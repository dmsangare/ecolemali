-- Migration: top_students (tableau d'honneur)
-- Date: 2026-10-04

CREATE TABLE "top_students" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "cycle" VARCHAR(50) NOT NULL,
    "period_type" VARCHAR(20) NOT NULL,
    "period_label" VARCHAR(100) NOT NULL,
    "term_id" UUID,
    "rank" SMALLINT NOT NULL,
    "student_id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "average" DECIMAL(5,2) NOT NULL,
    "scale" SMALLINT NOT NULL DEFAULT 20,
    "computed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "top_students_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "top_students_school_id_cycle_period_label_rank_key"
    ON "top_students"("school_id", "cycle", "period_label", "rank");

CREATE INDEX "top_students_school_id_cycle_period_label_idx"
    ON "top_students"("school_id", "cycle", "period_label");

ALTER TABLE "top_students"
    ADD CONSTRAINT "top_students_school_id_fkey"
    FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "top_students"
    ADD CONSTRAINT "top_students_student_id_fkey"
    FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "top_students"
    ADD CONSTRAINT "top_students_class_id_fkey"
    FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
