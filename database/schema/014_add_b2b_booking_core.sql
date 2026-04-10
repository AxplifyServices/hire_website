-- =====================================================
-- B2B BOOKING CORE
-- =====================================================

-- =========================
-- TABLE : reservations_entreprises
-- =========================
CREATE TABLE reservations_entreprises (
    id_reservation_entreprise VARCHAR(11) PRIMARY KEY,

    id_entreprise VARCHAR(11) NOT NULL,
    id_client_entreprise_demandeur VARCHAR(11) NOT NULL,
    id_client_entreprise_beneficiaire VARCHAR(11) NOT NULL,
    id_centre_cout VARCHAR(11),
    id_profil_beneficiaire VARCHAR(11),

    id_vehicule VARCHAR(11),
    id_agence_depart VARCHAR(11) NOT NULL,
    id_agence_retour VARCHAR(11),
    retour_different BOOLEAN DEFAULT FALSE,

    date_dep DATE NOT NULL,
    date_ret DATE NOT NULL,
    heure_dep TIME NOT NULL,
    heure_ret TIME NOT NULL,

    avec_chauffeur BOOLEAN DEFAULT FALSE,
    type_trajet VARCHAR(50),
    lieu_prise_en_charge TEXT,
    lieu_destination TEXT,
    nb_passagers INT,
    instructions_specifiques TEXT,

    reserve_pour_tiers BOOLEAN DEFAULT FALSE,

    id_tarification VARCHAR(11),
    id_assurance VARCHAR(11),

    cout_estime NUMERIC(10,2),
    cout_final NUMERIC(10,2),

    quota_jours_consomme INT DEFAULT 0,
    quota_budget_consomme NUMERIC(10,2) DEFAULT 0,

    type_validation VARCHAR(50),
    statut_validation VARCHAR(50) DEFAULT 'aucune',

    statut_reservation VARCHAR(50) NOT NULL DEFAULT 'brouillon',

    date_creation DATE DEFAULT CURRENT_DATE,
    date_dern_maj DATE DEFAULT CURRENT_DATE
);

ALTER TABLE reservations_entreprises
ADD CONSTRAINT fk_resa_ent_entreprise
FOREIGN KEY (id_entreprise) REFERENCES entreprises(id_entreprise);

ALTER TABLE reservations_entreprises
ADD CONSTRAINT fk_resa_ent_demandeur
FOREIGN KEY (id_client_entreprise_demandeur) REFERENCES clients_entreprises(id_client_entreprise);

ALTER TABLE reservations_entreprises
ADD CONSTRAINT fk_resa_ent_beneficiaire
FOREIGN KEY (id_client_entreprise_beneficiaire) REFERENCES clients_entreprises(id_client_entreprise);

ALTER TABLE reservations_entreprises
ADD CONSTRAINT fk_resa_ent_centre_cout
FOREIGN KEY (id_centre_cout) REFERENCES centres_cout(id_centre_cout);

ALTER TABLE reservations_entreprises
ADD CONSTRAINT fk_resa_ent_profil
FOREIGN KEY (id_profil_beneficiaire) REFERENCES profils_beneficiaires(id_profil_beneficiaire);

ALTER TABLE reservations_entreprises
ADD CONSTRAINT fk_resa_ent_vehicule
FOREIGN KEY (id_vehicule) REFERENCES vehicules(id_vehicule);

ALTER TABLE reservations_entreprises
ADD CONSTRAINT fk_resa_ent_agence_depart
FOREIGN KEY (id_agence_depart) REFERENCES agences(id_agence);

ALTER TABLE reservations_entreprises
ADD CONSTRAINT fk_resa_ent_agence_retour
FOREIGN KEY (id_agence_retour) REFERENCES agences(id_agence);

ALTER TABLE reservations_entreprises
ADD CONSTRAINT fk_resa_ent_tarification
FOREIGN KEY (id_tarification) REFERENCES tarifications(id_tarification);

ALTER TABLE reservations_entreprises
ADD CONSTRAINT fk_resa_ent_assurance
FOREIGN KEY (id_assurance) REFERENCES assurances(id_assurance);

ALTER TABLE reservations_entreprises
ADD CONSTRAINT chk_resa_ent_type_trajet
CHECK (
    type_trajet IS NULL
    OR type_trajet IN ('simple', 'mise_a_disposition', 'multi_destination')
);

ALTER TABLE reservations_entreprises
ADD CONSTRAINT chk_resa_ent_type_validation
CHECK (
    type_validation IS NULL
    OR type_validation IN ('aucune', 'automatique', 'manuelle')
);

ALTER TABLE reservations_entreprises
ADD CONSTRAINT chk_resa_ent_statut_validation
CHECK (
    statut_validation IN ('aucune', 'en_attente', 'validee', 'refusee', 'expiree')
);

ALTER TABLE reservations_entreprises
ADD CONSTRAINT chk_resa_ent_statut_reservation
CHECK (
    statut_reservation IN (
        'brouillon',
        'en_attente_validation',
        'validee',
        'confirmee',
        'refusee',
        'annulee',
        'terminee'
    )
);

ALTER TABLE reservations_entreprises
ADD CONSTRAINT chk_resa_ent_dates
CHECK (date_ret >= date_dep);

ALTER TABLE reservations_entreprises
ADD CONSTRAINT chk_resa_ent_nb_passagers
CHECK (nb_passagers IS NULL OR nb_passagers > 0);


-- =========================
-- TABLE : demandes_validation
-- =========================
CREATE TABLE demandes_validation (
    id_demande_validation VARCHAR(11) PRIMARY KEY,

    id_reservation_entreprise VARCHAR(11) NOT NULL,
    id_entreprise VARCHAR(11) NOT NULL,

    id_client_entreprise_demandeur VARCHAR(11) NOT NULL,
    id_client_entreprise_valideur VARCHAR(11),

    niveau_validation INT DEFAULT 1,
    statut VARCHAR(50) NOT NULL DEFAULT 'en_attente',
    motif TEXT,
    commentaire_decision TEXT,

    date_demande DATE DEFAULT CURRENT_DATE,
    date_decision DATE,
    date_expiration DATE,

    date_creation DATE DEFAULT CURRENT_DATE,
    date_dern_maj DATE DEFAULT CURRENT_DATE
);

ALTER TABLE demandes_validation
ADD CONSTRAINT fk_demande_validation_resa_ent
FOREIGN KEY (id_reservation_entreprise) REFERENCES reservations_entreprises(id_reservation_entreprise);

ALTER TABLE demandes_validation
ADD CONSTRAINT fk_demande_validation_entreprise
FOREIGN KEY (id_entreprise) REFERENCES entreprises(id_entreprise);

ALTER TABLE demandes_validation
ADD CONSTRAINT fk_demande_validation_demandeur
FOREIGN KEY (id_client_entreprise_demandeur) REFERENCES clients_entreprises(id_client_entreprise);

ALTER TABLE demandes_validation
ADD CONSTRAINT fk_demande_validation_valideur
FOREIGN KEY (id_client_entreprise_valideur) REFERENCES clients_entreprises(id_client_entreprise);

ALTER TABLE demandes_validation
ADD CONSTRAINT chk_demande_validation_statut
CHECK (
    statut IN ('en_attente', 'validee', 'refusee', 'annulee', 'expiree')
);

ALTER TABLE demandes_validation
ADD CONSTRAINT chk_demande_validation_niveau
CHECK (niveau_validation > 0);


-- =========================
-- TABLE : quotas_clients_entreprises
-- =========================
CREATE TABLE quotas_clients_entreprises (
    id_quota_client_entreprise VARCHAR(11) PRIMARY KEY,

    id_client_entreprise VARCHAR(11) NOT NULL,
    periode_annee INT NOT NULL,
    periode_mois INT NOT NULL,

    jours_alloues INT DEFAULT 0,
    jours_utilises INT DEFAULT 0,

    budget_alloue NUMERIC(10,2) DEFAULT 0,
    budget_utilise NUMERIC(10,2) DEFAULT 0,

    reservations_max_simultanees INT DEFAULT 0,
    reservations_simultanees_utilisees INT DEFAULT 0,

    nb_trajets_alloues INT DEFAULT 0,
    nb_trajets_utilises INT DEFAULT 0,

    actif BOOLEAN DEFAULT TRUE,

    date_creation DATE DEFAULT CURRENT_DATE,
    date_dern_maj DATE DEFAULT CURRENT_DATE
);

ALTER TABLE quotas_clients_entreprises
ADD CONSTRAINT fk_quota_client_entreprise
FOREIGN KEY (id_client_entreprise) REFERENCES clients_entreprises(id_client_entreprise);

ALTER TABLE quotas_clients_entreprises
ADD CONSTRAINT uq_quota_client_periode
UNIQUE (id_client_entreprise, periode_annee, periode_mois);

ALTER TABLE quotas_clients_entreprises
ADD CONSTRAINT chk_quota_periode_mois
CHECK (periode_mois BETWEEN 1 AND 12);

ALTER TABLE quotas_clients_entreprises
ADD CONSTRAINT chk_quota_jours_non_negatif
CHECK (jours_alloues >= 0 AND jours_utilises >= 0);

ALTER TABLE quotas_clients_entreprises
ADD CONSTRAINT chk_quota_budget_non_negatif
CHECK (budget_alloue >= 0 AND budget_utilise >= 0);

ALTER TABLE quotas_clients_entreprises
ADD CONSTRAINT chk_quota_resa_simultanees_non_negatif
CHECK (
    reservations_max_simultanees >= 0
    AND reservations_simultanees_utilisees >= 0
);

ALTER TABLE quotas_clients_entreprises
ADD CONSTRAINT chk_quota_trajets_non_negatif
CHECK (nb_trajets_alloues >= 0 AND nb_trajets_utilises >= 0);


-- =========================
-- INDEXES utiles
-- =========================
CREATE INDEX idx_resa_ent_entreprise
ON reservations_entreprises(id_entreprise);

CREATE INDEX idx_resa_ent_demandeur
ON reservations_entreprises(id_client_entreprise_demandeur);

CREATE INDEX idx_resa_ent_beneficiaire
ON reservations_entreprises(id_client_entreprise_beneficiaire);

CREATE INDEX idx_resa_ent_statut_reservation
ON reservations_entreprises(statut_reservation);

CREATE INDEX idx_resa_ent_statut_validation
ON reservations_entreprises(statut_validation);

CREATE INDEX idx_demande_validation_resa
ON demandes_validation(id_reservation_entreprise);

CREATE INDEX idx_demande_validation_valideur
ON demandes_validation(id_client_entreprise_valideur);

CREATE INDEX idx_demande_validation_statut
ON demandes_validation(statut);

CREATE INDEX idx_quota_client_periode
ON quotas_clients_entreprises(id_client_entreprise, periode_annee, periode_mois);