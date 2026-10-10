-- BLOC J — Examens d'Etat (DEF / BAC)

-- 1. Enum StateExamType
CREATE TYPE "StateExamType" AS ENUM ('NONE', 'DEF', 'BAC');

-- 2. Ajouter state_exam_type sur levels
ALTER TABLE "levels" ADD COLUMN "state_exam_type" "StateExamType" NOT NULL DEFAULT 'NONE';

-- 3. Marquer automatiquement les niveaux DEF/BAC par code
UPDATE "levels" SET "state_exam_type" = 'DEF' WHERE "code" = '9EME';
UPDATE "levels" SET "state_exam_type" = 'BAC' WHERE "code" = '12EME';
