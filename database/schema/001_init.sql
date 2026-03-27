-- =========================
-- TABLE : CLIENT
-- =========================
CREATE TABLE clients (
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
-- TABLE : ADMIN
-- =========================
CREATE TABLE admins (
    id_admin VARCHAR(11) PRIMARY KEY,
    mail VARCHAR(150),
    password TEXT,
    nom VARCHAR(100),
    prenom VARCHAR(100),
    grade VARCHAR(50),
    date_creation DATE
);

-- =========================
-- TABLE : AGENCE
-- =========================
CREATE TABLE agences (
    id_agence VARCHAR(11) PRIMARY KEY,
    ville VARCHAR(100),
    nom VARCHAR(100),
    num_tel VARCHAR(20),
    mail VARCHAR(150),
    disponibilite_agence VARCHAR(50),
    adresse TEXT,
    url_image_agence TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    description TEXT,
    is_active BOOLEAN,
    date_dern_maj DATE,
    date_creation DATE
);

-- =========================
-- TABLE : VEHICULE
-- =========================
CREATE TABLE vehicules (
    id_vehicule VARCHAR(11) PRIMARY KEY,
    nom VARCHAR(150),
    categorie VARCHAR(50),
    transmission VARCHAR(50),
    prix_jour NUMERIC(10,2),
    carburant VARCHAR(50),
    nb_place INTEGER,
    nb_porte INTEGER,
    climatisation BOOLEAN,
    disponibilite VARCHAR(50),
    model VARCHAR(100),
    marque VARCHAR(100),
    status_vehicule VARCHAR(50),
    id_agence_actuelle VARCHAR(11),
    url_image_vehicule TEXT,
    capacite_coffre NUMERIC,
    description TEXT,
    date_creation DATE,
    date_dern_maj DATE,

    CONSTRAINT fk_vehicule_agence
    FOREIGN KEY (id_agence_actuelle)
    REFERENCES agences(id_agence)
);

-- =========================
-- TABLE : CODE PROMO
-- =========================
CREATE TABLE codes_promo (
    id_coupon VARCHAR(11) PRIMARY KEY,
    code VARCHAR(50),
    type_promo VARCHAR(50),
    valeur_promo NUMERIC,
    status VARCHAR(50),
    date_creation DATE,
    date_fin_validite DATE,
    id_admin_createur VARCHAR(11),
    nb_max_utilisation INTEGER,

    CONSTRAINT fk_coupon_admin
    FOREIGN KEY (id_admin_createur)
    REFERENCES admins(id_admin)
);

-- =========================
-- TABLE : RESERVATION
-- =========================
CREATE TABLE reservations (
    id_reservation VARCHAR(11) PRIMARY KEY,

    date_dep DATE,
    date_ret DATE,
    heure_dep TIME,
    heure_ret TIME,

    id_lieu_dep VARCHAR(11),
    id_lieu_ret VARCHAR(11),

    status VARCHAR(50),

    id_client VARCHAR(11),
    id_vehicule VARCHAR(11),

    photo_dep TEXT,
    photo_ret TEXT,

    etat_dep TEXT,
    etat_ret TEXT,

    type_service VARCHAR(50),

    type_conducteur VARCHAR(50),

    code_promo VARCHAR(50),

    nb_jour INTEGER,
    devise VARCHAR(10),

    prix_initial NUMERIC(10,2),
    prix_final NUMERIC(10,2),

    date_creation DATE,
    date_dern_maj DATE,

    CONSTRAINT fk_reservation_client
    FOREIGN KEY (id_client)
    REFERENCES clients(id_client),

    CONSTRAINT fk_reservation_vehicule
    FOREIGN KEY (id_vehicule)
    REFERENCES vehicules(id_vehicule),

    CONSTRAINT fk_reservation_lieu_dep
    FOREIGN KEY (id_lieu_dep)
    REFERENCES agences(id_agence),

    CONSTRAINT fk_reservation_lieu_ret
    FOREIGN KEY (id_lieu_ret)
    REFERENCES agences(id_agence)
);

-- =========================
-- TABLE : AVIS
-- =========================
CREATE TABLE avis (
    id_avis VARCHAR(11) PRIMARY KEY,
    id_vehicule VARCHAR(11),
    id_client VARCHAR(11),
    rating INTEGER,
    commentaire TEXT,
    is_published BOOLEAN,
    date_creation DATE,

    CONSTRAINT fk_avis_vehicule
    FOREIGN KEY (id_vehicule)
    REFERENCES vehicules(id_vehicule),

    CONSTRAINT fk_avis_client
    FOREIGN KEY (id_client)
    REFERENCES clients(id_client)
);