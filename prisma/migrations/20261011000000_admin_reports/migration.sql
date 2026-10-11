-- ============================================================
-- BLOC B01 : Module rapports administratifs (RAP-01..13)
-- ============================================================

-- 1. Extension de School : champs institutionnels
ALTER TABLE "schools"
  ADD COLUMN IF NOT EXISTS "academy"             VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "cap"                 VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "institutional_code"  VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "institutional_mode"  BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Enums du module rapports
DO $$ BEGIN
  CREATE TYPE "AdminReportCategory" AS ENUM (
    'RENTREE', 'STATISTIQUES', 'PERSONNEL', 'INFRASTRUCTURES',
    'SITUATION_ANNUELLE', 'FIN_ANNEE', 'EXAMENS', 'COMPLEMENTAIRE'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "AdminReportStatus" AS ENUM (
    'NON_PREPARE', 'BROUILLON', 'EN_VERIFICATION', 'A_VALIDER',
    'VALIDE', 'PRET_A_TRANSMETTRE', 'TRANSMIS', 'RECEPTION_CONFIRMEE',
    'A_CORRIGER', 'NOUVELLE_VERSION_REQUISE', 'CLOTURE'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "AdminReportTemplateStatus" AS ENUM (
    'MODELE_INTERNE', 'INSTRUCTION_LOCALE_VERIFIEE',
    'OFFICIEL_VERIFIE', 'A_CONFIRMER', 'ARCHIVE'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "TransmissionChannel" AS ENUM (
    'DEPOT_PHYSIQUE', 'COURRIER', 'EMAIL_ADMIN',
    'PORTAIL_OFFICIEL', 'API_OFFICIELLE'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. Table admin_report_templates
CREATE TABLE IF NOT EXISTS "admin_report_templates" (
  "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id"         UUID REFERENCES "schools"("id") ON DELETE CASCADE,
  "code"              VARCHAR(20) NOT NULL,
  "title"             VARCHAR(200) NOT NULL,
  "description"       TEXT,
  "category"          "AdminReportCategory" NOT NULL,
  "status"            "AdminReportTemplateStatus" NOT NULL DEFAULT 'MODELE_INTERNE',
  "configuration"     JSONB NOT NULL DEFAULT '{}'::jsonb,
  "regulatory_ref"    VARCHAR(200),
  "authority_target"  VARCHAR(100),
  "version"           INTEGER NOT NULL DEFAULT 1,
  "effective_from"    DATE,
  "effective_to"      DATE,
  "periodicity"       VARCHAR(50),
  "deadline_source"   VARCHAR(200),
  "is_active"         BOOLEAN NOT NULL DEFAULT TRUE,
  "created_by"        UUID,
  "created_at"        TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("school_id", "code", "version")
);

CREATE INDEX IF NOT EXISTS "idx_admin_report_templates_school" ON "admin_report_templates"("school_id");
CREATE INDEX IF NOT EXISTS "idx_admin_report_templates_category" ON "admin_report_templates"("category");

-- 4. Table admin_reports
CREATE TABLE IF NOT EXISTS "admin_reports" (
  "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id"         UUID NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
  "template_id"       UUID REFERENCES "admin_report_templates"("id"),
  "academic_year_id"  UUID REFERENCES "academic_years"("id"),
  "code"              VARCHAR(20) NOT NULL,
  "title"             VARCHAR(200) NOT NULL,
  "status"            "AdminReportStatus" NOT NULL DEFAULT 'BROUILLON',
  "reference_date"    DATE,
  "period_label"      VARCHAR(100),
  "bordereau_number"  VARCHAR(50),
  "data"              JSONB NOT NULL DEFAULT '{}'::jsonb,
  "snapshot"          JSONB,
  "version"           INTEGER NOT NULL DEFAULT 1,
  "created_by"        UUID,
  "validated_by"      UUID,
  "validated_at"      TIMESTAMPTZ,
  "created_at"        TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_admin_reports_school" ON "admin_reports"("school_id");
CREATE INDEX IF NOT EXISTS "idx_admin_reports_status" ON "admin_reports"("status");
CREATE INDEX IF NOT EXISTS "idx_admin_reports_year" ON "admin_reports"("academic_year_id");

-- 5. Table admin_report_versions
CREATE TABLE IF NOT EXISTS "admin_report_versions" (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "report_id"    UUID NOT NULL REFERENCES "admin_reports"("id") ON DELETE CASCADE,
  "version"      INTEGER NOT NULL,
  "data"         JSONB NOT NULL,
  "snapshot"     JSONB,
  "reason"       TEXT,
  "created_by"   UUID,
  "created_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("report_id", "version")
);

-- 6. Table admin_report_transmissions
CREATE TABLE IF NOT EXISTS "admin_report_transmissions" (
  "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "report_id"         UUID NOT NULL REFERENCES "admin_reports"("id") ON DELETE CASCADE,
  "version"           INTEGER NOT NULL,
  "recipient"         VARCHAR(150) NOT NULL,
  "recipient_role"    VARCHAR(100),
  "channel"           "TransmissionChannel" NOT NULL,
  "sent_at"           TIMESTAMPTZ NOT NULL DEFAULT now(),
  "sent_by"           UUID,
  "bordereau_number"  VARCHAR(50),
  "reference_number"  VARCHAR(50),
  "proof_url"         VARCHAR(500),
  "acknowledgment_url" VARCHAR(500),
  "observations"      TEXT,
  "created_at"        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_admin_report_transmissions_report" ON "admin_report_transmissions"("report_id");

-- 7. Table admin_report_deadlines
CREATE TABLE IF NOT EXISTS "admin_report_deadlines" (
  "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id"         UUID NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
  "template_code"     VARCHAR(20) NOT NULL,
  "title"             VARCHAR(200) NOT NULL,
  "academic_year_id"  UUID REFERENCES "academic_years"("id"),
  "recipient"         VARCHAR(150),
  "prepare_from"      DATE,
  "deadline"          DATE NOT NULL,
  "source"            VARCHAR(200),
  "confidence_level"  VARCHAR(50) DEFAULT 'A_CONFIRMER',
  "responsible_user_id" UUID,
  "status"            VARCHAR(50) DEFAULT 'A_VENIR',
  "created_at"        TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_admin_report_deadlines_school" ON "admin_report_deadlines"("school_id");

-- 8. Table admin_report_audit_log
CREATE TABLE IF NOT EXISTS "admin_report_audit_log" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "report_id"   UUID REFERENCES "admin_reports"("id") ON DELETE CASCADE,
  "action"      VARCHAR(50) NOT NULL,
  "user_id"     UUID,
  "details"     JSONB,
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_admin_report_audit_log_report" ON "admin_report_audit_log"("report_id");

-- ============================================================
-- FIN BLOC B01
-- ============================================================
