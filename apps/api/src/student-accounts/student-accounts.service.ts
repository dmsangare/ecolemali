import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class StudentAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Recupere le compte d'un eleve (cree si absent).
   */
  async findByStudent(studentId: string, schoolId: string) {
    let account = await this.prisma.studentAccount.findUnique({
      where: { studentId },
    });

    if (!account) {
      // Verifier que l'eleve existe et est bien dans cette ecole
      const student = await this.prisma.student.findUnique({
        where: { id: studentId },
        select: { schoolId: true },
      });
      if (!student || student.schoolId !== schoolId) {
        throw new NotFoundException("Eleve introuvable");
      }

      account = await this.prisma.studentAccount.create({
        data: {
          studentId,
          schoolId,
          creditBalance: 0,
          debtBalance: 0,
        },
      });
    }

    return this.formatAccount(account);
  }

  /**
   * Remboursement manuel du credit eleve (especes rendues au parent).
   */
  async refund(
    studentId: string,
    schoolId: string,
    amount: number,
    cashierId: string,
    note?: string,
  ) {
    if (amount <= 0) {
      throw new BadRequestException("Montant invalide");
    }

    return this.prisma.$transaction(async (tx) => {
      const account = await tx.studentAccount.findUnique({
        where: { studentId },
      });

      if (!account) {
        throw new NotFoundException("Compte eleve introuvable");
      }

      const credit = Number(account.creditBalance);
      if (amount > credit + 0.001) {
        throw new BadRequestException(
          `Montant superieur au credit disponible (${credit} FCFA)`,
        );
      }

      const newCredit = credit - amount;

      const updated = await tx.studentAccount.update({
        where: { studentId },
        data: {
          creditBalance: newCredit,
          lastCreditAt: new Date(),
        },
      });

      return {
        ...this.formatAccount(updated),
        refunded: amount,
        note: note || null,
      };
    });
  }

  /**
   * Utilise le credit disponible pour regler une facture de l'eleve.
   */
  async applyCredit(
    studentId: string,
    schoolId: string,
    invoiceId: string,
    amount: number,
    cashierId: string,
  ) {
    if (amount <= 0) {
      throw new BadRequestException("Montant invalide");
    }

    return this.prisma.$transaction(async (tx) => {
      const account = await tx.studentAccount.findUnique({
        where: { studentId },
      });
      if (!account) throw new NotFoundException("Compte eleve introuvable");

      const credit = Number(account.creditBalance);
      if (credit <= 0.001) {
        throw new BadRequestException("Aucun credit disponible");
      }

      const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
      if (!invoice) throw new NotFoundException("Facture introuvable");
      if (invoice.studentId !== studentId) {
        throw new BadRequestException("Facture hors eleve");
      }
      if (invoice.status === "CANCELLED" || invoice.status === "PAID") {
        throw new BadRequestException("Facture deja soldee ou annulee");
      }

      const balance = Number(invoice.balance);
      const applied = Math.min(credit, balance, amount);

      // 1. Diminuer le credit
      const newCredit = credit - applied;

      // 2. Augmenter paidAmount de la facture
      const newPaid = Number(invoice.paidAmount) + applied;
      const newBalance = Number(invoice.totalAmount) - newPaid;
      let newStatus: any = "PARTIAL";
      if (newBalance <= 0.001) newStatus = "PAID";

      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: newPaid,
          balance: Math.max(newBalance, 0),
          status: newStatus,
        },
      });

      // 3. Creer un paiement "VIRTUAL" pour la tracabilite (method = OTHER)
      const openSession = await tx.cashSession.findFirst({
        where: { schoolId, cashierId, status: "OPEN" },
        orderBy: { openedAt: "desc" },
      });

      const payment = await tx.payment.create({
        data: {
          schoolId,
          invoiceId,
          studentId,
          amount: applied,
          method: "OTHER",
          reference: "UTILISATION_CREDIT",
          cashierId,
          cashSessionId: openSession?.id ?? null,
          note: `Utilisation credit eleve (${applied} FCFA)`,
        },
      });

      // 4. Generer un recu
      const receiptNumber = await this.generateReceiptNumber(tx, schoolId);
      await tx.receipt.create({
        data: {
          paymentId: payment.id,
          number: receiptNumber,
        },
      });

      // 5. Mettre a jour le compte
      const updated = await tx.studentAccount.update({
        where: { studentId },
        data: { creditBalance: newCredit },
      });

      return {
        ...this.formatAccount(updated),
        applied,
        paymentId: payment.id,
        receiptNumber,
      };
    });
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private async generateReceiptNumber(tx: any, schoolId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `REC-${year}-`;
    const last = await tx.receipt.findFirst({
      where: { number: { startsWith: prefix } },
      orderBy: { number: "desc" },
      select: { number: true },
    });
    let n = 1;
    if (last?.number) {
      const parts = last.number.split("-");
      const lastN = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastN)) n = lastN + 1;
    }
    return `${prefix}${String(n).padStart(6, "0")}`;
  }

  private formatAccount(account: any) {
    return {
      id: account.id,
      studentId: account.studentId,
      schoolId: account.schoolId,
      creditBalance: Number(account.creditBalance),
      debtBalance: Number(account.debtBalance),
      lastCreditAt: account.lastCreditAt,
      lastDebtAt: account.lastDebtAt,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }
}
