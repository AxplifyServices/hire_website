-- =========================================================
-- B2B - lieux hybrides (agence / localisation)
-- Table : reservations_entreprises
-- =========================================================

ALTER TABLE reservations_entreprises
ADD COLUMN type_lieu_depart VARCHAR(30) NOT NULL DEFAULT 'agence',
ADD COLUMN adresse_depart TEXT,
ADD COLUMN latitude_depart NUMERIC(9,6),
ADD COLUMN longitude_depart NUMERIC(9,6),
ADD COLUMN type_lieu_retour VARCHAR(30),
ADD COLUMN adresse_retour TEXT,
ADD COLUMN latitude_retour NUMERIC(9,6),
ADD COLUMN longitude_retour NUMERIC(9,6);

-- ---------------------------------------------------------
-- Contraintes sur les types autorisés
-- ---------------------------------------------------------
ALTER TABLE reservations_entreprises
ADD CONSTRAINT chk_resa_ent_type_lieu_depart
CHECK (type_lieu_depart IN ('agence', 'localisation'));

ALTER TABLE reservations_entreprises
ADD CONSTRAINT chk_resa_ent_type_lieu_retour
CHECK (
    type_lieu_retour IS NULL
    OR type_lieu_retour IN ('agence', 'localisation')
);