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