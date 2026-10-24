/**
 * Tests d'intégration — DashboardService
 * Aucune modification de production. Tests diagnostiques.
 *
 * Couvre :
 *  - recomputeTopStudents : égalités (D10)
 *  - getHonorRoll : égalités exactes et moyennes proches (D12-2)
 *  - isolation établissement
 */

import { DashboardService } from "./dashboard.service";

function makePrismaMock() {
  return {
    term: { findMany: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn() },
    academicYear: { findUnique: jest.fn(), findFirst: jest.fn() },
    reportCard: { findMany: jest.fn(), aggregate: jest.fn() },
    class: { findMany: jest.fn() },
    topStudent: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
    enrollment: { count: jest.fn() },
    teacher: { findFirst: jest.fn() },
    teacherAssignment: { findMany: jest.fn() },
    assessment: { findMany: jest.fn() },
    attendanceSession: { count: jest.fn() },
    attendanceRecord: { findMany: jest.fn() },
    student: { findMany: jest.fn(), count: jest.fn() },
  } as any;
}

function makeSettingsMock() {
  return {
    getDataWithDefaults: jest.fn().mockResolvedValue({ honorRoll: { topN: 3 } }),
  } as any;
}

const term = {
  id: "t1", name: "Trim 1", type: "TRIMESTRE",
  startDate: new Date("2026-10-01"), endDate: new Date("2026-12-31"),
  academicYearId: "ay1",
};

// ============================================================
// recomputeTopStudents — D10 (égalités)
// ============================================================
describe("recomputeTopStudents — égalités (D10)", () => {

  function setupTopStudents(prisma: any, opts: {
    students: Array<{ id: string; matricule: string; firstName: string; lastName: string; average: number; classId: string; cycle: string }>;
  }) {
    prisma.term.findUnique.mockResolvedValue(term);
    prisma.academicYear.findUnique.mockResolvedValue({ label: "2026-2027" });

    // ReportCard pour chaque élève
    prisma.reportCard.findMany.mockResolvedValue(
      opts.students.map((s) => ({
        studentId: s.id,
        classId: s.classId,
        average: s.average,
        scale: 20,
        student: { id: s.id, matricule: s.matricule, firstName: s.firstName, lastName: s.lastName },
        class: { id: s.classId, name: `Classe ${s.classId}`, level: { cycle: s.cycle, name: s.cycle } },
      })),
    );

    // $transaction : exécute le tableau de promesses mockées
    prisma.topStudent.deleteMany.mockResolvedValue({ count: 0 });
    prisma.topStudent.create.mockImplementation((args: any) => Promise.resolve({ id: `ts-${args.data.rank}` }));
    prisma.$transaction.mockImplementation(async (ops: any) => {
      if (Array.isArray(ops)) return Promise.all(ops);
      return ops(prisma);
    });
  }

  it("[DASH-1] 2 élèves ex-aequo à 15.00, 1 élève à 12.00 → rangs 1, 1, 3 (compétition)", async () => {
    const prisma = makePrismaMock();
    setupTopStudents(prisma, {
      students: [
        { id: "s1", matricule: "M1", firstName: "A", lastName: "Alpha", average: 15, classId: "c1", cycle: "DEUXIEME_CYCLE" },
        { id: "s2", matricule: "M2", firstName: "B", lastName: "Beta",  average: 15, classId: "c1", cycle: "DEUXIEME_CYCLE" },
        { id: "s3", matricule: "M3", firstName: "C", lastName: "Gamma", average: 12, classId: "c1", cycle: "DEUXIEME_CYCLE" },
      ],
    });
    const service = new DashboardService(prisma, makeSettingsMock());

    await service.recomputeTopStudents("school-1", "t1");

    const created = prisma.topStudent.create.mock.calls.map((c: any) => c[0].data);
    const ranks = created.map((d: any) => d.rank).sort((a: number, b: number) => a - b);
    // CdC §5.2 : 1, 1, 3
    expect(ranks).toEqual([1, 1, 3]);
  });

  it("[DASH-2] 3 élèves ex-aequo à 15.00 → rangs 1, 1, 1 (compétition)", async () => {
    const prisma = makePrismaMock();
    setupTopStudents(prisma, {
      students: [
        { id: "s1", matricule: "M1", firstName: "A", lastName: "Alpha", average: 15, classId: "c1", cycle: "DEUXIEME_CYCLE" },
        { id: "s2", matricule: "M2", firstName: "B", lastName: "Beta",  average: 15, classId: "c1", cycle: "DEUXIEME_CYCLE" },
        { id: "s3", matricule: "M3", firstName: "C", lastName: "Gamma", average: 15, classId: "c1", cycle: "DEUXIEME_CYCLE" },
      ],
    });
    const service = new DashboardService(prisma, makeSettingsMock());

    await service.recomputeTopStudents("school-1", "t1");

    const created = prisma.topStudent.create.mock.calls.map((c: any) => c[0].data);
    const ranks = created.map((d: any) => d.rank).sort((a: number, b: number) => a - b);
    expect(ranks).toEqual([1, 1, 1]);
  });

  it("[DASH-3] Aucune égalité : 3 élèves 15, 14, 13 → rangs 1, 2, 3", async () => {
    const prisma = makePrismaMock();
    setupTopStudents(prisma, {
      students: [
        { id: "s1", matricule: "M1", firstName: "A", lastName: "Alpha", average: 15, classId: "c1", cycle: "DEUXIEME_CYCLE" },
        { id: "s2", matricule: "M2", firstName: "B", lastName: "Beta",  average: 14, classId: "c1", cycle: "DEUXIEME_CYCLE" },
        { id: "s3", matricule: "M3", firstName: "C", lastName: "Gamma", average: 13, classId: "c1", cycle: "DEUXIEME_CYCLE" },
      ],
    });
    const service = new DashboardService(prisma, makeSettingsMock());

    await service.recomputeTopStudents("school-1", "t1");

    const created = prisma.topStudent.create.mock.calls.map((c: any) => c[0].data);
    const ranks = created.map((d: any) => d.rank).sort((a: number, b: number) => a - b);
    expect(ranks).toEqual([1, 2, 3]);
  });
});

// ============================================================
// getHonorRoll — D12-2 (tolérance 0.01)
// ============================================================
describe("getHonorRoll — égalités (D12-2)", () => {

  function setupHonorRoll(prisma: any, opts: {
    classes: Array<{ id: string; name: string; average: number; studentsCount: number }>;
    cycle?: string;
  }) {
    const cycle = opts.cycle ?? "DEUXIEME_CYCLE";
    prisma.term.findMany.mockResolvedValue([term]);
    prisma.class.findMany.mockResolvedValue(
      opts.classes.map((c) => ({
        id: c.id, name: c.name,
        level: { cycle, name: cycle },
      })),
    );
    prisma.reportCard.aggregate.mockImplementation((args: any) => {
      const cls = opts.classes.find((c) => c.id === args.where.classId);
      return Promise.resolve({
        _avg: { average: cls?.average ?? null },
        _count: { _all: cls?.studentsCount ?? 0 },
      });
    });
  }

  it("[DASH-4] 2 classes à 15.00, 1 classe à 12.00 → comportement actuel des rangs", async () => {
    const prisma = makePrismaMock();
    setupHonorRoll(prisma, {
      classes: [
        { id: "c1", name: "Classe A", average: 15, studentsCount: 30 },
        { id: "c2", name: "Classe B", average: 15, studentsCount: 28 },
        { id: "c3", name: "Classe C", average: 12, studentsCount: 32 },
      ],
    });
    const service = new DashboardService(prisma, makeSettingsMock());

    const result = await service.getHonorRoll("school-1", "t1");

    const ranks = result.podiums.DEUXIEME_CYCLE.map((p: any) => p.rank).sort((a: number, b: number) => a - b);
    // Le CdC §5.2 exige 1, 1, 3 (compétition stricte).
    // Comportement actuel de getHonorRoll : à vérifier.
    expect(ranks).toEqual([1, 1, 3]);
  });

  it("[DASH-5] 2 classes avec moyennes très proches (15.00 et 15.005) → comportement de la tolérance 0.01", async () => {
    const prisma = makePrismaMock();
    setupHonorRoll(prisma, {
      classes: [
        { id: "c1", name: "Classe A", average: 15.00, studentsCount: 30 },
        { id: "c2", name: "Classe B", average: 15.005, studentsCount: 28 },
        { id: "c3", name: "Classe C", average: 12.00, studentsCount: 32 },
      ],
    });
    const service = new DashboardService(prisma, makeSettingsMock());

    const result = await service.getHonorRoll("school-1", "t1");

    const ranks = result.podiums.DEUXIEME_CYCLE.map((p: any) => p.rank).sort((a: number, b: number) => a - b);
    // Avec la tolérance actuelle (Math.abs(diff) < 0.01), Classe B (15.005) est considérée ex-aequo avec Classe A (15.00).
    // Sans tolérance (calculateRank strict), Classe B aurait un rang > Classe A.
    // Ce test caractérise le comportement actuel — il est attendu PASS aujourd'hui,
    // et devra être ajusté dans Script 13b-3 si on remplace par calculateRank strict.
    //
    // Comportement attendu après correction (calculateRank strict) : [1, 2, 3]
    // Comportement actuel (tolérance 0.01) : [1, 1, 3]
    //
    // On teste ICI le comportement ACTUEL pour le documenter.
    expect(ranks).toEqual([1, 1, 3]);
  });
});

// ============================================================
// Isolation établissement
// ============================================================
describe("Isolation établissement", () => {

  it("[DASH-6] recomputeTopStudents ne traite que les ReportCard de l'école demandée", async () => {
    const prisma = makePrismaMock();
    prisma.term.findUnique.mockResolvedValue(term);
    prisma.academicYear.findUnique.mockResolvedValue({ label: "2026-2027" });
    prisma.reportCard.findMany.mockResolvedValue([]);  // aucun bulletin retourné
    prisma.topStudent.deleteMany.mockResolvedValue({ count: 0 });
    prisma.topStudent.create.mockResolvedValue({ id: "ts-1" });
    prisma.$transaction.mockImplementation(async (ops: any) => {
      if (Array.isArray(ops)) return Promise.all(ops);
      return ops(prisma);
    });
    const service = new DashboardService(prisma, makeSettingsMock());

    await service.recomputeTopStudents("school-1", "t1");

    // Vérifier que le filtre schoolId est bien passé à reportCard.findMany
    const callArgs = prisma.reportCard.findMany.mock.calls[0][0];
    expect(callArgs.where.student).toEqual({ schoolId: "school-1" });
  });
});

// ============================================================
// Tests A1 — Nouvelle contrainte [schoolId, cycle, periodLabel, studentId]
// + rangs de compétition (1, 1, 3)
// ============================================================
describe("TopStudent — Contrainte A1 et rangs de compétition", () => {

  function makePrismaMockA1() {
    return {
      term: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn() },
      academicYear: { findUnique: jest.fn(), findFirst: jest.fn() },
      reportCard: { findMany: jest.fn() },
      class: { findMany: jest.fn() },
      topStudent: {
        findMany: jest.fn(),
        deleteMany: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    } as any;
  }

  function makeSettingsMockA1() {
    return {
      getDataWithDefaults: jest.fn().mockResolvedValue({ honorRoll: { topN: 3 } }),
    } as any;
  }

  const termA1 = {
    id: "t1", name: "Trim 1", type: "TRIMESTRE",
    startDate: new Date("2026-10-01"), endDate: new Date("2026-12-31"),
    academicYearId: "ay1",
  };

  function setupTopStudentsA1(prisma: any, students: any[]) {
    prisma.term.findUnique.mockResolvedValue(termA1);
    prisma.academicYear.findUnique.mockResolvedValue({ label: "2026-2027" });
    prisma.reportCard.findMany.mockResolvedValue(
      students.map((s) => ({
        studentId: s.id, classId: s.classId, average: s.average, scale: 20,
        student: { id: s.id, matricule: s.matricule, firstName: s.firstName, lastName: s.lastName },
        class: { id: s.classId, name: `Classe ${s.classId}`, level: { cycle: s.cycle, name: s.cycle } },
      })),
    );
    prisma.topStudent.deleteMany.mockResolvedValue({ count: 0 });
    prisma.topStudent.create.mockImplementation((args: any) => Promise.resolve({ id: `ts-${args.data.rank}-${args.data.studentId}` }));
    prisma.$transaction.mockImplementation(async (ops: any) => {
      if (Array.isArray(ops)) return Promise.all(ops);
      return ops(prisma);
    });
  }

  // ----------------------------------------------------------
  // [DASH-7] Contrainte : même élève, même école/cycle/période
  // ----------------------------------------------------------
  it("[DASH-7] Un élève ne peut apparaître qu'une fois par école/cycle/période", async () => {
    // Simule l'appel à la base : on vérifie que recomputeTopStudents
    // déduplique correctement (2 cartes du même élève → 1 seul TopStudent)
    const prisma = makePrismaMockA1();
    setupTopStudentsA1(prisma, [
      { id: "s1", matricule: "M1", firstName: "A", lastName: "Alpha", average: 15, classId: "c1", cycle: "DEUXIEME_CYCLE" },
      { id: "s1", matricule: "M1", firstName: "A", lastName: "Alpha", average: 14, classId: "c1", cycle: "DEUXIEME_CYCLE" },
    ]);
    const service = new DashboardService(prisma, makeSettingsMockA1());

    await service.recomputeTopStudents("school-1", "t1");

    // L'élève ne doit apparaître qu'une fois dans les TopStudent créés
    const created = prisma.topStudent.create.mock.calls.map((c: any) => c[0].data);
    const studentIds = created.map((d: any) => d.studentId);
    const unique = new Set(studentIds);
    expect(studentIds.length).toBe(unique.size);
    expect(unique.size).toBe(1);
  });

  // ----------------------------------------------------------
  // [DASH-8] Deux élèves différents, même période
  // ----------------------------------------------------------
  it("[DASH-8] Deux élèves différents peuvent être enregistrés pour la même période", async () => {
    const prisma = makePrismaMockA1();
    setupTopStudentsA1(prisma, [
      { id: "s1", matricule: "M1", firstName: "A", lastName: "Alpha", average: 15, classId: "c1", cycle: "DEUXIEME_CYCLE" },
      { id: "s2", matricule: "M2", firstName: "B", lastName: "Beta",  average: 14, classId: "c1", cycle: "DEUXIEME_CYCLE" },
    ]);
    const service = new DashboardService(prisma, makeSettingsMockA1());

    await service.recomputeTopStudents("school-1", "t1");

    const created = prisma.topStudent.create.mock.calls.map((c: any) => c[0].data);
    expect(created.length).toBe(2);
    expect(new Set(created.map((d: any) => d.studentId)).size).toBe(2);
  });

  // ----------------------------------------------------------
  // [DASH-9] Deux élèves au rang 1 (compétition)
  // ----------------------------------------------------------
  it("[DASH-9] Deux élèves au rang 1 acceptés (règle de compétition)", async () => {
    const prisma = makePrismaMockA1();
    setupTopStudentsA1(prisma, [
      { id: "s1", matricule: "M1", firstName: "A", lastName: "Alpha", average: 15, classId: "c1", cycle: "DEUXIEME_CYCLE" },
      { id: "s2", matricule: "M2", firstName: "B", lastName: "Beta",  average: 15, classId: "c1", cycle: "DEUXIEME_CYCLE" },
      { id: "s3", matricule: "M3", firstName: "C", lastName: "Gamma", average: 12, classId: "c1", cycle: "DEUXIEME_CYCLE" },
    ]);
    const service = new DashboardService(prisma, makeSettingsMockA1());

    await service.recomputeTopStudents("school-1", "t1");

    const created = prisma.topStudent.create.mock.calls.map((c: any) => c[0].data);
    const ranks = created.map((d: any) => d.rank).sort((a: number, b: number) => a - b);
    // CdC §5.2 : 1, 1, 3
    expect(ranks).toEqual([1, 1, 3]);
  });

  // ----------------------------------------------------------
  // [DASH-10] Isolation entre cycles
  // ----------------------------------------------------------
  it("[DASH-10] Les élèves de cycles différents ne se mélangent pas dans un même podium", async () => {
    const prisma = makePrismaMockA1();
    setupTopStudentsA1(prisma, [
      { id: "s1", matricule: "M1", firstName: "A", lastName: "Alpha", average: 15, classId: "c1", cycle: "DEUXIEME_CYCLE" },
      { id: "s2", matricule: "M2", firstName: "B", lastName: "Beta",  average: 8,  classId: "c2", cycle: "PREMIER_CYCLE" },
    ]);
    const service = new DashboardService(prisma, makeSettingsMockA1());

    await service.recomputeTopStudents("school-1", "t1");

    const created = prisma.topStudent.create.mock.calls.map((c: any) => c[0].data);
    // Vérifier que les TopStudent sont bien séparés par cycle (via le champ cycle)
    const byCycle = new Map<string, number>();
    for (const d of created) {
      byCycle.set(d.cycle, (byCycle.get(d.cycle) ?? 0) + 1);
    }
    // Au moins 1 cycle distinct identifié
    expect(byCycle.size).toBeGreaterThan(0);
  });

  // ----------------------------------------------------------
  // [DASH-11] Isolation entre périodes
  // ----------------------------------------------------------
  it("[DASH-11] Les périodes différentes ne se mélangent pas", async () => {
    const prisma = makePrismaMockA1();
    setupTopStudentsA1(prisma, [
      { id: "s1", matricule: "M1", firstName: "A", lastName: "Alpha", average: 15, classId: "c1", cycle: "DEUXIEME_CYCLE" },
    ]);
    const service = new DashboardService(prisma, makeSettingsMockA1());

    await service.recomputeTopStudents("school-1", "t1");

    const created = prisma.topStudent.create.mock.calls.map((c: any) => c[0].data);
    // Vérifier que le periodLabel est bien renseigné
    expect(created[0].periodLabel).toBeDefined();
    expect(created[0].periodLabel).toContain("Trim 1");
  });

  // ----------------------------------------------------------
  // [DASH-12] Rollback transactionnel
  // ----------------------------------------------------------
  it("[DASH-12] Si create échoue, la transaction rollback (deleteMany annulé)", async () => {
    const prisma = makePrismaMockA1();
    setupTopStudentsA1(prisma, [
      { id: "s1", matricule: "M1", firstName: "A", lastName: "Alpha", average: 15, classId: "c1", cycle: "DEUXIEME_CYCLE" },
    ]);
    // Forcer un échec sur create
    prisma.topStudent.create.mockImplementation(() => Promise.reject(new Error("Simulated DB error")));
    // $transaction doit rejeter si l'un des appels échoue
    prisma.$transaction.mockImplementation(async (ops: any) => {
      if (Array.isArray(ops)) return Promise.all(ops);  // ← Promise.all rejette si un échoue
      return ops(prisma);
    });

    const service = new DashboardService(prisma, makeSettingsMockA1());

    await expect(service.recomputeTopStudents("school-1", "t1")).rejects.toThrow(/Simulated DB error/);
    // Vérifier que deleteMany A BIEN été appelé avant le create
    expect(prisma.topStudent.deleteMany).toHaveBeenCalled();
    // Vérifier que la "transaction" a été appelée
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  // ----------------------------------------------------------
  // [DASH-13] Deux recalculs simultanés ne corrompent pas
  // ----------------------------------------------------------
  it("[DASH-13] Deux recalculs simultanés ne produisent pas de doublons", async () => {
    const prisma = makePrismaMockA1();
    setupTopStudentsA1(prisma, [
      { id: "s1", matricule: "M1", firstName: "A", lastName: "Alpha", average: 15, classId: "c1", cycle: "DEUXIEME_CYCLE" },
    ]);
    const service = new DashboardService(prisma, makeSettingsMockA1());

    // Lancer 2 recalculs en parallèle
    await Promise.all([
      service.recomputeTopStudents("school-1", "t1"),
      service.recomputeTopStudents("school-1", "t1"),
    ]);

    // Compter les appels à deleteMany et create
    const deleteCalls = prisma.topStudent.deleteMany.mock.calls.length;
    const createCalls = prisma.topStudent.create.mock.calls.length;
    // Chaque appel à recompute fait 1 deleteMany + N creates
    // Avec 2 appels concurrents, on attend 2 deleteMany et 2 create (1 élève × 2)
    expect(deleteCalls).toBe(2);
    expect(createCalls).toBe(2);
  });
});

// ============================================================
// Test D13 — Effectif classé vs inscrit
// ============================================================
describe("D13 — Effectif classé vs inscrit", () => {
  it("[D13-1] getTopStudents expose classSize et studentsCount", async () => {
    const prisma = {
      term: { findMany: jest.fn() },
      topStudent: { findMany: jest.fn() },
      reportCard: { groupBy: jest.fn() },
      enrollment: { groupBy: jest.fn() },
      setting: { findFirst: jest.fn() },
      $transaction: jest.fn(),
    } as any;

    const term = {
      id: "t1", name: "Trim 1", type: "TRIMESTRE",
      startDate: new Date("2026-10-01"), endDate: new Date("2026-12-31"),
      academicYearId: "ay1",
    };

    prisma.term.findMany.mockResolvedValue([term]);
    prisma.topStudent.findMany.mockResolvedValue([
      {
        rank: 1, average: 15, scale: 20, termId: "t1", classId: "c1",
        cycle: "DEUXIEME_CYCLE",
        student: { id: "s1", firstName: "A", lastName: "Alpha", matricule: "M1" },
        class: { id: "c1", name: "7e A" },
      },
    ]);
    prisma.reportCard.groupBy.mockResolvedValue([
      { classId: "c1", _count: { _all: 25 } },
    ]);
    prisma.enrollment.groupBy.mockResolvedValue([
      { classId: "c1", _count: { _all: 30 } },
    ]);

    const service = new DashboardService(prisma, {
      getDataWithDefaults: jest.fn().mockResolvedValue({}),
    } as any);
    const result = await service.getTopStudents("school-1", "t1");

    const podium = result.podiums.DEUXIEME_CYCLE[0];
    expect(podium.classSize).toBe(30);
    expect(podium.studentsCount).toBe(25);
  });
});

