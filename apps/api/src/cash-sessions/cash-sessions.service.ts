import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CashSessionOpenDto, CashSessionCloseDto } from "./dto";

@Injectable()
export class CashSessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(schoolId: string | null, page = 1, limit = 20, status?: string) {
    const where: any = {};
    if (schoolId) where.schoolId = schoolId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.cashSession.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { openedAt: "desc" },
        include: {
          school: { select: { id: true, name: true } },
        },
      }),
      this.prisma.cashSession.count({ where }),
    ]);

    return { data, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const session = await this.prisma.cashSession.findUnique({
      where: { id },
      include: { school: true },
    });
    if (!session) throw new NotFoundException("Session de caisse introuvable");
    return session;
  }

  /**
   * Ouvre une nouvelle session de caisse.
   * Verifie qu'aucune session n'est deja ouverte pour ce caissier.
   */
  async open(dto: CashSessionOpenDto) {
    const existing = await this.prisma.cashSession.findFirst({
      where: {
        schoolId: dto.schoolId,
        cashierId: dto.cashierId,
        status: "OPEN",
      },
    });
    if (existing) {
      throw new BadRequestException("Une session de caisse est deja ouverte pour ce caissier");
    }

    return this.prisma.cashSession.create({
      data: {
        schoolId: dto.schoolId,
        cashierId: dto.cashierId,
        openingAmount: dto.openingAmount || 0,
        status: "OPEN",
      },
    });
  }

  /**
   * Ferme la session. Calcule :
   *  - expectedAmount = openingAmount + total des paiements non annules
   *  - difference = closingAmount - expectedAmount
   */
  async close(id: string, dto: CashSessionCloseDto) {
    const session = await this.findOne(id);
    if (session.status === "CLOSED") {
      throw new BadRequestException("Cette session est deja fermee");
    }

    // Calculer le total des paiements depuis l'ouverture
    const payments = await this.prisma.payment.findMany({
      where: {
        schoolId: session.schoolId,
        cashierId: session.cashierId,
        paidAt: { gte: session.openedAt },
        cancelledAt: null,
      },
    });

    const paymentsTotal = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const expectedAmount = Number(session.openingAmount) + paymentsTotal;
    const difference = dto.closingAmount - expectedAmount;

    return this.prisma.cashSession.update({
      where: { id },
      data: {
        closedAt: new Date(),
        closingAmount: dto.closingAmount,
        expectedAmount,
        difference,
        status: "CLOSED",
      },
    });
  }

  /**
   * Rapport detaille d'une session : paiements, totaux par methode, ecart.
   */
  async getReport(id: string) {
    const session = await this.findOne(id);

    const payments = await this.prisma.payment.findMany({
      where: {
        schoolId: session.schoolId,
        cashierId: session.cashierId,
        paidAt: {
          gte: session.openedAt,
          ...(session.closedAt ? { lte: session.closedAt } : {}),
        },
        cancelledAt: null,
      },
      include: {
        student: { select: { id: true, matricule: true, firstName: true, lastName: true } },
        receipt: { select: { id: true, number: true } },
      },
      orderBy: { paidAt: "asc" },
    });

    // Totaux par methode
    const byMethod: Record<string, { count: number; total: number }> = {};
    for (const p of payments) {
      if (!byMethod[p.method]) byMethod[p.method] = { count: 0, total: 0 };
      byMethod[p.method].count += 1;
      byMethod[p.method].total += Number(p.amount);
    }

    const totalPayments = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      session,
      summary: {
        openingAmount: Number(session.openingAmount),
        totalPayments,
        expectedAmount: Number(session.openingAmount) + totalPayments,
        closingAmount: session.closingAmount ? Number(session.closingAmount) : null,
        difference: session.difference ? Number(session.difference) : null,
        paymentsCount: payments.length,
        byMethod,
      },
      payments,
    };
  }

  /**
   * Session ouverte d'un caissier (s'il en a une).
   */
  async getCurrentOpen(schoolId: string, cashierId: string) {
    return this.prisma.cashSession.findFirst({
      where: { schoolId, cashierId, status: "OPEN" },
    });
  }

  async remove(id: string) {
    const session = await this.findOne(id);
    if (session.status === "OPEN") {
      throw new BadRequestException("Impossible de supprimer une session ouverte");
    }
    return this.prisma.cashSession.delete({ where: { id } });
  }
}
