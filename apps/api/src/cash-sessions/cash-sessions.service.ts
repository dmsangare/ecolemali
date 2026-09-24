import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenCashSessionDto } from './dto/open-cash-session.dto';
import { CloseCashSessionDto } from './dto/close-cash-session.dto';

@Injectable()
export class CashSessionsService {
  constructor(private prisma: PrismaService) {}

  private async computeTotals(sessionId: string) {
    const payments = await this.prisma.payment.findMany({
      where: { cashSessionId: sessionId },
    });
    const totalCash = payments
      .filter((p) => p.method === 'CASH')
      .reduce((s, p) => s + Number(p.amount), 0);
    const totalOther = payments
      .filter((p) => p.method !== 'CASH')
      .reduce((s, p) => s + Number(p.amount), 0);
    return {
      totalCash,
      totalOther,
      totalPayments: totalCash + totalOther,
      paymentsCount: payments.length,
    };
  }

  async getCurrent(schoolId: string, userId: string) {
    const session = await this.prisma.cashSession.findFirst({
      where: { schoolId, cashierId: userId, status: 'OPEN' },
      orderBy: { openedAt: 'desc' },
    });
    if (!session) return null;

    const totals = await this.computeTotals(session.id);
    const opening = Number(session.openingAmount);

    return {
      ...session,
      ...totals,
      theoreticalBalance: opening + totals.totalCash,
    };
  }

  async open(schoolId: string, userId: string, dto: OpenCashSessionDto) {
    const existing = await this.prisma.cashSession.findFirst({
      where: { schoolId, cashierId: userId, status: 'OPEN' },
    });
    if (existing) {
      throw new BadRequestException('Une session de caisse est déjà ouverte');
    }

    return this.prisma.cashSession.create({
      data: {
        schoolId,
        cashierId: userId,
        openingAmount: dto.openingBalance,
        status: 'OPEN',
      },
    });
  }

  async close(schoolId: string, userId: string, dto: CloseCashSessionDto) {
    const session = await this.prisma.cashSession.findFirst({
      where: { schoolId, cashierId: userId, status: 'OPEN' },
    });
    if (!session) {
      throw new NotFoundException('Aucune session de caisse ouverte');
    }

    const totals = await this.computeTotals(session.id);
    const expectedAmount = Number(session.openingAmount) + totals.totalCash;
    const difference = dto.closingBalance - expectedAmount;

    return this.prisma.cashSession.update({
      where: { id: session.id },
      data: {
        closingAmount: dto.closingBalance,
        expectedAmount,
        difference,
        status: 'CLOSED',
        closedAt: new Date(),
      },
    });
  }

  async history(schoolId: string, query: any) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const where: any = { schoolId, status: 'CLOSED' };
    if (query.cashierId) where.cashierId = query.cashierId;

    const [items, total] = await Promise.all([
      this.prisma.cashSession.findMany({
        where,
        orderBy: { closedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.cashSession.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async detail(schoolId: string, id: string) {
    const session = await this.prisma.cashSession.findFirst({
      where: { id, schoolId },
    });
    if (!session) throw new NotFoundException('Session introuvable');

    const payments = await this.prisma.payment.findMany({
      where: { cashSessionId: session.id },
      orderBy: { paidAt: 'desc' },
      include: {
        invoice: { select: { number: true } },
        student: { select: { firstName: true, lastName: true } },
      },
    });

    const totals = await this.computeTotals(session.id);
    return { ...session, payments, ...totals };
  }
}
