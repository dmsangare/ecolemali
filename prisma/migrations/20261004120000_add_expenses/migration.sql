-- Migration: ajout des tables de gestion des depenses (Caisse)
-- Date: 2026-10-04
-- Description: ExpenseCategory + Expense pour le module Caisse

-- ============================================================
-- Table expense_categories
-- ============================================================
CREATE TABLE "expense_categories" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "emoji" VARCHAR(10),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "expense_categories_school_id_code_key"
    ON "expense_categories"("school_id", "code");

CREATE INDEX "expense_categories_school_id_is_active_idx"
    ON "expense_categories"("school_id", "is_active");

-- ============================================================
-- Table expenses
-- ============================================================
CREATE TABLE "expenses" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "cashier_id" UUID NOT NULL,
    "cash_session_id" UUID,
    "amount" DECIMAL(14,2) NOT NULL,
    "description" TEXT NOT NULL,
    "beneficiary" VARCHAR(150),
    "receipt_url" TEXT,
    "spent_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "expenses_school_id_spent_at_idx"
    ON "expenses"("school_id", "spent_at");

CREATE INDEX "expenses_cash_session_id_idx"
    ON "expenses"("cash_session_id");

CREATE INDEX "expenses_category_id_idx"
    ON "expenses"("category_id");

-- ============================================================
-- Foreign keys
-- ============================================================
ALTER TABLE "cash_sessions"
    ADD CONSTRAINT "cash_sessions_cashier_id_fkey"
    FOREIGN KEY ("cashier_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "expense_categories"
    ADD CONSTRAINT "expense_categories_school_id_fkey"
    FOREIGN KEY ("school_id") REFERENCES "schools"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "expenses"
    ADD CONSTRAINT "expenses_school_id_fkey"
    FOREIGN KEY ("school_id") REFERENCES "schools"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "expenses"
    ADD CONSTRAINT "expenses_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "expense_categories"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "expenses"
    ADD CONSTRAINT "expenses_cashier_id_fkey"
    FOREIGN KEY ("cashier_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "expenses"
    ADD CONSTRAINT "expenses_cash_session_id_fkey"
    FOREIGN KEY ("cash_session_id") REFERENCES "cash_sessions"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
