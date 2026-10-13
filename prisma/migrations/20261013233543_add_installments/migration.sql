-- CreateEnum
CREATE TYPE "InstallmentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "InstallmentMode" AS ENUM ('CASH', 'TRIMESTER', 'MONTHLY', 'CUSTOM');

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "installment_mode" "InstallmentMode" NOT NULL DEFAULT 'CASH';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "imported_from" VARCHAR(80),
ADD COLUMN     "installment_id" UUID,
ADD COLUMN     "note" TEXT;

-- CreateTable
CREATE TABLE "invoice_installments" (
    "id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "paid_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "due_date" DATE,
    "status" "InstallmentStatus" NOT NULL DEFAULT 'PENDING',
    "order_index" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "invoice_installments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "invoice_installments_invoice_id_idx" ON "invoice_installments"("invoice_id");

-- CreateIndex
CREATE INDEX "invoice_installments_status_idx" ON "invoice_installments"("status");

-- CreateIndex
CREATE INDEX "invoice_installments_due_date_idx" ON "invoice_installments"("due_date");

-- CreateIndex
CREATE INDEX "payments_installment_id_idx" ON "payments"("installment_id");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_installment_id_fkey" FOREIGN KEY ("installment_id") REFERENCES "invoice_installments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_installments" ADD CONSTRAINT "invoice_installments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

