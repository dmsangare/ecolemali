import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ClassCreateDto, ClassUpdateDto } from "./dto";
import { CurrentUserPayload } from "../common/decorators";
import { assertSchoolAccess, assertRefsInSchool } from "../common/utils";

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(schoolId: string | null, academicYearId?: string, levelId?: string) {
    const where: any = {};
    if (schoolId) where.schoolId = schoolId;
    if (academicYearId) where.academicYearId = academicYearId;
    if (levelId) where.levelId = levelId;

    return this.prisma.class.findMany({
      where,
      orderBy: [{ level: { orderIndex: "asc" } }, { code: "asc" }],
      include: {
        level: { select: { id: true, name: true, code: true, cycle: true } },
        room: { select: { id: true, name: true } },
        mainTeacher: { select: { id: true, firstName: true, lastName: true } },
        academicYear: { select: { id: true, label: true } },
        _count: { select: { enrollments: true } },
      },
    });
  }

  async findOne(id: string, user: CurrentUserPayload) {
    const cls = await this.prisma.class.findUnique({
      where: { id },
      include: {
        level: true,
        room: true,
        mainTeacher: true,
        academicYear: true,
        _count: { select: { enrollments: true, assignments: true } },
      },
    });
    if (!cls) throw new NotFoundException("Classe introuvable");
    assertSchoolAccess(user, cls.schoolId, "Classe introuvable");
    return cls;
  }

  async getDashboard(id: string, user: CurrentUserPayload) {
    const cls = await this.findOne(id, user);

    const enrollments = await this.prisma.enrollment.findMany({
      where: { classId: id, status: "VALIDATED" },
      include: {
        student: {
          select: { id: true, matricule: true, firstName: true, lastName: true, gender: true },
        },
      },
    });

    const total = enrollments.length;
    const boys = enrollments.filter((e) => e.student.gender === "M").length;
    const girls = total - boys;

    return {
      class: cls,
      stats: {
        total,
        boys,
        girls,
        capacity: cls.capacity,
        fillRate: cls.capacity ? Math.round((total / cls.capacity) * 100) : null,
      },
      students: enrollments.map((e) => e.student),
    };
  }

  async create(dto: ClassCreateDto) {
    // Verifier que les references appartiennent bien a la meme ecole
    await assertRefsInSchool(this.prisma, dto.schoolId!, {
      academicYearId: dto.academicYearId,
      levelId: dto.levelId,
      roomId: dto.roomId,
      teacherId: dto.mainTeacherId,
    });

    const existing = await this.prisma.class.findFirst({
      where: { academicYearId: dto.academicYearId, code: dto.code },
    });
    if (existing) {
      throw new BadRequestException("Cette classe existe deja pour cette annee scolaire");
    }
    return this.prisma.class.create({ data: dto as any });
  }

  async update(id: string, dto: ClassUpdateDto, user: CurrentUserPayload) {
    const cls = await this.findOne(id, user);
    await assertRefsInSchool(this.prisma, cls.schoolId, {
      academicYearId: dto.academicYearId,
      levelId: dto.levelId,
      roomId: dto.roomId,
      teacherId: dto.mainTeacherId,
    });
    return this.prisma.class.update({ where: { id }, data: dto as any });
  }

  async remove(id: string, user: CurrentUserPayload) {
    await this.findOne(id, user);
    return this.prisma.class.delete({ where: { id } });
  }
}
