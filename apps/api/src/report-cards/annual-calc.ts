import { rulesForCycle, scaledThreshold } from "./grading-rules";

/**
 * Resultat annuel d'une classe (calcul pur, sans acces base de donnees).
 *
 *  - 1er cycle : moyenne annuelle = somme des moyennes mensuelles (compositions) / nombre de mois.
 *  - 2eme cycle et lycee : moyenne annuelle = moyenne generale ponderee par les COEFFICIENTS de matieres,
 *    chaque matiere etant la moyenne de ses trimestres.
 *  - Decision : admission si la moyenne atteint le seuil de l'ecole ramene au bareme du cycle.
 */

export interface AnnualCardInput {
  studentId: string;
  termId: string;
  average: number | null;
  items: Array<{ subjectId: string; average: number | null; coefficient: number }>;
}
export interface AnnualStudentInput {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
}
export interface AnnualTermInput {
  id: string;
  name: string;
}
export type AnnualDecision = "ADMIS" | "REDOUBLE" | "A_DETERMINER";

export interface AnnualRow {
  student: AnnualStudentInput;
  periods: Array<{ termId: string; average: number | null }>;
  periodsCount: number;
  complete: boolean;
  annualAverage: number | null;
  rank: number | null;
  decision: AnnualDecision;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function computeAnnualRows(args: {
  cycle: string;
  terms: AnnualTermInput[];
  cards: AnnualCardInput[];
  students: AnnualStudentInput[];
  passMark: number; // seuil d'admission de l'ecole, exprime sur 20
}) {
  const { cycle, terms, cards, students, passMark } = args;
  const scale = rulesForCycle(cycle).scale;
  const admisThreshold = scaledThreshold(passMark, scale);

  const rows: AnnualRow[] = students.map((student) => {
    const own = cards.filter((c) => c.studentId === student.id);
    const periods = terms.map((t) => {
      const card = own.find((c) => c.termId === t.id);
      return { termId: t.id, average: card && card.average !== null ? card.average : null };
    });
    const valid = periods.filter((p) => p.average !== null) as Array<{ termId: string; average: number }>;

    let annualAverage: number | null = null;
    if (cycle === "PREMIER_CYCLE") {
      if (valid.length > 0) {
        annualAverage = round2(valid.reduce((s, p) => s + p.average, 0) / valid.length);
      }
    } else {
      // moyenne de chaque matiere sur les periodes, puis moyenne ponderee par les coefficients
      const bySubject = new Map<string, { sum: number; n: number; coef: number }>();
      for (const card of own) {
        for (const it of card.items) {
          if (it.average === null) continue;
          const cur = bySubject.get(it.subjectId) ?? { sum: 0, n: 0, coef: it.coefficient };
          cur.sum += it.average;
          cur.n += 1;
          cur.coef = it.coefficient;
          bySubject.set(it.subjectId, cur);
        }
      }
      let weighted = 0;
      let coefTotal = 0;
      bySubject.forEach((s) => {
        weighted += (s.sum / s.n) * s.coef;
        coefTotal += s.coef;
      });
      if (coefTotal > 0) annualAverage = round2(weighted / coefTotal);
    }

    const decision: AnnualDecision =
      annualAverage === null
        ? "A_DETERMINER"
        : annualAverage >= admisThreshold
          ? "ADMIS"
          : "REDOUBLE";

    return {
      student,
      periods,
      periodsCount: valid.length,
      complete: terms.length > 0 && valid.length === terms.length,
      annualAverage,
      rank: null,
      decision,
    };
  });

  // Rang : egalite = meme rang (1, 1, 3...)
  const ranked = rows
    .filter((r) => r.annualAverage !== null)
    .sort((a, b) => (b.annualAverage as number) - (a.annualAverage as number));
  ranked.forEach((r, i) => {
    r.rank =
      i > 0 && r.annualAverage === ranked[i - 1].annualAverage ? (ranked[i - 1].rank as number) : i + 1;
  });

  rows.sort((a, b) => {
    if (a.rank !== null && b.rank !== null) {
      return a.rank - b.rank || a.student.lastName.localeCompare(b.student.lastName, "fr");
    }
    if (a.rank !== null) return -1;
    if (b.rank !== null) return 1;
    return a.student.lastName.localeCompare(b.student.lastName, "fr");
  });

  const withAvg = rows.filter((r) => r.annualAverage !== null);
  return {
    scale,
    admisThreshold,
    rows,
    stats: {
      count: rows.length,
      admis: rows.filter((r) => r.decision === "ADMIS").length,
      redouble: rows.filter((r) => r.decision === "REDOUBLE").length,
      undetermined: rows.filter((r) => r.decision === "A_DETERMINER").length,
      classAverage: withAvg.length
        ? round2(withAvg.reduce((s, r) => s + (r.annualAverage as number), 0) / withAvg.length)
        : null,
    },
  };
}
