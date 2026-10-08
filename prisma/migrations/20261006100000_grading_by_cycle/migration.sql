-- Migration: bulletins par cycle
--  - periodes mensuelles (compositions du 1er cycle) : nouveau type de periode MOIS
--  - bareme du bulletin (10 ou 20) enregistre sur chaque bulletin
-- Les bulletins existants gardent le bareme 20 par defaut : regenerez-les pour appliquer les regles de cycle.

ALTER TYPE "TermType" ADD VALUE IF NOT EXISTS 'MOIS';

ALTER TABLE "report_cards" ADD COLUMN "scale" SMALLINT NOT NULL DEFAULT 20;
