-- =========================
-- TABLE : LOGS CONNEXION
-- =========================
CREATE TABLE IF NOT EXISTS logs_connexion (
    id_log_connexion VARCHAR(11) PRIMARY KEY,
    id_client VARCHAR(11),
    date_connexion TIMESTAMP NOT NULL,
    ip_connexion VARCHAR(100),
    pays_connexion VARCHAR(100),
    ville_connexion VARCHAR(100)
);

-- =========================
-- TABLE : ANCIENS CLIENTS
-- =========================
CREATE TABLE IF NOT EXISTS anciens_clients (
    id_client VARCHAR(11) PRIMARY KEY,
    mail VARCHAR(150),
    password TEXT,
    nom VARCHAR(100),
    prenom VARCHAR(100),
    date_naissance DATE,
    pays VARCHAR(100),
    prefixe_tel VARCHAR(10),
    num_tel VARCHAR(20),
    statut_client VARCHAR(50),
    type_client VARCHAR(50),
    date_creation DATE,
    language_favori VARCHAR(10),
    date_dern_maj DATE
);

-- =========================
-- UNIQUE
-- =========================
ALTER TABLE anciens_clients
DROP CONSTRAINT IF EXISTS uq_anciens_clients_mail;

ALTER TABLE anciens_clients
ADD CONSTRAINT uq_anciens_clients_mail UNIQUE (mail);

-- =========================
-- CHECK : ANCIENS CLIENTS
-- =========================
ALTER TABLE anciens_clients
DROP CONSTRAINT IF EXISTS chk_anciens_clients_type_client;

ALTER TABLE anciens_clients
ADD CONSTRAINT chk_anciens_clients_type_client
CHECK (type_client IN ('Particulier', 'Entreprise'));

ALTER TABLE anciens_clients
DROP CONSTRAINT IF EXISTS chk_anciens_clients_language_favori;

ALTER TABLE anciens_clients
ADD CONSTRAINT chk_anciens_clients_language_favori
CHECK (language_favori IN ('FR', 'AR', 'EN'));

ALTER TABLE anciens_clients
DROP CONSTRAINT IF EXISTS chk_anciens_clients_statut_client;

ALTER TABLE anciens_clients
ADD CONSTRAINT chk_anciens_clients_statut_client
CHECK (statut_client IN ('Actif', 'Inactif', 'Rupture relation', 'Prospect'));

-- =========================
-- INDEX
-- =========================
CREATE INDEX IF NOT EXISTS idx_logs_connexion_id_client
ON logs_connexion(id_client);

CREATE INDEX IF NOT EXISTS idx_logs_connexion_date_connexion
ON logs_connexion(date_connexion);