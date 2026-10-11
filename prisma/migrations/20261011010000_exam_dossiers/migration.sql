-- ============================================================
-- BLOC B09a : Dossiers d'examens d'Etat (DEF/BAC)
-- ============================================================

-- 1. Enum : statut du dossier (CDC §12.3)
DO $$ BEGIN
  CREATE TYPE "ExamDossierStatus" AS ENUM (
    'BROUILLON',
    'PIECES_MANQUANTES',
    'PRET_VERIFICATION',
    'VALIDE_ETABLISSEMENT',
    'TRANSMIS',
    'RECEPTION_CONFIRMEE',
    'A_CORRIGER',
    'COMPLETE',
    'CLOTURE'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Table state_exam_sessions
CREATE TABLE IF NOT EXISTS "state_exam_sessions" (
  "id"                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "school_id"           UUID NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
  "academic_year_id"    UUID NOT NULL REFERENCES "academic_years"("id") ON DELETE CASCADE,
  "exam_type"           "StateExamType" NOT NULL,
  "label"               VARCHAR(120) NOT NULL,
  "registration_opens"  DATE,
  "registration_closes" DATE,
  "exam_date"           DATE,
  "institution_target"  VARCHAR(150),
  "bordereau_pattern"   VARCHAR(120),
  "created_by"          UUID,
  "created_at"          TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("school_id", "academic_year_id", "exam_type")
);

CREATE INDEX IF NOT EXISTS "idx_state_exam_sessions_school" ON "state_exam_sessions"("school_id");

-- 3. Table exam_dossiers (un par session x classe)
CREATE TABLE IF NOT EXISTS "exam_dossiers" (
  "id"                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "session_id"          UUID NOT NULL REFERENCES "state_exam_sessions"("id") ON DELETE CASCADE,
  "school_id"           UUID NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
  "class_id"            UUID NOT NULL REFERENCES "classes"("id") ON DELETE CASCADE,
  "level_id"            UUID NOT NULL REFERENCES "levels"("id") ON DELETE CASCADE,
  "status"              "ExamDossierStatus" NOT NULL DEFAULT 'BROUILLON',
  "bordereau_number"    VARCHAR(60),
  "reference_number"    VARCHAR(60),
  "candidate_count"     INTEGER NOT NULL DEFAULT 0,
  "pieces_required"     JSONB NOT NULL DEFAULT '[]'::jsonb,
  "transmitted_at"      TIMESTAMPTZ,
  "transmitted_by"      UUID,
  "received_at"         TIMESTAMPTZ,
  "received_by"         UUID,
  "proof_url"           VARCHAR(500),
  "receipt_url"         VARCHAR(500),
  "observations"        TEXT,
  "created_by"          UUID,
  "created_at"          TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("session_id", "class_id")
);

CREATE INDEX IF NOT EXISTS "idx_exam_dossiers_school" ON "exam_dossiers"("school_id");
CREATE INDEX IF NOT EXISTS "idx_exam_dossiers_session" ON "exam_dossiers"("session_id");
CREATE INDEX IF NOT EXISTS "idx_exam_dossiers_status" ON "exam_dossiers"("status");

-- 4. Table exam_dossier_pieces (pieces par candidat)
CREATE TABLE IF NOT EXISTS "exam_dossier_pieces" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "dossier_id"  UUID NOT NULL REFERENCES "exam_dossiers"("id") ON DELETE CASCADE,
  "student_id"  UUID NOT NULL REFERENCES "students"("id") ON DELETE CASCADE,
  "piece_type"  VARCHAR(60) NOT NULL,
  "is_present"  BOOLEAN NOT NULL DEFAULT FALSE,
  "file_url"    VARCHAR(500),
  "verified_at" TIMESTAMPTZ,
  "verified_by" UUID,
  "notes"       TEXT,
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("dossier_id", "student_id", "piece_type")
);

CREATE INDEX IF NOT EXISTS "idx_exam_dossier_pieces_dossier" ON "exam_dossier_pieces"("dossier_id");
CREATE INDEX IF NOT EXISTS "idx_exam_dossier_pieces_student" ON "exam_dossier_pieces"("student_id");

-- ============================================================
-- FIN BLOC B09a
-- ============================================================
