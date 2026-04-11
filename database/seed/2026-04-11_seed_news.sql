INSERT INTO news (
    id_news,
    id_agence,
    date_parution,
    titre,
    contenu,
    date_creation,
    date_dern_maj
)
VALUES
(
    'NEW00000001',
    'AGC00000001',
    CURRENT_DATE,
    'Nouvelle agence en avant-plan',
    'Découvrez les nouveautés et services disponibles dans cette agence.',
    CURRENT_DATE,
    CURRENT_DATE
),
(
    'NEW00000002',
    'AGC00000001',
    CURRENT_DATE - INTERVAL '1 day',
    'Conseils pour louer rapidement',
    'Voici quelques conseils pratiques pour accélérer votre prise en charge.',
    CURRENT_DATE,
    CURRENT_DATE
),
(
    'NEW00000003',
    'AGC00000002',
    CURRENT_DATE - INTERVAL '2 day',
    'Offres locales de la semaine',
    'Retrouvez les informations utiles et actualités locales de cette agence.',
    CURRENT_DATE,
    CURRENT_DATE
)
ON CONFLICT (id_news) DO NOTHING;