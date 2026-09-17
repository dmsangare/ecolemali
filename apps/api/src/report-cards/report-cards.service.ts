import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ReportCardGenerateDto, ReportCardUpdateDto } from "./dto";
import { calculateWeightedAverage, calculateReportAverage, determineDecision } from "@sis-mali/shared";

@Injectable()
export class ReportCardsService {
  private readonly logger = new Logger(ReportCardsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(schoolId: string | null, page = 1, limit = 20, termId?: string, classId?: string, studentId?: string) {
    const where: any = {};
    if (schoolId) where.student = { schoolId };
    if (termId) where.termId = termId;
    if (classId) where.classId = classId;
    if (studentId) where.studentId = studentId;

    const [data, total] = await Promise.all([
      this.prisma.reportCard.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          student: { select: { id: true, matricule: true, firstName: true, lastName: true } },
          class: { select: { id: true, code: true, name: true } },
          term: { select: { id: true, name: true } },
          academicYear: { select: { id: true, label: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.reportCard.count({ where }),
    ]);

    return { data, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const report = await this.prisma.reportCard.findUnique({
      where: { id },
      include: {
        student: true,
        class: { include: { level: true } },
        term: true,
        academicYear: true,
        items: {
          include: {
            subject: { select: { id: true, code: true, name: true } },
          },
          orderBy: { subject: { name: "asc" } },
        },
      },
    });
    if (!report) throw new NotFoundException("Bulletin introuvable");
    return report;
  }

  /**
   * Genere les bulletins pour une classe + un trimestre.
   * Calcule pour chaque eleve :
   *  - la moyenne par matiere (ponderee par coefficients d'evaluation)
   *  - la moyenne generale (ponderee par coefficients de matiere)
   *  - le rang dans la classe
   *  - la decision (ADMIS/PASSE/REDOUBLE)
   */
  async generate(dto: ReportCardGenerateDto) {
    // Recuperer les eleves de la classe (ou un seul)
    const whereEnrollments: any = {
      academicYearId: dto.academicYearId,
      status: "VALIDATED",
    };
    if (dto.classId) whereEnrollments.classId = dto.classId;
    if (dto.studentId) whereEnrollments.studentId = dto.studentId;

    const enrollments = await this.prisma.enrollment.findMany({
      where: whereEnrollments,
      include: { student: true },
    });

    if (enrollments.length === 0) {
      throw new BadRequestException("Aucun eleve inscrit trouve");
    }

    // Recuperer toutes les matieres du niveau avec leurs coefficients
    const levelId = enrollments[0].levelId;
    const subjects = await this.prisma.subjectCoefficient.findMany({
      where: { levelId },
      include: { subject: true },
    });

    // Recuperer les evaluations du trimestre pour ces classes
    const classIds = Array.from(new Set(enrollments.map((e) => e.classId)));
    const assessments = await this.prisma.assessment.findMany({
      where: {
        termId: dto.termId,
        classId: { in: classIds },
        status: { in: ["VALIDATED", "LOCKED"] },
      },
      include: { grades: true },
    });

    // Structure : studentId -> subjectId -> [{ value, coefficient }]
    const gradesMap = new Map<string, Map<string, Array<{ value: number; coefficient: number }>>>();
    for (const a of assessments) {
      for (const g of a.grades) {
        if (g.value === null || g.isAbsent) continue;
        if (!gradesMap.has(g.studentId)) gradesMap.set(g.studentId, new Map());
        const subMap = gradesMap.get(g.studentId)!;
        if (!subMap.has(a.subjectId)) subMap.set(a.subjectId, []);
        subMap.get(a.subjectId)!.push({
          value: Number(g.value),
          coefficient: Number(a.coefficient),
        });
      }
    }

    // Calculer pour chaque eleve
    const results: Array<{
      studentId: string;
      classId: string;
      average: number | null;
      subjectAverages: Array<{ subjectId: string; average: number | null; coefficient: number }>;
    }> = [];

    for (const e of enrollments) {
      const studentGrades = gradesMap.get(e.studentId) || new Map();
      const subjectAverages: Array<{ subjectId: string; average: number | null; coefficient: number }> = [];

      for (const sc of subjects) {
        const grades = studentGrades.get(sc.subjectId) || [];
        const average = calculateWeightedAverage(grades);
        subjectAverages.push({
          subjectId: sc.subjectId,
          average,
          coefficient: Number(sc.coefficient),
        });
      }

      const generalAverage = calculateReportAverage(
        subjectAverages.map((sa) => ({ average: sa.average, coefficient: sa.coefficient })),
      );

      results.push({
        studentId: e.studentId,
        classId: e.classId,
        average: generalAverage,
        subjectAverages,
      });
    }

    // Calculer les rangs par classe
    const byClass = new Map<string, number[]>();
    for (const r of results) {
      if (!byClass.has(r.classId)) byClass.set(r.classId, []);
      if (r.average !== null) byClass.get(r.classId)!.push(r.average);
    }

    const settings = await this.prisma.setting.findFirst({
      where: { school: { students: { some: { id: enrollments[0].studentId } } } },
    });
    const passMark = settings ? Number(settings.passMark) : 10;
    const passThreshold = passMark;
    const repeatThreshold = passMark - 2;

    // Creer/mettre a jour les bulletins
    const created: any[] = [];
    for (const r of results) {
      const classAverages = byClass.get(r.classId) || [];
      const sorted = [...classAverages].sort((a, b) => b - a);

      let rank: number | null = null;
      if (r.average !== null) {
        rank = sorted.findIndex((v) => Math.abs(v - r.average!) < 0.0001) + 1;
      }

      // Absences pour ce trimestre
      const attendanceStats = await this.prisma.attendanceRecord.findMany({
        where: {
          studentId: r.studentId,
          session: { termId: dto.termId },
        },
      });
      const absencesCount = attendanceStats.filter(
        (a) => a.status === "ABSENT" || a.status === "ABSENT_UNJUSTIFIED",
      ).length;
      const latesCount = attendanceStats.filter((a) => a.status === "LATE").length;

      const decision = r.average !== null ? determineDecision(r.average, { ADMIS: passThreshold, PASSE: repeatThreshold }) : "A_DETERMINER";

      // Upsert le bulletin
      const report = await this.prisma.reportCard.upsert({
        where: {
          studentId_termId: { studentId: r.studentId, termId: dto.termId },
        },
        update: {
          average: r.average,
          rank,
          classSize: classAverages.length,
          absencesCount,
          latesCount,
          decision: decision as any,
        },
        create: {
          studentId: r.studentId,
          classId: r.classId,
          termId: dto.termId,
          academicYearId: dto.academicYearId,
          average: r.average,
          rank,
          classSize: classAverages.length,
          absencesCount,
          latesCount,
          decision: decision as any,
          status: "DRAFT",
        },
      });

      // Supprimer les anciens items
      await this.prisma.reportCardItem.deleteMany({ where: { reportCardId: report.id } });

      // Creer les items (une ligne par matiere)
      await this.prisma.reportCardItem.createMany({
        data: r.subjectAverages.map((sa) => ({
          reportCardId: report.id,
          subjectId: sa.subjectId,
          average: sa.average,
          coefficient: sa.coefficient,
          weighted: sa.average !== null ? sa.average * sa.coefficient : null,
        })),
      });

      created.push(report);
    }

    this.logger.log(`Generated ${created.length} report cards for term ${dto.termId}`);

    return {
      generated: created.length,
      reports: created,
    };
  }

  async update(id: string, dto: ReportCardUpdateDto) {
    const report = await this.findOne(id);
    if (report.status === "PUBLISHED") {
      throw new BadRequestException("Impossible de modifier un bulletin publie");
    }
    return this.prisma.reportCard.update({
      where: { id },
      data: {
        ...dto,
        decision: dto.decision as any,
      },
    });
  }

  async publish(id: string) {
    const report = await this.findOne(id);
    if (report.status === "PUBLISHED") {
      throw new BadRequestException("Ce bulletin est deja publie");
    }
    return this.prisma.reportCard.update({
      where: { id },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    });
  }

  async publishByClass(classId: string, termId: string) {
    const result = await this.prisma.reportCard.updateMany({
      where: { classId, termId, status: "VALIDATED" },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    });
    return { published: result.count };
  }

  async validate(id: string) {
    await this.findOne(id);
    return this.prisma.reportCard.update({
      where: { id },
      data: { status: "VALIDATED" },
    });
  }

  async remove(id: string) {
    const report = await this.findOne(id);
    if (report.status === "PUBLISHED") {
      throw new BadRequestException("Impossible de supprimer un bulletin publie");
    }
    return this.prisma.reportCard.delete({ where: { id } });
  }

  /**
   * Recupere le bulletin d'un eleve pour un trimestre donne.
   */
  async getStudentReport(studentId: string, termId: string) {
    const report = await this.prisma.reportCard.findUnique({
      where: { studentId_termId: { studentId, termId } },
      include: {
        student: true,
        class: { include: { level: true } },
        term: true,
        academicYear: true,
        items: {
          include: { subject: true },
          orderBy: { subject: { name: "asc" } },
        },
      },
    });
    if (!report) throw new NotFoundException("Bulletin introuvable pour cet eleve et ce trimestre");
    return report;
  }

  /**
   * Classement complet d'une classe pour un trimestre.
   */
  async getClassRanking(classId: string, termId: string) {
    const reports = await this.prisma.reportCard.findMany({
      where: { classId, termId },
      orderBy: { rank: "asc" },
      include: {
        student: { select: { id: true, matricule: true, firstName: true, lastName: true } },
      },
    });

    return reports.map((r) => ({
      rank: r.rank,
      student: r.student,
      average: r.average,
      decision: r.decision,
      absences: r.absencesCount,
      lates: r.latesCount,
    }));
  }
}
