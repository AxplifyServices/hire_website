-- =====================================================
-- B2B CORE TABLES
-- =====================================================

-- =========================
-- TABLE : entreprises
-- =========================
CREATE TABLE entreprises (
    id_entreprise VARCHAR(11) PRIMARY KEY,
    raison_sociale VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL,
    email_contact VARCHAR(150),
    tel_contact VARCHAR(20),
    statut VARCHAR(50),
    mode_validation_defaut VARCHAR(50),
    devise VARCHAR(10),
    date_creation DATE DEFAULT CURRENT_DATE,
    date_dern_maj DATE DEFAULT CURRENT_DATE
);

ALTER TABLE entreprises
ADD CONSTRAINT uq_entreprises_raison_sociale UNIQUE (raison_sociale);

ALTER TABLE entreprises
ADD CONSTRAINT uq_entreprises_slug UNIQUE (slug);


-- =========================
-- TABLE : centres_cout
-- =========================
CREATE TABLE centres_cout (
    id_centre_cout VARCHAR(11) PRIMARY KEY,
    id_entreprise VARCHAR(11) NOT NULL,
    code VARCHAR(50) NOT NULL,
    libelle VARCHAR(150) NOT NULL,
    actif BOOLEAN DEFAULT TRUE,
    date_creation DATE DEFAULT CURRENT_DATE,
    date_dern_maj DATE DEFAULT CURRENT_DATE
);

ALTER TABLE centres_cout
ADD CONSTRAINT fk_centre_cout_entreprise
FOREIGN KEY (id_entreprise) REFERENCES entreprises(id_entreprise);

ALTER TABLE centres_cout
ADD CONSTRAINT uq_centre_cout_code_entreprise UNIQUE (id_entreprise, code);


-- =========================
-- TABLE : profils_beneficiaires
-- =========================
CREATE TABLE profils_beneficiaires (
    id_profil_beneficiaire VARCHAR(11) PRIMARY KEY,
    id_entreprise VARCHAR(11) NOT NULL,
    code VARCHAR(50) NOT NULL,
    libelle VARCHAR(100) NOT NULL,
    description TEXT,
    validation_requise BOOLEAN DEFAULT FALSE,
    budget_plafond_mensuel NUMERIC(10,2),
    nb_jours_mois INT,
    nb_reservations_simultanees INT,
    avec_chauffeur_autorise BOOLEAN DEFAULT FALSE,
    sans_chauffeur_autorise BOOLEAN DEFAULT TRUE,
    actif BOOLEAN DEFAULT TRUE,
    date_creation DATE DEFAULT CURRENT_DATE,
    date_dern_maj DATE DEFAULT CURRENT_DATE
);

ALTER TABLE profils_beneficiaires
ADD CONSTRAINT fk_profil_beneficiaire_entreprise
FOREIGN KEY (id_entreprise) REFERENCES entreprises(id_entreprise);

ALTER TABLE profils_beneficiaires
ADD CONSTRAINT uq_profil_beneficiaire_code_entreprise UNIQUE (id_entreprise, code);


-- =========================
-- TABLE : clients_entreprises
-- =========================
CREATE TABLE clients_entreprises (
    id_client_entreprise VARCHAR(11) PRIMARY KEY,
    id_client VARCHAR(11) NOT NULL,
    id_entreprise VARCHAR(11) NOT NULL,
    id_centre_cout VARCHAR(11),
    id_profil_beneficiaire VARCHAR(11),
    manager_id_client_entreprise VARCHAR(11),
    role_entreprise VARCHAR(50) NOT NULL,
    matricule VARCHAR(50),
    actif BOOLEAN DEFAULT TRUE,
    date_creation DATE DEFAULT CURRENT_DATE,
    date_dern_maj DATE DEFAULT CURRENT_DATE
);

ALTER TABLE clients_entreprises
ADD CONSTRAINT fk_client_entreprise_client
FOREIGN KEY (id_client) REFERENCES clients(id_client);

ALTER TABLE clients_entreprises
ADD CONSTRAINT fk_client_entreprise_entreprise
FOREIGN KEY (id_entreprise) REFERENCES entreprises(id_entreprise);

ALTER TABLE clients_entreprises
ADD CONSTRAINT fk_client_entreprise_centre_cout
FOREIGN KEY (id_centre_cout) REFERENCES centres_cout(id_centre_cout);

ALTER TABLE clients_entreprises
ADD CONSTRAINT fk_client_entreprise_profil
FOREIGN KEY (id_profil_beneficiaire) REFERENCES profils_beneficiaires(id_profil_beneficiaire);

ALTER TABLE clients_entreprises
ADD CONSTRAINT fk_client_entreprise_manager
FOREIGN KEY (manager_id_client_entreprise) REFERENCES clients_entreprises(id_client_entreprise);

ALTER TABLE clients_entreprises
ADD CONSTRAINT uq_client_entreprise UNIQUE (id_client, id_entreprise);


-- =========================
-- CHECKS utiles
-- =========================
ALTER TABLE clients_entreprises
ADD CONSTRAINT chk_role_entreprise
CHECK (role_entreprise IN ('admin_entreprise', 'valideur', 'collaborateur', 'assistant'));

ALTER TABLE entreprises
ADD CONSTRAINT chk_mode_validation_defaut
CHECK (
    mode_validation_defaut IS NULL
    OR mode_validation_defaut IN ('automatique', 'manuelle', 'mixte')
);

ALTER TABLE entreprises
ADD CONSTRAINT chk_statut_entreprise
CHECK (
    statut IS NULL
    OR statut IN ('actif', 'inactif', 'suspendu')
);

ALTER TABLE entreprises
ADD CONSTRAINT chk_devise_entreprise
CHECK (
    devise IS NULL
    OR devise IN ('MAD', 'EUR', 'USD')
);