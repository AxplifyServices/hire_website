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

  if (!headers.has('Content-Type') && init?.body) {
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

export async function fetchAgencies() {
  try {
    return await fetchApi<Agency[]>('/agences');
  } catch {
    return [] as Agency[];
  }
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

export async function searchVehicles(params: {
  id_agence_depart: string;
  date_dep: string;
  date_ret: string;
  heure_dep?: string;
  heure_ret?: string;
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

export async function fetchEntrepriseCentresCout(
  idEntreprise: string,
  token: string
) {
  return await fetchBrowserApi<B2BCentreCout[]>(
    `/entreprises/${idEntreprise}/centres-cout`,
    {
      headers: {Authorization: `Bearer ${token}`}
    }
  );
}

export async function fetchEntrepriseProfilsBeneficiaires(
  idEntreprise: string,
  token: string
) {
  return await fetchBrowserApi<B2BProfilBeneficiaire[]>(
    `/entreprises/${idEntreprise}/profils-beneficiaires`,
    {
      headers: {Authorization: `Bearer ${token}`}
    }
  );
}

export async function fetchEntrepriseCollaborateurs(
  idEntreprise: string,
  token: string
) {
  return await fetchBrowserApi<B2BCollaborateur[]>(
    `/entreprises/${idEntreprise}/collaborateurs`,
    {
      headers: {Authorization: `Bearer ${token}`}
    }
  );
}

export async function getB2bQuote(payload: B2BQuotePayload, token: string) {
  return await fetchBrowserApi<B2BQuoteResponse>('/b2b-reservations/quote', {
    method: 'POST',
    headers: {Authorization: `Bearer ${token}`},
    body: JSON.stringify(payload)
  });
}

export async function createB2bReservation(
  payload: CreateB2BReservationPayload,
  token: string
) {
  return await fetchBrowserApi<{
    message: string;
    reservation: any;
    validation?: any;
  }>('/b2b-reservations', {
    method: 'POST',
    headers: {Authorization: `Bearer ${token}`},
    body: JSON.stringify(payload)
  });
}

export async function fetchMyB2bReservations(
  token: string,
  params?: {
    statut_reservation?: string;
    statut_validation?: string;
    id_entreprise?: string;
    sort_date_creation?: 'asc' | 'desc';
  }
) {
  const response = await fetch(buildApiUrl('/b2b-reservations/me', params), {
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return parseResponse<B2BReservationsResponse>(response);
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
  return await fetchBrowserApi<{message: string}>(`/b2b-validations/${id}/approve`, {
    method: 'POST',
    headers: {Authorization: `Bearer ${token}`},
    body: JSON.stringify({
      commentaire: commentaire || ''
    })
  });
}

export async function rejectB2bValidation(
  id: string,
  token: string,
  commentaire?: string
) {
  return await fetchBrowserApi<{message: string}>(`/b2b-validations/${id}/reject`, {
    method: 'POST',
    headers: {Authorization: `Bearer ${token}`},
    body: JSON.stringify({
      commentaire: commentaire || ''
    })
  });
}