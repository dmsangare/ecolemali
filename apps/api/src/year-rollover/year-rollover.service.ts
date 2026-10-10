import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CurrentUserPayload } from "../common/decorators";
import { assertSchoolAccess } from "../common/utils";
import { AnnualResultsService } from "../report-cards/annual-results.service";
import {
  PreviewYearRolloverDto,
  ExecuteYearRolloverDto,
  DecisionOverride,
  StructureToClone,
  PeriodsToClone,
} from "./dto";

type AnnualDecision = "ADMIS" | "REDOUBLE" | "A_DETERMINER";

export interface ProposedDecision {
  studentId: string;
  matricule: string;
  firstName: string;
  lastName: string;
  fromClassId: string;
  fromClassName: string;
  fromLevelId: string;
  fromLevelName: string;
  fromCycle: string;
  decision: string;
  targetClassId: string | null;
  targetClassName: string | null;
  targetLevelId: string | null;
  note: string;
}

@Injectable()
export class YearRolloverService {
  private readonly logger = new Logger(YearRolloverService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly annualResults: AnnualResultsService,
  ) {}

  // ============================================================
  // PREVIEW — calcule tout sans rien ecrire
  // ============================================================

  async preview(dto: PreviewYearRolloverDto, user: CurrentUserPayload) {
    const sourceYear = await this.prisma.academicYear.findUnique({
      where: { id: dto.fromYearId },
      include: { school: { select: { id: true, name: true } } },
    });
    if (!sourceYear) throw new NotFoundException("Annee source introuvable");
    assertSchoolAccess(user, sourceYear.schoolId, "Annee source introuvable");

    // 1. Verifier libelle unique
    const existing = await this.prisma.academicYear.findFirst({
      where: { schoolId: sourceYear.schoolId, label: dto.newLabel },
    });
    if (existing) {
      throw new BadRequestException(
        `L'annee "${dto.newLabel}" existe deja pour cette ecole`,
      );
    }

    // 2. Verifier dates coherentes
    const startDate = new Date(dto.newStartDate);
    const endDate = new Date(dto.newEndDate);
    if (startDate >= endDate) {
      throw new BadRequestException("La date de fin doit etre apres la date de debut");
    }

    // 3. Calculer les periodes a creer
    const periods = await this.computePeriodsToClone(sourceYear, dto.periodsToClone);

    // 4. Lister les classes existantes + leurs effectifs
    const classes = await this.prisma.class.findMany({
      where: { academicYearId: sourceYear.id },
      include: {
        level: { select: { id: true, name: true, cycle: true, orderIndex: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { level: { orderIndex: "asc" } },
    });

    // 5. Calculer les tarifs avec %
    const feeStructures = await this.prisma.feeStructure.findMany({
      where: { academicYearId: sourceYear.id },
      include: {
        level: { select: { id: true, name: true } },
        feeType: { select: { id: true, name: true, code: true } },
      },
    });
    const feeIncrease = dto.feeIncreasePercent ?? 0;
    const feeStructuresWithNew = feeStructures.map((fs) => {
      const oldAmount = Number(fs.amount);
      const newAmount = Math.round(oldAmount * (1 + feeIncrease / 100) * 100) / 100;
      return {
        fromFeeStructureId: fs.id,
        levelId: fs.levelId,
        levelName: fs.level?.name ?? null,
        feeTypeId: fs.feeTypeId,
        feeTypeName: fs.feeType.name,
        installments: fs.installments,
        dueDate: fs.dueDate,
        oldAmount,
        newAmount,
      };
    });

    // 6. Calculer les decisions proposees pour tous les eleves
    const decisions = await this.computeProposedDecisions(sourceYear, classes);

    // 7. Stats
    const stats = this.computeStats(decisions);

    return {
      sourceYear: {
        id: sourceYear.id,
        label: sourceYear.label,
        startDate: sourceYear.startDate,
        endDate: sourceYear.endDate,
      },
      newYear: {
        label: dto.newLabel,
        startDate,
        endDate,
      },
      periods,
      classes: classes.map((c) => ({
        fromClassId: c.id,
        code: c.code,
        name: c.name,
        levelId: c.level.id,
        levelName: c.level.name,
        cycle: c.level.cycle,
        studentsCount: c._count.enrollments,
        capacity: c.capacity,
      })),
      feeStructures: feeStructuresWithNew,
      feeIncreasePercent: feeIncrease,
      decisions,
      stats,
    };
  }

  // ============================================================
  // EXECUTE — ecrit tout dans une transaction
  // ============================================================

  async execute(dto: ExecuteYearRolloverDto, user: CurrentUserPayload) {
    const sourceYear = await this.prisma.academicYear.findUnique({
      where: { id: dto.fromYearId },
    });
    if (!sourceYear) throw new NotFoundException("Annee source introuvable");
    assertSchoolAccess(user, sourceYear.schoolId, "Annee source introuvable");

    // Recalculer le preview (source de verite)
    const preview = await this.preview(dto, user);

    // Appliquer les overrides manuels
    const overrideMap = new Map<string, DecisionOverride>();
    for (const ov of dto.decisions ?? []) {
      overrideMap.set(ov.studentId, ov);
    }

    // Filtrer/ajuster les decisions
    const finalDecisions = preview.decisions.map((d) => {
      const ov = overrideMap.get(d.studentId);
      if (!ov) return d;
      return {
        ...d,
        decision: ov.decision,
        targetClassId: ov.targetClassId ?? d.targetClassId,
      };
    });

    const startDate = new Date(dto.newStartDate);
    const endDate = new Date(dto.newEndDate);
    const feeIncrease = dto.feeIncreasePercent ?? 0;
    const structure = dto.structureToClone;

    // === TRANSACTION ===
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Creer la nouvelle annee
      const newYear = await tx.academicYear.create({
        data: {
          schoolId: sourceYear.schoolId,
          label: dto.newLabel,
          startDate,
          endDate,
          status: "PREPARATION",
          isCurrent: false,
        },
      });

      // 2. Creer les periodes
      const periodIds: string[] = [];
      for (const p of preview.periods) {
        const term = await tx.term.create({
          data: {
            academicYearId: newYear.id,
            name: p.name,
            type: p.type as any,
            startDate: new Date(p.startDate),
            endDate: new Date(p.endDate),
            orderIndex: p.orderIndex,
          },
        });
        periodIds.push(term.id);
      }

      // 3. Cloner les classes (mapping ancienId -> nouveauId)
      const classMapping = new Map<string, string>();
      if (structure.classes) {
        for (const c of preview.classes) {
          const newClass = await tx.class.create({
            data: {
              schoolId: sourceYear.schoolId,
              academicYearId: newYear.id,
              levelId: c.levelId,
              code: c.code,
              name: c.name,
              capacity: c.capacity,
              status: "OPEN",
            },
          });
          classMapping.set(c.fromClassId, newClass.id);
        }
      }

      // 4. Cloner les tarifs (+%)
      let feeCount = 0;
      if (structure.feeStructures) {
        for (const fs of preview.feeStructures) {
          await tx.feeStructure.create({
            data: {
              schoolId: sourceYear.schoolId,
              academicYearId: newYear.id,
              levelId: fs.levelId,
              feeTypeId: fs.feeTypeId,
              amount: fs.newAmount,
              dueDate: fs.dueDate,
              installments: fs.installments,
            },
          });
          feeCount++;
        }
      }

      // 5. Creer les inscriptions + parcours pour chaque eleve
      let enrollmentCount = 0;
      let skippedCount = 0;

      for (const d of finalDecisions) {
        // NON_INSCRIT : on ne cree rien
        if (d.decision === "NON_INSCRIT" || d.decision === "QUITTE_ECOLE" || d.decision === "DIPLOME") {
          // On cree juste le pathway pour tracer la decision, mais pas d'inscription
          await tx.studentPathway.create({
            data: {
              studentId: d.studentId,
              academicYearId: sourceYear.id,
              levelId: d.fromLevelId,
              classId: d.fromClassId,
              result: d.decision === "QUITTE_ECOLE" || d.decision === "DIPLOME" ? "PASSED" : "EXCLUDED",
              decision: d.decision,
            },
          });
          skippedCount++;
          continue;
        }

        // Determiner la classe cible
        const targetClassId = d.targetClassId
          ? classMapping.get(d.targetClassId) ?? null
          : null;

        if (!targetClassId) {
          // Pas de classe cible (pas de niveau superieur ou mapping absent)
          skippedCount++;
          continue;
        }

        const targetClass = preview.classes.find(
          (c) => c.fromClassId === d.targetClassId,
        );

        // Creer l'inscription
        await tx.enrollment.create({
          data: {
            studentId: d.studentId,
            academicYearId: newYear.id,
            classId: targetClassId,
            levelId: targetClass?.levelId ?? d.fromLevelId,
            enrollmentDate: startDate,
            status: "VALIDATED",
          },
        });

        // Creer le pathway de la nouvelle annee
        await tx.studentPathway.create({
          data: {
            studentId: d.studentId,
            academicYearId: newYear.id,
            levelId: targetClass?.levelId ?? d.fromLevelId,
            classId: targetClassId,
            result: d.decision === "ADMIS" ? "PASSED" : "REPEATED",
            decision: d.decision,
          },
        });

        enrollmentCount++;
      }

      // 6. Marquer la source comme terminee
      await tx.academicYear.update({
        where: { id: sourceYear.id },
        data: {
          // on ne cloture PAS automatiquement, on laisse l'utilisateur le faire
        },
      });

      return {
        newYearId: newYear.id,
        newYearLabel: newYear.label,
        periodsCreated: periodIds.length,
        classesCreated: classMapping.size,
        feesCreated: feeCount,
        enrollmentsCreated: enrollmentCount,
        skipped: skippedCount,
      };
    });

    this.logger.log(
      `Passage cree : ${result.newYearLabel} (${result.classesCreated} classes, ${result.enrollmentsCreated} eleves)`,
    );

    return result;
  }

  // ============================================================
  // HELPERS PRIVES
  // ============================================================

  /** Calcule les periodes a cloner (+1 an sur les dates). */
  private async computePeriodsToClone(
    sourceYear: { id: string },
    types: PeriodsToClone[],
  ) {
    const terms = await this.prisma.term.findMany({
      where: {
        academicYearId: sourceYear.id,
        type: { in: types as any },
      },
      orderBy: { orderIndex: "asc" },
    });

    return terms.map((t) => {
      const newStart = new Date(t.startDate);
      newStart.setFullYear(newStart.getFullYear() + 1);
      const newEnd = new Date(t.endDate);
      newEnd.setFullYear(newEnd.getFullYear() + 1);
      return {
        name: t.name,
        type: t.type,
        startDate: newStart.toISOString(),
        endDate: newEnd.toISOString(),
        orderIndex: t.orderIndex,
      };
    });
  }

  /** Calcule les decisions proposees pour chaque eleve. */
  private async computeProposedDecisions(
    sourceYear: { id: string; schoolId: string },
    classes: Array<{
      id: string;
      name: string;
      level: { id: string; name: string; cycle: string; orderIndex: number };
    }>,
  ): Promise<ProposedDecision[]> {
    // Charger tous les niveaux de l'ecole pour trouver le suivant
    const allLevels = await this.prisma.level.findMany({
      where: { schoolId: sourceYear.schoolId },
      orderBy: { orderIndex: "asc" },
      select: { id: true, name: true, cycle: true, orderIndex: true },
    });

    const decisions: ProposedDecision[] = [];

    for (const cls of classes) {
      // Recuperer les resultats annuels
      let annualRows: any[] = [];
      try {
        const res = await this.annualResults.compute(
          {
            classId: cls.id,
            academicYearId: sourceYear.id,
            includeDraft: false,
          },
          { id: "system", roles: ["SUPER_ADMIN"], schoolId: sourceYear.schoolId } as any,
        );
        annualRows = res.rows || [];
      } catch (err) {
        this.logger.warn(
          `Impossible de calculer les resultats pour ${cls.name}: ${(err as Error).message}`,
        );
      }

      // Charger les eleves inscrits dans cette classe
      const enrollments = await this.prisma.enrollment.findMany({
        where: {
          classId: cls.id,
          academicYearId: sourceYear.id,
          status: "VALIDATED",
        },
        include: {
          student: {
            select: { id: true, matricule: true, firstName: true, lastName: true },
          },
        },
      });

      for (const enr of enrollments) {
        const row = annualRows.find((r) => r.student?.id === enr.studentId);
        const decision: AnnualDecision = row?.decision || "A_DETERMINER";

        let proposed: ProposedDecision["decision"];
        let targetClassId: string | null = null;
        let targetClassName: string | null = null;
        let targetLevelId: string | null = null;
        let note = "";

        if (decision === "ADMIS") {
          // Trouver le niveau suivant
          const nextLevel = allLevels.find(
            (l) => l.orderIndex === cls.level.orderIndex + 1,
          );
          if (!nextLevel) {
            proposed = "QUITTE_ECOLE";
            note = "Dernier niveau de l'ecole";
          } else {
            proposed = "ADMIS";
            // Chercher une classe du niveau suivant (meme section si possible)
            const nextClasses = classes.filter((c) => c.level.id === nextLevel.id);
            if (nextClasses.length > 0) {
              targetClassId = nextClasses[0].id;
              targetClassName = nextClasses[0].name;
            }
            targetLevelId = nextLevel.id;
            note = `Passe en ${nextLevel.name}`;
          }
        } else if (decision === "REDOUBLE") {
          proposed = "REDOUBLE";
          targetClassId = cls.id;
          targetClassName = cls.name;
          targetLevelId = cls.level.id;
          note = "Redouble la meme classe";
        } else {
          // A_DETERMINER
          proposed = "NON_INSCRIT";
          note = "Resultats annuels manquants";
        }

        decisions.push({
          studentId: enr.studentId,
          matricule: enr.student.matricule,
          firstName: enr.student.firstName,
          lastName: enr.student.lastName,
          fromClassId: cls.id,
          fromClassName: cls.name,
          fromLevelId: cls.level.id,
          fromLevelName: cls.level.name,
          fromCycle: cls.level.cycle,
          decision: proposed,
          targetClassId,
          targetClassName,
          targetLevelId,
          note,
        });
      }
    }

    return decisions;
  }

  /** Calcule les stats par decision. */
  private computeStats(decisions: ProposedDecision[]) {
    const stats: Record<string, number> = {
      ADMIS: 0,
      REDOUBLE: 0,
      QUITTE_ECOLE: 0,
      DIPLOME: 0,
      NON_INSCRIT: 0,
      EN_ATTENTE_DEF: 0,
      EN_ATTENTE_BAC: 0,
    };
    for (const d of decisions) {
      stats[d.decision] = (stats[d.decision] ?? 0) + 1;
    }
    return { ...stats, total: decisions.length };
  }
}
