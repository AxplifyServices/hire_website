INSERT INTO centres_cout (
  id_centre_cout,
  id_entreprise,
  code,
  libelle,
  actif
)
VALUES (
  'CCO00000001',
  'ENT00000001',
  'DEFAULT',
  'Centre principal',
  true
);

INSERT INTO profils_beneficiaires (
  id_profil_beneficiaire,
  id_entreprise,
  code,
  libelle,
  validation_requise,
  budget_plafond_mensuel,
  nb_jours_mois,
  nb_reservations_simultanees,
  avec_chauffeur_autorise,
  sans_chauffeur_autorise,
  actif
)
VALUES (
  'PBE00000001',
  'ENT00000001',
  'STANDARD',
  'Profil standard',
  true,
  10000,
  10,
  2,
  false,
  true,
  true
);

UPDATE clients_entreprises
SET
  id_centre_cout = 'CCO00000001',
  id_profil_beneficiaire = 'PBE00000001'
WHERE id_client_entreprise = 'CLE00000001';