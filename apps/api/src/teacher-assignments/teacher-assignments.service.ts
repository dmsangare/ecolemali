import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { TeacherAssignmentCreateDto, BulkAssignmentDto } from "./dto";

@Injectable()
export class TeacherAssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(teacherId?: string, classId?: string, subjectId?: string, academicYearId?: string) {
    const where: any = {};
    if (teacherId) where.teacherId = teacherId;
    if (classId) where.classId = classId;
    if (subjectId) where.subjectId = subjectId;
    if (academicYearId) where.academicYearId = academicYearId;

    return this.prisma.teacherAssignment.findMany({
      where,
      orderBy: [{ class: { code: "asc" } }, { subject: { name: "asc" } }],
      include: {
        teacher: { select: { id: true, matricule: true, firstName: true, lastName: true } },
        subject: { select: { id: true, code: true, name: true } },
        class: { select: { id: true, code: true, name: true } },
        academicYear: { select: { id: true, label: true } },
      },
    });
  }

  async findOne(id: string) {
    const assignment = await this.prisma.teacherAssignment.findUnique({
      where: { id },
      include: {
        teacher: true,
        subject: true,
        class: true,
        academicYear: true,
      },
    });
    if (!assignment) throw new NotFoundException("Affectation introuvable");
    return assignment;
  }

  async create(dto: TeacherAssignmentCreateDto) {
    const existing = await this.prisma.teacherAssignment.findUnique({
      where: {
        teacherId_subjectId_classId_academicYearId: {
          teacherId: dto.teacherId,
          subjectId: dto.subjectId,
          classId: dto.classId,
          academicYearId: dto.academicYearId,
        },
      },
    });
    if (existing) {
      throw new ConflictException("Cette affectation existe deja");
    }

    return this.prisma.teacherAssignment.create({
      data: dto as any,
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true } },
        subject: { select: { id: true, code: true, name: true } },
        class: { select: { id: true, code: true, name: true } },
      },
    });
  }

  async createBulk(dto: BulkAssignmentDto) {
    const created: any[] = [];
    const errors: any[] = [];

    for (const a of dto.assignments) {
      try {
        const existing = await this.prisma.teacherAssignment.findUnique({
          where: {
            teacherId_subjectId_classId_academicYearId: {
              teacherId: dto.teacherId,
              subjectId: a.subjectId,
              classId: a.classId,
              academicYearId: dto.academicYearId,
            },
          },
        });

        if (existing) {
          errors.push({ subjectId: a.subjectId, classId: a.classId, message: "Deja existante" });
          continue;
        }

        const result = await this.prisma.teacherAssignment.create({
          data: {
            teacherId: dto.teacherId,
            academicYearId: dto.academicYearId,
            subjectId: a.subjectId,
            classId: a.classId,
            isMain: a.isMain || false,
          },
        });
        created.push(result);
      } catch (err: any) {
        errors.push({ subjectId: a.subjectId, classId: a.classId, message: err.message });
      }
    }

    return { created: created.length, errors, results: created };
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.teacherAssignment.delete({ where: { id } });
  }

  async removeBulk(teacherId: string, academicYearId: string) {
    const result = await this.prisma.teacherAssignment.deleteMany({
      where: { teacherId, academicYearId },
    });
    return { deleted: result.count };
  }
}
