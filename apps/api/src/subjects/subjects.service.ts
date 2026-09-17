import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SubjectCreateDto, SubjectUpdateDto } from "./dto";

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(schoolId: string | null, q?: string, type?: string) {
    const where: any = {};
    if (schoolId) where.schoolId = schoolId;
    if (type) where.type = type;
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { code: { contains: q, mode: "insensitive" } },
      ];
    }

    return this.prisma.subject.findMany({
      where,
      orderBy: [{ type: "asc" }, { name: "asc" }],
      include: {
        coefficients: {
          include: { level: { select: { id: true, code: true, name: true } } },
        },
        _count: { select: { assignments: true, assessments: true } },
      },
    });
  }

  async findOne(id: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        coefficients: {
          include: { level: true },
          orderBy: { level: { orderIndex: "asc" } },
        },
        _count: { select: { assignments: true, assessments: true } },
      },
    });
    if (!subject) throw new NotFoundException("Matiere introuvable");
    return subject;
  }

  async create(dto: SubjectCreateDto) {
    const existing = await this.prisma.subject.findUnique({
      where: { schoolId_code: { schoolId: dto.schoolId, code: dto.code } },
    });
    if (existing) throw new ConflictException("Une matiere avec ce code existe deja");

    return this.prisma.subject.create({
      data: {
        ...dto,
        type: (dto.type || "CORE") as any,
      } as any,
    });
  }

  async update(id: string, dto: SubjectUpdateDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.type) data.type = dto.type as any;
    return this.prisma.subject.update({ where: { id }, data });
  }

  async remove(id: string) {
    const subject = await this.findOne(id);
    const usages = await this.prisma.teacherAssignment.count({ where: { subjectId: id } });
    if (usages > 0) {
      throw new ConflictException("Impossible de supprimer : des affectations utilisent cette matiere");
    }
    return this.prisma.subject.delete({ where: { id } });
  }

  // ============================================================
  // Coefficients par niveau
  // ============================================================

  async getCoefficients(subjectId: string) {
    await this.findOne(subjectId);
    return this.prisma.subjectCoefficient.findMany({
      where: { subjectId },
      include: { level: true },
      orderBy: { level: { orderIndex: "asc" } },
    });
  }

  async setCoefficient(subjectId: string, levelId: string, coefficient: number, weeklyHours?: number) {
    await this.findOne(subjectId);
    return this.prisma.subjectCoefficient.upsert({
      where: { subjectId_levelId: { subjectId, levelId } },
      update: { coefficient, weeklyHours },
      create: { subjectId, levelId, coefficient, weeklyHours },
    });
  }

  async removeCoefficient(subjectId: string, levelId: string) {
    await this.findOne(subjectId);
    return this.prisma.subjectCoefficient.delete({
      where: { subjectId_levelId: { subjectId, levelId } },
    });
  }
}
