import { Injectable, BadRequestException, NotFoundException, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { InstallmentMode, InstallmentStatus, Prisma } from "@prisma/client";

// ============================================================
// TYPES
// ============================================================

interface InstallmentDraft {
  label: string;
  amount: number;
  dueDate: Date | null;
  orderIndex: number;
}

interface GeneratedInstallment {
  label: string;
  amount: number;
  dueDate: Date | null;
}

// ============================================================
// HELPERS
// ============================================================

const MONTH_NAMES_FR = [
  "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre",
];

const TRIMESTER_LABELS_FR = [
  "1er Trimestre", "2eme Trimestre", "3eme Trimestre",
];

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function dayOfMonth(date: Date, day: number): Date {
  const d = new Date(date);
  d.setDate(day);
  return d;
}

/**
 * Repartit un montant total en N parts egales.
 * La derniere absorbe l'arrondi.
 * Ex: 100 000 en 3 -> [33333, 33333, 33334]
 */
function splitAmount(total: number, parts: number): number[] {
  if (parts <= 0) throw new BadRequestException("parts doit etre > 0");
  const base = Math.floor(total / parts);
  const reste = total - base * parts;
  const result: number[] = [];
  for (let i = 0; i < parts; i++) {
    result.push(i === parts - 1 ? base + reste : base);
  }
  return result;
}

// ============================================================
// SERVICE
// ============================================================

@Injectable()
export class InstallmentsService {
  private readonly logger = new Logger(InstallmentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ----------------------------------------------------------
  // LECTURE
  // ----------------------------------------------------------

  async findAllByInvoice(invoiceId: string) {
    return this.prisma.invoiceInstallment.findMany({
      where: { invoiceId },
      orderBy: { orderIndex: "asc" },
      include: {
        payments: {
          where: { cancelledAt: null },
          select: {
            id: true, amount: true, method: true, paidAt: true,
          },
        },
      },
    });
  }

  async findOne(installmentId: string) {
    const installment = await this.prisma.invoiceInstallment.findUnique({
      where: { id: installmentId },
      include: { invoice: true },
    });
    if (!installment) throw new NotFoundException("Echeance introuvable");
    return installment;
  }

  // ----------------------------------------------------------
  // GENERATION AUTOMATIQUE D'ECHEANCIER
  // ----------------------------------------------------------

  /**
   * Genere une liste de brouillons d'echeances selon le mode.
   */
  buildInstallments(params: {
    totalAmount: number;
    startDate: Date;
    mode: InstallmentMode;
    customCount?: number;
    feeTypeLabel?: string; // ex: "Scolarite"
    dayOfMonth?: number;   // 15 par defaut
  }): GeneratedInstallment[] {
    const {
      totalAmount, startDate, mode, customCount,
      feeTypeLabel = "Facture", dayOfMonth: dayNumber = 15,
    } = params;

    const base = dayOfMonth(startDate, dayNumber);

    // CASH : une seule echeance
    if (mode === "CASH") {
      return [{ label: feeTypeLabel, amount: totalAmount, dueDate: base }];
    }

    // TRIMESTER : 3 echeances
    if (mode === "TRIMESTER") {
      const amounts = splitAmount(totalAmount, 3);
      return amounts.map((amount, i) => ({
        label: `${TRIMESTER_LABELS_FR[i]}`,
        amount,
        dueDate: addMonths(base, i * 3),
      }));
    }

    // MONTHLY : 9 echeances (Oct a Juin typiquement)
    if (mode === "MONTHLY") {
      const amounts = splitAmount(totalAmount, 9);
      return amounts.map((amount, i) => {
        const d = addMonths(base, i);
        const monthName = MONTH_NAMES_FR[d.getMonth()];
        return {
          label: `${feeTypeLabel} ${monthName}`,
          amount,
          dueDate: d,
        };
      });
    }

    // CUSTOM : N echeances (2 a 12)
    if (mode === "CUSTOM") {
      const n = customCount || 3;
      if (n < 1 || n > 12) {
        throw new BadRequestException("Le nombre d'echeances doit etre entre 1 et 12");
      }
      const amounts = splitAmount(totalAmount, n);
      return amounts.map((amount, i) => ({
        label: `${feeTypeLabel} ${i + 1}/${n}`,
        amount,
        dueDate: addMonths(base, i),
      }));
    }

    throw new BadRequestException("Mode d'echeancier inconnu");
  }

  /**
   * Genere et cree les echeances pour une facture.
   * Supprime les echeances existantes (si pas de paiement rattache).
   */
  async generateForInvoice(params: {
    invoiceId: string;
    mode?: InstallmentMode;
    customCount?: number;
    feeTypeLabel?: string;
    dayOfMonth?: number;
  }) {
    const { invoiceId, mode, customCount, feeTypeLabel, dayOfMonth } = params;

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { installments: { include: { payments: { where: { cancelledAt: null } } } } },
    });
    if (!invoice) throw new NotFoundException("Facture introuvable");
    if (invoice.status === "CANCELLED") {
      throw new BadRequestException("Impossible de modifier une facture annulee");
    }

    // Blocage : si des paiements sont deja rattaches
    const hasPayments = invoice.installments.some((i) => i.payments.length > 0);
    if (hasPayments) {
      throw new BadRequestException(
        "Des paiements sont deja rattaches. Supprimez-les d'abord.",
      );
    }

    const useMode = mode || (invoice.installmentMode as InstallmentMode);

    // Supprimer les anciennes echeances
    await this.prisma.invoiceInstallment.deleteMany({ where: { invoiceId } });

    // Generer les nouvelles
    const drafts = this.buildInstallments({
      totalAmount: Number(invoice.totalAmount),
      startDate: invoice.issuedAt || new Date(),
      mode: useMode,
      customCount,
      feeTypeLabel,
      dayOfMonth,
    });

    const created = await Promise.all(
      drafts.map((d, i) =>
        this.prisma.invoiceInstallment.create({
          data: {
            invoiceId,
            label: d.label,
            amount: new Prisma.Decimal(d.amount),
            paidAmount: new Prisma.Decimal(0),
            dueDate: d.dueDate,
            status: "PENDING",
            orderIndex: i,
          },
        }),
      ),
    );

    // Maj du mode sur la facture
    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { installmentMode: useMode },
    });

    this.logger.log(`Facture ${invoice.number} : ${created.length} echeance(s) generee(s) en mode ${useMode}`);
    return created;
  }

  // ----------------------------------------------------------
  // CRUD
  // ----------------------------------------------------------

  async create(invoiceId: string, dto: {
    label: string;
    amount: number;
    dueDate?: string | null;
    orderIndex?: number;
  }) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundException("Facture introuvable");
    if (invoice.status === "CANCELLED") {
      throw new BadRequestException("Impossible de modifier une facture annulee");
    }

    const count = await this.prisma.invoiceInstallment.count({ where: { invoiceId } });

    const created = await this.prisma.invoiceInstallment.create({
      data: {
        invoiceId,
        label: dto.label,
        amount: new Prisma.Decimal(dto.amount),
        paidAmount: new Prisma.Decimal(0),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        status: "PENDING",
        orderIndex: dto.orderIndex ?? count,
      },
    });

    await this.recalculateInvoiceBalance(invoiceId);
    return created;
  }

  async update(installmentId: string, dto: {
    label?: string;
    amount?: number;
    dueDate?: string | null;
    orderIndex?: number;
  }) {
    const inst = await this.findOne(installmentId);
    if (inst.invoice.status === "CANCELLED") {
      throw new BadRequestException("Impossible de modifier une facture annulee");
    }

    const data: any = {};
    if (dto.label !== undefined) data.label = dto.label;
    if (dto.amount !== undefined) data.amount = new Prisma.Decimal(dto.amount);
    if (dto.dueDate !== undefined) data.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    if (dto.orderIndex !== undefined) data.orderIndex = dto.orderIndex;

    const updated = await this.prisma.invoiceInstallment.update({
      where: { id: installmentId },
      data,
    });

    // Recalcul statut
    await this.recalculateStatus(installmentId);
    await this.recalculateInvoiceBalance(inst.invoiceId);
    return updated;
  }

  async remove(installmentId: string) {
    const inst = await this.findOne(installmentId);

    // Refuser si paiement rattache
    const hasPayment = await this.prisma.payment.count({
      where: { installmentId, cancelledAt: null },
    });
    if (hasPayment > 0) {
      throw new BadRequestException(
        "Impossible de supprimer une echeance qui a des paiements",
      );
    }

    await this.prisma.invoiceInstallment.delete({ where: { id: installmentId } });
    await this.recalculateInvoiceBalance(inst.invoiceId);
    return { deleted: true };
  }

  // ----------------------------------------------------------
  // CALCULS DE STATUT / SOLDE
  // ----------------------------------------------------------

  async recalculateStatus(installmentId: string) {
    const inst = await this.prisma.invoiceInstallment.findUnique({
      where: { id: installmentId },
    });
    if (!inst) return;

    const paid = Number(inst.paidAmount);
    const total = Number(inst.amount);
    const now = new Date();

    let status: InstallmentStatus = "PENDING";
    if (paid >= total) {
      status = "PAID";
    } else if (paid > 0) {
      status = inst.dueDate && inst.dueDate < now ? "OVERDUE" : "PARTIAL";
    } else {
      status = inst.dueDate && inst.dueDate < now ? "OVERDUE" : "PENDING";
    }

    await this.prisma.invoiceInstallment.update({
      where: { id: installmentId },
      data: { status },
    });
  }

  /**
   * Recalcule paidAmount + balance + status de la facture
   * a partir des echeances et des paiements.
   */
  async recalculateInvoiceBalance(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payments: { where: { cancelledAt: null } },
      },
    });
    if (!invoice) return;

    const totalPaid = invoice.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );
    const total = Number(invoice.totalAmount);
    const balance = Math.max(0, total - totalPaid);

    let status: any = invoice.status;
    if (invoice.status !== "CANCELLED") {
      if (totalPaid >= total) status = "PAID";
      else if (totalPaid > 0) status = "PARTIAL";
      else status = "UNPAID";
    }

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: new Prisma.Decimal(totalPaid),
        balance: new Prisma.Decimal(balance),
        status,
      },
    });
  }

  /**
   * Recalcule le paidAmount de chaque echeance a partir des paiements.
   */
  async recalculateAllInstallmentsForInvoice(invoiceId: string) {
    const installments = await this.prisma.invoiceInstallment.findMany({
      where: { invoiceId },
    });

    for (const inst of installments) {
      const paid = await this.prisma.payment.aggregate({
        where: { installmentId: inst.id, cancelledAt: null },
        _sum: { amount: true },
      });
      const paidAmount = Number(paid._sum.amount || 0);

      await this.prisma.invoiceInstallment.update({
        where: { id: inst.id },
        data: { paidAmount: new Prisma.Decimal(paidAmount) },
      });

      await this.recalculateStatus(inst.id);
    }
  }
}
