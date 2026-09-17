import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { TeacherCreateDto, TeacherUpdateDto } from "./dto";

@Injectable()
export class TeachersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(schoolId: string | null, page = 1, limit = 20, q?: string, status?: string) {
    const where: any = {};
    if (schoolId) where.schoolId = schoolId;
    if (status) where.status = status;

    if (q) {
      where.OR = [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { matricule: { contains: q, mode: "insensitive" } },
        { specialty: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.teacher.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        include: {
          _count: {
            select: { assignments: true, timetableSlots: true, mainTeacherClasses: true },
          },
        },
      }),
      this.prisma.teacher.count({ where }),
    ]);

    return { data, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, phone: true, status: true } },
        assignments: {
          include: {
            subject: { select: { id: true, code: true, name: true } },
            class: { select: { id: true, code: true, name: true } },
            academicYear: { select: { id: true, label: true } },
          },
        },
        mainTeacherClasses: {
          select: { id: true, code: true, name: true },
        },
        _count: {
          select: { timetableSlots: true, assessments: true },
        },
      },
    });
    if (!teacher) throw new NotFoundException("Enseignant introuvable");
    return teacher;
  }

  async create(dto: TeacherCreateDto, createdBy: string) {
    // Générer le matricule automatiquement si non fourni
    let matricule = dto.matricule;
    if (!matricule) {
      const currentYear = new Date().getFullYear();
      const yearStr = String(currentYear);
      const count = await this.prisma.teacher.count({
        where: {
          schoolId: dto.schoolId,
          matricule: { startsWith: `ENS-${yearStr}-` },
        },
      });
      matricule = `ENS-${yearStr}-${String(count + 1).padStart(6, "0")}`;
    }

    // Vérifier unicité
    const existing = await this.prisma.teacher.findUnique({
      where: { schoolId_matricule: { schoolId: dto.schoolId, matricule } },
    });
    if (existing) {
      throw new ConflictException("Un enseignant avec ce matricule existe deja");
    }

    const data: any = {
      ...dto,
      matricule,
      gender: dto.gender as any,
      contractType: dto.contractType as any,
      status: (dto.status || "ACTIVE") as any,
    };
    if (dto.hireDate) data.hireDate = new Date(dto.hireDate);

    return this.prisma.teacher.create({ data });
  }

  async update(id: string, dto: TeacherUpdateDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.hireDate) data.hireDate = new Date(dto.hireDate);
    if (dto.gender) data.gender = dto.gender as any;
    if (dto.contractType) data.contractType = dto.contractType as any;
    if (dto.status) data.status = dto.status as any;
    return this.prisma.teacher.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.teacher.delete({ where: { id } });
  }

  async getAssignments(id: string) {
    await this.findOne(id);
    return this.prisma.teacherAssignment.findMany({
      where: { teacherId: id },
      include: {
        subject: true,
        class: { include: { level: true } },
        academicYear: true,
      },
    });
  }

  async getTimetable(id: string) {
    await this.findOne(id);
    return this.prisma.timetableSlot.findMany({
      where: { teacherId: id },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      include: {
        subject: { select: { id: true, code: true, name: true } },
        class: { select: { id: true, code: true, name: true } },
        room: { select: { id: true, name: true } },
      },
    });
  }
}
