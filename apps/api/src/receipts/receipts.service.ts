import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ReceiptsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(schoolId: string | null, page = 1, limit = 20) {
    const where: any = {};
    if (schoolId) where.payment = { schoolId };

    const [data, total] = await Promise.all([
      this.prisma.receipt.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { issuedAt: "desc" },
        include: {
          payment: {
            include: {
              student: { select: { id: true, matricule: true, firstName: true, lastName: true } },
              invoice: { select: { id: true, number: true } },
            },
          },
        },
      }),
      this.prisma.receipt.count({ where }),
    ]);

    return { data, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const receipt = await this.prisma.receipt.findUnique({
      where: { id },
      include: {
        payment: {
          include: {
            student: true,
            invoice: { include: { items: { include: { feeType: true } } } },
            cashier: { select: { id: true, firstName: true, lastName: true } },
            school: true,
          },
        },
      },
    });
    if (!receipt) throw new NotFoundException("Recu introuvable");
    return receipt;
  }

  async findByNumber(number: string) {
    const receipt = await this.prisma.receipt.findUnique({
      where: { number },
      include: {
        payment: {
          include: {
            student: true,
            invoice: true,
            cashier: { select: { id: true, firstName: true, lastName: true } },
            school: true,
          },
        },
      },
    });
    if (!receipt) throw new NotFoundException("Recu introuvable");
    return receipt;
  }
}
