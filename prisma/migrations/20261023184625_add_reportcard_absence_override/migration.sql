-- Migration DEC-6 : table ReportCardAbsenceOverride
-- Permet le déblocage manuel des bulletins bloqués par absence
BEGIN;

CREATE TABLE "report_card_absence_overrides" (
    "id" UUID NOT NULL,
    "report_card_id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "cleared_by" UUID NOT NULL,
    "cleared_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motive" VARCHAR(500) NOT NULL,
    CONSTRAINT "report_card_absence_overrides_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "report_card_absence_overrides_report_card_id_key"
    ON "report_card_absence_overrides"("report_card_id");

CREATE INDEX "report_card_absence_overrides_school_id_idx"
    ON "report_card_absence_overrides"("school_id");

ALTER TABLE "report_card_absence_overrides"
    ADD CONSTRAINT "report_card_absence_overrides_report_card_id_fkey"
    FOREIGN KEY ("report_card_id") REFERENCES "report_cards"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "report_card_absence_overrides"
    ADD CONSTRAINT "report_card_absence_overrides_school_id_fkey"
    FOREIGN KEY ("school_id") REFERENCES "schools"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
