/**
 * Tests de diagnostic — ReportCard.isComplete
 * Aucune modification de production. Vérifie le calcul et la persistance.
 *
 * Objectif : caractériser le comportement réel de `isComplete` produit par
 * `ReportCardsService.generate()` dans 4 scénarios du CdC.
 *
 * Ces tests sont des DIAGNOSTICS. Ils constatent l'état actuel.
 * Ils ne prétendent PAS tester le comportement après correction de note
 * ou suppression d'évaluation (parcours non exécuté ici).
 */

import { ReportCardsService } from "./report-cards.service";

// Mock Prisma minimal pour generate()
function makePrismaMock() {
  return {
    enrollment: { findMany: jest.fn(), count: jest.fn() },
    reportCard: { findMany: jest.fn(), upsert: jest.fn() },
    reportCardItem: { deleteMany: jest.fn(), createMany: jest.fn() },
    term: { findUnique: jest.fn() },
    level: { findMany: jest.fn() },
    subjectCoefficient: { findMany: jest.fn() },
    assessment: { findMany: jest.fn() },
    setting: { findFirst: jest.fn() },
    attendanceRecord: { findMany: jest.fn() },
  } as any;
}

// Scénario : N matières, M évaluations présentes, élèves
function setupScenario(prisma: any, opts: {
  cycle: "PREMIER_CYCLE" | "DEUXIEME_CYCLE";
  subjects: Array<{ id: string; coefficient: number }>;
  // Pour chaque matière, liste des valeurs de notes (null = note manquante)
  notesBySubject: Array<Array<number | null>>;
  // N périodes du bulletin (utilisé pour isComplete via assessmentsForClass)
  hasAnyAssessment: boolean;
}) {
  const scale = opts.cycle === "PREMIER_CYCLE" ? 10 : 20;
  const termType = opts.cycle === "PREMIER_CYCLE" ? "MOIS" : "TRIMESTRE";
  const levelId = opts.cycle === "PREMIER_CYCLE" ? "level-1" : "level-7";

  prisma.enrollment.findMany.mockResolvedValue([
    {
      studentId: "s1", classId: "c1", levelId,
      student: { id: "s1", matricule: "MAT-001", firstName: "A", lastName: "Alpha", schoolId: "school-1" },
    },
  ]);
  prisma.reportCard.findMany.mockResolvedValue([]);
  prisma.term.findUnique.mockResolvedValue({
    id: "t1", name: "P1", type: termType, isLocked: false, academicYearId: "ay1",
  });
  prisma.level.findMany.mockResolvedValue([{ id: levelId, cycle: opts.cycle }]);

  prisma.subjectCoefficient.findMany.mockResolvedValue(
    opts.subjects.map((s) => ({
      subjectId: s.id, levelId, coefficient: s.coefficient,
      subject: { id: s.id, name: `Matière ${s.id}` },
    })),
  );

  // Assessments VALIDATED : une par matière × une par note fournie
  if (opts.hasAnyAssessment) {
    const assessments: any[] = [];
    let assessIdx = 0;
    opts.subjects.forEach((subj, si) => {
      opts.notesBySubject[si].forEach((note) => {
        assessments.push({
          id: `a${assessIdx++}`,
          classId: "c1",
          subjectId: subj.id,
          maxScore: scale,
          coefficient: 1,
          status: "VALIDATED",
          grades: [{
            studentId: "s1",
            value: note,
            isAbsent: false,
            isExempt: false,
          }],
        });
      });
    });
    prisma.assessment.findMany.mockResolvedValueOnce(assessments);  // VALIDATED
    prisma.assessment.findMany.mockResolvedValueOnce([]);            // DRAFT
  } else {
    prisma.assessment.findMany.mockResolvedValueOnce([]);
    prisma.assessment.findMany.mockResolvedValueOnce([]);
  }

  prisma.setting.findFirst.mockResolvedValue({ passMark: 10, gradingScale: 20 });
  prisma.attendanceRecord.findMany.mockResolvedValue([]);
  // DEC-6 : mock des nouvelles méthodes appelées par generate()
  prisma.reportCardAbsenceOverride = {
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn(),
  };
  prisma.grade = {
    findMany: jest.fn().mockResolvedValue([]),
  };
  prisma.enrollment.count.mockResolvedValue(1);
  prisma.reportCard.upsert.mockImplementation((args: any) =>
    Promise.resolve({ id: "rc-1", ...(args.create ?? {}), ...(args.update ?? {}) }),
  );
  prisma.reportCardItem.deleteMany.mockResolvedValue({ count: 0 });
  prisma.reportCardItem.createMany.mockResolvedValue({ count: opts.subjects.length });
}

function makeService(prisma: any) {
  return new ReportCardsService(prisma, {} as any, {} as any);
}

// ============================================================
// 4 tests isComplete
// ============================================================
describe("isComplete — diagnostic", () => {

  // ----------------------------------------------------------
  // A1 — Bulletin complet : toutes les matières ont des notes
  // ----------------------------------------------------------
  it("[IC-1] Bulletin complet (1er cycle) : 2 matières, notes non-nulles → isComplete=true", async () => {
    const prisma = makePrismaMock();
    setupScenario(prisma, {
      cycle: "PREMIER_CYCLE",
      subjects: [{ id: "sm", coefficient: 1 }, { id: "sf", coefficient: 1 }],
      notesBySubject: [[7, 8], [9, 6]],
      hasAnyAssessment: true,
    });
    const service = makeService(prisma);

    await service.generate({ academicYearId: "ay1", termId: "t1", classId: "c1" });

    const upsertArgs = prisma.reportCard.upsert.mock.calls[0][0];
    const payload = { ...(upsertArgs.create ?? {}), ...(upsertArgs.update ?? {}) };
    expect(payload.isComplete).toBe(true);
  });

  // ----------------------------------------------------------
  // A2 — Bulletin incomplet : au moins une matière a average=null
  // ----------------------------------------------------------
  it("[IC-2] Bulletin incomplet avec moyenne non nulle : 1 matière notée, 1 matière sans note → isComplete=false", async () => {
    const prisma = makePrismaMock();
    setupScenario(prisma, {
      cycle: "PREMIER_CYCLE",
      subjects: [{ id: "sm", coefficient: 1 }, { id: "sf", coefficient: 1 }],
      // sm a des notes, sf n'a AUCUNE note (donc average=null)
      notesBySubject: [[7, 8], []],
      hasAnyAssessment: true,
    });
    const service = makeService(prisma);

    await service.generate({ academicYearId: "ay1", termId: "t1", classId: "c1" });

    const upsertArgs = prisma.reportCard.upsert.mock.calls[0][0];
    const payload = { ...(upsertArgs.create ?? {}), ...(upsertArgs.update ?? {}) };
    // La moyenne existe (calculée sur sm), mais sf manque → isComplete=false
    expect(payload.isComplete).toBe(false);
    expect(payload.average).not.toBeNull();
  });

  // ----------------------------------------------------------
  // A3 — Bulletin sans moyenne : aucune note
  // ----------------------------------------------------------
  it("[IC-3] Bulletin sans moyenne : aucune évaluation → isComplete=false, average=null", async () => {
    const prisma = makePrismaMock();
    setupScenario(prisma, {
      cycle: "PREMIER_CYCLE",
      subjects: [{ id: "sm", coefficient: 1 }],
      notesBySubject: [[]],  // aucune note
      hasAnyAssessment: false,
    });
    const service = makeService(prisma);

    await service.generate({ academicYearId: "ay1", termId: "t1", classId: "c1" });

    const upsertArgs = prisma.reportCard.upsert.mock.calls[0][0];
    const payload = { ...(upsertArgs.create ?? {}), ...(upsertArgs.update ?? {}) };
    expect(payload.isComplete).toBe(false);
    expect(payload.average).toBeNull();
  });

  // ----------------------------------------------------------
  // A4 — Bulletin 2e cycle avec données de période manquantes
  //     Une matière sans note → isComplete=false
  // ----------------------------------------------------------
  it("[IC-4] Bulletin 2e cycle avec matière sans note → isComplete=false", async () => {
    const prisma = makePrismaMock();
    setupScenario(prisma, {
      cycle: "DEUXIEME_CYCLE",
      subjects: [
        { id: "sm", coefficient: 4 },
        { id: "sf", coefficient: 3 },
        { id: "sh", coefficient: 2 },
      ],
      // sm et sf ont des notes, sh n'en a pas
      notesBySubject: [[15, 14], [12, 13], []],
      hasAnyAssessment: true,
    });
    const service = makeService(prisma);

    await service.generate({ academicYearId: "ay1", termId: "t1", classId: "c1" });

    const upsertArgs = prisma.reportCard.upsert.mock.calls[0][0];
    const payload = { ...(upsertArgs.create ?? {}), ...(upsertArgs.update ?? {}) };
    expect(payload.isComplete).toBe(false);
  });
});

// ============================================================
// Note de diagnostic
// ============================================================
/**
 * Ce que ces tests PROUVENT :
 *  - isComplete est calculé par generate() et dépend de la couverture des matières.
 *  - Un bulletin sans notes → isComplete = false.
 *  - Un bulletin avec une matière manquante → isComplete = false.
 *
 * Ce que ces tests NE PROUVENT PAS (parcours non exécutés ici) :
 *  - Ce qui arrive à isComplete après une correction de note (grades.update).
 *  - Ce qui arrive à isComplete après suppression d'une évaluation.
 *  - Ce qui arrive à isComplete après reopen/publish.
 *
 * Limite L8 documentée : isComplete est figé à la génération, non réévalué.
 * Fiabilisation hors périmètre du Script 13b.
 */
