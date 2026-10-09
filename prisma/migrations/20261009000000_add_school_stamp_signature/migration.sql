-- Migration: ajout signature et tampon pour les bulletins
ALTER TABLE schools ADD COLUMN IF NOT EXISTS stamp_url TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS signature_url TEXT;
