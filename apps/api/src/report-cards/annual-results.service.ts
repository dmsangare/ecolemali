import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CurrentUserPayload } from "../common/decorators";
import { rulesForCycle } from "./grading-rules";
import { computeAnnualRows, AnnualDecision } from "./annual-calc";

const DECISION_LABEL: Record<AnnualDecision, string> = {
  ADMIS: "Admis en classe superieure",
  REDOUBLE: "Redouble",
  A_DETERMINER: "A determiner",
};

@Injectable()
export class AnnualResultsService {
  constructor(private readonly prisma: PrismaService) {}

  async compute(
    params: { classId: string; academicYearId: string; includeDraft: boolean },
    user: CurrentUserPayload,
  ) {
    const cls = await this.prisma.class.findUnique({
      where: { id: params.classId },
      include: { level: { select: { id: true, name: true, cycle: true } } },
    });
    if (!cls) throw new NotFoundException("Classe introuvable");
    if (!user.roles.includes("SUPER_ADMIN") && cls.schoolId !== user.schoolId) {
      throw new NotFoundException("Classe introuvable");
    }

    const cycle = cls.level.cycle as string;
    const rules = rulesForCycle(cycle);

    // Periodes de l'annee qui comptent pour ce cycle : mois (1er cycle) ou trimestres (2eme cycle)
    const terms = await this.prisma.term.findMany({
      where: { academicYearId: params.academicYearId, type: { in: rules.allowedTermTypes as any } },
      orderBy: { startDate: "asc" },
      select: { id: true, name: true, startDate: true, endDate: true, type: true },
    });

    const statuses = params.includeDraft ? ["DRAFT", "VALIDATED", "PUBLISHED"] : ["VALIDATED", "PUBLISHED"];
    const reports = await this.prisma.reportCard.findMany({
      where: {
        classId: params.classId,
        academicYearId: params.academicYearId,
        termId: { in: terms.map((t) => t.id) },
        status: { in: statuses as any },
      },
      include: { items: true },
    });

    const enrollments = await this.prisma.enrollment.findMany({
      where: { classId: params.classId, academicYearId: params.academicYearId, status: "VALIDATED" },
      include: { student: { select: { id: true, matricule: true, firstName: true, lastName: true } } },
    });

    const setting = await this.prisma.setting.findFirst({ where: { schoolId: cls.schoolId } });
    const passMark = setting ? Number(setting.passMark) : 10;

    const result = computeAnnualRows({
      cycle,
      terms: terms.map((t) => ({ id: t.id, name: t.name })),
      cards: reports.map((r) => ({
        studentId: r.studentId,
        termId: r.termId,
        average: r.average !== null ? Number(r.average) : null,
        items: r.items.map((i) => ({
          subjectId: i.subjectId,
          average: i.average !== null ? Number(i.average) : null,
          coefficient: Number(i.coefficient),
        })),
      })),
      students: enrollments.map((e) => e.student),
      passMark,
    });

    return {
      class: { id: cls.id, name: cls.name, levelId: cls.level.id, levelName: cls.level.name, cycle },
      academicYearId: params.academicYearId,
      scale: result.scale,
      admisThreshold: result.admisThreshold,
      periodKind: cycle === "PREMIER_CYCLE" ? "MOIS" : "TRIMESTRE",
      periods: terms.map((t) => ({ id: t.id, name: t.name, startDate: t.startDate, endDate: t.endDate })),
      includeDraft: params.includeDraft,
      rows: result.rows,
      stats: result.stats,
    };
  }

  /**
   * Enregistre le passage de chaque eleve (table student_pathways) : admis/passe -> PASSED, redouble -> REPEATED.
   * Seuls les eleves dont TOUTES les periodes sont calculees sont enregistres.
   */
  async apply(params: { classId: string; academicYearId: string }, user: CurrentUserPayload) {
    const data = await this.compute({ ...params, includeDraft: false }, user);
    if (data.periods.length === 0) {
      throw new BadRequestException("Aucune periode (mois ou trimestre) pour cette annee et ce cycle");
    }

    let applied = 0;
    let skipped = 0;
    await this.prisma.$transaction(async (tx) => {
      for (const row of data.rows) {
        if (!row.complete || row.annualAverage === null || row.decision === "A_DETERMINER") {
          skipped += 1;
          continue;
        }
        const payload = {
          levelId: data.class.levelId,
          classId: data.class.id,
          result: (row.decision === "REDOUBLE" ? "REPEATED" : "PASSED") as "PASSED" | "REPEATED",
          decision: `${DECISION_LABEL[row.decision]} - moy. ${row.annualAverage.toFixed(2)}/${data.scale}`,
        };
        const existing = await tx.studentPathway.findFirst({
          where: { studentId: row.student.id, academicYearId: params.academicYearId },
          select: { id: true },
        });
        if (existing) {
          await tx.studentPathway.update({ where: { id: existing.id }, data: payload });
        } else {
          await tx.studentPathway.create({
            data: { studentId: row.student.id, academicYearId: params.academicYearId, ...payload },
          });
        }
        applied += 1;
      }
    });

    return { applied, skipped };
  }
}
