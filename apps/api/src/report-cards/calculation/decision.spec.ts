import { determineDecision } from "./decision";

describe("decision annuelle", () => {
  it("test 11 : seuil 5/10 (1er cycle) vs 10/20 (2e cycle)", () => {
    // 1er cycle : seuil 5/10
    expect(determineDecision(7, true, { passingScore: 5 })).toBe("ADMIS");
    expect(determineDecision(4, true, { passingScore: 5 })).toBe("REDOUBLE");

    // 2e cycle : seuil 10/20
    expect(determineDecision(12.67, true, { passingScore: 10 })).toBe("ADMIS");
    expect(determineDecision(8, true, { passingScore: 10 })).toBe("REDOUBLE");
  });

  it("test 8b : incomplet → INCOMPLET", () => {
    expect(determineDecision(7, false, { passingScore: 5 })).toBe("INCOMPLET");
    expect(determineDecision(null, true, { passingScore: 5 })).toBe("INCOMPLET");
  });

  it("test 11b : examScore → A_EXAMINER", () => {
    expect(
      determineDecision(7, true, { passingScore: 10, examScore: 5 }),
    ).toBe("A_EXAMINER");
  });
});
