-- Migration : ajout de la cle d'idempotence sur payments
-- But : eviter les doublons en cas de double-clic ou coupure reseau
-- Portee : unique par (school_id, idempotency_key) pour le multi-tenant

ALTER TABLE "payments" 
  ADD COLUMN "idempotency_key" VARCHAR(80);

CREATE UNIQUE INDEX "unique_idempotency_per_school"
  ON "payments" ("school_id", "idempotency_key")
  WHERE "idempotency_key" IS NOT NULL;
