import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AssessmentCreateDto, AssessmentUpdateDto } from "./dto";

@Injectable()
export class AssessmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    schoolId: string | null,
    page = 1,
    limit = 20,
    filters: { classId?: string; subjectId?: string; termId?: string; teacherId?: string; status?: string } = {},
    user?: { id: string; roles: string[] },
  ) {
    const where: any = {};
    if (schoolId) where.schoolId = schoolId;
    if (filters.classId) where.classId = filters.classId;
    if (filters.subjectId) where.subjectId = filters.subjectId;
    if (filters.termId) where.termId = filters.termId;
    if (filters.teacherId) where.teacherId = filters.teacherId;
    if (filters.status) where.status = filters.status;

    // FILTRE TEACHER : forcer le teacherId si TEACHER connecte
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
      where.teacherId = teacher?.id || "00000000-0000-0000-0000-000000000000";
    }

    const [data, total] = await Promise.all([
      this.prisma.assessment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: "desc" },
        include: {
          class: { select: { id: true, code: true, name: true } },
          subject: { select: { id: true, code: true, name: true } },
          teacher: { select: { id: true, firstName: true, lastName: true } },
          term: { select: { id: true, name: true } },
          _count: { select: { grades: true } },
        },
      }),
      this.prisma.assessment.count({ where }),
    ]);

    return { data, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id },
      include: {
        class: true,
        subject: true,
        teacher: true,
        term: true,
        academicYear: true,
        grades: {
          include: {
            student: {
              select: {
                id: true, matricule: true, firstName: true, lastName: true, gender: true,
              },
            },
          },
          orderBy: { student: { lastName: "asc" } },
        },
      },
    });
    if (!assessment) throw new NotFoundException("Evaluation introuvable");
    return assessment;
  }

  async create(dto: AssessmentCreateDto) {
    return this.prisma.assessment.create({
      data: {
        ...dto,
        date: new Date(dto.date),
        status: "DRAFT",
      } as any,
      include: {
        class: { select: { id: true, code: true, name: true } },
        subject: { select: { id: true, code: true, name: true } },
      },
    });
  }

  async update(id: string, dto: AssessmentUpdateDto) {
    const assessment = await this.findOne(id);
    if (assessment.status === "LOCKED") {
      throw new BadRequestException("Impossible de modifier une evaluation verrouillee");
    }
    const data: any = { ...dto };
    if (dto.date) data.date = new Date(dto.date);
    return this.prisma.assessment.update({ where: { id }, data });
  }

  async remove(id: string) {
    const assessment = await this.findOne(id);
    if (assessment.status === "LOCKED" || assessment.status === "VALIDATED") {
      throw new BadRequestException("Impossible de supprimer une evaluation validee ou verrouillee");
    }
    return this.prisma.assessment.delete({ where: { id } });
  }

  // ============================================================
  // WORKFLOW : DRAFT -> OPEN -> SUBMITTED -> VALIDATED -> LOCKED
  // ============================================================

  async open(id: string) {
    const assessment = await this.findOne(id);
    if (assessment.status !== "DRAFT") {
      throw new BadRequestException(`Impossible d ouvrir une evaluation avec statut ${assessment.status}`);
    }
    return this.prisma.assessment.update({
      where: { id },
      data: { status: "OPEN" },
    });
  }

  async submit(id: string) {
    const assessment = await this.findOne(id);
    if (assessment.status !== "OPEN") {
      throw new BadRequestException("Seule une evaluation ouverte peut etre soumise");
    }

    // Verifier que toutes les notes sont saisies
    const students = await this.prisma.enrollment.findMany({
      where: {
        classId: assessment.classId,
        academicYearId: assessment.academicYearId,
        status: "VALIDATED",
      },
      select: { studentId: true },
    });

    const gradesCount = await this.prisma.grade.count({
      where: { assessmentId: id },
    });

    if (gradesCount < students.length) {
      throw new BadRequestException(
        `Toutes les notes doivent etre saisies (${gradesCount}/${students.length})`,
      );
    }

    return this.prisma.assessment.update({
      where: { id },
      data: { status: "SUBMITTED" },
    });
  }

  async validate(id: string) {
    const assessment = await this.findOne(id);
    if (assessment.status !== "SUBMITTED") {
      throw new BadRequestException("Seule une evaluation soumise peut etre validee");
    }
    return this.prisma.assessment.update({
      where: { id },
      data: { status: "VALIDATED" },
    });
  }

  async lock(id: string) {
    const assessment = await this.findOne(id);
    if (assessment.status !== "VALIDATED") {
      throw new BadRequestException("Seule une evaluation validee peut etre verrouillee");
    }

    // Verrouiller toutes les notes
    await this.prisma.grade.updateMany({
      where: { assessmentId: id },
      data: { locked: true },
    });

    return this.prisma.assessment.update({
      where: { id },
      data: { status: "LOCKED" },
    });
  }

  async reopen(id: string) {
    const assessment = await this.findOne(id);
    if (assessment.status === "OPEN" || assessment.status === "DRAFT") {
      return assessment; // deja modifiable
    }

    // Reinitialiser toutes les notes : debloquer
    await this.prisma.grade.updateMany({
      where: { assessmentId: id },
      data: { locked: false },
    });

    return this.prisma.assessment.update({
      where: { id },
      data: { status: "OPEN" },
    });
  }

  /**
   * Prepare les donnees pour l'export (PDF/Excel/CSV).
   */
  async getExportData(assessmentId: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        class: {
          include: {
            level: true,
          },
        },
        subject: true,
        term: true,
        teacher: true,
      },
    });

    if (!assessment) {
      const { NotFoundException } = await import("@nestjs/common");
      throw new NotFoundException("Evaluation introuvable");
    }

    // Recuperer les eleves inscrits dans la classe
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        classId: assessment.classId,
        academicYearId: assessment.academicYearId,
        status: "VALIDATED",
      },
      include: {
        student: {
          select: {
            id: true,
            matricule: true,
            firstName: true,
            lastName: true,
            gender: true,
          },
        },
      },
      orderBy: [
        { student: { lastName: "asc" } },
        { student: { firstName: "asc" } },
      ],
    });

    // Recuperer les notes
    const grades = await this.prisma.grade.findMany({
      where: { assessmentId },
    });

    const gradesMap = new Map(
      grades.map((g) => [g.studentId, g]),
    );

    // Construire les lignes
    const rows = enrollments.map((e, idx) => {
      const g = gradesMap.get(e.studentId);
      return {
        index: idx + 1,
        matricule: e.student.matricule,
        firstName: e.student.firstName,
        lastName: e.student.lastName,
        gender: e.student.gender as string,
        value: g?.value !== null && g?.value !== undefined ? Number(g.value) : null,
        isAbsent: g?.isAbsent ?? false,
        observation: g?.observation ?? null,
        rank: null as number | null,
      };
    });

    // Calculer les rangs
    const scored = rows
      .filter((r) => !r.isAbsent && r.value !== null)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    let currentRank = 1;
    let prevValue: number | null = null;
    scored.forEach((r, i) => {
      if (prevValue !== null && r.value! < prevValue) {
        currentRank = i + 1;
      }
      const target = rows.find((x) => x.matricule === r.matricule);
      if (target) target.rank = currentRank;
      prevValue = r.value;
    });

    // Stats
    const validGrades = rows
      .filter((r) => !r.isAbsent && r.value !== null)
      .map((r) => r.value!);

    const count = validGrades.length;
    const average = count > 0 ? validGrades.reduce((s, v) => s + v, 0) / count : 0;
    const min = count > 0 ? Math.min(...validGrades) : 0;
    const max = count > 0 ? Math.max(...validGrades) : 0;

    // Infos ecole
    const school = await this.prisma.school.findUnique({
      where: { id: assessment.schoolId },
    });

    const academicYear = await this.prisma.academicYear.findUnique({
      where: { id: assessment.academicYearId },
    });

    return {
      schoolName: school?.name || "SIS-MALI",
      schoolAddress: school?.address,
      schoolPhone: school?.phone,
      schoolLogoUrl: school?.logoUrl,
      className: assessment.class?.name || "",
      subjectName: assessment.subject?.name || "",
      termName: assessment.term?.name || "",
      assessmentTitle: assessment.title,
      assessmentType: assessment.type,
      assessmentDate: assessment.date.toISOString().split("T")[0],
      maxScore: Number(assessment.maxScore),
      coefficient: Number(assessment.coefficient),
      teacherName: assessment.teacher
        ? `${assessment.teacher.firstName} ${assessment.teacher.lastName}`
        : null,
      academicYear: academicYear?.label || "",
      grades: rows,
      stats: {
        count,
        total: rows.length,
        average,
        min,
        max,
      },
    };
  }

}
