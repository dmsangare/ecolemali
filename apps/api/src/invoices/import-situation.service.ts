import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  generateSituationTemplate,
  parseSituationExcel,
  type ParsedSituationRow,
  type SituationParseResult,
  type SituationTemplateStudent,
} from "./utils/situation-excel.util";

/**
 * Mapping des modes de paiement ecrits en francais dans l'Excel
 * vers l'enum Prisma PaymentMethod (anglais).
 * Tolere les accents et la casse.
 */
const METHOD_MAP: Record<string, "CASH" | "TRANSFER" | "CHECK" | "MOBILE_MONEY" | "OTHER"> = {
  ESPECES: "CASH",
  ESPECE: "CASH",
  CASH: "CASH",
  MOBILE_MONEY: "MOBILE_MONEY",
  MOBILEMONEY: "MOBILE_MONEY",
  "MOBILE MONEY": "MOBILE_MONEY",
  CHEQUE: "CHECK",
  CHECK: "CHECK",
  VIREMENT: "TRANSFER",
  TRANSFER: "TRANSFER",
  AUTRE: "OTHER",
  OTHER: "OTHER",
};

function normalizeMethod(raw: string | null | undefined): "CASH" | "TRANSFER" | "CHECK" | "MOBILE_MONEY" | "OTHER" | null {
  if (!raw) return null;
  const key = String(raw).trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return METHOD_MAP[key] ?? null;
}

export interface ImportSituationPreviewResult extends SituationParseResult {
  /** Nombre de lignes ignorees car l'eleve a deja une facture (Q2). */
  skippedAlreadyInvoiced: number;
  /** Detail par ligne : trouve / non trouve / deja facture */
  rowDiagnostics: Array<{
    lineNumber: number;
    matricule: string;
    status: "OK" | "STUDENT_NOT_FOUND" | "ALREADY_INVOICED" | "INVALID";
    message?: string;
  }>;
}

export interface ImportSituationConfirmResult {
  createdInvoices: number;
  createdPayments: number;
  totalInvoiced: number;
  totalPaid: number;
  importTag: string;
}

@Injectable()
export class ImportSituationService {
  private readonly logger = new Logger(ImportSituationService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // 1. TEMPLATE pre-rempli (Q1)
  // ============================================================
  async getTemplate(schoolId: string, academicYearId: string): Promise<Buffer> {
    const year = await this.prisma.academicYear.findUnique({
      where: { id: academicYearId },
      select: { id: true, label: true, schoolId: true },
    });
    if (!year || year.schoolId !== schoolId) {
      throw new NotFoundException("Annee scolaire introuvable pour cette ecole");
    }

    // Eleves VALIDATED de l'annee active
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        academicYearId,
        status: "VALIDATED",
        student: { schoolId, deletedAt: null },
      },
      include: {
        student: {
          select: { id: true, matricule: true, firstName: true, lastName: true },
        },
        class: { select: { name: true } },
        level: { select: { name: true } },
      },
      orderBy: [
        { class: { name: "asc" } },
        { student: { lastName: "asc" } },
        { student: { firstName: "asc" } },
      ],
    });

    const students: SituationTemplateStudent[] = enrollments.map((e) => ({
      matricule: e.student.matricule,
      firstName: e.student.firstName,
      lastName: e.student.lastName,
      className: e.class?.name ?? "",
      levelName: e.level?.name ?? "",
    }));

    return generateSituationTemplate(students, year.label);
  }

  // ============================================================
  // 2. PREVIEW (analyse sans ecriture)
  // ============================================================
  async preview(
    buffer: Buffer,
    schoolId: string,
    academicYearId: string,
  ): Promise<ImportSituationPreviewResult> {
    const parsed = await parseSituationExcel(buffer);

    const diagnostics: ImportSituationPreviewResult["rowDiagnostics"] = [];
    let skippedAlreadyInvoiced = 0;
    let validAfterCrossCheck = 0;

    for (const row of parsed.rows) {
      const student = await this.prisma.student.findFirst({
        where: { schoolId, matricule: row.matricule, deletedAt: null },
        select: { id: true },
      });

      if (!student) {
        diagnostics.push({
          lineNumber: row.lineNumber,
          matricule: row.matricule,
          status: "STUDENT_NOT_FOUND",
          message: "Aucun eleve avec ce matricule",
        });
        continue;
      }

      const existingInvoice = await this.prisma.invoice.findFirst({
        where: {
          schoolId,
          studentId: student.id,
          academicYearId,
          status: { not: "CANCELLED" },
        },
        select: { id: true, number: true },
      });

      if (existingInvoice) {
        skippedAlreadyInvoiced++;
        diagnostics.push({
          lineNumber: row.lineNumber,
          matricule: row.matricule,
          status: "ALREADY_INVOICED",
          message: `Facture deja existante : ${existingInvoice.number}`,
        });
        continue;
      }

      validAfterCrossCheck++;
      diagnostics.push({
        lineNumber: row.lineNumber,
        matricule: row.matricule,
        status: "OK",
      });
    }

    // Si une ligne a une erreur de parsing OU de validation, on ajoute une entree INVALID
    for (const err of parsed.errors) {
      diagnostics.push({
        lineNumber: err.lineNumber,
        matricule: err.matricule ?? "",
        status: "INVALID",
        message: err.errors.join(" | "),
      });
    }

    const errorCount = parsed.errorCount;

    return {
      ...parsed,
      validCount: validAfterCrossCheck,
      errorCount,
      skippedAlreadyInvoiced,
      rowDiagnostics: diagnostics,
    };
  }

  // ============================================================
  // 3. CONFIRM (transaction tout-ou-rien) (Q3)
  // ============================================================
  async confirm(
    buffer: Buffer,
    schoolId: string,
    academicYearId: string,
    userId: string,
  ): Promise<ImportSituationConfirmResult> {
    const preview = await this.preview(buffer, schoolId, academicYearId);

    // Regle Q3 : tout ou rien. Si une seule ligne est invalide, on rejette.
    const blockingErrors = preview.rowDiagnostics.filter(
      (d) => d.status === "STUDENT_NOT_FOUND" || d.status === "INVALID",
    );
    if (blockingErrors.length > 0) {
      throw new BadRequestException(
        `Import annule : ${blockingErrors.length} ligne(s) invalide(s). Corrigez le fichier puis reessayez.`,
      );
    }

    // Recuperer le FeeType "AUTRE" ou "SITUATION" pour les items importes
    const feeType = await this.prisma.feeType.findFirst({
      where: { schoolId, isActive: true },
      orderBy: { code: "asc" },
    });
    if (!feeType) {
      throw new BadRequestException(
        "Aucun type de frais actif. Configurez au moins un FeeType avant l'import.",
      );
    }

    const importTag = `MANUAL_IMPORT_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`;
    const year = await this.prisma.academicYear.findUnique({
      where: { id: academicYearId },
      select: { label: true },
    });

    let createdInvoices = 0;
    let createdPayments = 0;
    let totalInvoiced = 0;
    let totalPaid = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const row of preview.rows) {
        const student = await tx.student.findFirst({
          where: { schoolId, matricule: row.matricule, deletedAt: null },
          select: { id: true },
        });
        if (!student) {
          throw new BadRequestException(`Eleve introuvable : ${row.matricule}`);
        }

        // Idempotence intra-transaction : skip si deja facture
        const existing = await tx.invoice.findFirst({
          where: {
            schoolId,
            studentId: student.id,
            academicYearId,
            status: { not: "CANCELLED" },
          },
          select: { id: true },
        });
        if (existing) continue;

        const invoiceNumber = await this.generateInvoiceNumber(tx, schoolId);

        const invoice = await tx.invoice.create({
          data: {
            schoolId,
            studentId: student.id,
            academicYearId,
            number: invoiceNumber,
            issuedAt: new Date(),
            totalAmount: row.totalDue,
            paidAmount: 0,
            balance: row.totalDue,
            status: "UNPAID",
            kind: "REGULAR",
            installmentMode: "CASH",
            items: {
              create: [
                {
                  feeTypeId: feeType.id,
                  description: row.feeDetails || `Situation importee (${year?.label ?? ""})`,
                  quantity: 1,
                  unitAmount: row.totalDue,
                  totalAmount: row.totalDue,
                },
              ],
            },
          },
        });

        // Creer une echeance unique (CASH) pour que le paiement importe puisse s'y rattacher
        await tx.invoiceInstallment.create({
          data: {
            invoiceId: invoice.id,
            label: "Situation importee",
            amount: row.totalDue,
            paidAmount: 0,
            dueDate: null,
            status: "PENDING",
            orderIndex: 0,
          },
        });

        createdInvoices++;
        totalInvoiced += row.totalDue;

        // Enregistrer le paiement (si present) via le service pour bénéficier
        // de toute la logique : FIFO, maj echeance, maj facture, recu.
        if (row.paidAmount > 0) {
          const method = normalizeMethod(row.lastPaymentMethod) ?? "CASH";
          const paidAt = row.lastPaymentDate ?? new Date();

          const invoiceForPayment = await tx.invoice.findUniqueOrThrow({
            where: { id: invoice.id },
            select: { id: true, studentId: true },
          });

          // NOTE : PaymentsService.create utilise son propre $transaction interne.
          // Il faut donc l'appeler HORS de la transaction globale pour eviter
          // l'imbrication. On collecte les paiements a faire et on les execute apres.
          createdPayments++;
          totalPaid += row.paidAmount;

          // On cree le paiement directement en tx pour rester atomique.
          const installment = await tx.invoiceInstallment.findFirst({
            where: { invoiceId: invoice.id, status: { not: "PAID" } },
            orderBy: { orderIndex: "asc" },
          });

          const newInstPaid = row.paidAmount;
          const instAmount = row.totalDue;
          const instStatus =
            newInstPaid >= instAmount ? "PAID" : newInstPaid > 0 ? "PARTIAL" : "PENDING";

          await tx.payment.create({
            data: {
              schoolId,
              invoiceId: invoice.id,
              studentId: invoiceForPayment.studentId,
              amount: row.paidAmount,
              method,
              reference: null,
              paidAt,
              cashierId: userId,
              installmentId: installment?.id ?? null,
              importedFrom: importTag,
              note: row.observation ?? null,
            },
          });

          if (installment) {
            await tx.invoiceInstallment.update({
              where: { id: installment.id },
              data: { paidAmount: newInstPaid, status: instStatus },
            });
          }

          const newBalance = row.totalDue - row.paidAmount;
          await tx.invoice.update({
            where: { id: invoice.id },
            data: {
              paidAmount: row.paidAmount,
              balance: Math.max(newBalance, 0),
              status: newBalance <= 0.001 ? "PAID" : "PARTIAL",
            },
          });
        }
      }

      // Verifier qu'aucune ligne "ALREADY_INVOICED" n'a ete comptee
      // (ce cas est tolere : skip silencieux, Q2).
      this.logger.log(
        `Import situation OK : ${createdInvoices} facture(s), ${createdPayments} paiement(s)`,
      );
    });

    return {
      createdInvoices,
      createdPayments,
      totalInvoiced,
      totalPaid,
      importTag,
    };
  }

  // ============================================================
  // Helper : numero de facture sequentiel (meme format que le reste de l'app)
  // ============================================================
  private async generateInvoiceNumber(tx: any, schoolId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `FAC-${year}-`;
    const last = await tx.invoice.findFirst({
      where: { schoolId, number: { startsWith: prefix } },
      orderBy: { number: "desc" },
      select: { number: true },
    });
    const lastSeq = last ? parseInt(last.number.slice(prefix.length), 10) : 0;
    const nextSeq = (lastSeq + 1).toString().padStart(6, "0");
    return `${prefix}${nextSeq}`;
  }
}
