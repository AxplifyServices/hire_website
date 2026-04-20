import type {
  Agency,
  B2BContextResponse,
  B2BQuotePayload,
  B2BQuoteResponse,
  B2BReservationsResponse,
  B2BValidationsResponse,
  CreateB2BReservationPayload,
  CreateCartPayload,
  CreateCartResponse,
  QuotePayload,
  QuoteResponse,
  ReservationPrefillResponse,
  Tarification,
  UpdateReservationPayload,
  UpdateReservationResponse,
  Vehicle,
  VehiclesListResponse,
  FinalizeCartResponse,
  Assurance,
  B2BCentreCout,
  B2BCollaborateur,
  B2BProfilBeneficiaire,
  NewsListResponse,
  AdminClient,
  AdminClientsListResponse,
  AdminLoginResponse,
  NewsItem,
  AdminReservation,
  AdminReservationsListResponse,
  AdminCoupon,
  AdminCouponsListResponse,
  AdminOption,
  AdminOptionsListResponse,
  AdminInsurance,
  AdminInsurancesListResponse,
  AdminPricing,
  AdminPricingListResponse,
  B2BEntreprise,
  AdminB2BCompaniesListResponse,
  AdminB2BReservation,
  AdminB2BReservationsListResponse,
} from '@/lib/types';

const DEFAULT_API_BASE_URL = 'http://localhost:3000';

export function getApiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.API_BASE_URL ||
    DEFAULT_API_BASE_URL
  ).replace(/\/$/, '');
}

function buildQuery(
  params?: Record<string, string | number | undefined | null>
) {
  const searchParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export function buildApiUrl(
  path: string,
  params?: Record<string, string | number | undefined | null>
) {
  return `${getApiBaseUrl()}${path}${buildQuery(params)}`;
}

export function resolveMediaUrl(path?: string | null) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = 'Une erreur serveur est survenue.';
    try {
      const payload = await response.json();
      message = payload.message || payload.error || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function fetchApi<T>(
  path: string,
  params?: Record<string, string | number | undefined | null>
) {
  const response = await fetch(buildApiUrl(path, params), {
    cache: 'no-store'
  });

  return parseResponse<T>(response);
}

export async function fetchBrowserApi<T>(
  path: string,
  init?: RequestInit & {sessionId?: string}
) {
  const headers = new Headers(init?.headers || {});
  const isFormData =
    typeof FormData !== 'undefined' && init?.body instanceof FormData;

  if (!headers.has('Content-Type') && init?.body && !isFormData) {
    headers.set('Content-Type', 'application/json');
  }

  if (init?.sessionId) {
    headers.set('x-session-id', init.sessionId);
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers
  });

  return parseResponse<T>(response);
}

const ADMIN_TOKEN_STORAGE_KEY = 'hire_admin_access_token';

export function getAdminAccessToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
}

export function setAdminAccessToken(token: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
}

export function clearAdminAccessToken() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
}

export async function fetchAdminApi<T>(
  path: string,
  init?: RequestInit
) {
  const token = getAdminAccessToken();

  if (!token) {
    throw new Error('Session admin introuvable. Veuillez vous reconnecter.');
  }

  const headers = new Headers(init?.headers || {});
  headers.set('Authorization', `Bearer ${token}`);

  const isFormData =
    typeof FormData !== 'undefined' && init?.body instanceof FormData;

  if (!headers.has('Content-Type') && init?.body && !isFormData) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers
  });

  return parseResponse<T>(response);
}

export async function adminLogin(payload: {
  mail: string;
  password: string;
}) {
  return await fetchBrowserApi<AdminLoginResponse>('/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function fetchAdminClients(
  params?: Record<string, string | number | undefined | null>
) {
  return await fetchAdminApi<AdminClientsListResponse>(
    `/clients${buildQuery({
      page: 1,
      limit: 10,
      ...params
    })}`
  );
}

export async function createAdminClient(payload: {
  mail: string;
  password: string;
  nom: string;
  prenom: string;
  date_naissance?: string;
  pays?: string;
  prefixe_tel?: string;
  num_tel?: string;
  statut_client?: string;
  type_client?: string;
  language_favori?: string;
  banned?: boolean;
}) {
  return await fetchAdminApi<{message: string; client: AdminClient}>('/clients', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateAdminClient(
  id: string,
  payload: Partial<{
    mail: string;
    password: string;
    nom: string;
    prenom: string;
    date_naissance?: string;
    pays?: string;
    prefixe_tel?: string;
    num_tel?: string;
    statut_client?: string;
    type_client?: string;
    language_favori?: string;
    banned?: boolean;
  }>
) {
  return await fetchAdminApi<{message: string; client: AdminClient}>(`/clients/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

export async function deleteAdminClient(id: string) {
  return await fetchAdminApi<{message: string; client: AdminClient}>(`/clients/${id}`, {
    method: 'DELETE'
  });
}

export async function fetchAdminReservations(
  params?: Record<string, string | number | undefined | null>
) {
  return await fetchAdminApi<AdminReservationsListResponse>(
    `/reservations${buildQuery({
      page: 1,
      limit: 10,
      ...params
    })}`
  );
}

export async function adminStartReservation(id: string) {
  return await fetchAdminApi<{message: string; reservation: AdminReservation}>(
    `/reservations/${id}/admin/start`,
    {
      method: 'POST'
    }
  );
}

export async function adminCompleteReservation(id: string) {
  return await fetchAdminApi<{message: string; reservation: AdminReservation}>(
    `/reservations/${id}/admin/complete`,
    {
      method: 'POST'
    }
  );
}

export async function adminCancelReservation(id: string) {
  return await fetchAdminApi<{message: string; reservation: AdminReservation}>(
    `/reservations/${id}/admin/cancel`,
    {
      method: 'POST'
    }
  );
}

export async function fetchAgencies() {
  try {
    return await fetchApi<Agency[]>('/agences');
  } catch {
    return [] as Agency[];
  }
}

export async function createAdminAgency(payload: FormData) {
  return await fetchAdminApi<{message: string; agence: Agency}>('/agences', {
    method: 'POST',
    body: payload
  });
}

export async function updateAdminAgency(id: string, payload: FormData) {
  return await fetchAdminApi<{message: string; agence: Agency}>(`/agences/${id}`, {
    method: 'PATCH',
    body: payload
  });
}

export async function deleteAdminAgency(id: string) {
  return await fetchAdminApi<{
    message: string;
    deleted?: boolean;
    deactivated?: boolean;
  }>(`/agences/${id}`, {
    method: 'DELETE'
  });
}

export async function fetchNews(
  params?: Record<string, string | number | undefined | null>
) {
  try {
    return await fetchApi<NewsListResponse>('/news', params);
  } catch {
    return {
      page: 1,
      limit: 10,
      total: 0,
      total_pages: 1,
      data: []
    } as NewsListResponse;
  }
}

export async function fetchVehiclesList(
  params?: Record<string, string | number | undefined | null>
) {
  try {
    return await fetchApi<VehiclesListResponse>('/vehicules', {
      page: 1,
      limit: 12,
      ...params
    });
  } catch {
    return {
      data: [],
      pagination: {
        page: 1,
        limit: 12,
        total: 0,
        total_pages: 0,
        has_next: false,
        has_prev: false
      }
    } as VehiclesListResponse;
  }
}

export async function fetchAdminVehicles(
  params?: Record<string, string | number | undefined | null>
) {
  try {
    return await fetchApi<VehiclesListResponse>('/vehicules', {
      page: 1,
      limit: 10,
      ...params
    });
  } catch {
    return {
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        total_pages: 0,
        has_next: false,
        has_prev: false
      }
    } as VehiclesListResponse;
  }
}

export async function fetchVehicleById(id: string) {
  return await fetchApi<Vehicle>(`/vehicules/${id}`);
}

export async function createAdminVehicle(payload: FormData) {
  return await fetchBrowserApi<{message: string; vehicule: Vehicle}>(
    '/vehicules',
    {
      method: 'POST',
      body: payload
    }
  );
}

export async function updateAdminVehicle(id: string, payload: FormData) {
  return await fetchBrowserApi<{message: string; vehicule: Vehicle}>(
    `/vehicules/${id}`,
    {
      method: 'PATCH',
      body: payload
    }
  );
}

export async function deleteAdminVehicle(id: string) {
  return await fetchBrowserApi<{message: string}>(`/vehicules/${id}`, {
    method: 'DELETE'
  });
}

export async function searchVehicles(params: {
  id_agence_depart: string;
  date_dep: string;
  date_ret: string;
  heure_dep?: string;
  heure_ret?: string;
  id_client_entreprise_beneficiaire?: string;
}) {
  return await fetchApi<Vehicle[]>('/vehicules/search', {
    heure_dep: params.heure_dep ?? '10:00',
    heure_ret: params.heure_ret ?? '09:00',
    ...params
  });
}

export async function fetchReservationPrefill(token?: string | null) {
  return await fetchBrowserApi<ReservationPrefillResponse>(
    '/reservations/prefill',
    {
      headers: token ? {Authorization: `Bearer ${token}`} : undefined
    }
  );
}

export async function createReservationCart(
  payload: CreateCartPayload,
  options?: {token?: string | null; sessionId?: string | null}
) {
  return await fetchBrowserApi<CreateCartResponse>('/reservations', {
    method: 'POST',
    headers: options?.token
      ? {Authorization: `Bearer ${options.token}`}
      : undefined,
    sessionId: options?.sessionId || undefined,
    body: JSON.stringify(payload)
  });
}

export async function fetchTarifications() {
  return await fetchApi<Tarification[]>('/tarifications');
}

export async function updateReservationCart(
  reservationId: string,
  payload: UpdateReservationPayload,
  options?: {token?: string | null; sessionId?: string | null}
) {
  return await fetchBrowserApi<UpdateReservationResponse>(
    `/reservations/${reservationId}`,
    {
      method: 'PATCH',
      headers: options?.token
        ? {Authorization: `Bearer ${options.token}`}
        : undefined,
      sessionId: options?.sessionId || undefined,
      body: JSON.stringify(payload)
    }
  );
}

export async function getReservationQuote(
  payload: QuotePayload,
  options?: {token?: string | null; sessionId?: string | null}
) {
  return await fetchBrowserApi<QuoteResponse>('/reservations/quote', {
    method: 'POST',
    headers: options?.token
      ? {Authorization: `Bearer ${options.token}`}
      : undefined,
    sessionId: options?.sessionId || undefined,
    body: JSON.stringify(payload)
  });
}

export async function fetchAssurances() {
  return await fetchApi<any[]>('/assurances');
}

export async function fetchOptions() {
  return await fetchApi<any[]>('/options');
}

export async function finalizeReservationCart(
  reservationId: string,
  options?: {token?: string | null; sessionId?: string | null}
) {
  return await fetchBrowserApi<FinalizeCartResponse>(
    `/reservations/${reservationId}/finalize`,
    {
      method: 'POST',
      headers: options?.token
        ? {Authorization: `Bearer ${options.token}`}
        : undefined,
      sessionId: options?.sessionId || undefined
    }
  );
}

export async function fetchCollaborateurContext(token: string) {
  return await fetchBrowserApi<B2BContextResponse>('/collaborateurs/me/context', {
    headers: {Authorization: `Bearer ${token}`}
  });
}

export async function fetchCollaborateurEntreprises(token: string) {
  return await fetchBrowserApi<B2BContextResponse['memberships']>(
    '/collaborateurs/me/entreprises',
    {
      headers: {Authorization: `Bearer ${token}`}
    }
  );
}

export async function getB2BQuote(
  payload: B2BQuotePayload,
  token: string
) {
  return await fetchBrowserApi<B2BQuoteResponse>('/b2b-reservations/quote', {
    method: 'POST',
    headers: {Authorization: `Bearer ${token}`},
    body: JSON.stringify(payload)
  });
}

export async function createB2BReservation(
  payload: CreateB2BReservationPayload,
  token: string
) {
  return await fetchBrowserApi('/b2b-reservations', {
    method: 'POST',
    headers: {Authorization: `Bearer ${token}`},
    body: JSON.stringify(payload)
  });
}

export async function fetchB2BReservations(
  token: string,
  params?: Record<string, string | number | undefined | null>
) {
  return await fetchBrowserApi<B2BReservationsResponse>(
    `/b2b-reservations${buildQuery(params)}`,
    {
      headers: {Authorization: `Bearer ${token}`}
    }
  );
}

export async function fetchB2BValidations(
  token: string,
  params?: Record<string, string | number | undefined | null>
) {
  return await fetchBrowserApi<B2BValidationsResponse>(
    `/b2b-validations${buildQuery(params)}`,
    {
      headers: {Authorization: `Bearer ${token}`}
    }
  );
}

export async function fetchB2BCentresCout(
  entrepriseId: string,
  token: string
) {
  return await fetchBrowserApi<B2BCentreCout[]>(
    `/entreprises/${entrepriseId}/centres-cout`,
    {
      headers: {Authorization: `Bearer ${token}`}
    }
  );
}

export async function fetchB2BProfilsBeneficiaires(
  entrepriseId: string,
  token: string
) {
  return await fetchBrowserApi<B2BProfilBeneficiaire[]>(
    `/entreprises/${entrepriseId}/profils-beneficiaires`,
    {
      headers: {Authorization: `Bearer ${token}`}
    }
  );
}

export async function fetchB2BCollaborateurs(
  entrepriseId: string,
  token: string
) {
  return await fetchBrowserApi<B2BCollaborateur[]>(
    `/entreprises/${entrepriseId}/collaborateurs`,
    {
      headers: {Authorization: `Bearer ${token}`}
    }
  );
}

// =========================
// Compat legacy B2B names
// =========================

export async function fetchEntrepriseCollaborateurs(
  entrepriseId: string,
  token: string
) {
  return await fetchB2BCollaborateurs(entrepriseId, token);
}

export async function getB2bQuote(
  payload: B2BQuotePayload,
  token: string
) {
  return await getB2BQuote(payload, token);
}

export async function createB2bReservation(
  payload: CreateB2BReservationPayload,
  token: string
) {
  return await createB2BReservation(payload, token);
}

export async function fetchMyB2bReservations(token: string) {
  return await fetchBrowserApi<B2BReservationsResponse>('/b2b-reservations/me', {
    headers: {Authorization: `Bearer ${token}`}
  });
}

export async function fetchMyPendingValidations(token: string) {
  return await fetchBrowserApi<B2BValidationsResponse>('/b2b-validations/me', {
    headers: {Authorization: `Bearer ${token}`}
  });
}

export async function approveB2bValidation(
  id: string,
  token: string,
  commentaire?: string
) {
  return await fetchBrowserApi(`/b2b-validations/${id}/approve`, {
    method: 'POST',
    headers: {Authorization: `Bearer ${token}`},
    body: JSON.stringify(
      commentaire && commentaire.trim() ? {commentaire} : {}
    )
  });
}

export async function rejectB2bValidation(
  id: string,
  token: string,
  commentaire?: string
) {
  return await fetchBrowserApi(`/b2b-validations/${id}/reject`, {
    method: 'POST',
    headers: {Authorization: `Bearer ${token}`},
    body: JSON.stringify(
      commentaire && commentaire.trim() ? {commentaire} : {}
    )
  });
}

export async function fetchAdminB2BCompanies() {
  return await fetchAdminApi<AdminB2BCompaniesListResponse>('/entreprises');
}

export async function createAdminB2BCompany(payload: {
  raison_sociale: string;
  slug: string;
  email_contact?: string;
  tel_contact?: string;
  statut?: string;
  mode_validation_defaut?: string;
  devise?: string;
}) {
  return await fetchAdminApi<{message: string; entreprise: B2BEntreprise}>(
    '/entreprises',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

export async function updateAdminB2BCompany(
  id: string,
  payload: Partial<{
    raison_sociale: string;
    slug: string;
    email_contact?: string;
    tel_contact?: string;
    statut?: string;
    mode_validation_defaut?: string;
    devise?: string;
  }>
) {
  return await fetchAdminApi<{message: string; entreprise: B2BEntreprise}>(
    `/entreprises/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }
  );
}

export async function deleteAdminB2BCompany(id: string) {
  return await fetchAdminApi<{message: string; id_entreprise: string}>(
    `/entreprises/${id}`,
    {
      method: 'DELETE',
    }
  );
}

export async function fetchAdminB2BCentresCout(entrepriseId: string) {
  return await fetchAdminApi<B2BCentreCout[]>(
    `/entreprises/${entrepriseId}/centres-cout`
  );
}

export async function createAdminB2BCentreCout(
  entrepriseId: string,
  payload: {
    code: string;
    libelle: string;
    actif?: boolean;
  }
) {
  return await fetchAdminApi<{message: string; centre_cout: B2BCentreCout}>(
    `/entreprises/${entrepriseId}/centres-cout`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

export async function updateAdminB2BCentreCout(
  idCentreCout: string,
  payload: Partial<{
    code: string;
    libelle: string;
    actif?: boolean;
  }>
) {
  return await fetchAdminApi<{message: string; centre_cout: B2BCentreCout}>(
    `/centres-cout/${idCentreCout}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }
  );
}

export async function deleteAdminB2BCentreCout(idCentreCout: string) {
  return await fetchAdminApi<{message: string; id_centre_cout: string}>(
    `/centres-cout/${idCentreCout}`,
    {
      method: 'DELETE',
    }
  );
}

export async function fetchAdminB2BProfilsBeneficiaires(entrepriseId: string) {
  return await fetchAdminApi<B2BProfilBeneficiaire[]>(
    `/entreprises/${entrepriseId}/profils-beneficiaires`
  );
}

export async function fetchAdminB2BCollaborateurs(entrepriseId: string) {
  return await fetchAdminApi<B2BCollaborateur[]>(
    `/entreprises/${entrepriseId}/collaborateurs`
  );
}

export async function createAdminB2BCollaborateur(
  entrepriseId: string,
  payload: {
    nom: string;
    prenom: string;
    mail: string;
    password: string;
    pays?: string;
    prefixe_tel?: string;
    num_tel?: string;
    date_naissance?: string;
    language_favori?: string;
    id_centre_cout?: string;
    id_profil_beneficiaire?: string;
    role_entreprise: string;
    matricule?: string;
    validateur?: string;
    manager_id_client_entreprise?: string;
  }
) {
  return await fetchAdminApi<{message: string; collaborateur: B2BCollaborateur}>(
    `/entreprises/${entrepriseId}/collaborateurs`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

export async function updateAdminB2BCollaborateur(
  idClientEntreprise: string,
  payload: Partial<{
    nom: string;
    prenom: string;
    mail: string;
    password?: string;
    pays?: string;
    prefixe_tel?: string;
    num_tel?: string;
    date_naissance?: string;
    language_favori?: string;
    id_centre_cout?: string | null;
    id_profil_beneficiaire?: string | null;
    role_entreprise?: string;
    matricule?: string;
    validateur?: string;
    manager_id_client_entreprise?: string | null;
    actif?: boolean;
  }>
) {
  return await fetchAdminApi<{message: string; collaborateur: B2BCollaborateur}>(
    `/collaborateurs/${idClientEntreprise}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }
  );
}

export async function deleteAdminB2BCollaborateur(idClientEntreprise: string) {
  return await fetchAdminApi<{message: string; id_client_entreprise: string}>(
    `/collaborateurs/${idClientEntreprise}`,
    {
      method: 'DELETE',
    }
  );
}

export async function fetchAdminNews(
  params?: Record<string, string | number | undefined | null>
) {
  try {
    return await fetchApi<NewsListResponse>('/news', {
      page: 1,
      limit: 10,
      ...params
    });
  } catch {
    return {
      page: 1,
      limit: 10,
      total: 0,
      total_pages: 1,
      data: []
    } as NewsListResponse;
  }
}

export async function createAdminNews(payload: {
  id_agence: string;
  date_parution: string;
  titre: string;
  contenu: string;
}) {
  return await fetchAdminApi<{message: string; news: NewsItem}>('/news', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateAdminNews(
  id: string,
  payload: Partial<{
    id_agence: string;
    date_parution: string;
    titre: string;
    contenu: string;
  }>
) {
  return await fetchAdminApi<{message: string; news: NewsItem}>(`/news/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

export async function deleteAdminNews(id: string) {
  return await fetchAdminApi<{message: string; id_news: string}>(`/news/${id}`, {
    method: 'DELETE'
  });
}

export async function fetchAdminCoupons(
  params?: Record<string, string | number | undefined | null>
) {
  return await fetchAdminApi<AdminCouponsListResponse>(
    `/codes-promo${buildQuery({
      page: 1,
      limit: 10,
      ...params
    })}`
  );
}

export async function createAdminCoupon(payload: {
  code: string;
  type_promo: string;
  valeur_promo: number;
  status: string;
  date_fin_validite?: string;
  nb_max_utilisation?: number | null;
}) {
  return await fetchAdminApi<{message: string; coupon: AdminCoupon}>(
    '/codes-promo',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    }
  );
}

export async function updateAdminCoupon(
  id: string,
  payload: Partial<{
    code: string;
    type_promo: string;
    valeur_promo: number;
    status: string;
    date_fin_validite?: string;
    nb_max_utilisation?: number | null;
  }>
) {
  return await fetchAdminApi<{message: string; coupon: AdminCoupon}>(
    `/codes-promo/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }
  );
}

export async function deleteAdminCoupon(id: string) {
  return await fetchAdminApi<{message: string; id_coupon: string}>(
    `/codes-promo/${id}`,
    {
      method: 'DELETE'
    }
  );
}

export async function fetchAdminInsurances(
  params?: Record<string, string | number | undefined | null>
) {
  return await fetchAdminApi<AdminInsurancesListResponse>(
    `/assurances/admin/list${buildQuery({
      page: 1,
      limit: 10,
      ...params
    })}`
  );
}

export async function createAdminInsurance(payload: {
  nom: string;
  description?: string;
  qualificatif?: string;
  avantages?: string[];
  prix_jour: number;
}) {
  return await fetchAdminApi<{message: string; assurance: AdminInsurance}>(
    '/assurances',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    }
  );
}

export async function updateAdminInsurance(
  id: string,
  payload: Partial<{
    nom: string;
    description?: string;
    qualificatif?: string;
    avantages?: string[];
    prix_jour: number;
  }>
) {
  return await fetchAdminApi<{message: string; assurance: AdminInsurance}>(
    `/assurances/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }
  );
}

export async function deleteAdminInsurance(id: string) {
  return await fetchAdminApi<{message: string; id_assurance: string}>(
    `/assurances/${id}`,
    {
      method: 'DELETE'
    }
  );
}

export async function fetchAdminOptions(
  params?: Record<string, string | number | undefined | null>
) {
  return await fetchAdminApi<AdminOptionsListResponse>(
    `/options/admin/list${buildQuery({
      page: 1,
      limit: 10,
      ...params
    })}`
  );
}

export async function createAdminOption(payload: {
  nom: string;
  description?: string;
  prix_jour: number;
}) {
  return await fetchAdminApi<{message: string; option: AdminOption}>(
    '/options',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    }
  );
}

export async function updateAdminOption(
  id: string,
  payload: Partial<{
    nom: string;
    description?: string;
    prix_jour: number;
  }>
) {
  return await fetchAdminApi<{message: string; option: AdminOption}>(
    `/options/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }
  );
}

export async function deleteAdminOption(id: string) {
  return await fetchAdminApi<{message: string; id_option: string}>(
    `/options/${id}`,
    {
      method: 'DELETE'
    }
  );
}

export async function fetchAdminPricing(
  params?: Record<string, string | number | undefined | null>
) {
  return await fetchAdminApi<AdminPricingListResponse>(
    `/tarifications/admin/list${buildQuery({
      page: 1,
      limit: 10,
      ...params
    })}`
  );
}

export async function createAdminPricing(payload: {
  nom: string;
  description?: string;
  qualificatif?: string;
  avantages?: string[];
  discount_rate: number;
}) {
  return await fetchAdminApi<{message: string; tarification: AdminPricing}>(
    '/tarifications',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    }
  );
}

export async function updateAdminPricing(
  id: string,
  payload: Partial<{
    nom: string;
    description?: string;
    qualificatif?: string;
    avantages?: string[];
    discount_rate: number;
  }>
) {
  return await fetchAdminApi<{message: string; tarification: AdminPricing}>(
    `/tarifications/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }
  );
}

export async function deleteAdminPricing(id: string) {
  return await fetchAdminApi<{message: string; id_tarification: string}>(
    `/tarifications/${id}`,
    {
      method: 'DELETE'
    }
  );
}

export async function createAdminB2BProfilBeneficiaire(
  entrepriseId: string,
  payload: {
    code: string;
    libelle: string;
    description?: string;
    validation_requise?: boolean;
    budget_plafond_mensuel?: number;
    nb_jours_mois?: number;
    nb_reservations_simultanees?: number;
    avec_chauffeur_autorise?: boolean;
    sans_chauffeur_autorise?: boolean;
    liste_type_autorise?: string[];
    actif?: boolean;
  }
) {
  return await fetchAdminApi<{message: string; profil_beneficiaire: B2BProfilBeneficiaire}>(
    `/entreprises/${entrepriseId}/profils-beneficiaires`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

export async function updateAdminB2BProfilBeneficiaire(
  idProfilBeneficiaire: string,
  payload: Partial<{
    code: string;
    libelle: string;
    description?: string | null;
    validation_requise?: boolean;
    budget_plafond_mensuel?: number | null;
    nb_jours_mois?: number | null;
    nb_reservations_simultanees?: number | null;
    avec_chauffeur_autorise?: boolean;
    sans_chauffeur_autorise?: boolean;
    liste_type_autorise?: string[];
    actif?: boolean;
  }>
) {
  return await fetchAdminApi<{message: string; profil_beneficiaire: B2BProfilBeneficiaire}>(
    `/profils-beneficiaires/${idProfilBeneficiaire}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }
  );
}

export async function deleteAdminB2BProfilBeneficiaire(idProfilBeneficiaire: string) {
  return await fetchAdminApi<{message: string; id_profil_beneficiaire: string}>(
    `/profils-beneficiaires/${idProfilBeneficiaire}`,
    {
      method: 'DELETE',
    }
  );
}

export async function fetchAdminB2BReservations(
  params?: Record<string, string | number | undefined | null>
) {
  return await fetchAdminApi<AdminB2BReservationsListResponse>(
    `/admin/b2b-reservations${buildQuery(params)}`
  );
}

export async function adminStartB2BReservation(id: string) {
  return await fetchAdminApi<{message: string; reservation: AdminB2BReservation}>(
    `/admin/b2b-reservations/${id}/start`,
    {
      method: 'POST',
    }
  );
}

export async function adminCompleteB2BReservation(id: string) {
  return await fetchAdminApi<{message: string; reservation: AdminB2BReservation}>(
    `/admin/b2b-reservations/${id}/complete`,
    {
      method: 'POST',
    }
  );
}

export async function adminCancelB2BReservation(id: string) {
  return await fetchAdminApi<{message: string; reservation: AdminB2BReservation}>(
    `/admin/b2b-reservations/${id}/cancel`,
    {
      method: 'POST',
    }
  );
}