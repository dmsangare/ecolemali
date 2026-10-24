-- Migration A1 : remplacer l'unicité sur rank par une unicité sur studentId
-- Permet les rangs de compétition (1, 1, 3, 4)
-- Auteur : SIS-MALI · Date : 2026-10-23

BEGIN;

DROP INDEX IF EXISTS "top_students_school_id_cycle_period_label_rank_key";

CREATE UNIQUE INDEX "top_students_school_id_cycle_period_label_student_id_key"
  ON "top_students"("school_id", "cycle", "period_label", "student_id");

COMMIT;
