-- =========================
-- UNIQUE
-- =========================
ALTER TABLE tarifications
ADD CONSTRAINT uq_tarifications_nom UNIQUE (nom);

ALTER TABLE assurances
ADD CONSTRAINT uq_assurances_nom UNIQUE (nom);

ALTER TABLE options
ADD CONSTRAINT uq_options_nom UNIQUE (nom);

ALTER TABLE politiques_age
ADD CONSTRAINT uq_politiques_age_nom UNIQUE (nom);

-- =========================
-- CHECK : TARIFICATIONS
-- =========================
ALTER TABLE tarifications
ADD CONSTRAINT chk_tarifications_discount_rate
CHECK (discount_rate >= 0 AND discount_rate <= 100);

-- =========================
-- CHECK : ASSURANCES
-- =========================
ALTER TABLE assurances
ADD CONSTRAINT chk_assurances_prix_jour
CHECK (prix_jour >= 0);

-- =========================
-- CHECK : OPTIONS
-- =========================
ALTER TABLE options
ADD CONSTRAINT chk_options_prix_jour
CHECK (prix_jour >= 0);

-- =========================
-- CHECK : POLITIQUES AGE
-- =========================
ALTER TABLE politiques_age
ADD CONSTRAINT chk_politiques_age_prix_jour
CHECK (prix_jour >= 0);