-- =========================
-- SEED : ADMINS
-- =========================
INSERT INTO admins (
    id_admin, mail, password, nom, prenom, grade, date_creation
)
VALUES
('ADM00000001', 'admin1@hire.ma', 'admin123', 'Zitane', 'Zakariae', 'Meta_admin', '2026-03-18'),
('ADM00000002', 'admin2@hire.ma', 'admin123', 'El Amrani', 'Sara', 'Admin', '2026-03-18');

-- =========================
-- SEED : AGENCES
-- =========================
INSERT INTO agences (
    id_agence, ville, nom, num_tel, mail, disponibilite_agence,
    adresse, url_image_agence, latitude, longitude,
    description, is_active, date_dern_maj, date_creation
)
VALUES
(
    'AGC00000001', 'Casablanca', 'Hire Casablanca Centre', '0522000001', 'casa@hire.ma', 'Disponible',
    'Centre ville Casablanca', '/uploads/agences/casa.jpg', 33.5731, -7.5898,
    'Agence principale de Casablanca', TRUE, '2026-03-18', '2026-03-18'
),
(
    'AGC00000002', 'Rabat', 'Hire Rabat Agdal', '0522000002', 'rabat@hire.ma', 'Disponible',
    'Agdal Rabat', '/uploads/agences/rabat.jpg', 34.0209, -6.8416,
    'Agence de Rabat Agdal', TRUE, '2026-03-18', '2026-03-18'
),
(
    'AGC00000003', 'Tanger', 'Hire Tanger Gare', '0522000003', 'tanger@hire.ma', 'Disponible',
    'Gare Tanger', '/uploads/agences/tanger.jpg', 35.7595, -5.8340,
    'Agence de Tanger proche gare', TRUE, '2026-03-18', '2026-03-18'
);

-- =========================
-- SEED : CLIENTS
-- =========================
INSERT INTO clients (
    id_client, mail, password, nom, prenom, date_naissance,
    pays, prefixe_tel, num_tel, statut_client, type_client,
    date_creation, language_favori, date_dern_maj
)
VALUES
(
    'CLI00000001', 'client1@hire.ma', 'pass123', 'Benali', 'Youssef', '1995-06-10',
    'Maroc', '+212', '600000001', 'Actif', 'Particulier',
    '2026-03-18', 'FR', '2026-03-18'
),
(
    'CLI00000002', 'client2@hire.ma', 'pass123', 'Alaoui', 'Imane', '1990-09-15',
    'Maroc', '+212', '600000002', 'Prospect', 'Particulier',
    '2026-03-18', 'AR', '2026-03-18'
),
(
    'CLI00000003', 'client3@hire.ma', 'pass123', 'Dupont', 'Jean', '1988-01-20',
    'France', '+33', '610000003', 'Actif', 'Entreprise',
    '2026-03-18', 'FR', '2026-03-18'
);

-- =========================
-- SEED : VEHICULES
-- =========================
INSERT INTO vehicules (
    id_vehicule, nom, categorie, transmission, prix_jour, carburant,
    nb_place, nb_porte, climatisation, disponibilite, model, marque,
    status_vehicule, id_agence_actuelle, url_image_vehicule,
    capacite_coffre, description, date_creation, date_dern_maj
)
VALUES
(
    'VEH00000001', 'Dacia Logan Blanche', 'Berlines', 'Manuelle', 350.00, 'Essence',
    5, 4, TRUE, 'Disponible', 'Logan', 'Dacia',
    'Disponible', 'AGC00000001', '/uploads/vehicules/logan.jpg',
    510, 'Véhicule économique et fiable', '2026-03-18', '2026-03-18'
),
(
    'VEH00000002', 'Clio Rouge', 'Citadines', 'Automatique', 420.00, 'Essence',
    5, 4, TRUE, 'Disponible', 'Clio', 'Renault',
    'Disponible', 'AGC00000001', '/uploads/vehicules/clio.jpg',
    390, 'Citadine confortable pour la ville', '2026-03-18', '2026-03-18'
),
(
    'VEH00000003', 'Peugeot 3008 Noir', 'SUV', 'Automatique', 850.00, 'Gazoil',
    5, 5, TRUE, 'Disponible', '3008', 'Peugeot',
    'Disponible', 'AGC00000002', '/uploads/vehicules/3008.jpg',
    520, 'SUV spacieux pour famille', '2026-03-18', '2026-03-18'
),
(
    'VEH00000004', 'Range Rover Sport', 'Premium', 'Automatique', 1800.00, 'Gazoil',
    5, 5, TRUE, 'Reserve', 'Sport', 'Land Rover',
    'Reserve', 'AGC00000003', '/uploads/vehicules/range-rover.jpg',
    600, 'SUV premium haut de gamme', '2026-03-18', '2026-03-18'
),
(
    'VEH00000005', 'Mercedes Vito', 'Vans', 'Manuelle', 1200.00, 'Gazoil',
    9, 5, TRUE, 'Indisponible', 'Vito', 'Mercedes',
    'Indisponible', 'AGC00000002', '/uploads/vehicules/vito.jpg',
    900, 'Van idéal pour groupes', '2026-03-18', '2026-03-18'
);

-- =========================
-- SEED : CODES PROMO
-- =========================
INSERT INTO codes_promo (
    id_coupon, code, type_promo, valeur_promo, status,
    date_creation, date_fin_validite, id_admin_createur, nb_max_utilisation
)
VALUES
('CPN00000001', 'WELCOME10', 'Pourcentage', 10, 'Valide', '2026-03-18', '2026-12-31', 'ADM00000001', 100),
('CPN00000002', 'SPRING200', 'Fixe', 200, 'Valide', '2026-03-18', '2026-06-30', 'ADM00000002', 50);

-- =========================
-- SEED : RESERVATIONS
-- =========================
INSERT INTO reservations (
    id_reservation, date_dep, date_ret, heure_dep, heure_ret,
    id_lieu_dep, id_lieu_ret, status, id_client, id_vehicule,
    photo_dep, photo_ret, etat_dep, etat_ret, type_service,
    type_conducteur, code_promo, nb_jour, devise,
    prix_initial, prix_final, date_creation, date_dern_maj
)
VALUES
(
    'RES00000001', '2026-04-01', '2026-04-05', '10:00', '10:00',
    'AGC00000001', 'AGC00000001', 'Valide', 'CLI00000001', 'VEH00000001',
    '/uploads/etat/dep1.jpg', '/uploads/etat/ret1.jpg', 'RAS', 'RAS', 'Standard',
    'Normal', 'WELCOME10', 4, 'MAD',
    1400.00, 1260.00, '2026-03-18', '2026-03-18'
),
(
    'RES00000002', '2026-04-10', '2026-04-12', '09:00', '18:00',
    'AGC00000002', 'AGC00000002', 'Valide', 'CLI00000002', 'VEH00000003',
    '/uploads/etat/dep2.jpg', '/uploads/etat/ret2.jpg', 'RAS', 'RAS', 'Premium',
    'Senior', 'SPRING200', 2, 'MAD',
    1700.00, 1500.00, '2026-03-18', '2026-03-18'
),
(
    'RES00000003', '2026-05-01', '2026-05-03', '08:30', '17:30',
    'AGC00000003', 'AGC00000001', 'abandonnee', 'CLI00000003', 'VEH00000004',
    NULL, NULL, NULL, NULL, 'OneWay',
    'Normal', NULL, 2, 'MAD',
    3600.00, 3600.00, '2026-03-18', '2026-03-18'
);

-- =========================
-- SEED : AVIS
-- =========================
INSERT INTO avis (
    id_avis, id_vehicule, id_client, rating, commentaire, is_published, date_creation
)
VALUES
('AVI00000001', 'VEH00000001', 'CLI00000001', 5, 'Très bonne voiture, propre et économique.', TRUE, '2026-03-18'),
('AVI00000002', 'VEH00000003', 'CLI00000002', 4, 'Bonne expérience globale.', TRUE, '2026-03-18'),
('AVI00000003', 'VEH00000004', 'CLI00000003', 5, 'Service premium excellent.', FALSE, '2026-03-18');