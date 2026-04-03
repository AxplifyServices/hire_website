import type {
  Agency,
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
  FinalizeCartResponse
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