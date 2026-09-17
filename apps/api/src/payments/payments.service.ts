import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { PaymentCreateDto, PaymentCancelDto } from "./dto";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly prisma: PrismaService) {}

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
        student: true,
        invoice: { include: { items: { include: { feeType: true } } } },
        receipt: true,
        cashier: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!payment) throw new NotFoundException("Paiement introuvable");
    return payment;
  }

  /**
   * Enregistre un paiement.
   * Transaction :
   *  1. Verifier la facture (non annulee, solde restant suffisant)
   *  2. Creer le paiement
   *  3. Mettre a jour la facture (paidAmount, balance, status)
   *  4. Creer le recu (auto)
   */
  async create(dto: PaymentCreateDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Recuperer et verifier la facture
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

      // 2. Creer le paiement
      const payment = await tx.payment.create({
        data: {
          schoolId: dto.schoolId,
          invoiceId: dto.invoiceId,
          studentId: dto.studentId,
          amount: dto.amount,
          method: dto.method as any,
          reference: dto.reference,
          cashierId: dto.cashierId,
        },
      });

      // 3. Mettre a jour la facture
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

      // 4. Generer le recu
      const receiptNumber = await this.generateReceiptNumber(tx, dto.schoolId);
      const receipt = await tx.receipt.create({
        data: {
          paymentId: payment.id,
          number: receiptNumber,
        },
      });

      this.logger.log(`Payment ${payment.id} created. Receipt: ${receiptNumber}`);

      return {
        ...payment,
        receipt,
      };
    });
  }

  async cancel(id: string, dto: PaymentCancelDto) {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({ where: { id } });
      if (!payment) throw new NotFoundException("Paiement introuvable");
      if (payment.cancelledAt) {
        throw new BadRequestException("Ce paiement est deja annule");
      }

      // 1. Marquer le paiement comme annule
      await tx.payment.update({
        where: { id },
        data: {
          cancelledAt: new Date(),
          cancelReason: dto.reason,
        },
      });

      // 2. Recalculer la facture
      const invoice = await tx.invoice.findUnique({
        where: { id: payment.invoiceId },
      });
      if (invoice) {
        const newPaidAmount = Math.max(Number(invoice.paidAmount) - Number(payment.amount), 0);
        const newBalance = Number(invoice.totalAmount) - newPaidAmount;
        let newStatus: any = "UNPAID";
        if (newBalance <= 0.001) newStatus = "PAID";
        else if (newPaidAmount > 0) newStatus = "PARTIAL";

        // Verifier echeance
        if (invoice.dueDate && new Date(invoice.dueDate) < new Date() && newStatus !== "PAID") {
          newStatus = "OVERDUE";
        }

        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            paidAmount: newPaidAmount,
            balance: Math.max(newBalance, 0),
            status: newStatus,
          },
        });
      }

      return { message: "Paiement annule" };
    });
  }

  async remove(id: string) {
    const payment = await this.findOne(id);
    if (!payment.cancelledAt) {
      throw new BadRequestException("Impossible de supprimer un paiement actif. Annulez-le d abord.");
    }
    return this.prisma.payment.delete({ where: { id } });
  }

  /**
   * Recettes du jour pour un caissier.
   */
  async getTodayTotal(schoolId: string, cashierId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: any = {
      schoolId,
      paidAt: { gte: today, lt: tomorrow },
      cancelledAt: null,
    };
    if (cashierId) where.cashierId = cashierId;

    const payments = await this.prisma.payment.findMany({ where });
    const total = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    return { count: payments.length, total };
  }

  private async generateReceiptNumber(tx: any, schoolId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `REC-${year}-`;

    const last = await tx.receipt.findFirst({
      where: { payment: { schoolId }, number: { startsWith: prefix } },
      orderBy: { number: "desc" },
    });

    let seq = 1;
    if (last) {
      const lastSeq = parseInt(last.number.slice(prefix.length), 10);
      if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }

    return `${prefix}${String(seq).padStart(6, "0")}`;
  }
}
