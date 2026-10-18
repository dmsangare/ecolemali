-- CreateTable
CREATE TABLE "bulletin_configs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "academy" VARCHAR(150),
    "cap" VARCHAR(150),
    "header1" VARCHAR(100) DEFAULT 'RÉPUBLIQUE DU MALI',
    "header2" VARCHAR(150) DEFAULT 'Un Peuple - Un But - Une Foi',
    "subjects" JSONB NOT NULL DEFAULT '[]',
    "use_coefficients" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bulletin_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bulletin_configs_school_id_key" ON "bulletin_configs"("school_id");

-- AddForeignKey
ALTER TABLE "bulletin_configs" ADD CONSTRAINT "bulletin_configs_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
