import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { FeeTypeCreateDto } from "./dto";

@Injectable()
export class FeeTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(schoolId: string | null, category?: string) {
    const where: any = {};
    if (schoolId) where.schoolId = schoolId;
    if (category) where.category = category;

    return this.prisma.feeType.findMany({
      where,
      orderBy: [{ category: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { feeStructures: true, invoiceItems: true } },
      },
    });
  }

  async findOne(id: string) {
    const feeType = await this.prisma.feeType.findUnique({
      where: { id },
      include: {
        feeStructures: { include: { level: true, academicYear: true } },
      },
    });
    if (!feeType) throw new NotFoundException("Type de frais introuvable");
    return feeType;
  }

  async create(dto: FeeTypeCreateDto) {
    const existing = await this.prisma.feeType.findUnique({
      where: { schoolId_code: { schoolId: dto.schoolId, code: dto.code } },
    });
    if (existing) throw new ConflictException("Un type de frais avec ce code existe deja");

    return this.prisma.feeType.create({
      data: { ...dto, category: dto.category as any } as any,
    });
  }

  async update(id: string, dto: Partial<FeeTypeCreateDto>) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.category) data.category = dto.category as any;
    return this.prisma.feeType.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    const usages = await this.prisma.invoiceItem.count({ where: { feeTypeId: id } });
    if (usages > 0) {
      throw new ConflictException("Impossible de supprimer : des factures utilisent ce type de frais");
    }
    return this.prisma.feeType.delete({ where: { id } });
  }
}
