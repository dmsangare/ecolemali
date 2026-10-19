import { roundScore, calculateRank, getCycleFromLevel, calculateAverage } from "./common";

describe("common", () => {
  describe("roundScore", () => {
    it("test 4a : arrondi 2 décimales ROUND", () => {
      expect(roundScore(12.6666)).toBe(12.67);
      expect(roundScore(12.664)).toBe(12.66);
    });

    it("test 4b : troncature TRUNCATE", () => {
      const opts = { decimals: 2, mode: "TRUNCATE" as const };
      expect(roundScore(12.6666, opts)).toBe(12.66);
      expect(roundScore(12.6699, opts)).toBe(12.66);
    });
  });

  describe("calculateRank", () => {
    it("test 10 : ex-aequo, rang suivant sauté", () => {
      // 15, 15, 12, 10 → rangs 1, 1, 3, 4
      const all = [15, 15, 12, 10];
      expect(calculateRank(15, all)).toBe(1);
      expect(calculateRank(15, all)).toBe(1);
      expect(calculateRank(12, all)).toBe(3);
      expect(calculateRank(10, all)).toBe(4);
    });

    it("test 7a : notes null exclues du calcul de rang", () => {
      const all = [15, null, 12, 10];
      expect(calculateRank(12, all)).toBe(2); // 15 > 12, donc 1 + 1 = 2
      expect(calculateRank(10, all)).toBe(3);
    });
  });

  describe("getCycleFromLevel", () => {
    it("test 6a : niveaux 1-6 → PREMIER_CYCLE", () => {
      expect(getCycleFromLevel(1)).toBe("PREMIER_CYCLE");
      expect(getCycleFromLevel(6)).toBe("PREMIER_CYCLE");
    });

    it("test 6b : niveaux 7-9 → DEUXIEME_CYCLE", () => {
      expect(getCycleFromLevel(7)).toBe("DEUXIEME_CYCLE");
      expect(getCycleFromLevel(9)).toBe("DEUXIEME_CYCLE");
    });

    it("test 6c : niveau invalide → erreur", () => {
      expect(() => getCycleFromLevel(0)).toThrow();
      expect(() => getCycleFromLevel(10)).toThrow();
    });
  });

  describe("calculateAverage", () => {
    it("test 7b : notes manquantes (null) exclues et signalées", () => {
      const r = calculateAverage([8, null, 6]);
      expect(r.value).toBe(7);
      expect(r.count).toBe(2);
      expect(r.missing).toBe(1);
      expect(r.complete).toBe(false);
    });

    it("test 7c : tableau vide → value=null, complete=false", () => {
      const r = calculateAverage([]);
      expect(r.value).toBeNull();
      expect(r.complete).toBe(false);
    });

    it("test 7d : toutes les notes valides → complete=true", () => {
      const r = calculateAverage([8, 6, 10]);
      expect(r.value).toBe(8);
      expect(r.complete).toBe(true);
    });
  });
});
