import { calculateCompositionAverage, calculateFirstCycleAnnual } from "./first-cycle";

describe("first cycle (1re-6e) — notes /10", () => {
  describe("calculateCompositionAverage", () => {
    it("test 1 : moyenne simple de 7/10, 8/10, 6/10 = 7/10", () => {
      const r = calculateCompositionAverage([{ value: 7 }, { value: 8 }, { value: 6 }]);
      expect(r.value).toBe(7);
      expect(r.complete).toBe(true);
    });

    it("test 6d : notes /10, PAS /20", () => {
      const r = calculateCompositionAverage([{ value: 10 }, { value: 10 }, { value: 10 }]);
      expect(r.value).toBe(10); // et NON 20
    });

    it("test 7e : absences et dispensés exclus (pas comptés comme manquants)", () => {
      const r = calculateCompositionAverage([
        { value: 8 },
        { value: null, isAbsent: true },
        { value: null, isExempt: true },
        { value: 6 },
      ]);
      expect(r.value).toBe(7);        // (8+6)/2
      expect(r.count).toBe(2);        // 2 notes valides
      expect(r.excluded).toBe(2);     // 1 absent + 1 dispensé
      expect(r.complete).toBe(true);  // pas de "manquant" (les exclus sont retirés)
    });
  });

  describe("calculateFirstCycleAnnual", () => {
    it("test 2 : 9 compositions → somme + moyenne /9", () => {
      const r = calculateFirstCycleAnnual([7, 8, 6, 9, 5, 7, 8, 6, 7]);
      expect(r.sum).toBe(63);
      expect(r.average).toBe(7);
      expect(r.count).toBe(9);
      expect(r.complete).toBe(true);
    });

    it("test 8 : composition manquante → incomplete, pas de décision", () => {
      const r = calculateFirstCycleAnnual([7, 8, null, 9, 5, 7, 8, 6, 7]);
      expect(r.complete).toBe(false);
      expect(r.missing).toBe(1);
      // La moyenne est calculée sur 8 compositions valides
      expect(r.average).toBe(7.13); // (7+8+9+5+7+8+6+7)/8 = 7.125 → 7.13
    });

    it("test 6e : 3 compositions /10 → max 10/10 (pas 20)", () => {
      const r = calculateFirstCycleAnnual([10, 10, 10]);
      expect(r.average).toBe(10); // et NON 20
    });
  });
});
