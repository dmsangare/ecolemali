/**
 * Tests d'intégration — ReportCardsService.generate()
 * CdC V1 SIS-MALI — Lot 1 (étape par étape)
 *
 * Le service est RÉEL. Le moteur (calculation/*) est RÉEL.
 * Seul PrismaService est mocké, strictement selon les appels du service.
 *
 * Objectifs :
 *  - vérifier que le moteur corrigé est réellement atteint par les notes/coefs
 *  - vérifier que les valeurs produites (moyenne, décision, items) sont conformes
 *  - signaler sans les masquer les défauts fonctionnels du service
 */

import { ReportCardsService } from "./report-cards.service";

// ============================================================
// Mock Prisma — 12 méthodes réellement appelées par generate()
// ============================================================
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

// ============================================================
// Scénario 1er cycle
// ============================================================
function setupFirstCycle(prisma: any, opts: {
  compositions?: number[];
  withoutAssessments?: boolean;
}) {
  const notes = opts.compositions ?? [7, 8, 6, 9, 8];

  prisma.enrollment.findMany.mockResolvedValue([{
    studentId: "student-1",
    classId: "class-1",
    levelId: "level-1",
    student: {
      id: "student-1", matricule: "MAT-001",
      firstName: "Amadou", lastName: "Diallo", schoolId: "school-1",
    },
  }]);
  prisma.reportCard.findMany.mockResolvedValue([]);
  prisma.term.findUnique.mockResolvedValue({
    id: "term-1", name: "Composition 1", type: "MOIS",
    isLocked: false, academicYearId: "ay-1",
  });
  prisma.level.findMany.mockResolvedValue([
    { id: "level-1", cycle: "PREMIER_CYCLE" },
  ]);
  prisma.subjectCoefficient.findMany.mockResolvedValue([{
    subjectId: "11111111-1111-4111-8111-111111111111",
    levelId: "level-1",
    coefficient: 1,
    subject: { id: "11111111-1111-4111-8111-111111111111", name: "Mathématiques" },
  }]);

  if (opts.withoutAssessments) {
    prisma.assessment.findMany.mockResolvedValueOnce([]);  // VALIDATED
    prisma.assessment.findMany.mockResolvedValueOnce([]);  // DRAFT
  } else {
    const assessments = notes.map((n, i) => ({
      id: `assess-${i}`,
      classId: "class-1",
      subjectId: "11111111-1111-4111-8111-111111111111",
      maxScore: 10,
      coefficient: 1,
      status: "VALIDATED",
      grades: [{
        studentId: "student-1", value: n,
        isAbsent: false, isExempt: false,
      }],
    }));
    prisma.assessment.findMany.mockResolvedValueOnce(assessments);
    prisma.assessment.findMany.mockResolvedValueOnce([]);
  }

  prisma.setting.findFirst.mockResolvedValue({ passMark: 10, gradingScale: 20 });
  prisma.attendanceRecord.findMany.mockResolvedValue([]);
  prisma.grade = { findMany: jest.fn().mockResolvedValue([]) };
  prisma.reportCardAbsenceOverride = {
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn(),
  };
  prisma.enrollment.count.mockResolvedValue(1);
  prisma.reportCard.upsert.mockImplementation((args: any) =>
    Promise.resolve({ id: "rc-1", ...(args.create ?? {}), ...(args.update ?? {}) })
  );
  prisma.reportCardItem.deleteMany.mockResolvedValue({ count: 0 });
  prisma.reportCardItem.createMany.mockResolvedValue({ count: 1 });
}

// ============================================================
// Scénario 2e cycle
// ============================================================
function setupSecondCycle(prisma: any, opts: {
  subjects: Array<{
    id: string; name: string; coefficient: number; notes: number[];
  }>;
}) {
  prisma.enrollment.findMany.mockResolvedValue([{
    studentId: "student-1", classId: "class-1", levelId: "level-7",
    student: {
      id: "student-1", matricule: "MAT-001",
      firstName: "Awa", lastName: "Traoré", schoolId: "school-1",
    },
  }]);
  prisma.reportCard.findMany.mockResolvedValue([]);
  prisma.term.findUnique.mockResolvedValue({
    id: "term-t1", name: "Trimestre 1", type: "TRIMESTRE",
    isLocked: false, academicYearId: "ay-1",
  });
  prisma.level.findMany.mockResolvedValue([
    { id: "level-7", cycle: "DEUXIEME_CYCLE" },
  ]);
  prisma.subjectCoefficient.findMany.mockResolvedValue(
    opts.subjects.map((s) => ({
      subjectId: s.id,
      levelId: "level-7",
      coefficient: s.coefficient,
      subject: { id: s.id, name: s.name },
    }))
  );

  const assessments = opts.subjects.map((s, i) => ({
    id: `assess-${i}`,
    classId: "class-1",
    subjectId: s.id,
    maxScore: 20,
    coefficient: 1,
    status: "VALIDATED",
    grades: s.notes.map((n) => ({
      studentId: "student-1", value: n, isAbsent: false, isExempt: false,
    })),
  }));
  prisma.assessment.findMany.mockResolvedValueOnce(assessments);
  prisma.assessment.findMany.mockResolvedValueOnce([]);

  prisma.setting.findFirst.mockResolvedValue({ passMark: 10, gradingScale: 20 });
  prisma.attendanceRecord.findMany.mockResolvedValue([]);
  prisma.grade = { findMany: jest.fn().mockResolvedValue([]) };
  prisma.reportCardAbsenceOverride = {
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn(),
  };
  prisma.enrollment.count.mockResolvedValue(1);
  prisma.reportCard.upsert.mockImplementation((args: any) =>
    Promise.resolve({ id: "rc-1", ...(args.create ?? {}), ...(args.update ?? {}) })
  );
  prisma.reportCardItem.deleteMany.mockResolvedValue({ count: 0 });
  prisma.reportCardItem.createMany.mockResolvedValue({ count: opts.subjects.length });
}

// ============================================================
// Suite
// ============================================================
describe("ReportCardsService.generate() — intégration moteur", () => {
  let prisma: any;
  let service: ReportCardsService;

  beforeEach(() => {
    prisma = makePrismaMock();
    service = new ReportCardsService(prisma, {} as any, {} as any);
  });

  // ----------------------------------------------------------
  // [INT-1] 1er cycle 7,8,6,9,8 → moyenne 7,60 sur 10
  // + vérification persistance : subjectId = UUID, pas le nom
  // ----------------------------------------------------------
  it("[INT-1] 1er cycle 7,8,6,9,8 → moyenne 7,60 / 10, items persistés avec UUID", async () => {
    setupFirstCycle(prisma, { compositions: [7, 8, 6, 9, 8] });

    const result = await service.generate({
      academicYearId: "ay-1", termId: "term-1", classId: "class-1",
    });

    expect(result.generated).toBe(1);

    const rcArgs = prisma.reportCard.upsert.mock.calls[0][0];
    const payload = { ...(rcArgs.create ?? {}), ...(rcArgs.update ?? {}) };

    // Moyenne et scale
    expect(payload.average).toBeCloseTo(7.6, 2);
    expect(payload.scale).toBe(10);

    // Persistance des items : les subjectId doivent être des UUID, pas des noms
    const itemsCall = prisma.reportCardItem.createMany.mock.calls[0];
    expect(itemsCall).toBeDefined();
    const items = itemsCall[0].data;

    expect(Array.isArray(items)).toBe(true);
    for (const item of items) {
      // Doit être l'UUID, jamais le nom
      expect(item.subjectId).not.toBe("Mathématiques");
      expect(typeof item.subjectId).toBe("string");
      // UUID v4 canonique
      expect(item.subjectId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    }
  });

  // ----------------------------------------------------------
  // [INT-2] 2e cycle coef 4/3/2/2, moyennes 15/14/12/16 → 14,36
  // ----------------------------------------------------------
  it("[INT-2] 2e cycle coef 4/3/2/2, moy 15/14/12/16 → moyenne 14,36 / 20", async () => {
    setupSecondCycle(prisma, {
      subjects: [
        { id: "11111111-1111-4111-8111-111111111111", name: "Mathématiques", coefficient: 4, notes: [15] },
        { id: "22222222-2222-4222-8222-222222222222", name: "Français",     coefficient: 3, notes: [14] },
        { id: "33333333-3333-4333-8333-333333333333", name: "Histoire",     coefficient: 2, notes: [12] },
        { id: "44444444-4444-4444-8444-444444444444", name: "SVT",          coefficient: 2, notes: [16] },
      ],
    });

    const result = await service.generate({
      academicYearId: "ay-1", termId: "term-t1", classId: "class-1",
    });

    expect(result.generated).toBe(1);

    const rcArgs = prisma.reportCard.upsert.mock.calls[0][0];
    const payload = { ...(rcArgs.create ?? {}), ...(rcArgs.update ?? {}) };

    expect(payload.average).toBeCloseTo(14.36, 2);
    expect(payload.scale).toBe(20);

    // Vérification persistance des items
    const items = prisma.reportCardItem.createMany.mock.calls[0][0].data;
    expect(items.length).toBe(4);

    const uuids = new Set([
      "11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222",
      "33333333-3333-4333-8333-333333333333",
      "44444444-4444-4444-8444-444444444444",
    ]);
    for (const item of items) {
      expect(uuids.has(item.subjectId)).toBe(true);
    }

    // Moyennes par matière : 15, 14, 12, 16
    const byUuid = new Map(items.map((i: any) => [i.subjectId, i]));
    expect(Number(byUuid.get("11111111-1111-4111-8111-111111111111")!.average)).toBeCloseTo(15, 2);
    expect(Number(byUuid.get("22222222-2222-4222-8222-222222222222")!.average)).toBeCloseTo(14, 2);
    expect(Number(byUuid.get("33333333-3333-4333-8333-333333333333")!.average)).toBeCloseTo(12, 2);
    expect(Number(byUuid.get("44444444-4444-4444-8444-444444444444")!.average)).toBeCloseTo(16, 2);
  });

  // ----------------------------------------------------------
  // [INT-3] Note 11/10 → le moteur doit throw
  // Preuve que la note atteint le moteur : si le service ne throw pas,
  // soit le moteur n'est pas atteint, soit il ne valide pas.
  // ----------------------------------------------------------
  it("[INT-3] 1er cycle : note 11/10 → doit être refusée par le moteur", async () => {
    setupFirstCycle(prisma, { compositions: [7, 8, 11, 9, 8] });

    let caught: any = null;
    try {
      await service.generate({
        academicYearId: "ay-1", termId: "term-1", classId: "class-1",
      });
    } catch (e) {
      caught = e;
    }

    expect(caught).not.toBeNull();
    expect(String(caught?.message ?? "")).toMatch(/barème|dépasse|Note/i);
  });

  // ----------------------------------------------------------
  // [INT-4] Coefficient 0 → le moteur doit throw
  // On vérifie explicitement que le coefficient atteint calculateTermAverage :
  // soit par throw, soit par détection dans les items / la moyenne.
  // ----------------------------------------------------------
  it("[INT-4] 2e cycle : coefficient 0 → doit être refusé par le moteur", async () => {
    setupSecondCycle(prisma, {
      subjects: [
        { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", name: "Mathématiques", coefficient: 0, notes: [15] },
      ],
    });

    let caught: any = null;
    try {
      await service.generate({
        academicYearId: "ay-1", termId: "term-t1", classId: "class-1",
      });
    } catch (e) {
      caught = e;
    }

    expect(caught).not.toBeNull();
    expect(String(caught?.message ?? "")).toMatch(/[Cc]oefficient/i);
  });

  // ----------------------------------------------------------
  // [INT-5] Dossier sans notes → moyenne null, A_DETERMINER, isComplete=false
  // ----------------------------------------------------------
  it("[INT-5] 1er cycle sans évaluation → moyenne null, décision A_DETERMINER, isComplete=false", async () => {
    setupFirstCycle(prisma, { withoutAssessments: true });

    const result = await service.generate({
      academicYearId: "ay-1", termId: "term-1", classId: "class-1",
    });

    expect(result.generated).toBe(1);

    const rcArgs = prisma.reportCard.upsert.mock.calls[0][0];
    const payload = { ...(rcArgs.create ?? {}), ...(rcArgs.update ?? {}) };

    expect(payload.average).toBeNull();
    expect(payload.decision).toBe("A_DETERMINER");
    expect(payload.isComplete).toBe(false);
  });

  // ----------------------------------------------------------
  // [INT-6] Multi-niveaux DU MÊME CYCLE : un élève de 1re année
  // ne doit pas recevoir les matières de 6e année (et inversement).
  // Term = MOIS, les 2 élèves sont PREMIER_CYCLE.
  // ----------------------------------------------------------
  it("[INT-6] Multi-niveaux (même cycle) : les matières de 6e ne fuient pas vers la 1re", async () => {
    const UUID_MATHS_1RE = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const UUID_FRANC_6E = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

    prisma.enrollment.findMany.mockResolvedValue([
      {
        studentId: "student-1", classId: "class-1", levelId: "level-1",
        student: { id: "student-1", matricule: "MAT-001",
          firstName: "Amadou", lastName: "Diallo", schoolId: "school-1" },
      },
      {
        studentId: "student-2", classId: "class-6", levelId: "level-6",
        student: { id: "student-2", matricule: "MAT-002",
          firstName: "Awa", lastName: "Traoré", schoolId: "school-1" },
      },
    ]);
    prisma.reportCard.findMany.mockResolvedValue([]);
    // Term = MOIS : compatible avec PREMIER_CYCLE (les deux élèves)
    prisma.term.findUnique.mockResolvedValue({
      id: "term-mois", name: "Composition Novembre", type: "MOIS",
      isLocked: false, academicYearId: "ay-1",
    });
    // Les DEUX niveaux sont en PREMIER_CYCLE
    prisma.level.findMany.mockResolvedValue([
      { id: "level-1", cycle: "PREMIER_CYCLE" },
      { id: "level-6", cycle: "PREMIER_CYCLE" },
    ]);
    // Niveau-1 : Mathématiques ; Niveau-6 : Français
    prisma.subjectCoefficient.findMany.mockResolvedValue([
      { subjectId: UUID_MATHS_1RE, levelId: "level-1", coefficient: 1,
        subject: { id: UUID_MATHS_1RE, name: "Mathématiques" } },
      { subjectId: UUID_FRANC_6E, levelId: "level-6", coefficient: 1,
        subject: { id: UUID_FRANC_6E, name: "Français" } },
    ]);
    // Assessments : 1 par élève, chacun sur SA matière
    prisma.assessment.findMany.mockResolvedValueOnce([
      { id: "a1", classId: "class-1", subjectId: UUID_MATHS_1RE,
        maxScore: 10, coefficient: 1, status: "VALIDATED",
        grades: [{ studentId: "student-1", value: 8, isAbsent: false, isExempt: false }] },
      { id: "a2", classId: "class-6", subjectId: UUID_FRANC_6E,
        maxScore: 10, coefficient: 1, status: "VALIDATED",
        grades: [{ studentId: "student-2", value: 6, isAbsent: false, isExempt: false }] },
    ]);
    prisma.assessment.findMany.mockResolvedValueOnce([]);
    prisma.setting.findFirst.mockResolvedValue({ passMark: 10, gradingScale: 20 });
    prisma.attendanceRecord.findMany.mockResolvedValue([]);
    prisma.enrollment.count.mockResolvedValue(1);
    let upsertCount = 0;
    prisma.reportCard.upsert.mockImplementation((args: any) => {
      upsertCount++;
      return Promise.resolve({ id: `rc-${upsertCount}`, ...(args.create ?? {}), ...(args.update ?? {}) });
    });
    prisma.reportCardItem.deleteMany.mockResolvedValue({ count: 0 });
    prisma.reportCardItem.createMany.mockResolvedValue({ count: 1 });

    const result = await service.generate({
      academicYearId: "ay-1", termId: "term-mois",
    });

    // Les DEUX élèves passent le filtre (même cycle, term MOIS)
    expect(result.generated).toBe(2);

    // Récupérer les items de chaque élève via l'ordre des upserts
    const upsertArgs = prisma.reportCard.upsert.mock.calls.map((c: any) => c[0]);
    const itemsCalls = prisma.reportCardItem.createMany.mock.calls;
    expect(itemsCalls.length).toBe(2);

    // Construire un map studentId → items
    const itemsByStudent = new Map<string, string[]>();
    for (let i = 0; i < upsertArgs.length; i++) {
      const studentId = (upsertArgs[i].create ?? upsertArgs[i].update)?.studentId;
      const items = itemsCalls[i][0].data.map((it: any) => it.subjectId);
      itemsByStudent.set(studentId, items);
    }

    // L'élève de 1re ne reçoit QUE Maths
    expect(itemsByStudent.get("student-1")).toEqual([UUID_MATHS_1RE]);
    // L'élève de 6e ne reçoit QUE Français
    expect(itemsByStudent.get("student-2")).toEqual([UUID_FRANC_6E]);
  });

  // ----------------------------------------------------------
  // [INT-7] Coefficient 0 avec notes effectives (preuve directe)
  // ----------------------------------------------------------
  it("[INT-7] Coefficient 0 avec notes présentes → throw explicite du moteur", async () => {
    setupSecondCycle(prisma, {
      subjects: [
        { id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", name: "Mathématiques",
          coefficient: 0, notes: [15] },
      ],
    });

    let caught: any = null;
    try {
      await service.generate({
        academicYearId: "ay-1", termId: "term-t1", classId: "class-1",
      });
    } catch (e) {
      caught = e;
    }

    expect(caught).not.toBeNull();
    expect(String(caught?.message ?? "")).toMatch(/[Cc]oefficient/);
    // Vérifier qu'aucun upsert n'a été tenté
    expect(prisma.reportCard.upsert).not.toHaveBeenCalled();
  });

});

// ============================================================
// Tests DEC-6 — Blocage bulletin absence + clearAbsences
// ============================================================
describe("DEC-6 — Blocage absence + dérogation", () => {
  function makePrismaMockDec6() {
    return {
      enrollment: { findMany: jest.fn(), count: jest.fn() },
      reportCard: { findMany: jest.fn(), upsert: jest.fn() },
      reportCardItem: { deleteMany: jest.fn(), createMany: jest.fn() },
      reportCardAbsenceOverride: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
      term: { findUnique: jest.fn() },
      level: { findMany: jest.fn() },
      subjectCoefficient: { findMany: jest.fn() },
      assessment: { findMany: jest.fn() },
      attendanceRecord: { findMany: jest.fn() },
      grade: { findMany: jest.fn() },
      setting: { findFirst: jest.fn() },
    } as any;
  }

  function setupBase(prisma: any, studentId: string, options: { absent?: boolean } = {}) {
    prisma.enrollment.findMany.mockResolvedValue([{
      studentId, classId: "c1", levelId: "l1",
      student: { id: studentId, matricule: "M1", firstName: "A", lastName: "Alpha", schoolId: "s1" },
    }]);
    prisma.reportCard.findMany.mockResolvedValue([]);
    prisma.term.findUnique.mockResolvedValue({
      id: "t1", name: "T1", type: "TRIMESTRE", isLocked: false, academicYearId: "ay1",
    });
    prisma.level.findMany.mockResolvedValue([{ id: "l1", cycle: "DEUXIEME_CYCLE" }]);
    prisma.subjectCoefficient.findMany.mockResolvedValue([{
      subjectId: "s-math", levelId: "l1", coefficient: 1,
      subject: { id: "s-math", name: "Maths" },
    }]);
    // Assessments présents
    prisma.assessment.findMany.mockResolvedValueOnce([
      { id: "a1", classId: "c1", subjectId: "s-math", maxScore: 20, coefficient: 1,
        status: "VALIDATED", grades: [{ studentId, value: 15, isAbsent: false }] },
    ]);
    prisma.assessment.findMany.mockResolvedValueOnce([]);

    // Absences : si absent=true, 1 absence injustifiée
    if (options.absent) {
      prisma.attendanceRecord.findMany.mockResolvedValue([
        { studentId, status: "ABSENT_UNJUSTIFIED", session: { termId: "t1", classId: "c1" } },
      ]);
    } else {
      prisma.attendanceRecord.findMany.mockResolvedValue([]);
    }

    // Grades ABSENT : si absent=true, 1 grade absent COMPOSITION
    if (options.absent) {
      prisma.grade.findMany.mockResolvedValue([
        { studentId, status: "ABSENT", assessment: { termId: "t1", classId: "c1", type: "COMPOSITION" } },
      ]);
    } else {
      prisma.grade.findMany.mockResolvedValue([]);
    }

    prisma.reportCardAbsenceOverride.findMany.mockResolvedValue([]);
    prisma.setting.findFirst.mockResolvedValue({ passMark: 10 });
    prisma.enrollment.count.mockResolvedValue(1);
    prisma.reportCard.upsert.mockImplementation((args: any) =>
      Promise.resolve({ id: "rc-1", ...(args.create ?? {}), ...(args.update ?? {}) })
    );
    prisma.reportCardItem.deleteMany.mockResolvedValue({ count: 0 });
    prisma.reportCardItem.createMany.mockResolvedValue({ count: 1 });
  }

  const user = { id: "u1", schoolId: "s1", roles: ["DIRECTOR"], permissions: [] } as any;

  it("[ABS-1] Absence AttendanceRecord ABSENT_UNJUSTIFIED → isComplete=false", async () => {
    const prisma = makePrismaMockDec6();
    setupBase(prisma, "student-1", { absent: true });
    const service = new ReportCardsService(prisma, {} as any, {} as any);
    await service.generate({ academicYearId: "ay1", termId: "t1", classId: "c1" }, user);
    const args = prisma.reportCard.upsert.mock.calls[0][0];
    const payload = { ...(args.create ?? {}), ...(args.update ?? {}) };
    expect(payload.isComplete).toBe(false);
    expect(payload.decision).toBe("A_DETERMINER");
  });

  it("[ABS-2] Absence Grade(COMPOSITION) ABSENT → isComplete=false", async () => {
    const prisma = makePrismaMockDec6();
    setupBase(prisma, "student-1", { absent: true });
    // Désactiver la source Attendance pour tester uniquement Grade
    prisma.attendanceRecord.findMany.mockResolvedValue([]);
    prisma.grade.findMany.mockResolvedValue([
      { studentId: "student-1", status: "ABSENT", assessment: { termId: "t1", classId: "c1", type: "COMPOSITION" } },
    ]);
    const service = new ReportCardsService(prisma, {} as any, {} as any);
    await service.generate({ academicYearId: "ay1", termId: "t1", classId: "c1" }, user);
    const args = prisma.reportCard.upsert.mock.calls[0][0];
    const payload = { ...(args.create ?? {}), ...(args.update ?? {}) };
    expect(payload.isComplete).toBe(false);
  });

  it("[ABS-3] Absence + override → isComplete calculé normalement", async () => {
    const prisma = makePrismaMockDec6();
    setupBase(prisma, "student-1", { absent: true });
    prisma.reportCardAbsenceOverride.findMany.mockResolvedValue([
      { reportCard: { studentId: "student-1" } },
    ]);
    const service = new ReportCardsService(prisma, {} as any, {} as any);
    await service.generate({ academicYearId: "ay1", termId: "t1", classId: "c1" }, user);
    const args = prisma.reportCard.upsert.mock.calls[0][0];
    const payload = { ...(args.create ?? {}), ...(args.update ?? {}) };
    // override présent → isComplete calculé normalement (peut être true ou false selon matières)
    // Ici, la matière a une note donc isComplete devrait être true
    expect(payload.isComplete).toBe(true);
  });

  it("[ABS-4] Pas d'absence → isComplete calculé normalement", async () => {
    const prisma = makePrismaMockDec6();
    setupBase(prisma, "student-1", { absent: false });
    const service = new ReportCardsService(prisma, {} as any, {} as any);
    await service.generate({ academicYearId: "ay1", termId: "t1", classId: "c1" }, user);
    const args = prisma.reportCard.upsert.mock.calls[0][0];
    const payload = { ...(args.create ?? {}), ...(args.update ?? {}) };
    expect(payload.isComplete).toBe(true);
  });

  it("[ABS-5] clearAbsences() crée un override", async () => {
    const prisma = makePrismaMockDec6();
    prisma.reportCard.findUnique = jest.fn().mockResolvedValue({
      id: "rc-1", student: { schoolId: "s1" },
    });
    prisma.reportCardAbsenceOverride.findUnique = jest.fn().mockResolvedValue(null);
    prisma.reportCardAbsenceOverride.create = jest.fn().mockResolvedValue({
      id: "o1", reportCardId: "rc-1", schoolId: "s1", clearedBy: "u1", motive: "Motif valide",
    });
    const service = new ReportCardsService(prisma, {} as any, {} as any);
    const result = await service.clearAbsences("rc-1", "Motif valide", user);
    expect(result.id).toBe("o1");
    expect(prisma.reportCardAbsenceOverride.create).toHaveBeenCalled();
  });

  it("[ABS-6] clearAbsences() rejette un motif trop court", async () => {
    const prisma = makePrismaMockDec6();
    const service = new ReportCardsService(prisma, {} as any, {} as any);
    await expect(service.clearAbsences("rc-1", "abc", user)).rejects.toThrow();
  });

  it("[ABS-7] clearAbsences() rejette une double dérogation", async () => {
    const prisma = makePrismaMockDec6();
    prisma.reportCard.findUnique = jest.fn().mockResolvedValue({
      id: "rc-1", student: { schoolId: "s1" },
    });
    prisma.reportCardAbsenceOverride.findUnique = jest.fn().mockResolvedValue({ id: "existing" });
    const service = new ReportCardsService(prisma, {} as any, {} as any);
    await expect(service.clearAbsences("rc-1", "Motif valide", user)).rejects.toThrow();
  });
});

// ============================================================
// Test D12-4 — Rang de compétition (1, 1, 3)
// ============================================================
describe("D12-4 — Rang de compétition", () => {
  it("[RANK-1] 2 élèves ex-aequo à 15.00, 1 à 12.00 → rangs 1, 1, 3", async () => {
    const prisma = {
      enrollment: { findMany: jest.fn(), count: jest.fn() },
      reportCard: { findMany: jest.fn(), upsert: jest.fn() },
      reportCardItem: { deleteMany: jest.fn(), createMany: jest.fn() },
      reportCardAbsenceOverride: { findMany: jest.fn().mockResolvedValue([]) },
      term: { findUnique: jest.fn() },
      level: { findMany: jest.fn() },
      subjectCoefficient: { findMany: jest.fn() },
      assessment: { findMany: jest.fn() },
      attendanceRecord: { findMany: jest.fn().mockResolvedValue([]) },
      grade: { findMany: jest.fn().mockResolvedValue([]) },
      setting: { findFirst: jest.fn() },
    } as any;

    prisma.enrollment.findMany.mockResolvedValue([
      { studentId: "s1", classId: "c1", levelId: "l1",
        student: { id: "s1", matricule: "M1", firstName: "A", lastName: "Alpha", schoolId: "sc1" } },
      { studentId: "s2", classId: "c1", levelId: "l1",
        student: { id: "s2", matricule: "M2", firstName: "B", lastName: "Beta", schoolId: "sc1" } },
      { studentId: "s3", classId: "c1", levelId: "l1",
        student: { id: "s3", matricule: "M3", firstName: "C", lastName: "Gamma", schoolId: "sc1" } },
    ]);
    prisma.reportCard.findMany.mockResolvedValue([]);
    prisma.term.findUnique.mockResolvedValue({
      id: "t1", name: "T1", type: "TRIMESTRE", isLocked: false, academicYearId: "ay1",
    });
    prisma.level.findMany.mockResolvedValue([{ id: "l1", cycle: "DEUXIEME_CYCLE" }]);
    prisma.subjectCoefficient.findMany.mockResolvedValue([{
      subjectId: "sm", levelId: "l1", coefficient: 1,
      subject: { id: "sm", name: "Maths" },
    }]);

    // Assessments : 1 par élève, avec moyenne cible
    prisma.assessment.findMany.mockResolvedValueOnce([
      { id: "a1", classId: "c1", subjectId: "sm", maxScore: 20, coefficient: 1,
        status: "VALIDATED", grades: [{ studentId: "s1", value: 15, isAbsent: false }] },
      { id: "a2", classId: "c1", subjectId: "sm", maxScore: 20, coefficient: 1,
        status: "VALIDATED", grades: [{ studentId: "s2", value: 15, isAbsent: false }] },
      { id: "a3", classId: "c1", subjectId: "sm", maxScore: 20, coefficient: 1,
        status: "VALIDATED", grades: [{ studentId: "s3", value: 12, isAbsent: false }] },
    ]);
    prisma.assessment.findMany.mockResolvedValueOnce([]);

    prisma.setting.findFirst.mockResolvedValue({ passMark: 10 });
    prisma.enrollment.count.mockResolvedValue(3);
    prisma.reportCard.upsert.mockImplementation((args: any) =>
      Promise.resolve({ id: `rc-${args.create.studentId}`, ...(args.create ?? {}), ...(args.update ?? {}) })
    );
    prisma.reportCardItem.deleteMany.mockResolvedValue({ count: 0 });
    prisma.reportCardItem.createMany.mockResolvedValue({ count: 1 });

    const service = new ReportCardsService(prisma, {} as any, {} as any);
    await service.generate(
      { academicYearId: "ay1", termId: "t1", classId: "c1" },
      { id: "u1", schoolId: "sc1", roles: ["DIRECTOR"], permissions: [] } as any,
    );

    const upserts = prisma.reportCard.upsert.mock.calls.map((c: any) => c[0]);
    const ranks: Record<string, number> = {};
    for (const u of upserts) {
      const payload = { ...(u.create ?? {}), ...(u.update ?? {}) };
      ranks[payload.studentId] = payload.rank;
    }

    // D12-4 : rangs de compétition
    expect(ranks["s1"]).toBe(1);
    expect(ranks["s2"]).toBe(1);
    expect(ranks["s3"]).toBe(3);
  });
});

// ============================================================
// Test DEC-9 — Marquage isStale
// ============================================================
describe("DEC-9 — isStale", () => {
  it("[DEC9-1] generate() remet isStale à false", async () => {
    const prisma = {
      enrollment: { findMany: jest.fn(), count: jest.fn() },
      reportCard: { findMany: jest.fn(), upsert: jest.fn() },
      reportCardItem: { deleteMany: jest.fn(), createMany: jest.fn() },
      reportCardAbsenceOverride: { findMany: jest.fn().mockResolvedValue([]) },
      term: { findUnique: jest.fn() },
      level: { findMany: jest.fn() },
      subjectCoefficient: { findMany: jest.fn() },
      assessment: { findMany: jest.fn() },
      attendanceRecord: { findMany: jest.fn().mockResolvedValue([]) },
      grade: { findMany: jest.fn().mockResolvedValue([]) },
      setting: { findFirst: jest.fn() },
    } as any;

    prisma.enrollment.findMany.mockResolvedValue([{
      studentId: "s1", classId: "c1", levelId: "l1",
      student: { id: "s1", matricule: "M1", firstName: "A", lastName: "Alpha", schoolId: "sc1" },
    }]);
    prisma.reportCard.findMany.mockResolvedValue([]);
    prisma.term.findUnique.mockResolvedValue({
      id: "t1", name: "T1", type: "TRIMESTRE", isLocked: false, academicYearId: "ay1",
    });
    prisma.level.findMany.mockResolvedValue([{ id: "l1", cycle: "DEUXIEME_CYCLE" }]);
    prisma.subjectCoefficient.findMany.mockResolvedValue([{
      subjectId: "sm", levelId: "l1", coefficient: 1,
      subject: { id: "sm", name: "Maths" },
    }]);
    prisma.assessment.findMany.mockResolvedValueOnce([
      { id: "a1", classId: "c1", subjectId: "sm", maxScore: 20, coefficient: 1,
        status: "VALIDATED", grades: [{ studentId: "s1", value: 15, isAbsent: false }] },
    ]);
    prisma.assessment.findMany.mockResolvedValueOnce([]);
    prisma.setting.findFirst.mockResolvedValue({ passMark: 10 });
    prisma.enrollment.count.mockResolvedValue(1);
    prisma.reportCard.upsert.mockImplementation((args: any) =>
      Promise.resolve({ id: "rc-1", ...(args.create ?? {}), ...(args.update ?? {}) })
    );
    prisma.reportCardItem.deleteMany.mockResolvedValue({ count: 0 });
    prisma.reportCardItem.createMany.mockResolvedValue({ count: 1 });

    const service = new ReportCardsService(prisma, {} as any, {} as any);
    await service.generate(
      { academicYearId: "ay1", termId: "t1", classId: "c1" },
      { id: "u1", schoolId: "sc1", roles: ["DIRECTOR"], permissions: [] } as any,
    );

    const args = prisma.reportCard.upsert.mock.calls[0][0];
    const payload = { ...(args.create ?? {}), ...(args.update ?? {}) };
    expect(payload.isStale).toBe(false);
  });
});

