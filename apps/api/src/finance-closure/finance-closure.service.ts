import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CurrentUserPayload } from "../common/decorators";
import { assertSchoolAccess } from "../common/utils";
import { ExecuteFinanceClosureDto } from "./dto";

interface StudentBalance {
  studentId: string;
  matricule: string;
  firstName: string;
  lastName: string;
  className: string | null;
  totalBilled: number;
  totalPaid: number;
  balance: number; // positif = impaye (doit), negatif = avance (credit)
}

@Injectable()
export class FinanceClosureService {
  private readonly logger = new Logger(FinanceClosureService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // PREVIEW — calcule tout sans rien ecrire
  // ============================================================

  async preview(yearId: string, user: CurrentUserPayload) {
    const year = await this.prisma.academicYear.findUnique({
      where: { id: yearId },
    });
    if (!year) throw new NotFoundException("Annee introuvable");
    assertSchoolAccess(user, year.schoolId, "Annee introuvable");

    // 1. Factures de l'annee (hors annulees)
    const invoices = await this.prisma.invoice.findMany({
      where: {
        academicYearId: yearId,
        status: { not: "CANCELLED" },
        kind: "REGULAR", // on ignore les reports precedents
      },
      include: {
        student: {
          select: {
            id: true,
            matricule: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // 2. Calculer les soldes par eleve
    const byStudent = new Map<string, StudentBalance>();
    for (const inv of invoices) {
      const sid = inv.studentId;
      if (!byStudent.has(sid)) {
        byStudent.set(sid, {
          studentId: sid,
          matricule: inv.student.matricule,
          firstName: inv.student.firstName,
          lastName: inv.student.lastName,
          className: null,
          totalBilled: 0,
          totalPaid: 0,
          balance: 0,
        });
      }
      const entry = byStudent.get(sid)!;
      entry.totalBilled += Number(inv.totalAmount);
      entry.totalPaid += Number(inv.paidAmount);
      entry.balance += Number(inv.balance);
    }

    // 3. Charger les classes (via enrollment) pour enrichir
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        academicYearId: yearId,
        status: "VALIDATED",
        studentId: { in: [...byStudent.keys()] },
      },
      include: { class: { select: { name: true } } },
    });
    for (const enr of enrollments) {
      const entry = byStudent.get(enr.studentId);
      if (entry) entry.className = enr.class.name;
    }

    // 4. Séparer en debiteurs / crediteurs
    const allBalances = [...byStudent.values()];
    const debtors = allBalances.filter((b) => b.balance > 0.01);
    const creditors = allBalances.filter((b) => b.balance < -0.01);
    const settled = allBalances.filter((b) => Math.abs(b.balance) <= 0.01);

    // 5. Caisses ouvertes pour cette annee
    const openCashSessions = await this.prisma.cashSession.count({
      where: { schoolId: year.schoolId, status: "OPEN" },
    });

    // 6. Totaux
    const totalDebt = debtors.reduce((s, d) => s + d.balance, 0);
    const totalCredit = creditors.reduce((s, c) => s + Math.abs(c.balance), 0);

    // 7. Blocages
    const blockers: Array<{ type: string; count: number; label: string }> = [];
    if (openCashSessions > 0) {
      blockers.push({
        type: "open-cash-sessions",
        count: openCashSessions,
        label: "Caisses ouvertes",
      });
    }

    return {
      year: {
        id: year.id,
        label: year.label,
        status: year.status,
        financeClosedAt: year.financeClosedAt,
        financeClosedBy: year.financeClosedBy,
      },
      totals: {
        invoicesCount: invoices.length,
        studentsCount: allBalances.length,
        totalBilled: this.round(totalDebt + totalCredit + settled.reduce((s, x) => s + x.totalBilled, 0)),
        totalDebt: this.round(totalDebt),
        totalCredit: this.round(totalCredit),
      },
      debtors: debtors
        .sort((a, b) => b.balance - a.balance)
        .map((d) => ({ ...d, balance: this.round(d.balance) })),
      creditors: creditors
        .sort((a, b) => a.balance - b.balance)
        .map((c) => ({ ...c, balance: this.round(c.balance) })),
      settledCount: settled.length,
      blockers,
      canExecute: blockers.length === 0,
      alreadyClosed: !!year.financeClosedAt,
    };
  }

  // ============================================================
  // EXECUTE — cloture financiere annuelle
  // ============================================================

  async execute(dto: ExecuteFinanceClosureDto, user: CurrentUserPayload) {
    const year = await this.prisma.academicYear.findUnique({
      where: { id: dto.yearId },
    });
    if (!year) throw new NotFoundException("Annee introuvable");
    assertSchoolAccess(user, year.schoolId, "Annee introuvable");

    if (year.financeClosedAt) {
      throw new BadRequestException("Cette annee est deja cloturee financierement");
    }

    // 1. Recalculer le preview (source de verite)
    const preview = await this.preview(dto.yearId, user);

    // 2. Verifier les blocages
    if (!dto.ignoreOpenCashSessions && preview.blockers.length > 0) {
      throw new BadRequestException(
        `Impossible de cloturer : ${preview.blockers.map((b) => b.label).join(", ")}`,
      );
    }

    // 3. Trouver l'annee suivante (N+1) qui n'est pas cloturee
    const nextYear = await this.prisma.academicYear.findFirst({
      where: {
        schoolId: year.schoolId,
        startDate: { gt: year.startDate },
        financeClosedAt: null,
      },
      orderBy: { startDate: "asc" },
    });

    if (!nextYear && (dto.carryOverDebts || dto.carryOverCredits)) {
      throw new BadRequestException(
        "Aucune annee suivante (N+1) trouvee pour reporter les soldes. Creez-la d'abord via Passage a l'annee.",
      );
    }

    // 4. Charger le prefixe des factures (pour generer les numeros de report)
    const setting = await this.prisma.setting.findUnique({
      where: { schoolId: year.schoolId },
      select: { data: true },
    });
    const numbering: any = (setting?.data as any)?.numbering ?? {};
    const invoicePrefix: string = numbering.invoicePrefix || "FAC";
    const yearNum = new Date(nextYear?.startDate ?? year.startDate).getFullYear();

    // === TRANSACTION ===
    const result = await this.prisma.$transaction(async (tx) => {
      let carriedInvoicesCount = 0;
      let creditedAccountsCount = 0;
      let debitedAccountsCount = 0;

      // Verifier/creer le FeeType systeme "CARRY_OVER"
      const carryOverFeeType = await tx.feeType.upsert({
        where: {
          schoolId_code: {
            schoolId: year.schoolId,
            code: "CARRY_OVER",
          },
        },
        update: {},
        create: {
          schoolId: year.schoolId,
          code: "CARRY_OVER",
          name: "Report solde annee precedente",
          category: "AUTRE",
          isActive: true,
        },
      });

      // 5a. Reporter les IMPAYES en factures sur N+1
      if (dto.carryOverDebts && nextYear && preview.debtors.length > 0) {
        for (const debtor of preview.debtors) {
          // Generer un numero unique
          const last = await tx.invoice.findFirst({
            where: {
              schoolId: year.schoolId,
              number: { startsWith: `${invoicePrefix}-${yearNum}-` },
            },
            orderBy: { number: "desc" },
          });
          let seq = 1;
          if (last) {
            const lastSeq = parseInt(last.number.slice(-6), 10);
            if (!isNaN(lastSeq)) seq = lastSeq + 1;
          }
          const number = `${invoicePrefix}-${yearNum}-${String(seq).padStart(6, "0")}`;

          // Trouver une facture source (pour la tracabilite)
          const sourceInvoice = await tx.invoice.findFirst({
            where: {
              academicYearId: dto.yearId,
              studentId: debtor.studentId,
              kind: "REGULAR",
              status: { not: "CANCELLED" },
            },
            select: { id: true },
          });

          // Creer la facture de report
          await tx.invoice.create({
            data: {
              schoolId: year.schoolId,
              studentId: debtor.studentId,
              academicYearId: nextYear.id,
              number,
              issuedAt: nextYear.startDate,
              dueDate: nextYear.startDate,
              totalAmount: debtor.balance,
              paidAmount: 0,
              balance: debtor.balance,
              status: "UNPAID",
              kind: "CARRY_OVER",
              carriedOverFromId: sourceInvoice?.id ?? null,
              items: {
                create: {
                  feeTypeId: carryOverFeeType.id,
                  description: `Report solde ${year.label}`,
                  quantity: 1,
                  unitAmount: debtor.balance,
                  totalAmount: debtor.balance,
                },
              },
            },
          });

          // Mettre a jour le StudentAccount (debtBalance)
          await tx.studentAccount.upsert({
            where: { studentId: debtor.studentId },
            update: {
              debtBalance: { increment: debtor.balance },
              lastDebtAt: new Date(),
            },
            create: {
              studentId: debtor.studentId,
              schoolId: year.schoolId,
              creditBalance: 0,
              debtBalance: debtor.balance,
              lastDebtAt: new Date(),
            },
          });

          carriedInvoicesCount++;
          debitedAccountsCount++;
        }
      }

      // 5b. Reporter les AVANCES (credits) sur le compte eleve
      if (dto.carryOverCredits && preview.creditors.length > 0) {
        for (const creditor of preview.creditors) {
          const creditAmount = Math.abs(creditor.balance);

          await tx.studentAccount.upsert({
            where: { studentId: creditor.studentId },
            update: {
              creditBalance: { increment: creditAmount },
              lastCreditAt: new Date(),
            },
            create: {
              studentId: creditor.studentId,
              schoolId: year.schoolId,
              creditBalance: creditAmount,
              debtBalance: 0,
              lastCreditAt: new Date(),
            },
          });

          creditedAccountsCount++;
        }
      }

      // 5c. Marquer l'annee comme cloturee financierement
      await tx.academicYear.update({
        where: { id: dto.yearId },
        data: {
          financeClosedAt: new Date(),
          financeClosedBy: user.id,
        },
      });

      return {
        yearId: dto.yearId,
        yearLabel: year.label,
        nextYearId: nextYear?.id ?? null,
        nextYearLabel: nextYear?.label ?? null,
        carriedInvoicesCount,
        creditedAccountsCount,
        debitedAccountsCount,
        totalDebtCarried: this.round(
          preview.debtors.reduce((s, d) => s + d.balance, 0),
        ),
        totalCreditCarried: this.round(
          preview.creditors.reduce((s, c) => s + Math.abs(c.balance), 0),
        ),
      };
    });

    this.logger.log(
      `Cloture finance ${year.label} : ${result.carriedInvoicesCount} factures reportees, ` +
        `${result.creditedAccountsCount} credits, dette totale ${result.totalDebtCarried}`,
    );

    return result;
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private round(n: number): number {
    return Math.round(n * 100) / 100;
  }
}
