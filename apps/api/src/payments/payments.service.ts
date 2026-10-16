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
  /** Optionnel : cle d'idempotence (anti-doublon) */
  idempotencyKey?: string | null;
};

type PaymentFamilyInput = {
  schoolId: string;
  cashierId: string;
  guardianId: string;
  amount: number;
  method?: string;
  reference?: string;
  idempotencyKey?: string | null;
  note?: string | null;
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
      const allowOverpayment = (dto as any).allowOverpayment === true;
      let appliedAmount = dto.amount;
      let surplusAmount = 0;

      if (dto.amount > currentBalance + 0.001) {
        if (!allowOverpayment) {
          throw new BadRequestException(
            `Le montant depasse le solde restant (${currentBalance} FCFA). ` +
            `Cochez "Autoriser trop-percu" pour crediter le surplus.`,
          );
        }
        // Paiement plus grand que le solde : surplus -> credit eleve
        appliedAmount = currentBalance;
        surplusAmount = dto.amount - currentBalance;
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
          amount: appliedAmount,
          method: (dto.method ?? "CASH") as any,
          reference: dto.reference,
          cashierId: dto.cashierId,
          cashSessionId: openSession?.id ?? null,
          installmentId: targetInstallmentId,
        },
      });

      // 5. Mettre a jour l'echeance cible
      if (targetInstallment) {
        const newInstPaid = Number(targetInstallment.paidAmount) + appliedAmount;
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
      const newPaidAmount = Number(invoice.paidAmount) + appliedAmount;
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

      // 6. Si surplus, crediter le compte eleve
      if (surplusAmount > 0.001) {
        await tx.studentAccount.upsert({
          where: { studentId: dto.studentId },
          update: {
            creditBalance: { increment: surplusAmount },
            lastCreditAt: new Date(),
          },
          create: {
            studentId: dto.studentId,
            schoolId: dto.schoolId,
            creditBalance: surplusAmount,
            debtBalance: 0,
            lastCreditAt: new Date(),
          },
        });
        this.logger.log(
          `Trop-percu : +${surplusAmount} FCFA en credit pour eleve ${dto.studentId}`,
        );
      }

      return {
        ...payment,
        receipt,
        overpayment: surplusAmount > 0.001
          ? { credited: surplusAmount }
          : undefined,
      };
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

  /**
   * Encaissement famille : un seul montant reparti en FIFO
   * sur toutes les factures non soldees des enfants du tuteur.
   *
   * - FIFO global : les echeances les plus anciennes (dueDate) d'abord
   * - Un paiement par echeance couverte
   * - Idempotence : si idempotencyKey fourni et deja utilise, renvoie le recap sans rien creer
   */
  async settleFamily(params: PaymentFamilyInput) {
    const {
      schoolId,
      cashierId,
      guardianId,
      amount,
      method,
      reference,
      idempotencyKey,
      note,
    } = params;

    if (amount <= 0) throw new BadRequestException("Montant invalide");

    return this.prisma.$transaction(async (tx) => {
      // --- 0. Idempotence : si la cle existe deja, renvoyer le recap ---
      if (idempotencyKey) {
        const existing = await tx.payment.findFirst({
          where: { schoolId, idempotencyKey },
          include: { receipt: true },
        });
        if (existing) {
          this.logger.warn(
            `settleFamily idempotent hit: key=${idempotencyKey} -> payment=${existing.id}`,
          );
          return {
            idempotent: true,
            paymentsCreated: 0,
            amountApplied: 0,
            remainingUnapplied: amount,
            firstPaymentId: existing.id,
            perStudent: [],
          };
        }
      }

      // --- 1. Verifier le tuteur ---
      const guardian = await tx.guardian.findUnique({
        where: { id: guardianId },
      });
      if (!guardian) throw new NotFoundException("Tuteur introuvable");
      if (guardian.schoolId !== schoolId) {
        throw new BadRequestException("Tuteur hors etablissement");
      }

      // --- 2. Trouver tous les enfants du tuteur ---
      const links = await tx.studentGuardian.findMany({
        where: { guardianId },
        select: { studentId: true },
      });
      const studentIds = links.map((l) => l.studentId);
      if (studentIds.length === 0) {
        throw new BadRequestException("Ce tuteur n'a aucun eleve rattache");
      }

      // --- 3. Trouver les factures non soldees de ces eleves ---
      const invoices = await tx.invoice.findMany({
        where: {
          schoolId,
          studentId: { in: studentIds },
          status: { notIn: ["PAID", "CANCELLED"] },
          balance: { gt: 0 },
        },
        include: {
          installments: {
            where: { status: { not: "PAID" } },
            orderBy: [{ dueDate: "asc" }, { orderIndex: "asc" }],
          },
        },
      });

      if (invoices.length === 0) {
        throw new BadRequestException("Aucune facture non soldee pour ce tuteur");
      }

      // --- 4. Calculer le total du a la famille ---
      const totalDue = invoices.reduce(
        (sum, inv) => sum + Number(inv.balance),
        0,
      );
      if (amount > totalDue + 0.001) {
        throw new BadRequestException(
          `Le montant depasse le total du par la famille (${totalDue} FCFA)`,
        );
      }

      // --- 5. Aplatir toutes les echeances et trier FIFO global ---
      type InstRef = {
        inst: any;
        invoice: any;
      };
      const allInstallments: InstRef[] = [];
      for (const inv of invoices) {
        if (inv.installments.length === 0) {
          // Cas : facture sans echeance (ne devrait pas arriver, mais robustesse)
          allInstallments.push({
            inst: {
              id: null,
              label: "Solde facture",
              amount: Number(inv.balance),
              paidAmount: 0,
              dueDate: inv.dueDate,
              orderIndex: 0,
            },
            invoice: inv,
          });
        } else {
          for (const inst of inv.installments) {
            allInstallments.push({ inst, invoice: inv });
          }
        }
      }

      allInstallments.sort((a, b) => {
        const da = a.inst.dueDate ? new Date(a.inst.dueDate).getTime() : Infinity;
        const db = b.inst.dueDate ? new Date(b.inst.dueDate).getTime() : Infinity;
        if (da !== db) return da - db;
        return (a.inst.orderIndex ?? 0) - (b.inst.orderIndex ?? 0);
      });

      // --- 6. Session de caisse ouverte ---
      const openSession = await tx.cashSession.findFirst({
        where: { schoolId, cashierId, status: "OPEN" },
        orderBy: { openedAt: "desc" },
      });

      // --- 7. Appliquer le montant en FIFO ---
      let remaining = amount;
      const paymentsCreated: any[] = [];
      const perStudentMap = new Map<string, { amount: number; payments: number }>();
      let firstPaymentId: string | null = null;

      for (const { inst, invoice } of allInstallments) {
        if (remaining <= 0.001) break;

        const due =
          inst.id !== null
            ? Number(inst.amount) - Number(inst.paidAmount)
            : Number(invoice.balance);
        if (due <= 0.001) continue;

        const applied = Math.min(due, remaining);

        // Cle d'idempotence : uniquement sur le PREMIER paiement cree
        const keyForThis: string | null =
          firstPaymentId === null ? idempotencyKey ?? null : null;

        const payment: any = await tx.payment.create({
          data: {
            schoolId,
            invoiceId: invoice.id,
            studentId: invoice.studentId,
            amount: applied,
            method: (method ?? "CASH") as any,
            reference,
            cashierId,
            cashSessionId: openSession?.id ?? null,
            installmentId: inst.id ?? null,
            idempotencyKey: keyForThis,
            note:
              note ??
              `Encaissement famille - ${inst.label ?? "solde"}`,
          },
        });

        if (firstPaymentId === null) firstPaymentId = payment.id;
        paymentsCreated.push(payment);

        // Maj echeance
        if (inst.id !== null) {
          const newInstPaid = Number(inst.paidAmount) + applied;
          const instAmount = Number(inst.amount);
          let instStatus: any = "PENDING";
          if (newInstPaid >= instAmount) instStatus = "PAID";
          else if (newInstPaid > 0) {
            instStatus =
              inst.dueDate && new Date(inst.dueDate) < new Date()
                ? "OVERDUE"
                : "PARTIAL";
          }
          await tx.invoiceInstallment.update({
            where: { id: inst.id },
            data: { paidAmount: newInstPaid, status: instStatus },
          });
        }

        // Maj facture
        const newPaid = Number(invoice.paidAmount) + applied;
        const newBal = Number(invoice.totalAmount) - newPaid;
        const newStatus: any = newBal <= 0.001 ? "PAID" : "PARTIAL";
        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            paidAmount: newPaid,
            balance: Math.max(newBal, 0),
            status: newStatus,
          },
        });

        // Recalculer les valeurs locales pour eviter les doubles comptages
        invoice.paidAmount = newPaid;
        invoice.balance = Math.max(newBal, 0);
        if (inst.id !== null) {
          inst.paidAmount = Number(inst.paidAmount) + applied;
        }

        // Recap par eleve
        const prev = perStudentMap.get(invoice.studentId) ?? {
          amount: 0,
          payments: 0,
        };
        perStudentMap.set(invoice.studentId, {
          amount: prev.amount + applied,
          payments: prev.payments + 1,
        });

        remaining -= applied;
      }

      // --- 8. Generer un recu par paiement cree ---
      for (const p of paymentsCreated) {
        const receiptNumber = await this.generateReceiptNumber(tx, schoolId);
        await tx.receipt.create({
          data: { paymentId: p.id, number: receiptNumber },
        });
      }

      // --- 9. Construire le recap par eleve ---
      const perStudent = Array.from(perStudentMap.entries()).map(
        ([studentId, info]) => ({ studentId, ...info }),
      );

      return {
        idempotent: false,
        paymentsCreated: paymentsCreated.length,
        amountApplied: amount - remaining,
        remainingUnapplied: remaining,
        firstPaymentId,
        perStudent,
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
