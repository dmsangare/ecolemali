-- Backfill : creer une echeance "Facture initiale" pour chaque facture
-- qui n'en a pas encore.
-- Idempotent : WHERE NOT EXISTS evite les doublons en cas de re-run.

INSERT INTO "invoice_installments" (
  "id",
  "invoice_id",
  "label",
  "amount",
  "paid_amount",
  "due_date",
  "status",
  "order_index",
  "created_at",
  "updated_at"
)
SELECT
  gen_random_uuid(),
  i."id",
  'Facture initiale',
  i."total_amount",
  i."paid_amount",
  i."due_date",
  CASE
    WHEN i."paid_amount" >= i."total_amount" THEN 'PAID'::"InstallmentStatus"
    WHEN i."paid_amount" > 0 THEN 'PARTIAL'::"InstallmentStatus"
    ELSE 'PENDING'::"InstallmentStatus"
  END,
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "invoices" i
WHERE NOT EXISTS (
  SELECT 1 FROM "invoice_installments" ii WHERE ii."invoice_id" = i."id"
);
