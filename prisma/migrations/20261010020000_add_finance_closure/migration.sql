-- BLOC H — Cloture financiere annuelle

-- 1. Enum InvoiceKind
CREATE TYPE "InvoiceKind" AS ENUM ('REGULAR', 'CARRY_OVER');

-- 2. Ajouter kind + carriedOverFromId sur invoices
ALTER TABLE "invoices" ADD COLUMN "kind" "InvoiceKind" NOT NULL DEFAULT 'REGULAR';
ALTER TABLE "invoices" ADD COLUMN "carried_over_from_id" UUID;

-- 3. Ajouter financeClosedAt + financeClosedBy sur academic_years
ALTER TABLE "academic_years" ADD COLUMN "finance_closed_at" TIMESTAMPTZ;
ALTER TABLE "academic_years" ADD COLUMN "finance_closed_by" UUID;

-- 4. Creer student_accounts
CREATE TABLE "student_accounts" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "credit_balance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "debt_balance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "last_credit_at" TIMESTAMPTZ,
    "last_debt_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "student_accounts_pkey" PRIMARY KEY ("id")
);

-- 5. Index + contraintes
CREATE UNIQUE INDEX "student_accounts_student_id_key" ON "student_accounts"("student_id");
CREATE INDEX "student_accounts_school_id_credit_balance_idx" ON "student_accounts"("school_id", "credit_balance");
CREATE INDEX "student_accounts_school_id_debt_balance_idx" ON "student_accounts"("school_id", "debt_balance");

ALTER TABLE "student_accounts" ADD CONSTRAINT "student_accounts_student_id_fkey"
    FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "student_accounts" ADD CONSTRAINT "student_accounts_school_id_fkey"
    FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
