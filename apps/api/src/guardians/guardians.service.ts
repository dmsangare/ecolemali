import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { GuardianCreateDto, GuardianUpdateDto } from "./dto";

@Injectable()
export class GuardiansService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(schoolId: string | null, page = 1, limit = 20, q?: string) {
    const where: any = {};
    if (schoolId) where.schoolId = schoolId;
    if (q) {
      where.OR = [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.guardian.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        include: {
          students: {
            include: {
              student: {
                select: {
                  id: true, matricule: true, firstName: true, lastName: true, gender: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.guardian.count({ where }),
    ]);

    return { data, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async findAvailable(schoolId: string | null) {
    const where: any = { userId: null };
    if (schoolId) where.schoolId = schoolId;

    return this.prisma.guardian.findMany({
      where,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      take: 100,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        relationType: true,
      },
    });
  }

  async findOne(id: string) {
    const guardian = await this.prisma.guardian.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, phone: true, status: true } },
        students: {
          include: {
            student: {
              include: {
                enrollments: {
                  where: { status: "VALIDATED" },
                  take: 1,
                  include: {
                    class: { select: { id: true, code: true, name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!guardian) throw new NotFoundException("Tuteur introuvable");
    return guardian;
  }

  async create(dto: GuardianCreateDto) {
    if (dto.email) {
      const existing = await this.prisma.guardian.findFirst({
        where: { schoolId: dto.schoolId, email: dto.email },
      });
      if (existing) {
        throw new ConflictException("Un tuteur avec cet email existe deja");
      }
    }
    return this.prisma.guardian.create({
      data: {
        ...dto,
        gender: dto.gender as any,
        relationType: dto.relationType as any,
      } as any,
    });
  }

  async update(id: string, dto: GuardianUpdateDto) {
    await this.findOne(id);
    return this.prisma.guardian.update({
      where: { id },
      data: { ...dto, gender: dto.gender as any, relationType: dto.relationType as any } as any,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.guardian.delete({ where: { id } });
  }

  async linkToStudent(guardianId: string, studentId: string, isPrimary = false) {
    await this.findOne(guardianId);
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException("Eleve introuvable");

    return this.prisma.studentGuardian.upsert({
      where: { studentId_guardianId: { studentId, guardianId } },
      update: { isPrimary },
      create: { studentId, guardianId, isPrimary },
    });
  }

  async unlinkFromStudent(guardianId: string, studentId: string) {
    await this.findOne(guardianId);
    return this.prisma.studentGuardian.delete({
      where: { studentId_guardianId: { studentId, guardianId } },
    });
  }
}
