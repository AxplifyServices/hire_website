-- =========================
-- SEED : TARIFICATIONS
-- =========================
INSERT INTO tarifications (
    id_tarification, nom, description, qualificatif, avantages, discount_rate
)
VALUES
(
    'TAR00000001',
    'Eco Saver',
    'Tarification économique pour petits budgets',
    'Economique',
    ARRAY['Prix réduit', 'Idéal courts séjours', 'Bon rapport qualité prix'],
    5.00
),
(
    'TAR00000002',
    'Flex Premium',
    'Tarification flexible avec avantages premium',
    'Premium',
    ARRAY['Annulation flexible', 'Support prioritaire', 'Confort supérieur'],
    12.00
),
(
    'TAR00000003',
    'Corporate',
    'Tarification dédiée aux entreprises',
    'Entreprise',
    ARRAY['Facturation entreprise', 'Tarif négocié', 'Service prioritaire'],
    15.00
);

-- =========================
-- SEED : ASSURANCES
-- =========================
INSERT INTO assurances (
    id_assurance, nom, description, qualificatif, avantages, prix_jour
)
VALUES
(
    'ASS00000001',
    'Assurance Standard',
    'Couverture de base pour le véhicule',
    'Standard',
    ARRAY['Responsabilité civile', 'Couverture de base'],
    0.00
),
(
    'ASS00000002',
    'Assurance Confort',
    'Couverture renforcée avec assistance',
    'Confort',
    ARRAY['Bris de glace', 'Assistance', 'Couverture étendue'],
    80.00
),
(
    'ASS00000003',
    'Assurance Premium',
    'Couverture premium avec franchise réduite',
    'Premium',
    ARRAY['Franchise réduite', 'Assistance premium', 'Protection maximale'],
    150.00
);

-- =========================
-- SEED : OPTIONS
-- =========================
INSERT INTO options (
    id_option, nom, description, qualificatif, prix_jour
)
VALUES
(
    'OPT00000001',
    'GPS',
    'Système de navigation embarqué',
    'Confort',
    35.00
),
(
    'OPT00000002',
    'Siège bébé',
    'Siège enfant pour jeune passager',
    'Famille',
    40.00
),
(
    'OPT00000003',
    'Conducteur additionnel',
    'Ajout d’un deuxième conducteur',
    'Service',
    60.00
),
(
    'OPT00000004',
    'Wifi embarqué',
    'Connexion internet mobile dans le véhicule',
    'Connectivité',
    25.00
);

-- =========================
-- SEED : POLITIQUES AGE
-- =========================
INSERT INTO politiques_age (
    id_politic_age, nom, description, qualificatif, prix_jour
)
VALUES
(
    'AGE00000001',
    'Junior',
    'Tarification spéciale jeune conducteur',
    'Moins de 25 ans',
    120.00
),
(
    'AGE00000002',
    'Normal',
    'Tarification standard conducteur classique',
    '25 à 65 ans',
    0.00
),
(
    'AGE00000003',
    'Senior',
    'Tarification adaptée conducteur senior',
    'Plus de 65 ans',
    70.00
);

-- =========================
-- UPDATE : RESERVATIONS
-- =========================
UPDATE reservations
SET
    id_tarification = 'TAR00000001',
    id_assurance = 'ASS00000001',
    liste_id_option = ARRAY['OPT00000001'],
    id_politic_age = 'AGE00000002'
WHERE id_reservation = 'RES00000001';

UPDATE reservations
SET
    id_tarification = 'TAR00000002',
    id_assurance = 'ASS00000002',
    liste_id_option = ARRAY['OPT00000001', 'OPT00000003'],
    id_politic_age = 'AGE00000003'
WHERE id_reservation = 'RES00000002';

UPDATE reservations
SET
    id_tarification = 'TAR00000003',
    id_assurance = 'ASS00000003',
    liste_id_option = ARRAY['OPT00000002', 'OPT00000004'],
    id_politic_age = 'AGE00000002'
WHERE id_reservation = 'RES00000003';