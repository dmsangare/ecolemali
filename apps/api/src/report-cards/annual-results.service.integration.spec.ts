/**
 * Tests annuels — AnnualResultsService et computeAnnualRows()
 * CdC V1 SIS-MALI — Lot 1B (tests avant correction)
 *
 * Niveau 1 (AR-1 à AR-10) : computeAnnualRows() en pur, sans mock.
 * Niveau 2 (AR-INT-1 à AR-INT-5) : AnnualResultsService avec Prisma mocké.
 * Le moteur (rulesForCycle, scaledThreshold) n'est PAS mocké.
 *
 * Aucune attente n'est ajustée au comportement actuel : AR-8 doit FAIL
 * si le service renvoie ADMIS/REDOUBLE pour un dossier incomplet.
 */

import { computeAnnualRows, AnnualCardInput, AnnualStudentInput, AnnualTermInput } from "./annual-calc";
import { AnnualResultsService } from "./annual-results.service";

// ============================================================
// Helpers
// ============================================================

const student = (id: string, matricule = `MAT-${id}`): AnnualStudentInput => ({
  id, matricule, firstName: "Test", lastName: `Élève-${id}`,
});

const term = (id: string, name: string): AnnualTermInput => ({ id, name });

const cardFirstCycle = (studentId: string, termId: string, average: number | null): AnnualCardInput => ({
  studentId, termId, average,
  items: [],  // 1er cycle : pas d'items, la moyenne est déjà calculée
});

const cardSecondCycle = (
  studentId: string, termId: string, average: number | null,
  items: Array<{ subjectId: string; average: number | null; coefficient: number }>,
): AnnualCardInput => ({ studentId, termId, average, items });

// ============================================================
// NIVEAU 1 — computeAnnualRows() pur
// ============================================================
describe("computeAnnualRows() — pur", () => {

  // ----------------------------------------------------------
  // AR-1 — 1er cycle, 3 compositions [7, 8, 6] / 9 attendues
  // ----------------------------------------------------------
  it("[AR-1] 1er cycle : 3 compositions sur 9 → moyenne 7.00, complete=false", () => {
    const terms = Array.from({ length: 9 }, (_, i) => term(`t${i + 1}`, `Compo ${i + 1}`));
    const cards: AnnualCardInput[] = [
      cardFirstCycle("s1", "t1", 7),
      cardFirstCycle("s1", "t2", 8),
      cardFirstCycle("s1", "t3", 6),
    ];
    const r = computeAnnualRows({
      cycle: "PREMIER_CYCLE", terms, cards,
      students: [student("s1")], passMark: 10,
    });
    expect(r.scale).toBe(10);
    expect(r.rows[0].annualAverage).toBe(7);
    expect(r.rows[0].periodsCount).toBe(3);
    expect(r.rows[0].complete).toBe(false);
  });

  // ----------------------------------------------------------
  // AR-2 — 1er cycle, 9 compositions → complete = true
  // ----------------------------------------------------------
  it("[AR-2] 1er cycle : 9 compositions [7,8,6,9,8,7,8,6,7] → moyenne 7.33, complete=true", () => {
    const terms = Array.from({ length: 9 }, (_, i) => term(`t${i + 1}`, `Compo ${i + 1}`));
    const notes = [7, 8, 6, 9, 8, 7, 8, 6, 7];
    const cards = notes.map((n, i) => cardFirstCycle("s1", `t${i + 1}`, n));
    const r = computeAnnualRows({
      cycle: "PREMIER_CYCLE", terms, cards,
      students: [student("s1")], passMark: 10,
    });
    // (7+8+6+9+8+7+8+6+7)/9 = 66/9 = 7.3333 → 7.33
    expect(r.rows[0].annualAverage).toBe(7.33);
    expect(r.rows[0].complete).toBe(true);
  });

  // ----------------------------------------------------------
  // AR-3 — 1er cycle, 2 valides + 7 absentes → complete=false
  // ----------------------------------------------------------
  it("[AR-3] 1er cycle : 2 compositions valides sur 9 → moyenne sur 2, complete=false", () => {
    const terms = Array.from({ length: 9 }, (_, i) => term(`t${i + 1}`, `Compo ${i + 1}`));
    const cards: AnnualCardInput[] = [
      cardFirstCycle("s1", "t1", 7),
      cardFirstCycle("s1", "t2", 8),
      // 7 périodes sans ReportCard
    ];
    const r = computeAnnualRows({
      cycle: "PREMIER_CYCLE", terms, cards,
      students: [student("s1")], passMark: 10,
    });
    // (7+8)/2 = 7.50
    expect(r.rows[0].annualAverage).toBe(7.5);
    expect(r.rows[0].periodsCount).toBe(2);
    expect(r.rows[0].complete).toBe(false);
  });

  // ----------------------------------------------------------
  // AR-4 — 1er cycle, aucune composition valide → null
  // ----------------------------------------------------------
  it("[AR-4] 1er cycle : aucune composition valide → annualAverage=null, decision=A_DETERMINER", () => {
    const terms = [term("t1", "Compo 1"), term("t2", "Compo 2")];
    const cards: AnnualCardInput[] = [];
    const r = computeAnnualRows({
      cycle: "PREMIER_CYCLE", terms, cards,
      students: [student("s1")], passMark: 10,
    });
    expect(r.rows[0].annualAverage).toBeNull();
    expect(r.rows[0].decision).toBe("A_DETERMINER");
    expect(r.rows[0].complete).toBe(false);
  });

  // ----------------------------------------------------------
  // AR-5 — 2e cycle, coefficients CdC → 14.36
  // ----------------------------------------------------------
  it("[AR-5] 2e cycle : matières coef 4/3/2/2, moy 15/14/12/16 → 14.36", () => {
    const terms = [term("t1", "Trim 1"), term("t2", "Trim 2"), term("t3", "Trim 3")];
    const mkItems = () => [
      { subjectId: "s-math", average: 15, coefficient: 4 },
      { subjectId: "s-fr",   average: 14, coefficient: 3 },
      { subjectId: "s-hist", average: 12, coefficient: 2 },
      { subjectId: "s-svt",  average: 16, coefficient: 2 },
    ];
    const cards: AnnualCardInput[] = terms.map((t) =>
      cardSecondCycle("s1", t.id, null, mkItems()));
    const r = computeAnnualRows({
      cycle: "DEUXIEME_CYCLE", terms, cards,
      students: [student("s1")], passMark: 10,
    });
    // (15*4 + 14*3 + 12*2 + 16*2) / 11 = 158/11 = 14.3636… → 14.36
    expect(r.rows[0].annualAverage).toBe(14.36);
    expect(r.rows[0].complete).toBe(true);
    expect(r.rows[0].decision).toBe("ADMIS"); // ≥ 10
    expect(r.scale).toBe(20);
    expect(r.admisThreshold).toBe(10);
  });

  // ----------------------------------------------------------
  // AR-6 — 2e cycle, 3 trimestres, 1 matière coef 1, notes moyennes
  //         [12.50, 14.00, 11.50] → moyenne annuelle 12.67
  // ----------------------------------------------------------
  it("[AR-6] 2e cycle : trimestres [12.5, 14, 11.5] → moyenne annuelle 12.67", () => {
    const terms = [term("t1", "Trim 1"), term("t2", "Trim 2"), term("t3", "Trim 3")];
    const cards: AnnualCardInput[] = [
      cardSecondCycle("s1", "t1", null, [{ subjectId: "s1", average: 12.5, coefficient: 1 }]),
      cardSecondCycle("s1", "t2", null, [{ subjectId: "s1", average: 14, coefficient: 1 }]),
      cardSecondCycle("s1", "t3", null, [{ subjectId: "s1", average: 11.5, coefficient: 1 }]),
    ];
    const r = computeAnnualRows({
      cycle: "DEUXIEME_CYCLE", terms, cards,
      students: [student("s1")], passMark: 10,
    });
    // Moyenne matière s1 = (12.5 + 14 + 11.5)/3 = 12.6666… → 12.67
    expect(r.rows[0].annualAverage).toBe(12.67);
    expect(r.rows[0].complete).toBe(true);
  });

  // ----------------------------------------------------------
  // AR-7 — 2e cycle, 1 trimestre manquant → complete=false
  // ----------------------------------------------------------
  it("[AR-7] 2e cycle : trimestre manquant → complete=false", () => {
    const terms = [term("t1", "Trim 1"), term("t2", "Trim 2"), term("t3", "Trim 3")];
    const cards: AnnualCardInput[] = [
      cardSecondCycle("s1", "t1", null, [{ subjectId: "s1", average: 14, coefficient: 1 }]),
      cardSecondCycle("s1", "t2", null, [{ subjectId: "s1", average: 15, coefficient: 1 }]),
      // t3 manquant
    ];
    const r = computeAnnualRows({
      cycle: "DEUXIEME_CYCLE", terms, cards,
      students: [student("s1")], passMark: 10,
    });
    expect(r.rows[0].complete).toBe(false);
    // La moyenne est calculée sur les 2 trimestres retenus (14+15)/2 = 14.5
    expect(r.rows[0].annualAverage).toBe(14.5);
  });

  // ----------------------------------------------------------
  // AR-8 — D2 : dossier incomplet + moyenne non nulle
  //         ATTENDU CdC §4.3 : A_DETERMINER.
  //         Si le code produit ADMIS → FAIL (preuve du défaut D2).
  // ----------------------------------------------------------
  it("[AR-8] D2 : dossier incomplet + moyenne 14.36 → decision A_DETERMINER (CdC §4.3)", () => {
    const terms = [term("t1", "Trim 1"), term("t2", "Trim 2"), term("t3", "Trim 3")];
    const mkItems = () => [
      { subjectId: "s-math", average: 15, coefficient: 4 },
      { subjectId: "s-fr",   average: 14, coefficient: 3 },
      { subjectId: "s-hist", average: 12, coefficient: 2 },
      { subjectId: "s-svt",  average: 16, coefficient: 2 },
    ];
    // Seulement 2 trimestres sur 3 → incomplete
    const cards: AnnualCardInput[] = [
      cardSecondCycle("s1", "t1", null, mkItems()),
      cardSecondCycle("s1", "t2", null, mkItems()),
    ];
    const r = computeAnnualRows({
      cycle: "DEUXIEME_CYCLE", terms, cards,
      students: [student("s1")], passMark: 10,
    });
    expect(r.rows[0].annualAverage).toBe(14.36);
    expect(r.rows[0].complete).toBe(false);
    // ⚠️ Ceci est l'attendu CdC §4.3 : "dossier incomplet → pas de décision définitive"
    expect(r.rows[0].decision).toBe("A_DETERMINER");
  });

  // ----------------------------------------------------------
  // AR-9 — Rang partagé : 15.00, 15.00, 12.00 → 1, 1, 3
  // ----------------------------------------------------------
  it("[AR-9] Rang partagé : 2 élèves à 15.00, 1 à 12.00 → 1, 1, 3", () => {
    const terms = [term("t1", "Compo 1")];
    const cards: AnnualCardInput[] = [
      cardFirstCycle("s1", "t1", 15),
      cardFirstCycle("s2", "t1", 15),
      cardFirstCycle("s3", "t1", 12),
    ];
    const r = computeAnnualRows({
      cycle: "PREMIER_CYCLE", terms, cards,
      students: [student("s1"), student("s2"), student("s3")], passMark: 10,
    });
    const ranks = r.rows.map((row) => row.rank);
    expect(ranks).toEqual([1, 1, 3]);
  });

  // ----------------------------------------------------------
  // AR-10 — Aucun rang pour un élève à moyenne null
  // ----------------------------------------------------------
  it("[AR-10] Élève sans moyenne → rank=null", () => {
    const terms = [term("t1", "Compo 1")];
    const cards: AnnualCardInput[] = [
      cardFirstCycle("s1", "t1", 15),
      // s2 : aucune note
    ];
    const r = computeAnnualRows({
      cycle: "PREMIER_CYCLE", terms, cards,
      students: [student("s1"), student("s2")], passMark: 10,
    });
    const s2 = r.rows.find((row) => row.student.id === "s2")!;
    expect(s2.annualAverage).toBeNull();
    expect(s2.rank).toBeNull();
  });
  // ----------------------------------------------------------
  // AR-11 — D2 : dossier incomplet + moyenne non nulle
  //          Attendu : decision = A_DETERMINER
  // ----------------------------------------------------------
  it("[AR-11] D2 : dossier incomplet avec moyenne non nulle → A_DETERMINER", () => {
    const terms = [term("t1", "Trim 1"), term("t2", "Trim 2"), term("t3", "Trim 3")];
    const mkItems = () => [
      { subjectId: "s1", average: 14, coefficient: 1 },
    ];
    const cards: AnnualCardInput[] = [
      cardSecondCycle("s1", "t1", null, mkItems()),
      cardSecondCycle("s1", "t2", null, mkItems()),
      // t3 manquant
    ];
    const r = computeAnnualRows({
      cycle: "DEUXIEME_CYCLE", terms, cards,
      students: [student("s1")], passMark: 10,
    });
    // Moyenne provisoire calculée sur les 2 trimestres = 14
    expect(r.rows[0].annualAverage).toBe(14);
    expect(r.rows[0].complete).toBe(false);
    // D2 : décision forcée à A_DETERMINER
    expect(r.rows[0].decision).toBe("A_DETERMINER");
  });

  // ----------------------------------------------------------
  // AR-12 — D8 : 2e cycle, 3 bulletins avec average=null
  //          mais items remplis → complete=true
  // ----------------------------------------------------------
  it("[AR-12] D8 : 3 bulletins 2e cycle avec average=null mais items remplis → complete=true", () => {
    const terms = [term("t1", "Trim 1"), term("t2", "Trim 2"), term("t3", "Trim 3")];
    const mkItems = (n: number) => [
      { subjectId: "sm", average: n, coefficient: 1 },
    ];
    // average = null partout, mais items[] présents sur chaque trimestre
    const cards: AnnualCardInput[] = [
      cardSecondCycle("s1", "t1", null, mkItems(12)),
      cardSecondCycle("s1", "t2", null, mkItems(14)),
      cardSecondCycle("s1", "t3", null, mkItems(16)),
    ];
    const r = computeAnnualRows({
      cycle: "DEUXIEME_CYCLE", terms, cards,
      students: [student("s1")], passMark: 10,
    });
    // (12 + 14 + 16)/3 = 14
    expect(r.rows[0].annualAverage).toBe(14);
    // D8 : complete = true car les 3 cartes existent
    expect(r.rows[0].complete).toBe(true);
    // complete + moyenne ≥ seuil → ADMIS
    expect(r.rows[0].decision).toBe("ADMIS");
  });

});

// ============================================================
// NIVEAU 2 — AnnualResultsService avec Prisma mocké
// ============================================================

function makePrismaMock() {
  return {
    class: { findUnique: jest.fn() },
    term: { findMany: jest.fn() },
    reportCard: { findMany: jest.fn() },
    enrollment: { findMany: jest.fn() },
    setting: { findFirst: jest.fn() },
    $transaction: jest.fn(),
    // studentPathway accédé uniquement dans apply() via le tx passé à $transaction
    studentPathway: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  } as any;
}

const user = {
  id: "u1", schoolId: "school-1", roles: ["DIRECTOR"],
  permissions: [],
} as any;

describe("AnnualResultsService — intégration (Prisma mocké)", () => {
  let prisma: any;
  let service: AnnualResultsService;

  beforeEach(() => {
    prisma = makePrismaMock();
    service = new AnnualResultsService(prisma);
  });

  // ----------------------------------------------------------
  // AR-INT-1 — compute() avec 1 classe, 3 trimestres, 2 élèves
  // ----------------------------------------------------------
  it("[AR-INT-1] compute() : 1 classe, 3 trimestres, 2 élèves (complet/incomplet)", async () => {
    prisma.class.findUnique.mockResolvedValue({
      id: "c1", name: "7e A", schoolId: "school-1",
      level: { id: "l7", name: "7e", cycle: "DEUXIEME_CYCLE" },
    });
    prisma.term.findMany.mockResolvedValue([
      { id: "t1", name: "Trim 1", startDate: new Date("2026-10-01"), endDate: new Date("2026-12-31"), type: "TRIMESTRE" },
      { id: "t2", name: "Trim 2", startDate: new Date("2027-01-01"), endDate: new Date("2027-03-31"), type: "TRIMESTRE" },
      { id: "t3", name: "Trim 3", startDate: new Date("2027-04-01"), endDate: new Date("2027-06-30"), type: "TRIMESTRE" },
    ]);
    // Élève s1 : 3 bulletins, coef 1, moyenne 12/14/16
    // Élève s2 : 2 bulletins (t3 manquant)
    prisma.reportCard.findMany.mockResolvedValue([
      { studentId: "s1", termId: "t1", average: 12, status: "PUBLISHED",
        items: [{ subjectId: "sm", average: 12, coefficient: 1 }] },
      { studentId: "s1", termId: "t2", average: 14, status: "PUBLISHED",
        items: [{ subjectId: "sm", average: 14, coefficient: 1 }] },
      { studentId: "s1", termId: "t3", average: 16, status: "PUBLISHED",
        items: [{ subjectId: "sm", average: 16, coefficient: 1 }] },
      { studentId: "s2", termId: "t1", average: 10, status: "PUBLISHED",
        items: [{ subjectId: "sm", average: 10, coefficient: 1 }] },
      { studentId: "s2", termId: "t2", average: 11, status: "PUBLISHED",
        items: [{ subjectId: "sm", average: 11, coefficient: 1 }] },
    ]);
    prisma.enrollment.findMany.mockResolvedValue([
      { student: { id: "s1", matricule: "MAT-001", firstName: "A", lastName: "Alpha" } },
      { student: { id: "s2", matricule: "MAT-002", firstName: "B", lastName: "Beta" } },
    ]);
    prisma.setting.findFirst.mockResolvedValue({ passMark: 10 });

    const result = await service.compute(
      { classId: "c1", academicYearId: "ay1", includeDraft: false },
      user,
    );

    expect(result.rows.length).toBe(2);
    const s1 = result.rows.find((r) => r.student.id === "s1")!;
    const s2 = result.rows.find((r) => r.student.id === "s2")!;

    // s1 : (12+14+16)/3 = 14.00, complete=true
    expect(s1.annualAverage).toBe(14);
    expect(s1.complete).toBe(true);

    // s2 : (10+11)/2 = 10.50, complete=false
    expect(s2.annualAverage).toBe(10.5);
    expect(s2.complete).toBe(false);
  });

  // ----------------------------------------------------------
  // AR-INT-2 — isolation école : user.schoolId ≠ cls.schoolId
  // ----------------------------------------------------------
  it("[AR-INT-2] compute() : isolation école → NotFoundException", async () => {
    prisma.class.findUnique.mockResolvedValue({
      id: "c1", name: "7e A", schoolId: "OTHER-SCHOOL",
      level: { id: "l7", name: "7e", cycle: "DEUXIEME_CYCLE" },
    });

    await expect(
      service.compute(
        { classId: "c1", academicYearId: "ay1", includeDraft: false },
        user,
      )
    ).rejects.toThrow(/introuvable/i);
  });

  // ----------------------------------------------------------
  // AR-INT-3 — apply() avec 1 élève complet + 1 incomplet
  // ----------------------------------------------------------
  it("[AR-INT-3] apply() : 1 élève complet (applied) + 1 incomplet (skipped)", async () => {
    prisma.class.findUnique.mockResolvedValue({
      id: "c1", name: "7e A", schoolId: "school-1",
      level: { id: "l7", name: "7e", cycle: "DEUXIEME_CYCLE" },
    });
    prisma.term.findMany.mockResolvedValue([
      { id: "t1", name: "Trim 1", startDate: new Date(), endDate: new Date(), type: "TRIMESTRE" },
      { id: "t2", name: "Trim 2", startDate: new Date(), endDate: new Date(), type: "TRIMESTRE" },
      { id: "t3", name: "Trim 3", startDate: new Date(), endDate: new Date(), type: "TRIMESTRE" },
    ]);
    prisma.reportCard.findMany.mockResolvedValue([
      // s1 : 3 trimestres complets
      { studentId: "s1", termId: "t1", average: 14, status: "VALIDATED", items: [{ subjectId: "sm", average: 14, coefficient: 1 }] },
      { studentId: "s1", termId: "t2", average: 15, status: "VALIDATED", items: [{ subjectId: "sm", average: 15, coefficient: 1 }] },
      { studentId: "s1", termId: "t3", average: 13, status: "VALIDATED", items: [{ subjectId: "sm", average: 13, coefficient: 1 }] },
      // s2 : 2 trimestres seulement
      { studentId: "s2", termId: "t1", average: 8, status: "VALIDATED", items: [{ subjectId: "sm", average: 8, coefficient: 1 }] },
      { studentId: "s2", termId: "t2", average: 9, status: "VALIDATED", items: [{ subjectId: "sm", average: 9, coefficient: 1 }] },
    ]);
    prisma.enrollment.findMany.mockResolvedValue([
      { student: { id: "s1", matricule: "MAT-001", firstName: "A", lastName: "Alpha" } },
      { student: { id: "s2", matricule: "MAT-002", firstName: "B", lastName: "Beta" } },
    ]);
    prisma.setting.findFirst.mockResolvedValue({ passMark: 10 });
    // Mock auditLog requis depuis D5 (apply() écrit un AuditLog)
    prisma.auditLog = { create: jest.fn().mockResolvedValue({ id: "audit-int3" }) };

    // $transaction : on l'exécute en appelant le callback avec le prisma mocké comme tx
    prisma.$transaction.mockImplementation(async (cb: any) => cb(prisma));
    prisma.studentPathway.findFirst.mockResolvedValue(null);
    prisma.studentPathway.create.mockResolvedValue({ id: "path1" });

    const result = await service.apply(
      { classId: "c1", academicYearId: "ay1" },
      user,
    );

    expect(result.applied).toBe(1);
    expect(result.skipped).toBe(1);
    expect(prisma.studentPathway.create).toHaveBeenCalledTimes(1);
    const createdArgs = prisma.studentPathway.create.mock.calls[0][0];
    expect(createdArgs.data.studentId).toBe("s1");
    // D5 : apply() n'écrit plus de décision définitive (proposition A_EXAMINER).
    // L'objectif de ce test reste : vérifier quel élève a été traité.
    // Le contenu précis (result=null, decision=A_EXAMINER) est vérifié par AR-INT-7.
    expect(createdArgs.data.result).toBeNull();
  });

  // ----------------------------------------------------------
  // AR-INT-4 — apply() sans période → throw
  // ----------------------------------------------------------
  it("[AR-INT-4] apply() : aucune période → BadRequestException", async () => {
    prisma.class.findUnique.mockResolvedValue({
      id: "c1", name: "7e A", schoolId: "school-1",
      level: { id: "l7", name: "7e", cycle: "DEUXIEME_CYCLE" },
    });
    prisma.term.findMany.mockResolvedValue([]);   // aucune période
    prisma.reportCard.findMany.mockResolvedValue([]);
    prisma.enrollment.findMany.mockResolvedValue([]);
    prisma.setting.findFirst.mockResolvedValue({ passMark: 10 });

    await expect(
      service.apply({ classId: "c1", academicYearId: "ay1" }, user)
    ).rejects.toThrow(/Aucune periode/i);
  });

  // ----------------------------------------------------------
  // AR-INT-5 — compute() excludeDraft=true exclut DRAFT
  // ----------------------------------------------------------
  it("[AR-INT-5] compute(includeDraft=false) : filtre status sur VALIDATED+PUBLISHED uniquement", async () => {
    prisma.class.findUnique.mockResolvedValue({
      id: "c1", name: "7e A", schoolId: "school-1",
      level: { id: "l7", name: "7e", cycle: "DEUXIEME_CYCLE" },
    });
    prisma.term.findMany.mockResolvedValue([
      { id: "t1", name: "Trim 1", startDate: new Date(), endDate: new Date(), type: "TRIMESTRE" },
    ]);
    prisma.reportCard.findMany.mockResolvedValue([]);
    prisma.enrollment.findMany.mockResolvedValue([]);
    prisma.setting.findFirst.mockResolvedValue({ passMark: 10 });

    await service.compute(
      { classId: "c1", academicYearId: "ay1", includeDraft: false },
      user,
    );

    // Vérifier l'argument réel passé à reportCard.findMany
    const callArgs = prisma.reportCard.findMany.mock.calls[0][0];
    expect(callArgs.where.status).toEqual({ in: ["VALIDATED", "PUBLISHED"] });
    expect(callArgs.where.status.in).not.toContain("DRAFT");
  });
  // ----------------------------------------------------------
  // AR-INT-6 — D5 : apply() écrit AuditLog dans la même transaction
  // ----------------------------------------------------------
  it("[AR-INT-6] D5 : apply() crée AuditLog avec proposedDecision et annualAverage", async () => {
    prisma.class.findUnique.mockResolvedValue({
      id: "c1", name: "7e A", schoolId: "school-1",
      level: { id: "l7", name: "7e", cycle: "DEUXIEME_CYCLE" },
    });
    prisma.term.findMany.mockResolvedValue([
      { id: "t1", name: "Trim 1", startDate: new Date(), endDate: new Date(), type: "TRIMESTRE" },
      { id: "t2", name: "Trim 2", startDate: new Date(), endDate: new Date(), type: "TRIMESTRE" },
      { id: "t3", name: "Trim 3", startDate: new Date(), endDate: new Date(), type: "TRIMESTRE" },
    ]);
    prisma.reportCard.findMany.mockResolvedValue([
      { studentId: "s1", termId: "t1", average: 14, status: "VALIDATED", items: [{ subjectId: "sm", average: 14, coefficient: 1 }] },
      { studentId: "s1", termId: "t2", average: 15, status: "VALIDATED", items: [{ subjectId: "sm", average: 15, coefficient: 1 }] },
      { studentId: "s1", termId: "t3", average: 13, status: "VALIDATED", items: [{ subjectId: "sm", average: 13, coefficient: 1 }] },
    ]);
    prisma.enrollment.findMany.mockResolvedValue([
      { student: { id: "s1", matricule: "MAT-001", firstName: "A", lastName: "Alpha" } },
    ]);
    prisma.setting.findFirst.mockResolvedValue({ passMark: 10 });
    prisma.$transaction.mockImplementation(async (cb: any) => cb(prisma));
    prisma.studentPathway.findFirst.mockResolvedValue(null);
    prisma.studentPathway.create.mockResolvedValue({ id: "11111111-1111-4111-8111-111111111111" });
    prisma.auditLog = { create: jest.fn() };
    prisma.auditLog.create.mockResolvedValue({ id: "audit-1" });

    await service.apply({ classId: "c1", academicYearId: "ay1" }, user);

    expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);
    const auditArgs = prisma.auditLog.create.mock.calls[0][0];
    expect(auditArgs.data.action).toBe("ANNUAL_RESULT_PROPOSED");
    expect(auditArgs.data.module).toBe("annual-results");
    expect(auditArgs.data.objectType).toBe("StudentPathway");
    expect(auditArgs.data.userId).toBe("u1");
    expect(auditArgs.data.newValue.proposedDecision).toBe("ADMIS");
    expect(auditArgs.data.newValue.annualAverage).toBe(14);
    expect(auditArgs.data.newValue.scale).toBe(20);
  });

  // ----------------------------------------------------------
  // AR-INT-7 — D5 : apply() n'écrit PAS de décision définitive
  // ----------------------------------------------------------
  it("[AR-INT-7] D5 : apply() écrit A_EXAMINER / result=null et retourne proposals", async () => {
    prisma.class.findUnique.mockResolvedValue({
      id: "c1", name: "7e A", schoolId: "school-1",
      level: { id: "l7", name: "7e", cycle: "DEUXIEME_CYCLE" },
    });
    prisma.term.findMany.mockResolvedValue([
      { id: "t1", name: "Trim 1", startDate: new Date(), endDate: new Date(), type: "TRIMESTRE" },
      { id: "t2", name: "Trim 2", startDate: new Date(), endDate: new Date(), type: "TRIMESTRE" },
      { id: "t3", name: "Trim 3", startDate: new Date(), endDate: new Date(), type: "TRIMESTRE" },
    ]);
    prisma.reportCard.findMany.mockResolvedValue([
      { studentId: "s1", termId: "t1", average: 14, status: "VALIDATED", items: [{ subjectId: "sm", average: 14, coefficient: 1 }] },
      { studentId: "s1", termId: "t2", average: 15, status: "VALIDATED", items: [{ subjectId: "sm", average: 15, coefficient: 1 }] },
      { studentId: "s1", termId: "t3", average: 13, status: "VALIDATED", items: [{ subjectId: "sm", average: 13, coefficient: 1 }] },
    ]);
    prisma.enrollment.findMany.mockResolvedValue([
      { student: { id: "s1", matricule: "MAT-001", firstName: "A", lastName: "Alpha" } },
    ]);
    prisma.setting.findFirst.mockResolvedValue({ passMark: 10 });
    prisma.$transaction.mockImplementation(async (cb: any) => cb(prisma));
    prisma.studentPathway.findFirst.mockResolvedValue(null);
    prisma.studentPathway.create.mockResolvedValue({ id: "22222222-2222-4222-8222-222222222222" });
    prisma.auditLog = { create: jest.fn() };
    prisma.auditLog.create.mockResolvedValue({ id: "audit-2" });

    const result = await service.apply({ classId: "c1", academicYearId: "ay1" }, user);

    // Le StudentPathway n'a pas de décision définitive
    const createArgs = prisma.studentPathway.create.mock.calls[0][0];
    expect(createArgs.data.decision).toBe("A_EXAMINER");
    expect(createArgs.data.result).toBeNull();
    // Aucune décision ADMIS/REDOUBLE/PASSED/REPEATED
    expect(createArgs.data.decision).not.toBe("ADMIS");
    expect(createArgs.data.decision).not.toBe("REDOUBLE");
    expect(createArgs.data.result).not.toBe("PASSED");
    expect(createArgs.data.result).not.toBe("REPEATED");
    // proposals renvoyées
    expect(result.proposals.length).toBe(1);
    expect(result.proposals[0].id).toBe("22222222-2222-4222-8222-222222222222");
    expect(result.proposals[0].studentId).toBe("s1");
    expect(result.proposals[0].proposedDecision).toBe("ADMIS");
    expect(result.proposals[0].annualAverage).toBe(14);
  });

});

// ============================================================
// Test D3 — Nombre minimal de compositions (1er cycle)
// ============================================================
describe("D3 — Min compositions", () => {
  it("[D3-1] 1er cycle avec 5 compositions sur min 7 → complete=false", () => {
    const terms = Array.from({ length: 9 }, (_, i) => ({ id: `t${i}`, name: `C${i}` }));
    // 5 compositions valides sur 9
    const cards = [
      { studentId: "s1", termId: "t0", average: 7, items: [] },
      { studentId: "s1", termId: "t1", average: 8, items: [] },
      { studentId: "s1", termId: "t2", average: 6, items: [] },
      { studentId: "s1", termId: "t3", average: 9, items: [] },
      { studentId: "s1", termId: "t4", average: 8, items: [] },
    ];
    const result = computeAnnualRows({
      cycle: "PREMIER_CYCLE",
      terms,
      cards,
      students: [{ id: "s1", matricule: "M1", firstName: "A", lastName: "Alpha" }],
      passMark: 10,
      minCompositions: 7,
    });
    expect(result.rows[0].complete).toBe(false);
    expect(result.rows[0].decision).toBe("A_DETERMINER");
  });

  it("[D3-2] 1er cycle avec 7 compositions sur min 7 → complete=true", () => {
    const terms = Array.from({ length: 9 }, (_, i) => ({ id: `t${i}`, name: `C${i}` }));
    const cards = Array.from({ length: 7 }, (_, i) => ({
      studentId: "s1", termId: `t${i}`, average: 7, items: [],
    }));
    const result = computeAnnualRows({
      cycle: "PREMIER_CYCLE",
      terms,
      cards,
      students: [{ id: "s1", matricule: "M1", firstName: "A", lastName: "Alpha" }],
      passMark: 10,
      minCompositions: 7,
    });
    expect(result.rows[0].complete).toBe(true);
    expect(result.rows[0].annualAverage).toBe(7);
  });
});

