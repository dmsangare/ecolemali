import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ExpenseCreateDto, ExpenseUpdateDto, ExpenseListFilters } from "./dto";

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(schoolId: string | null, filters: ExpenseListFilters) {
    const where: any = {};
    if (schoolId) where.schoolId = schoolId;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.cashierId) where.cashierId = filters.cashierId;
    if (filters.cashSessionId) where.cashSessionId = filters.cashSessionId;

    if (filters.dateFrom || filters.dateTo) {
      where.spentAt = {};
      if (filters.dateFrom) where.spentAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.spentAt.lte = new Date(filters.dateTo);
    }

    if (filters.q) {
      where.OR = [
        { description: { contains: filters.q, mode: "insensitive" } },
        { beneficiary: { contains: filters.q, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        orderBy: { spentAt: "desc" },
        take: filters.limit,
        skip: filters.offset,
        include: {
          category: true,
          cashier: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.expense.count({ where }),
    ]);

    // Calcul du total depense sur le filtre
    const sum = await this.prisma.expense.aggregate({
      where,
      _sum: { amount: true },
    });

    return {
      items,
      total,
      limit: filters.limit,
      offset: filters.offset,
      totalAmount: Number(sum._sum.amount || 0),
    };
  }

  async findOne(id: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: {
        category: true,
        cashier: { select: { id: true, firstName: true, lastName: true } },
        school: { select: { id: true, name: true } },
      },
    });
    if (!expense) throw new NotFoundException("Depense introuvable");
    return expense;
  }

  async create(dto: ExpenseCreateDto, cashierId: string, schoolId: string) {
    // Verifier que la categorie existe et appartient a l'ecole
    const category = await this.prisma.expenseCategory.findFirst({
      where: { id: dto.categoryId, schoolId },
    });
    if (!category) {
      throw new BadRequestException("Categorie de depense introuvable");
    }

    // Verifier que la session de caisse existe si fournie
    if (dto.cashSessionId) {
      const session = await this.prisma.cashSession.findFirst({
        where: { id: dto.cashSessionId, schoolId, status: "OPEN" },
      });
      if (!session) {
        throw new BadRequestException("Session de caisse introuvable ou fermee");
      }
    }

    return this.prisma.expense.create({
      data: {
        schoolId,
        categoryId: dto.categoryId,
        cashierId,
        cashSessionId: dto.cashSessionId || null,
        amount: dto.amount,
        description: dto.description,
        beneficiary: dto.beneficiary || null,
        receiptUrl: dto.receiptUrl || null,
        spentAt: dto.spentAt ? new Date(dto.spentAt) : new Date(),
      },
      include: { category: true },
    });
  }

  async update(id: string, dto: ExpenseUpdateDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.spentAt) data.spentAt = new Date(dto.spentAt);
    if (dto.categoryId) {
      const cat = await this.prisma.expenseCategory.findUnique({
        where: { id: dto.categoryId },
      });
      if (!cat) throw new BadRequestException("Categorie introuvable");
    }
    return this.prisma.expense.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.expense.delete({ where: { id } });
  }
}
