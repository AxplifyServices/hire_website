BEGIN;

ALTER TABLE vehicules
ADD COLUMN IF NOT EXISTS type_vehicule VARCHAR(20);

ALTER TABLE profils_beneficiaires
ADD COLUMN IF NOT EXISTS liste_type_autorise TEXT[];

-- Seed des véhicules existants avec 6 types : sm-a à sm-f
WITH ranked AS (
    SELECT
        id_vehicule,
        ROW_NUMBER() OVER (ORDER BY id_vehicule) AS rn
    FROM vehicules
)
UPDATE vehicules v
SET type_vehicule = CASE ((ranked.rn - 1) % 6)
    WHEN 0 THEN 'sm-a'
    WHEN 1 THEN 'sm-b'
    WHEN 2 THEN 'sm-c'
    WHEN 3 THEN 'sm-d'
    WHEN 4 THEN 'sm-e'
    ELSE 'sm-f'
END
FROM ranked
WHERE ranked.id_vehicule = v.id_vehicule
  AND (v.type_vehicule IS NULL OR v.type_vehicule = '');

-- Profil bénéficiaire de test : on lui donne accès à 2 catégories
UPDATE profils_beneficiaires
SET liste_type_autorise = ARRAY['sm-a', 'sm-c']
WHERE id_profil_beneficiaire = 'PBE00000001';

COMMIT;