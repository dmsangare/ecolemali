import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { FeeStructureCreateDto } from "./dto";

@Injectable()
export class FeeStructuresService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(schoolId: string | null, academicYearId?: string, levelId?: string) {
    const where: any = {};
    if (schoolId) where.schoolId = schoolId;
    if (academicYearId) where.academicYearId = academicYearId;
    if (levelId) where.levelId = levelId;

    return this.prisma.feeStructure.findMany({
      where,
      orderBy: [{ academicYear: { startDate: "desc" } }, { level: { orderIndex: "asc" } }],
      include: {
        feeType: true,
        level: { select: { id: true, code: true, name: true, cycle: true } },
        academicYear: { select: { id: true, label: true } },
      },
    });
  }

  async findOne(id: string) {
    const structure = await this.prisma.feeStructure.findUnique({
      where: { id },
      include: { feeType: true, level: true, academicYear: true },
    });
    if (!structure) throw new NotFoundException("Structure tarifaire introuvable");
    return structure;
  }

  async create(dto: FeeStructureCreateDto) {
    return this.prisma.feeStructure.create({
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        levelId: dto.levelId || null,
      } as any,
      include: {
        feeType: true,
        level: true,
      },
    });
  }

  async update(id: string, dto: Partial<FeeStructureCreateDto>) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.dueDate) data.dueDate = new Date(dto.dueDate);
    return this.prisma.feeStructure.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.feeStructure.delete({ where: { id } });
  }

  /**
   * Recupere toute la grille tarifaire applicable a un eleve
   * (via sa classe et son niveau) pour une annee scolaire.
   */
  async getForLevel(schoolId: string, academicYearId: string, levelId: string) {
    return this.prisma.feeStructure.findMany({
      where: { schoolId, academicYearId, OR: [{ levelId }, { levelId: null }] },
      include: { feeType: true },
      orderBy: { feeType: { category: "asc" } },
    });
  }
}
