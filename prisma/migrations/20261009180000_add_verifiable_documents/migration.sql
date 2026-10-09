-- CreateTable
CREATE TABLE "verifiable_documents" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "reference_id" UUID NOT NULL,
    "short_code" VARCHAR(12) NOT NULL,
    "hmac_token" VARCHAR(64) NOT NULL,
    "meta" JSONB,
    "revoked_at" TIMESTAMPTZ,
    "revoked_by" UUID,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "last_view_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "verifiable_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "verifiable_documents_short_code_key" ON "verifiable_documents"("short_code");

-- CreateIndex
CREATE INDEX "verifiable_documents_school_id_type_idx" ON "verifiable_documents"("school_id", "type");

-- CreateIndex
CREATE INDEX "verifiable_documents_short_code_idx" ON "verifiable_documents"("short_code");

-- CreateIndex
CREATE INDEX "verifiable_documents_reference_id_idx" ON "verifiable_documents"("reference_id");

-- AddForeignKey
ALTER TABLE "verifiable_documents" ADD CONSTRAINT "verifiable_documents_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
