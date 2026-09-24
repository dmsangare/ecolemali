-- Ajouter un champ sigle a la table schools
ALTER TABLE schools ADD COLUMN IF NOT EXISTS sigle VARCHAR(20);

-- Remplir pour l'ecole demo
UPDATE schools 
SET sigle = 'AIGLONS' 
WHERE code = 'DEMO-BAMAKO' AND sigle IS NULL;

-- Afficher le resultat
SELECT id, code, name, sigle FROM schools;
