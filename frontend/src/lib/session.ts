import type {ClientProfile} from '@/lib/types';

const TOKEN_KEY = 'hire_access_token';
const CLIENT_KEY = 'hire_client';
const CART_SESSION_KEY = 'hire_cart_session_id';
const CART_RESERVATION_KEY = 'hire_cart_reservation_id';
const SESSION_EVENT = 'hire-session-changed';

function notifySessionChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function saveSession(accessToken: string, client: ClientProfile) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOKEN_KEY, accessToken);
  window.localStorage.setItem(CLIENT_KEY, JSON.stringify(client));
  notifySessionChanged();
}

export function readAccessToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function readStoredClient() {
  if (typeof window === 'undefined') return null;
  const value = window.localStorage.getItem(CLIENT_KEY);
  if (!value) return null;

  try {
    return JSON.parse(value) as ClientProfile;
  } catch {
    return null;
  }
}

export function saveCartSession(
  sessionId: string,
  reservationId?: string | null
) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CART_SESSION_KEY, sessionId);
  if (reservationId) {
    window.localStorage.setItem(CART_RESERVATION_KEY, reservationId);
  }
}

export function readCartSession() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(CART_SESSION_KEY);
}

export function readCartReservationId() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(CART_RESERVATION_KEY);
}

export function clearCartSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(CART_SESSION_KEY);
  window.localStorage.removeItem(CART_RESERVATION_KEY);
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(CLIENT_KEY);
  notifySessionChanged();
}

export function subscribeToSessionChange(callback: () => void) {
  if (typeof window === 'undefined') return () => {};

  const handler = () => callback();

  window.addEventListener('storage', handler);
  window.addEventListener(SESSION_EVENT, handler);

  return () => {
    window.removeEventListener('storage', handler);
    window.removeEventListener(SESSION_EVENT, handler);
  };
}