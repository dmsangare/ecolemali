import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ExpenseCategoryCreateDto, ExpenseCategoryUpdateDto } from "./dto";

@Injectable()
export class ExpenseCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(schoolId: string | null, includeInactive = false) {
    const where: any = {};
    if (schoolId) where.schoolId = schoolId;
    if (!includeInactive) where.isActive = true;

    return this.prisma.expenseCategory.findMany({
      where,
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
      include: {
        _count: { select: { expenses: true } },
      },
    });
  }

  async findOne(id: string) {
    const cat = await this.prisma.expenseCategory.findUnique({
      where: { id },
      include: { _count: { select: { expenses: true } } },
    });
    if (!cat) throw new NotFoundException("Categorie introuvable");
    return cat;
  }

  async create(dto: ExpenseCategoryCreateDto, schoolId: string) {
    const existing = await this.prisma.expenseCategory.findFirst({
      where: { schoolId, code: dto.code },
    });
    if (existing) {
      throw new ConflictException("Une categorie avec ce code existe deja");
    }

    return this.prisma.expenseCategory.create({
      data: {
        schoolId,
        code: dto.code,
        name: dto.name,
        description: dto.description || null,
        emoji: dto.emoji || null,
        isActive: dto.isActive ?? true,
        isSystem: false,
      },
    });
  }

  async update(id: string, dto: ExpenseCategoryUpdateDto) {
    await this.findOne(id);
    return this.prisma.expenseCategory.update({
      where: { id },
      data: {
        ...dto,
        description: dto.description || undefined,
        emoji: dto.emoji || undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    const usages = await this.prisma.expense.count({
      where: { categoryId: id },
    });
    if (usages > 0) {
      throw new ConflictException(
        "Impossible de supprimer : des depenses utilisent cette categorie",
      );
    }
    return this.prisma.expenseCategory.delete({ where: { id } });
  }
}
