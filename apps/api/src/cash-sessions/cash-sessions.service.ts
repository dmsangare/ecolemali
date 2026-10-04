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

  /**
   * Calcule les totaux d'une session :
   * - encaissements especes
   * - encaissements autres methodes
   * - depenses (toutes en especes)
   */
  private async computeTotals(sessionId: string) {
    const [payments, expenses] = await Promise.all([
      this.prisma.payment.findMany({
        where: { cashSessionId: sessionId },
      }),
      this.prisma.expense.findMany({
        where: { cashSessionId: sessionId },
      }),
    ]);

    const totalCashIn = payments
      .filter((p) => p.method === 'CASH')
      .reduce((s, p) => s + Number(p.amount), 0);

    const totalOtherIn = payments
      .filter((p) => p.method !== 'CASH')
      .reduce((s, p) => s + Number(p.amount), 0);

    const totalExpenses = expenses.reduce(
      (s, e) => s + Number(e.amount),
      0,
    );

    return {
      totalCash: totalCashIn,
      totalOther: totalOtherIn,
      totalExpenses,
      totalPayments: totalCashIn + totalOtherIn,
      paymentsCount: payments.length,
      expensesCount: expenses.length,
      movementsCount: payments.length + expenses.length,
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

    // Solde theorique = fond + encaissements especes - depenses
    const theoreticalBalance =
      opening + totals.totalCash - totals.totalExpenses;

    return {
      ...session,
      ...totals,
      theoreticalBalance,
    };
  }

  async open(schoolId: string, userId: string, dto: OpenCashSessionDto) {
    const existing = await this.prisma.cashSession.findFirst({
      where: { schoolId, cashierId: userId, status: 'OPEN' },
    });
    if (existing) {
      throw new BadRequestException('Une session de caisse est deja ouverte');
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
    const expectedAmount =
      Number(session.openingAmount) +
      totals.totalCash -
      totals.totalExpenses;
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
        include: {
          cashier: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
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
      include: {
        cashier: { select: { id: true, firstName: true, lastName: true } },
        school: {
          select: {
            id: true,
            name: true,
            sigle: true,
            address: true,
            phone: true,
            email: true,
            logoUrl: true,
            motto: true,
          },
        },
      },
    });
    if (!session) throw new NotFoundException('Session introuvable');

    const [payments, expenses] = await Promise.all([
      this.prisma.payment.findMany({
        where: { cashSessionId: session.id },
        orderBy: { paidAt: 'desc' },
        include: {
          invoice: { select: { id: true, number: true } },
          student: {
            select: { id: true, firstName: true, lastName: true, matricule: true },
          },
        },
      }),
      this.prisma.expense.findMany({
        where: { cashSessionId: session.id },
        orderBy: { spentAt: 'desc' },
        include: {
          category: { select: { code: true, name: true, emoji: true } },
        },
      }),
    ]);

    const totals = await this.computeTotals(session.id);
    const opening = Number(session.openingAmount);
    const theoreticalBalance =
      opening + totals.totalCash - totals.totalExpenses;

    return {
      ...session,
      payments,
      expenses,
      ...totals,
      theoreticalBalance,
    };
  }
}
