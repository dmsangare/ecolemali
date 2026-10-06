import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { LevelCreateDto, LevelUpdateDto } from "./dto";
import { CurrentUserPayload } from "../common/decorators";
import { assertSchoolAccess } from "../common/utils";

@Injectable()
export class LevelsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(schoolId: string | null, cycle?: string) {
    const where: any = {};
    if (schoolId) where.schoolId = schoolId;
    if (cycle) where.cycle = cycle;

    return this.prisma.level.findMany({
      where,
      orderBy: { orderIndex: "asc" },
      include: { _count: { select: { classes: true } } },
    });
  }

  async findOne(id: string, user: CurrentUserPayload) {
    const level = await this.prisma.level.findUnique({
      where: { id },
      include: { subjectCoefficients: true, _count: { select: { classes: true } } },
    });
    if (!level) throw new NotFoundException("Niveau introuvable");
    assertSchoolAccess(user, level.schoolId, "Niveau introuvable");
    return level;
  }

  async create(dto: LevelCreateDto) {
    return this.prisma.level.create({ data: dto as any });
  }

  async update(id: string, dto: LevelUpdateDto, user: CurrentUserPayload) {
    await this.findOne(id, user);
    return this.prisma.level.update({ where: { id }, data: dto as any });
  }

  async remove(id: string, user: CurrentUserPayload) {
    await this.findOne(id, user);
    return this.prisma.level.delete({ where: { id } });
  }
}
