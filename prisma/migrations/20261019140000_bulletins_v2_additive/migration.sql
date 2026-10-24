-- ============================================================
-- BLOC 6 : ajouts additifs uniquement (bulletins v2)
-- Généré à partir du schéma Prisma corrigé
-- ============================================================

-- Nouveaux enums
CREATE TYPE "GradeStatus" AS ENUM ('PRESENT', 'ABSENT', 'EXEMPT', 'MISSING');
CREATE TYPE "ReportCardKind" AS ENUM ('COMPOSITION', 'TRIMESTRIEL', 'ANNUEL');

-- Enrichissement Grade
ALTER TABLE "grades"
  ADD COLUMN "comment" TEXT,
  ADD COLUMN "is_exempt" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "status" "GradeStatus" NOT NULL DEFAULT 'PRESENT';

-- Enrichissement ReportCardItem
ALTER TABLE "report_card_items"
  ADD COLUMN "composition_score" DECIMAL(5,2),
  ADD COLUMN "continuous_average" DECIMAL(5,2),
  ADD COLUMN "domain_id" UUID;

-- Enrichissement ReportCard
ALTER TABLE "report_cards"
  ADD COLUMN "conduct_appreciation" TEXT,
  ADD COLUMN "conduct_score" DECIMAL(5,2),
  ADD COLUMN "is_complete" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "kind" "ReportCardKind" NOT NULL DEFAULT 'TRIMESTRIEL',
  ADD COLUMN "rule_version_id" TEXT,
  ADD COLUMN "snapshot" JSONB;

-- Enrichissement Subject
ALTER TABLE "subjects"
  ADD COLUMN "domain_id" UUID;

-- Nouvelle table : subject_domains
CREATE TABLE "subject_domains" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subject_domains_pkey" PRIMARY KEY ("id")
);

-- Nouvelle table : grade_audits
CREATE TABLE "grade_audits" (
    "id" UUID NOT NULL,
    "grade_id" UUID NOT NULL,
    "old_value" DECIMAL(5,2),
    "new_value" DECIMAL(5,2),
    "user_id" UUID NOT NULL,
    "motive" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "grade_audits_pkey" PRIMARY KEY ("id")
);

-- Index unique
CREATE UNIQUE INDEX "subject_domains_school_id_code_key"
  ON "subject_domains"("school_id", "code");

-- Clés étrangères BLOC 6 uniquement
ALTER TABLE "subjects"
  ADD CONSTRAINT "subjects_domain_id_fkey"
  FOREIGN KEY ("domain_id") REFERENCES "subject_domains"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "subject_domains"
  ADD CONSTRAINT "subject_domains_school_id_fkey"
  FOREIGN KEY ("school_id") REFERENCES "schools"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "grade_audits"
  ADD CONSTRAINT "grade_audits_grade_id_fkey"
  FOREIGN KEY ("grade_id") REFERENCES "grades"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
