-- =========================
-- ADD COLUMN : categorie (AGENCES)
-- =========================

ALTER TABLE agences
ADD COLUMN categorie VARCHAR(50) DEFAULT 'Ville';

-- =========================
-- UPDATE données existantes
-- =========================

UPDATE agences
SET categorie = 'Ville'
WHERE categorie IS NULL;

-- =========================
-- CONTRAINTE : valeurs autorisées
-- =========================

ALTER TABLE agences
ADD CONSTRAINT check_categorie_agence
CHECK (categorie IN ('Aéroport', 'Ville'));

-- =========================
-- NOT NULL (après nettoyage)
-- =========================

ALTER TABLE agences
ALTER COLUMN categorie SET NOT NULL;