import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from "@nestjs/common";
import QRCode from "qrcode";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { VerificationService } from "../verification/verification.service";
import { ReportCardGenerateDto, ReportCardUpdateDto } from "./dto";
import { calculateSubjectAverage } from "./calculation/second-cycle";
import { calculateCompositionAverage } from "./calculation/first-cycle";
import { determineDecision as determineDecisionEngine } from "./calculation/decision";
import { DashboardService } from "../dashboard/dashboard.service";
import {
  isTermAllowedForCycle,
  describeTermMismatch,
  normalizeScore,
  rulesForCycle,
  scaledThreshold,
} from "./grading-rules";
import { fileToBase64 } from "../common/utils/file-to-base64.util";
import { CurrentUserPayload } from "../common/decorators";

@Injectable()
export class ReportCardsService {
  private readonly logger = new Logger(ReportCardsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly verificationService: VerificationService,
    private readonly dashboard: DashboardService,
  ) {}

  /** Met a jour le tableau d'honneur sans jamais faire echouer la publication. */
  private async refreshHonorRoll(schoolId: string | null | undefined, termId: string) {
    if (!schoolId) return;
    try {
      await this.dashboard.recomputeTopStudents(schoolId, termId);
    } catch (err) {
      this.logger.warn(`Recalcul du tableau d'honneur impossible : ${(err as Error).message}`);
    }
  }

  async findAll(
    schoolId: string | null,
    page = 1,
    limit = 20,
    termId?: string,
    classId?: string,
    studentId?: string,
    user?: { id: string; roles: string[] },
  ) {
    const where: any = {};
    if (schoolId) where.student = { schoolId };
    if (termId) where.termId = termId;
    if (classId) where.classId = classId;
    if (studentId) where.studentId = studentId;

    // FILTRE TEACHER : ne voir que les bulletins de ses classes
    const isTeacherOnly =
      user &&
      user.roles.includes("TEACHER") &&
      !user.roles.includes("SUPER_ADMIN") &&
      !user.roles.includes("DIRECTOR") &&
      !user.roles.includes("SECRETARY");

    if (isTeacherOnly && user) {
      const teacher = await this.prisma.teacher.findFirst({
        where: { userId: user.id },
        select: { id: true },
      });

      if (teacher) {
        const assignments = await this.prisma.teacherAssignment.findMany({
          where: { teacherId: teacher.id },
          select: { classId: true },
        });
        const teacherClassIds = [...new Set(assignments.map((a) => a.classId))];

        // Si un classId est deja demande, on l'intersecte
        if (classId) {
          where.classId = teacherClassIds.includes(classId) ? classId : "00000000-0000-0000-0000-000000000000";
        } else {
          where.classId = { in: teacherClassIds };
        }
      } else {
        where.classId = "00000000-0000-0000-0000-000000000000";
      }
    }

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
   *  - la decision (ADMIS/REDOUBLE)
   */
  async generate(dto: ReportCardGenerateDto, user?: CurrentUserPayload) {
    // Recuperer les eleves de la classe (ou un seul)
    const whereEnrollments: any = {
      academicYearId: dto.academicYearId,
      status: "VALIDATED",
    };
    if (dto.classId) whereEnrollments.classId = dto.classId;
    if (dto.studentId) whereEnrollments.studentId = dto.studentId;
    // Filtre ecole dans le WHERE (pas seulement apres lecture)
    if (user?.schoolId) {
      whereEnrollments.student = { schoolId: user.schoolId };
    }

    const allEnrollments = await this.prisma.enrollment.findMany({
      where: whereEnrollments,
      include: { student: true },
    });

    if (allEnrollments.length === 0) {
      throw new BadRequestException("Aucun eleve inscrit trouve");
    }

    // (Isolation ecole deja faite dans le where ci-dessus)

    // Verifier si des bulletins valides/publies existent deja pour ces eleves
    const existingLocked = await this.prisma.reportCard.findMany({
      where: {
        studentId: { in: allEnrollments.map((e) => e.studentId) },
        termId: dto.termId,
        status: { in: ["VALIDATED", "PUBLISHED"] },
      },
      select: { studentId: true, status: true },
    });

    // Generation partielle : sauter les bulletins deja valides/publies
    const lockedStudentIds = new Set(existingLocked.map((r) => r.studentId));
    const skipped = existingLocked.map((r) => {
      const enr = allEnrollments.find((e) => e.studentId === r.studentId);
      return {
        studentId: r.studentId,
        studentName: enr ? `${enr.student.firstName} ${enr.student.lastName}` : r.studentId,
        status: r.status,
      };
    });

    // Regles par cycle : bareme (/10 ou /20) et type de periode (mois ou trimestre)
    const term = await this.prisma.term.findUnique({ where: { id: dto.termId } });
    if (!term) throw new NotFoundException("Periode introuvable");
    if (term.isLocked) {
      throw new BadRequestException(
        "Cette periode est verrouillee. Impossible de generer les bulletins.",
      );
    }

    const levels = await this.prisma.level.findMany({
      where: { id: { in: Array.from(new Set(allEnrollments.map((e) => e.levelId))) } },
      select: { id: true, cycle: true },
    });
    const cycleByLevel = new Map<string, string>(levels.map((l) => [l.id, l.cycle as string]));

    // On ne garde que les classes dont le cycle correspond au type de periode choisi
    // ET on exclut les eleves avec bulletin verrouille (fix7)
    const enrollments = allEnrollments.filter((e) =>
      isTermAllowedForCycle(term.type, cycleByLevel.get(e.levelId)) &&
      !lockedStudentIds.has(e.studentId),
    );
    if (enrollments.length === 0) {
      if (lockedStudentIds.size > 0) {
        throw new BadRequestException(
          `Tous les bulletins de cette periode sont deja valides/publies (${lockedStudentIds.size} saute(s)).`,
        );
      }
      throw new BadRequestException(describeTermMismatch(term.type, term.name));
    }

    // Bareme par classe
    const scaleByClass = new Map<string, number>();
    for (const e of enrollments) {
      scaleByClass.set(e.classId, rulesForCycle(cycleByLevel.get(e.levelId)).scale);
    }

    // Matieres et coefficients : fallback SubjectCoefficient
    // (BulletinConfig supprime — voir commit refonte bulletins v2)
    const subjectsToUse = await (async () => {
      const coefficientRows = await this.prisma.subjectCoefficient.findMany({
        where: { levelId: { in: Array.from(new Set(enrollments.map((e) => e.levelId))) } },
        include: { subject: true },
      });
      return coefficientRows.map((r) => ({
        name: r.subject.name,
        coefficient: Number(r.coefficient),
      }));
        })();

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

    // Fix9 : signaler les evaluations non validees (DRAFT/OPEN/SUBMITTED)
    const draftAssessments = await this.prisma.assessment.findMany({
      where: {
        termId: dto.termId,
        classId: { in: classIds },
        status: { in: ["DRAFT", "OPEN", "SUBMITTED"] },
      },
      select: { id: true, classId: true, subjectId: true, status: true },
    });

    // Structure : studentId -> subjectId -> [{ value, coefficient }]
    const gradesMap = new Map<string, Map<string, Array<{ value: number; coefficient: number }>>>();
    for (const a of assessments) {
      for (const g of a.grades) {
        if (g.value === null || g.isAbsent) continue;
        if (!gradesMap.has(g.studentId)) gradesMap.set(g.studentId, new Map());
        const subMap = gradesMap.get(g.studentId)!;
        if (!subMap.has(a.subjectId)) subMap.set(a.subjectId, []);
        // Note ramenee au bareme du cycle (ex. 14/20 -> 7/10 au 1er cycle)
        const scale = scaleByClass.get(a.classId) ?? 20;
        subMap.get(a.subjectId)!.push({
          value: normalizeScore(Number(g.value), Number(a.maxScore), scale),
          coefficient: Number(a.coefficient),
        });
      }
    }

    // Calculer pour chaque eleve
    const results: Array<{
      studentId: string;
      classId: string;
      scale: number;
      average: number | null;
      subjectAverages: Array<{ subjectId: string; average: number | null; coefficient: number }>;
    }> = [];

    for (const e of enrollments) {
      const studentGrades = gradesMap.get(e.studentId) || new Map();
      const subjectAverages: Array<{ subjectId: string; average: number | null; coefficient: number }> = [];

      const cycle = cycleByLevel.get(e.levelId) as string;
      for (const sc of subjectsToUse) {
        const grades = studentGrades.get(sc.name) || [];
        // Utiliser le moteur calculation/ selon le cycle
        const gradeInputs = grades.map((g: any) => ({
          value: g.value,
          isAbsent: g.isAbsent ?? false,
          isExempt: g.isExempt ?? false,
        }));
        const partialResult = cycle === "PREMIER_CYCLE"
          ? calculateCompositionAverage(gradeInputs)
          : calculateSubjectAverage(gradeInputs);
        subjectAverages.push({
          subjectId: sc.name,
          average: partialResult.value,
          coefficient: Number(sc.coefficient),
        });
      }

      // Moyenne générale : pondérée (2e cycle) ou simple (1er cycle)
      let generalAverage: number | null = null;
      if (cycle === "PREMIER_CYCLE") {
        // 1er cycle : moyenne simple des matières (pas de coefficients)
        const valid = subjectAverages.filter(sa => sa.average !== null).map(sa => sa.average as number);
        generalAverage = valid.length > 0
          ? Math.round((valid.reduce((s, v) => s + v, 0) / valid.length) * 100) / 100
          : null;
      } else {
        // 2e cycle : moyenne pondérée par coefficients
        const { calculateTermAverage } = require("./calculation/second-cycle");
        generalAverage = calculateTermAverage(
          subjectAverages.map((sa) => ({ average: sa.average, coefficient: sa.coefficient })),
        ).value;
      }

      results.push({
        studentId: e.studentId,
        classId: e.classId,
        scale: scaleByClass.get(e.classId) ?? 20,
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

      const decision = r.average !== null
        ? determineDecisionEngine(r.average, true, {
            passingScore: scaledThreshold(passMark, r.scale),
            examScore: null,
          })
        : "INCOMPLET";

      // Calcul isComplete :
      // - Il faut au moins une evaluation de type COMPOSITION (ou une evaluation tout court)
      //   attendue pour ce trimestre et cette classe
      // - ET toutes les matieres doivent avoir une moyenne non-null
      const assessmentsForClass = assessments.filter((a: any) => a.classId === r.classId);
      const hasExpectedAssessments = assessmentsForClass.length > 0;
      const allSubjectsHaveAverage = r.subjectAverages.length > 0
        && r.subjectAverages.every((sa: any) => sa.average !== null);
      const isComplete = hasExpectedAssessments && allSubjectsHaveAverage;

      // Upsert le bulletin
      const report = await this.prisma.reportCard.upsert({
        where: {
          studentId_termId: { studentId: r.studentId, termId: dto.termId },
        },
        update: {
          scale: r.scale,
          average: r.average,
          rank,
          classSize: classAverages.length,
          absencesCount,
          latesCount,
          decision: decision as any,
          kind: dto.kind ?? "TRIMESTRIEL",
          isComplete,
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
          scale: r.scale,
          status: "DRAFT",
          kind: dto.kind ?? "TRIMESTRIEL",
          isComplete,
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

    // Construire les warnings pour les evaluations non validees
    const warnings = draftAssessments.length > 0
      ? [{
          type: "UNVALIDATED_ASSESSMENTS",
          message: `${draftAssessments.length} evaluation(s) non validee(s) ne sont pas incluses dans les bulletins`,
          count: draftAssessments.length,
          assessments: draftAssessments,
        }]
      : [];

    return {
      generated: created.length,
      skipped,
      skippedCount: skipped.length,
      warnings,
      reports: created,
    };
  }

  async update(id: string, dto: ReportCardUpdateDto, user?: CurrentUserPayload) {
    const report = await this.findOne(id);
    if (user?.schoolId && report.student?.schoolId !== user.schoolId) {
      throw new ForbiddenException("Acces interdit");
    }
    if (report.status === "PUBLISHED") {
      throw new BadRequestException("Impossible de modifier un bulletin publie");
    }
    return this.prisma.reportCard.update({
      where: { id },
      data: {
        ...dto,
        decision: dto.decision as any,
        conductScore: dto.conductScore ?? undefined,
        conductAppreciation: dto.conductAppreciation,
      },
    });
  }

  async publish(id: string, user?: CurrentUserPayload) {
    const report = await this.findOne(id);
    if (user?.schoolId && report.student?.schoolId !== user.schoolId) {
      throw new ForbiddenException("Acces interdit");
    }
    if (report.status === "PUBLISHED") {
      throw new BadRequestException("Ce bulletin est deja publie");
    }
    // Recuperer les parametres de l'ecole pour le snapshot fige
    const setting = await this.prisma.setting.findUnique({
      where: { schoolId: report.student?.schoolId ?? "" },
      select: { gradingScale: true, passMark: true, locale: true, timezone: true },
    });

    const snapshot = {
      capturedAt: new Date().toISOString(),
      capturedBy: user?.id ?? "system",
      version: "1.0",
      settings: setting
        ? {
            gradingScale: Number(setting.gradingScale),
            passMark: Number(setting.passMark),
            locale: setting.locale,
            timezone: setting.timezone,
          }
        : null,
      report: {
        id: report.id,
        studentId: report.studentId,
        average: report.average,
        rank: report.rank,
        decision: report.decision,
      },
    };
    const published = await this.prisma.reportCard.update({
      where: { id },
      data: { status: "PUBLISHED", publishedAt: new Date(), snapshot },
    });
    await this.refreshHonorRoll(report.student?.schoolId, report.termId);
    return published;
  }

  async publishByClass(classId: string, termId: string) {
    const result = await this.prisma.reportCard.updateMany({
      where: { classId, termId, status: "VALIDATED" },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    });
    if (result.count > 0) {
      const cls = await this.prisma.class.findUnique({ where: { id: classId }, select: { schoolId: true } });
      await this.refreshHonorRoll(cls?.schoolId, termId);
    }
    return { published: result.count };
  }

  async reopen(id: string, motive: string, user?: CurrentUserPayload) {
    const report = await this.findOne(id);
    if (user?.schoolId && report.student?.schoolId !== user.schoolId) {
      throw new ForbiddenException("Acces interdit");
    }
    if (report.status !== "VALIDATED" && report.status !== "PUBLISHED") {
      throw new BadRequestException("Seul un bulletin valide ou publie peut etre rouvert");
    }

    // BLOC 8.5 : revoquer les VerifiableDocument associes (QR)
    try {
      const verifiableDocs = await this.prisma.verifiableDocument.findMany({
        where: { referenceId: id, type: "BULLETIN", revokedAt: null },
      });
      for (const doc of verifiableDocs) {
        await this.verificationService.revoke(doc.shortCode, user?.id ?? "system");
      }
    } catch (err) {
      this.logger.warn(`Erreur revocation QR pour bulletin ${id}: ${err}`);
    }

    return this.prisma.reportCard.update({
      where: { id },
      data: {
        status: "DRAFT",
        snapshot: Prisma.DbNull,
        publishedAt: null,
      },
    });
  }

  async validate(id: string, user?: CurrentUserPayload) {
    const report = await this.findOne(id);
    if (user?.schoolId && report.student?.schoolId !== user.schoolId) {
      throw new ForbiddenException("Acces interdit");
    }

    // Recuperer les parametres de l'ecole pour le snapshot fige
    const setting = await this.prisma.setting.findUnique({
      where: { schoolId: report.student?.schoolId ?? "" },
      select: { gradingScale: true, passMark: true, locale: true, timezone: true },
    });

    // Creer le snapshot fige (regles + valeurs)
    const snapshot = {
      capturedAt: new Date().toISOString(),
      capturedBy: user?.id ?? "system",
      version: "1.0",
      settings: setting
        ? {
            gradingScale: Number(setting.gradingScale),
            passMark: Number(setting.passMark),
            locale: setting.locale,
            timezone: setting.timezone,
          }
        : null,
      report: {
        id: report.id,
        studentId: report.studentId,
        average: report.average,
        rank: report.rank,
        classSize: report.classSize,
        decision: report.decision,
        items: (report as any).items?.map((i: any) => ({
          subjectId: i.subjectId,
          average: i.average,
          coefficient: i.coefficient,
          weighted: i.weighted,
        })) ?? [],
      },
    };

    return this.prisma.reportCard.update({
      where: { id },
      data: { status: "VALIDATED", snapshot },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.reportCard.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!existing) throw new NotFoundException("Bulletin introuvable");
    if (existing.status === "PUBLISHED" || existing.status === "VALIDATED") {
      throw new BadRequestException(
        "Impossible de supprimer un bulletin valide ou publie.",
      );
    }

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

  /**
   * Prepare les donnees d'export PDF pour un bulletin.
   */
  async getExportData(id: string, user?: CurrentUserPayload) {
    // Generation du QR code de verification
    let qrCodeDataUrl: string | null = null;
    try {
      const card = await this.prisma.reportCard.findUnique({
        where: { id },
        select: { studentId: true, termId: true, student: { select: { schoolId: true } } },
      });
      if (card) {
        // Signer le bulletin (creer un VerifiableDocument)
        const signResult = await this.verificationService.sign({
          schoolId: card.student.schoolId,
          type: "BULLETIN",
          referenceId: id,
          meta: { studentId: card.studentId, termId: card.termId },
        });
        // Generer l'image QR code (data URL)
        qrCodeDataUrl = await QRCode.toDataURL(signResult.verificationUrl);
      }
    } catch (err) {
      // Silencieux : le bulletin s'affiche sans QR code si erreur
      console.warn("Erreur generation QR code:", err);
    }

    const report = await this.prisma.reportCard.findUnique({
      where: { id },
      include: {
        student: true,
        class: {
          include: { level: true },
        },
        term: true,
        academicYear: true,
        items: {
          include: {
            subject: true,
          },
        },
      },
    });

    if (!report) {
      const { NotFoundException } = await import("@nestjs/common");
      throw new NotFoundException("Bulletin introuvable");
    }

    const school = await this.prisma.school.findUnique({
      where: { id: report.student.schoolId },
    });

    // Calculer le total coefficient et total weighted
    const totalCoefficient = report.items.reduce(
      (sum, item) => sum + Number(item.coefficient),
      0,
    );
    const totalWeighted = report.items.reduce(
      (sum, item) => sum + (Number(item.weighted) || 0),
      0,
    );

    return {
      schoolName: school?.name || "SIS-MALI",
      schoolAddress: school?.address,
      schoolPhone: school?.phone,
      schoolMotto: school?.motto,
      schoolLogoUrl: school?.logoUrl,
      schoolStampBase64: await fileToBase64(school?.stampUrl),
      qrCodeDataUrl,

      studentName: `${report.student.lastName} ${report.student.firstName}`,
      studentMatricule: report.student.matricule,
      studentGender: report.student.gender,
      studentBirthDate: report.student.birthDate.toISOString().split("T")[0],
      studentBirthPlace: report.student.birthPlace,

      className: report.class?.name || "",
      classSize: report.classSize || 0,
      termName: report.term?.name || "",
      academicYear: report.academicYear?.label || "",

      items: report.items.map((item) => ({
        subjectName: item.subject?.name || "",
        coefficient: Number(item.coefficient),
        average: item.average !== null ? Number(item.average) : null,
        weighted: item.weighted !== null ? Number(item.weighted) : null,
        rank: item.rank,
      })),
      totalCoefficient,
      totalWeighted,
      generalAverage:
        report.average !== null ? Number(report.average) : null,
      rank: report.rank,
      absencesCount: report.absencesCount,
      latesCount: report.latesCount,

      decision: report.decision,
      appreciation: report.appreciation,
    };
  }

}