import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MessageCreateDto, MessageListFilters } from "./dto";

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // LISTE DES MESSAGES (historique)
  // ============================================================
  async findAll(schoolId: string | null, filters: MessageListFilters) {
    const where: any = {};
    if (schoolId) where.schoolId = schoolId;
    if (filters.studentId) where.studentId = filters.studentId;
    if (filters.invoiceId) where.invoiceId = filters.invoiceId;
    if (filters.type) where.type = filters.type;
    if (filters.channel) where.channel = filters.channel;

    if (filters.dateFrom || filters.dateTo) {
      where.sentAt = {};
      if (filters.dateFrom) where.sentAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.sentAt.lte = new Date(filters.dateTo);
    }

    const [items, total] = await Promise.all([
      this.prisma.messageLog.findMany({
        where,
        orderBy: { sentAt: "desc" },
        take: filters.limit,
        skip: filters.offset,
        include: {
          student: { select: { id: true, firstName: true, lastName: true, matricule: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.messageLog.count({ where }),
    ]);

    return { items, total, limit: filters.limit, offset: filters.offset };
  }

  // ============================================================
  // ENREGISTRER UN MESSAGE (log)
  // ============================================================
  async create(dto: MessageCreateDto, userId: string, schoolId: string) {
    return this.prisma.messageLog.create({
      data: {
        schoolId,
        userId,
        studentId: dto.studentId || null,
        guardianId: dto.guardianId || null,
        invoiceId: dto.invoiceId || null,
        type: dto.type,
        channel: dto.channel,
        recipientPhone: dto.recipientPhone,
        recipientName: dto.recipientName || null,
        message: dto.message,
        status: dto.status,
      },
    });
  }

  // ============================================================
  // RELANCES : factures echues + derniere relance
  // ============================================================
  async findReminders(schoolId: string | null, minDaysLate = 0) {
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - minDaysLate);

    // Factures avec echeance depassee et solde > 0
    const where: any = {
      dueDate: { not: null, lt: cutoff },
      status: { in: ["UNPAID", "PARTIAL", "OVERDUE"] },
    };
    if (schoolId) where.schoolId = schoolId;

    const invoices = await this.prisma.invoice.findMany({
      where,
      orderBy: { dueDate: "asc" },
      take: 200,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            matricule: true,
            guardians: {
              include: {
                guardian: {
                  select: { id: true, firstName: true, lastName: true, phone: true, relationType: true },
                },
              },
            },
          },
        },
        messageLogs: {
          where: { type: "REMINDER" },
          orderBy: { sentAt: "desc" },
          take: 1,
          select: { id: true, sentAt: true, channel: true, recipientPhone: true },
        },
      },
    });

    // Filtrer les factures avec solde > 0
    const reminders = invoices
      .filter((inv) => Number(inv.balance) > 0)
      .map((inv) => {
        const dueDate = inv.dueDate ? new Date(inv.dueDate) : null;
        const daysLate = dueDate
          ? Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        const primaryGuardian = inv.student.guardians.find((g) => g.isPrimary)?.guardian
          || inv.student.guardians[0]?.guardian
          || null;

        const lastReminder = inv.messageLogs[0] || null;

        return {
          invoiceId: inv.id,
          invoiceNumber: inv.number,
          invoiceStatus: inv.status,
          totalAmount: Number(inv.totalAmount),
          paidAmount: Number(inv.paidAmount),
          balance: Number(inv.balance),
          dueDate: inv.dueDate,
          daysLate,
          student: {
            id: inv.student.id,
            firstName: inv.student.firstName,
            lastName: inv.student.lastName,
            matricule: inv.student.matricule,
          },
          guardian: primaryGuardian,
          lastReminder,
        };
      });

    return { items: reminders, total: reminders.length };
  }
}
