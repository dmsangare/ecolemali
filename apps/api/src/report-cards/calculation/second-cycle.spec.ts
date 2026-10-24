import { calculateSubjectAverage, calculateTermAverage, calculateSecondCycleAnnual } from "./second-cycle";

describe("second cycle (7e-9e) — notes /20 avec coefficients", () => {
  describe("calculateSubjectAverage", () => {
    it("test 6f : moyenne matière sur 20 (pas sur 10)", () => {
      const r = calculateSubjectAverage([{ value: 14 }, { value: 12 }, { value: 16 }]);
      expect(r.value).toBe(14); // et NON 7
    });
  });

  describe("calculateTermAverage", () => {
    it("test 3 : 14×3, 12×3, 13×2, 15×2 → 13.40", () => {
      const items = [
        { average: 14, coefficient: 3 },
        { average: 12, coefficient: 3 },
        { average: 13, coefficient: 2 },
        { average: 15, coefficient: 2 },
      ];
      const r = calculateTermAverage(items);
      // (14*3 + 12*3 + 13*2 + 15*2) / (3+3+2+2) = 134 / 10 = 13.4
      expect(r.value).toBe(13.4);
      expect(r.complete).toBe(true);
    });

    it("test 5 : coefficients appliqués une seule fois", () => {
      // Une seule matière coeff 4, moyenne 12 → 12 (pas 48)
      const r = calculateTermAverage([{ average: 12, coefficient: 4 }]);
      expect(r.value).toBe(12);
    });
  });

  describe("calculateSecondCycleAnnual", () => {
    it("test 4a : 12.5, 14, 11.5 → 12.67 (arrondi)", () => {
      const r = calculateSecondCycleAnnual([12.5, 14, 11.5]);
      expect(r.sum).toBe(38);
      expect(r.average).toBe(12.67);
    });

    it("test 4b : 12.5, 14, 11.5 → 12.66 (tronqué)", () => {
      const r = calculateSecondCycleAnnual([12.5, 14, 11.5], {
        decimals: 2,
        mode: "TRUNCATE",
      });
      expect(r.average).toBe(12.66);
    });

    it("test 12 : non-régression — mêmes notes → mêmes moyennes", () => {
      const r1 = calculateSecondCycleAnnual([12.5, 14, 11.5]);
      const r2 = calculateSecondCycleAnnual([12.5, 14, 11.5]);
      expect(r1.average).toBe(r2.average);
      expect(r1.sum).toBe(r2.sum);
    });
  });
});
