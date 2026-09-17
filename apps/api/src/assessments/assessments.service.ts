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
  ) {
    const where: any = {};
    if (schoolId) where.schoolId = schoolId;
    if (filters.classId) where.classId = filters.classId;
    if (filters.subjectId) where.subjectId = filters.subjectId;
    if (filters.termId) where.termId = filters.termId;
    if (filters.teacherId) where.teacherId = filters.teacherId;
    if (filters.status) where.status = filters.status;

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
}
