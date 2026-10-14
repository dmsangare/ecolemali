import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SettingsService } from "../settings/settings.service";
import { PaymentCancelDto } from "./dto";
import { InstallmentsService } from "../invoices/installments.service";

type PaymentCreateInput = {
  schoolId: string;
  cashierId: string;
  invoiceId: string;
  studentId: string;
  amount: number;
  method?: string;
  reference?: string;
  /** Optionnel : echeance a regler. Si absent, applique FIFO. */
  installmentId?: string | null;
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly installments: InstallmentsService,
  ) {}

  async findAll(schoolId: string | null, page = 1, limit = 20, filters: {
    studentId?: string; invoiceId?: string; method?: string; fromDate?: string; toDate?: string;
  } = {}) {
    const where: any = { cancelledAt: null };
    if (schoolId) where.schoolId = schoolId;
    if (filters.studentId) where.studentId = filters.studentId;
    if (filters.invoiceId) where.invoiceId = filters.invoiceId;
    if (filters.method) where.method = filters.method;
    if (filters.fromDate || filters.toDate) {
      where.paidAt = {};
      if (filters.fromDate) where.paidAt.gte = new Date(filters.fromDate);
      if (filters.toDate) where.paidAt.lte = new Date(filters.toDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { paidAt: "desc" },
        include: {
          student: { select: { id: true, matricule: true, firstName: true, lastName: true } },
          invoice: { select: { id: true, number: true, totalAmount: true, balance: true } },
          receipt: { select: { id: true, number: true } },
          cashier: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { data, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            guardians: {
              include: {
                guardian: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    relationType: true,
                  },
                },
              },
            },
          },
        },
        invoice: { include: { items: { include: { feeType: true } } } },
        receipt: true,
        cashier: { select: { id: true, firstName: true, lastName: true } },
        school: {
          select: {
            id: true,
            name: true,
            sigle: true,
            logoUrl: true,
            motto: true,
            address: true,
            phone: true,
          },
        },
      },
    });
    if (!payment) throw new NotFoundException("Paiement introuvable");
    return payment;
  }

  async getTodayTotal(schoolId: string, cashierId?: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const where: any = {
      schoolId,
      cancelledAt: null,
      paidAt: { gte: start, lte: end },
    };
    if (cashierId) where.cashierId = cashierId;

    const payments = await this.prisma.payment.findMany({ where });
    const total = payments.reduce((s, p) => s + Number(p.amount), 0);
    return { total, count: payments.length };
  }

  async create(dto: PaymentCreateInput) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Verifier la facture
      const invoice = await tx.invoice.findUnique({
        where: { id: dto.invoiceId },
      });

      if (!invoice) throw new NotFoundException("Facture introuvable");
      if (invoice.status === "CANCELLED") {
        throw new BadRequestException("Impossible de payer une facture annulee");
      }

      const currentBalance = Number(invoice.balance);
      if (dto.amount > currentBalance + 0.001) {
        throw new BadRequestException(
          `Le montant depasse le solde restant (${currentBalance} FCFA)`,
        );
      }

      // 2. Chercher la session de caisse ouverte du caissier
      const openSession = await tx.cashSession.findFirst({
        where: {
          schoolId: dto.schoolId,
          cashierId: dto.cashierId,
          status: "OPEN",
        },
        orderBy: { openedAt: "desc" },
      });

      // 3. Determiner l'echeance a regler
      //    - Si dto.installmentId fourni : ciblage explicite
      //    - Sinon : FIFO (premiere echeance non soldee, dans l'ordre)
      let targetInstallmentId: string | null = dto.installmentId || null;
      let targetInstallment: any = null;

      if (targetInstallmentId) {
        targetInstallment = await tx.invoiceInstallment.findUnique({
          where: { id: targetInstallmentId },
        });
        if (!targetInstallment || targetInstallment.invoiceId !== dto.invoiceId) {
          throw new BadRequestException("Echeance introuvable pour cette facture");
        }
      } else {
        // FIFO : on prend la 1ere echeance non totalement payee
        targetInstallment = await tx.invoiceInstallment.findFirst({
          where: {
            invoiceId: dto.invoiceId,
            status: { not: "PAID" },
          },
          orderBy: { orderIndex: "asc" },
        });
        if (targetInstallment) {
          targetInstallmentId = targetInstallment.id;
        }
      }

      // 4. Creer le paiement (rattache la session de caisse si ouverte)
      const payment = await tx.payment.create({
        data: {
          schoolId: dto.schoolId,
          invoiceId: dto.invoiceId,
          studentId: dto.studentId,
          amount: dto.amount,
          method: (dto.method ?? "CASH") as any,
          reference: dto.reference,
          cashierId: dto.cashierId,
          cashSessionId: openSession?.id ?? null,
          installmentId: targetInstallmentId,
        },
      });

      // 5. Mettre a jour l'echeance cible
      if (targetInstallment) {
        const newInstPaid = Number(targetInstallment.paidAmount) + dto.amount;
        const instAmount = Number(targetInstallment.amount);
        let instStatus: any = "PENDING";
        if (newInstPaid >= instAmount) instStatus = "PAID";
        else if (newInstPaid > 0) {
          instStatus = targetInstallment.dueDate && targetInstallment.dueDate < new Date()
            ? "OVERDUE"
            : "PARTIAL";
        } else {
          instStatus = targetInstallment.dueDate && targetInstallment.dueDate < new Date()
            ? "OVERDUE"
            : "PENDING";
        }

        await tx.invoiceInstallment.update({
          where: { id: targetInstallment.id },
          data: {
            paidAmount: newInstPaid,
            status: instStatus,
          },
        });
      }

      // 6. Mettre a jour la facture
      const newPaidAmount = Number(invoice.paidAmount) + dto.amount;
      const newBalance = Number(invoice.totalAmount) - newPaidAmount;
      let newStatus: any = "PARTIAL";
      if (newBalance <= 0.001) newStatus = "PAID";

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: newPaidAmount,
          balance: Math.max(newBalance, 0),
          status: newStatus,
        },
      });

      // 5. Generer le recu
      const receiptNumber = await this.generateReceiptNumber(tx, dto.schoolId);
      const receipt = await tx.receipt.create({
        data: {
          paymentId: payment.id,
          number: receiptNumber,
        },
      });

      return { ...payment, receipt };
    });
  }

  /**
   * Regle plusieurs echeances d'un coup (FIFO).
   * Cree un paiement distinct par echeance affectee.
   *
   * @returns le nombre d'echeances soldees et le montant total affecte
   */
  async settleAll(params: {
    schoolId: string;
    cashierId: string;
    invoiceId: string;
    studentId: string;
    amount: number;
    method?: string;
    reference?: string;
  }) {
    const { schoolId, cashierId, invoiceId, studentId, amount, method, reference } = params;

    if (amount <= 0) throw new BadRequestException("Montant invalide");

    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
      if (!invoice) throw new NotFoundException("Facture introuvable");
      if (invoice.status === "CANCELLED") {
        throw new BadRequestException("Impossible de payer une facture annulee");
      }

      const balance = Number(invoice.balance);
      if (amount > balance + 0.001) {
        throw new BadRequestException(
          `Le montant depasse le solde restant (${balance} FCFA)`,
        );
      }

      // Session de caisse ouverte
      const openSession = await tx.cashSession.findFirst({
        where: { schoolId, cashierId, status: "OPEN" },
        orderBy: { openedAt: "desc" },
      });

      // Recuperer les echeances non soldees, dans l'ordre
      const installments = await tx.invoiceInstallment.findMany({
        where: { invoiceId, status: { not: "PAID" } },
        orderBy: { orderIndex: "asc" },
      });

      let remaining = amount;
      const paymentsCreated: any[] = [];

      for (const inst of installments) {
        if (remaining <= 0.001) break;

        const due = Number(inst.amount) - Number(inst.paidAmount);
        if (due <= 0.001) continue;

        const applied = Math.min(due, remaining);

        // Creer un paiement pour cette echeance
        const p = await tx.payment.create({
          data: {
            schoolId,
            invoiceId,
            studentId,
            amount: applied,
            method: (method ?? "CASH") as any,
            reference,
            cashierId,
            cashSessionId: openSession?.id ?? null,
            installmentId: inst.id,
            note: `Settle-all FIFO (echeance ${inst.label})`,
          },
        });

        // Maj echeance
        const newInstPaid = Number(inst.paidAmount) + applied;
        const instAmount = Number(inst.amount);
        let instStatus: any = "PENDING";
        if (newInstPaid >= instAmount) instStatus = "PAID";
        else if (newInstPaid > 0) {
          instStatus = inst.dueDate && inst.dueDate < new Date()
            ? "OVERDUE"
            : "PARTIAL";
        }

        await tx.invoiceInstallment.update({
          where: { id: inst.id },
          data: { paidAmount: newInstPaid, status: instStatus },
        });

        paymentsCreated.push(p);
        remaining -= applied;
      }

      // Recalcul global facture
      const newPaidAmount = Number(invoice.paidAmount) + amount;
      const newBalance = Number(invoice.totalAmount) - newPaidAmount;
      let newStatus: any = "PARTIAL";
      if (newBalance <= 0.001) newStatus = "PAID";

      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: newPaidAmount,
          balance: Math.max(newBalance, 0),
          status: newStatus,
        },
      });

      return {
        paymentsCreated: paymentsCreated.length,
        amountApplied: amount - remaining,
        remainingUnapplied: remaining,
      };
    });
  }

  async cancel(id: string, dto: PaymentCancelDto) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException("Paiement introuvable");
    if (payment.cancelledAt) {
      throw new BadRequestException("Paiement deja annule");
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id },
        data: {
          cancelledAt: new Date(),
          cancelReason: dto.reason,
        },
      });

      const invoice = await tx.invoice.findUnique({
        where: { id: payment.invoiceId },
      });
      if (invoice) {
        const newPaid = Number(invoice.paidAmount) - Number(payment.amount);
        const newBalance = Number(invoice.totalAmount) - newPaid;
        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            paidAmount: Math.max(newPaid, 0),
            balance: Math.max(newBalance, 0),
            status: newPaid <= 0 ? "UNPAID" : "PARTIAL",
          },
        });
      }

      // Si le paiement etait rattache a une echeance, decrementer son paidAmount
      if (payment.installmentId) {
        const inst = await tx.invoiceInstallment.findUnique({
          where: { id: payment.installmentId },
        });
        if (inst) {
          const newInstPaid = Math.max(
            0,
            Number(inst.paidAmount) - Number(payment.amount),
          );
          const instAmount = Number(inst.amount);
          let instStatus: any = "PENDING";
          if (newInstPaid >= instAmount) instStatus = "PAID";
          else if (newInstPaid > 0) {
            instStatus = inst.dueDate && inst.dueDate < new Date()
              ? "OVERDUE"
              : "PARTIAL";
          } else {
            instStatus = inst.dueDate && inst.dueDate < new Date()
              ? "OVERDUE"
              : "PENDING";
          }

          await tx.invoiceInstallment.update({
            where: { id: inst.id },
            data: {
              paidAmount: newInstPaid,
              status: instStatus,
            },
          });
        }
      }

      return { success: true };
    });
  }

  async remove(id: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException("Paiement introuvable");
    await this.prisma.payment.delete({ where: { id } });
    return { success: true };
  }

  private async generateReceiptNumber(tx: any, schoolId: string): Promise<string> {
    const year = new Date().getFullYear();
    const settingsData = await this.settings.getDataWithDefaults(schoolId);
    const receiptPrefix = (settingsData.numbering?.receiptPrefix ?? "REC")
      .toString()
      .toUpperCase();
    const prefix = `${receiptPrefix}-${year}-`;
    const last = await tx.receipt.findFirst({
      where: { number: { startsWith: prefix } },
      orderBy: { number: "desc" },
    });
    const lastSeq = last ? parseInt(last.number.slice(prefix.length), 10) : 0;
    const nextSeq = (lastSeq + 1).toString().padStart(6, "0");
    return `${prefix}${nextSeq}`;
  }
}
