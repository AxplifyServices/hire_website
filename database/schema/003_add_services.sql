-- =========================
-- TABLE : TARIFICATION
-- =========================
CREATE TABLE tarifications (
    id_tarification VARCHAR(11) PRIMARY KEY,
    nom VARCHAR(100),
    description TEXT,
    qualificatif VARCHAR(100),
    avantages TEXT[],
    discount_rate NUMERIC(10,2)
);

-- =========================
-- TABLE : ASSURANCE
-- =========================
CREATE TABLE assurances (
    id_assurance VARCHAR(11) PRIMARY KEY,
    nom VARCHAR(100),
    description TEXT,
    qualificatif VARCHAR(100),
    avantages TEXT[],
    prix_jour NUMERIC(10,2)
);

-- =========================
-- TABLE : OPTIONS
-- =========================
CREATE TABLE options (
    id_option VARCHAR(11) PRIMARY KEY,
    nom VARCHAR(100),
    description TEXT,
    qualificatif VARCHAR(100),
    prix_jour NUMERIC(10,2)
);

-- =========================
-- TABLE : POLITIQUE AGE
-- =========================
CREATE TABLE politiques_age (
    id_politic_age VARCHAR(11) PRIMARY KEY,
    nom VARCHAR(100),
    description TEXT,
    qualificatif VARCHAR(100),
    prix_jour NUMERIC(10,2)
);

-- =========================
-- ALTER TABLE : RESERVATIONS
-- =========================
ALTER TABLE reservations
ADD COLUMN id_tarification VARCHAR(11),
ADD COLUMN id_assurance VARCHAR(11),
ADD COLUMN liste_id_option TEXT[],
ADD COLUMN id_politic_age VARCHAR(11);

-- =========================
-- FOREIGN KEYS : RESERVATIONS
-- =========================
ALTER TABLE reservations
ADD CONSTRAINT fk_reservation_tarification
FOREIGN KEY (id_tarification)
REFERENCES tarifications(id_tarification);

ALTER TABLE reservations
ADD CONSTRAINT fk_reservation_assurance
FOREIGN KEY (id_assurance)
REFERENCES assurances(id_assurance);

ALTER TABLE reservations
ADD CONSTRAINT fk_reservation_politique_age
FOREIGN KEY (id_politic_age)
REFERENCES politiques_age(id_politic_age);