-- =========================
-- CONTRAINTES UNIQUE
-- =========================

ALTER TABLE clients
ADD CONSTRAINT uq_clients_mail UNIQUE (mail);

ALTER TABLE admins
ADD CONSTRAINT uq_admins_mail UNIQUE (mail);

ALTER TABLE agences
ADD CONSTRAINT uq_agences_mail UNIQUE (mail);

ALTER TABLE codes_promo
ADD CONSTRAINT uq_codes_promo_code UNIQUE (code);

-- =========================
-- CHECK : CLIENTS
-- =========================

ALTER TABLE clients
ADD CONSTRAINT chk_clients_type_client
CHECK (type_client IN ('Particulier', 'Entreprise'));

ALTER TABLE clients
ADD CONSTRAINT chk_clients_language_favori
CHECK (language_favori IN ('FR', 'AR', 'EN'));

ALTER TABLE clients
ADD CONSTRAINT chk_clients_statut_client
CHECK (statut_client IN ('Actif', 'Inactif', 'Rupture relation', 'Prospect'));

-- =========================
-- CHECK : ADMINS
-- =========================

ALTER TABLE admins
ADD CONSTRAINT chk_admins_grade
CHECK (grade IN ('Meta_admin', 'Admin'));

-- =========================
-- CHECK : VEHICULES
-- =========================

ALTER TABLE vehicules
ADD CONSTRAINT chk_vehicules_categorie
CHECK (categorie IN ('Citadines', 'Eco', 'Berlines', 'SUV', 'Premium', 'Vans'));

ALTER TABLE vehicules
ADD CONSTRAINT chk_vehicules_transmission
CHECK (transmission IN ('Manuelle', 'Automatique'));

ALTER TABLE vehicules
ADD CONSTRAINT chk_vehicules_carburant
CHECK (carburant IN ('Gazoil', 'Essence', 'Electrique', 'Hybride'));

ALTER TABLE vehicules
ADD CONSTRAINT chk_vehicules_status
CHECK (status_vehicule IN ('Actif', 'Maintenance', 'Retire_flotte'));

-- =========================
-- CHECK : CODES PROMO
-- =========================

ALTER TABLE codes_promo
ADD CONSTRAINT chk_codes_promo_status
CHECK (status IN ('Valide', 'Non Valide'));

ALTER TABLE codes_promo
ADD CONSTRAINT chk_codes_promo_type
CHECK (type_promo IN ('Pourcentage', 'Fixe'));

-- =========================
-- CHECK : RESERVATIONS
-- =========================

ALTER TABLE reservations
ADD CONSTRAINT chk_reservations_status
CHECK (status IN ('Valide', 'abandonnee', 'Cloturee'));

ALTER TABLE reservations
ADD CONSTRAINT chk_reservations_type_conducteur
CHECK (type_conducteur IN ('Junior', 'Normal', 'Senior'));

ALTER TABLE reservations
ADD CONSTRAINT chk_reservations_prix
CHECK (prix_final <= prix_initial);

ALTER TABLE reservations
ADD CONSTRAINT chk_reservations_nb_jour
CHECK (nb_jour >= 0);

-- =========================
-- CHECK : AVIS
-- =========================

ALTER TABLE avis
ADD CONSTRAINT chk_avis_rating
CHECK (rating BETWEEN 1 AND 5);

ALTER TABLE agences
ADD COLUMN num_tel_deux VARCHAR(20);