export type Agency = {
  id_agence: string;
  nom: string | null;
  ville: string | null;
  adresse: string | null;
  num_tel: string | null;
  num_tel_deux?: string | null;
  mail: string | null;
  description: string | null;
  disponibilite_agence?: string | null;
  url_image_agence?: string | null;
  categorie?: string | null;
};

export type Vehicle = {
  id_vehicule: string;
  nom: string | null;
  categorie: string | null;
  transmission: string | null;
  prix_jour: number | null;
  carburant: string | null;
  nb_place: number | null;
  nb_porte: number | null;
  climatisation: boolean | null;
  disponibilite: string | null;
  model: string | null;
  marque: string | null;
  status_vehicule: string | null;
  id_agence_actuelle: string | null;
  url_image_vehicule: string | null;
  capacite_coffre: number | null;
  description: string | null;
};

export type VehiclesListResponse = {
  data: Vehicle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
};

export type ClientProfile = {
  id_client: string;
  mail: string;
  nom: string | null;
  prenom: string | null;
  date_naissance: string | null;
  pays: string | null;
  prefixe_tel: string | null;
  num_tel: string | null;
  statut_client: string | null;
  type_client: string | null;
  language_favori?: string | null;
  banned?: boolean | null;
};

export type LoginResponse = {
  message: string;
  access_token: string;
  client: ClientProfile;
};

export type ReservationsMineResponse = {
  page: number;
  limit: number;
  total: number;
  data: Array<{
    id_reservation: string;
    status: string | null;
    date_dep: string | null;
    date_ret: string | null;
    prix_final: number | null;
    devise: string | null;
    vehicules?: Vehicle | null;
  }>;
};

export type AgePolicy = {
  id_politic_age: string;
  nom: string;
  description: string;
  qualificatif: string;
  prix_jour: string | number;
};

export type ReservationPrefillResponse = {
  is_authenticated: boolean;
  client?: ClientProfile | null;
  politique_age?: AgePolicy | null;
};

export type ReservationRecord = {
  id_reservation: string;
  date_dep: string | null;
  date_ret: string | null;
  heure_dep: string | null;
  heure_ret: string | null;
  id_lieu_dep: string | null;
  id_lieu_ret: string | null;
  status: string | null;
  id_client: string | null;
  id_vehicule: string | null;
  code_promo: string | null;
  devise: string | null;
  prix_initial: number | null;
  prix_final: number | null;
  date_creation: string | null;
  date_dern_maj: string | null;
  id_tarification: string | null;
  id_assurance: string | null;
  liste_id_option: string[];
  id_politic_age: string | null;
  session_panier: string | null;
  source_reservation: string | null;
  etape_panier: string | null;
  is_abandoned: boolean;
  date_abandon: string | null;
  date_derniere_activite: string | null;
  payment_status: string | null;
  payment_reference: string | null;
  nom_snapshot: string | null;
  prenom_snapshot: string | null;
  mail_snapshot: string | null;
  prefixe_tel_snapshot: string | null;
  num_tel_snapshot: string | null;
};

export type CreateCartPayload = {
  id_lieu_dep?: string;
  id_lieu_ret?: string;
  date_dep?: string;
  date_ret?: string;
  heure_dep?: string;
  heure_ret?: string;
  nom?: string;
  prenom?: string;
  mail?: string;
  prefixe_tel?: string;
  num_tel?: string;
  code_promo?: string;
  session_panier?: string;
};

export type CreateCartResponse = {
  message: string;
  reservation: ReservationRecord;
};

export type Tarification = {
  id_tarification: string;
  nom: string;
  description: string;
  qualificatif: string;
  avantages: string[];
  discount_rate: number;
};

export type UpdateReservationPayload = {
  id_vehicule?: string;
  id_tarification?: string | null;
  id_assurance?: string | null;
  liste_id_option?: string[];
  id_politique_age?: string | null;
  code_promo?: string | null;
  nom?: string;
  prenom?: string;
  mail?: string;
  prefixe_tel?: string;
  num_tel?: string;
  date_naissance?: string;
  pays?: string;
  id_lieu_dep?: string;
  id_lieu_ret?: string;
  date_dep?: string;
  date_ret?: string;
  heure_dep?: string;
  heure_ret?: string;
  retour_different?: boolean;
  etape_panier?: string;
};

export type UpdateReservationResponse = {
  message?: string;
  reservation?: ReservationRecord;
} & ReservationRecord;

export type QuotePayload = {
  id_vehicule: string;
  date_dep: string;
  date_ret: string;
  id_tarification: string | null;
  id_politique_age: string | null;
  id_assurance: string | null;
  liste_id_option: string[];
  code_promo?: string | null;
};

export type QuoteResponse = {
  nb_jour: number;
  discount_rate: number;
  breakdown: {
    prixVehiculeJour: number;
    prixVehiculeRemiseJour: number;
    prixOptionsJour: number;
    prixAssuranceJour: number;
    prixAgeJour: number;
    totalVehicule: number;
    totalOptions: number;
    totalAssurance: number;
    totalAge: number;
  };
  prix_initial: number;
  prix_final: number;
  promo_applied: boolean;
  discount: number;
  code_promo?: string | null;
};

export type FinalizeCartResponse = {
  message: string;
  reservation: ReservationRecord;
  quote: QuoteResponse;
};

export type B2BEntreprise = {
  id_entreprise: string;
  raison_sociale: string | null;
  slug: string | null;
  statut: string | null;
  devise: string | null;
  mode_validation_defaut: string | null;
};

export type B2BCentreCout = {
  id_centre_cout: string;
  code: string | null;
  libelle: string | null;
};

export type B2BProfilBeneficiaire = {
  id_profil_beneficiaire: string;
  code: string | null;
  libelle: string | null;
  description: string | null;
  validation_requise: boolean | null;
  budget_plafond_mensuel: number | null;
  nb_jours_mois: number | null;
  nb_reservations_simultanees: number | null;
  avec_chauffeur_autorise: boolean | null;
  sans_chauffeur_autorise: boolean | null;
  actif: boolean | null;
};

export type B2BMembership = {
  id_client_entreprise: string;
  id_client: string;
  id_entreprise: string;
  id_centre_cout: string | null;
  id_profil_beneficiaire: string | null;
  manager_id_client_entreprise: string | null;
  role_entreprise: string | null;
  matricule: string | null;
  actif: boolean;
  date_creation: string | null;
  date_dern_maj: string | null;
  entreprises: B2BEntreprise | null;
  centres_cout: B2BCentreCout | null;
  profils_beneficiaires: B2BProfilBeneficiaire | null;
};

export type B2BContextResponse = {
  user: {
    id_client: string;
    mail: string;
    nom: string | null;
    prenom: string | null;
    role: string | null;
    type_client: string | null;
  };
  is_b2b: boolean;
  memberships: B2BMembership[];
  default_membership: B2BMembership | null;
};

export type B2BQuotePayload = {
  id_client_entreprise_demandeur: string;
  id_client_entreprise_beneficiaire?: string;
  id_centre_cout?: string;
  id_profil_beneficiaire?: string;
  id_vehicule: string;
  id_agence_depart: string;
  id_agence_retour?: string;
  type_lieu_depart?: 'agence' | 'localisation';
  adresse_depart?: string;
  latitude_depart?: number;
  longitude_depart?: number;
  type_lieu_retour?: 'agence' | 'localisation';
  adresse_retour?: string;
  latitude_retour?: number;
  longitude_retour?: number;
  date_dep: string;
  date_ret: string;
  heure_dep: string;
  heure_ret: string;
  avec_chauffeur?: boolean;
  type_trajet?: string;
  lieu_prise_en_charge?: string;
  lieu_destination?: string;
  id_tarification?: string;
  id_assurance?: string;
};

export type B2BQuoteResponse = {
  allowed: boolean;
  requires_validation: boolean;
  errors: unknown[];
  warnings: unknown[];
  prix_estime: number | null;
  quota_consomme: {
    jours: number | null;
    budget: number | null;
  };
  quota_status: string | Record<string, unknown> | null;
};

export type CreateB2BReservationPayload = {
  id_client_entreprise_demandeur: string;
  id_client_entreprise_beneficiaire?: string;
  id_centre_cout?: string;
  id_profil_beneficiaire?: string;
  id_vehicule: string;
  id_agence_depart: string;
  id_agence_retour?: string;
  type_lieu_depart?: 'agence' | 'localisation';
  adresse_depart?: string;
  latitude_depart?: number;
  longitude_depart?: number;
  type_lieu_retour?: 'agence' | 'localisation';
  adresse_retour?: string;
  latitude_retour?: number;
  longitude_retour?: number;
  retour_different?: boolean;
  date_dep: string;
  date_ret: string;
  heure_dep: string;
  heure_ret: string;
  avec_chauffeur?: boolean;
  type_trajet?: string;
  lieu_prise_en_charge?: string;
  lieu_destination?: string;
  nb_passagers?: number;
  instructions_specifiques?: string;
  reserve_pour_tiers?: boolean;
  id_tarification?: string;
  id_assurance?: string;
};

export type B2BValidationRecord = {
  id_demande_validation: string;
  id_reservation_entreprise: string;
  id_client_entreprise_demandeur: string;
  id_client_entreprise_valideur: string | null;
  statut: string | null;
  commentaire_demande: string | null;
  commentaire_validation: string | null;
  date_creation: string | null;
  date_decision: string | null;
  has_assigned_validator?: boolean;
  demandeur?: {
    id_client_entreprise: string;
    clients?: {
      id_client: string;
      nom: string | null;
      prenom: string | null;
      mail: string | null;
    } | null;
  } | null;
  valideur?: {
    id_client_entreprise: string;
    clients?: {
      id_client: string;
      nom: string | null;
      prenom: string | null;
      mail: string | null;
    } | null;
  } | null;
  reservations_entreprises?: B2BReservationRecord | null;
};

export type B2BReservationRecord = {
  id_reservation_entreprise: string;
  id_client_entreprise_demandeur: string;
  id_client_entreprise_beneficiaire: string | null;
  id_entreprise: string;
  id_centre_cout: string | null;
  id_profil_beneficiaire: string | null;
  id_vehicule: string;
  id_agence_depart: string;
  id_agence_retour: string | null;
  type_lieu_depart: string | null;
  adresse_depart: string | null;
  latitude_depart: number | null;
  longitude_depart: number | null;
  type_lieu_retour: string | null;
  adresse_retour: string | null;
  latitude_retour: number | null;
  longitude_retour: number | null;
  date_dep: string | null;
  date_ret: string | null;
  heure_dep: string | null;
  heure_ret: string | null;
  avec_chauffeur: boolean | null;
  type_trajet: string | null;
  lieu_prise_en_charge: string | null;
  lieu_destination: string | null;
  nb_passagers: number | null;
  instructions_specifiques: string | null;
  reserve_pour_tiers: boolean | null;
  statut_reservation: string | null;
  statut_validation: string | null;
  prix_estime: number | null;
  prix_final: number | null;
  devise: string | null;
  date_creation: string | null;
  date_dern_maj: string | null;
  vehicules?: Vehicle | null;
  entreprises?: B2BEntreprise | null;
  centres_cout?: B2BCentreCout | null;
  profils_beneficiaires?: B2BProfilBeneficiaire | null;
  demandes_validation?: B2BValidationRecord[];
  is_demandeur?: boolean;
  is_beneficiaire?: boolean;
  has_pending_validation?: boolean;
  validation_count?: number;
  latest_validation_status?: string | null;
};

export type B2BCollaborateur = {
  id_client_entreprise: string;
  id_client: string;
  id_entreprise: string;
  id_centre_cout: string | null;
  id_profil_beneficiaire: string | null;
  manager_id_client_entreprise: string | null;
  role_entreprise: string | null;
  matricule: string | null;
  actif: boolean;
  date_creation: string | null;
  date_dern_maj: string | null;
  clients: {
    id_client: string;
    nom: string | null;
    prenom: string | null;
    mail: string | null;
  } | null;
  centres_cout: B2BCentreCout | null;
  profils_beneficiaires: B2BProfilBeneficiaire | null;
};

export type B2BReservationsResponse = {
  data: B2BReservationRecord[];
  meta: {
    total: number;
    memberships_count: number;
  };
};

export type B2BValidationsResponse = {
  data: B2BValidationRecord[];
  meta: {
    total: number;
    memberships_count: number;
  };
};

export type Assurance = {
  id_assurance: string;
  nom: string;
  description: string;
  qualificatif: string;
  avantages: string[];
  prix_jour: number | null;
};
