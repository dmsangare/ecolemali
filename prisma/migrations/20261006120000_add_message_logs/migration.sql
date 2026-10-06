-- Migration: table message_logs (journal des messages WhatsApp/SMS)
-- Date: 2026-10-06
-- Description: Journal des messages envoyes (relances impayes, recus, notifications)

CREATE TABLE "message_logs" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "student_id" UUID,
    "guardian_id" UUID,
    "user_id" UUID,
    "invoice_id" UUID,
    "type" VARCHAR(50) NOT NULL,
    "channel" VARCHAR(20) NOT NULL,
    "recipient_phone" VARCHAR(30) NOT NULL,
    "recipient_name" VARCHAR(150),
    "message" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'SENT',
    "sent_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "message_logs_school_id_sent_at_idx" ON "message_logs"("school_id", "sent_at");
CREATE INDEX "message_logs_invoice_id_idx" ON "message_logs"("invoice_id");

ALTER TABLE "message_logs"
    ADD CONSTRAINT "message_logs_school_id_fkey"
    FOREIGN KEY ("school_id") REFERENCES "schools"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "message_logs"
    ADD CONSTRAINT "message_logs_student_id_fkey"
    FOREIGN KEY ("student_id") REFERENCES "students"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "message_logs"
    ADD CONSTRAINT "message_logs_guardian_id_fkey"
    FOREIGN KEY ("guardian_id") REFERENCES "guardians"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "message_logs"
    ADD CONSTRAINT "message_logs_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "message_logs"
    ADD CONSTRAINT "message_logs_invoice_id_fkey"
    FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
