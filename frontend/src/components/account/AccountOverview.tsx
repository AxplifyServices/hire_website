'use client';

import Link from 'next/link';
import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import {fetchBrowserApi, getApiBaseUrl} from '@/lib/api';
import {clearSession, readAccessToken, readStoredClient} from '@/lib/session';
import type {ClientProfile, ReservationsMineResponse} from '@/lib/types';

function isAbandonedReservation(status: string | null) {
  if (!status) return false;

  const normalized = status
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();

  return normalized.includes('ABANDON');
}

function formatDate(value: string | null, locale: string) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

function getVehicleName(reservation: ReservationsMineResponse['data'][number]) {
  const vehicle = (reservation as any).vehicules;

  if (!vehicle) return '—';

  return (
    vehicle.nom ||
    [vehicle.marque, vehicle.model].filter(Boolean).join(' ') ||
    vehicle.categorie ||
    '—'
  );
}

export default function AccountOverview({locale}: {locale: string}) {
  const t = useTranslations('AccountPage');
  const [client, setClient] = useState<ClientProfile | null>(readStoredClient());
  const [reservations, setReservations] = useState<ReservationsMineResponse['data']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const visibleReservations = reservations.filter(
    (reservation) => !isAbandonedReservation(reservation.status)
  );

  useEffect(() => {
    const token = readAccessToken();

    if (!token) {
      setLoading(false);
      return;
    }

    Promise.all([
      fetchBrowserApi<ClientProfile>('/auth/me', {
        headers: {Authorization: `Bearer ${token}`}
      }),
      fetchBrowserApi<ReservationsMineResponse>('/reservations/me', {
        headers: {Authorization: `Bearer ${token}`}
      })
    ])
      .then(([profile, mine]) => {
        setClient(profile);
        setReservations(mine.data || []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : t('genericError')))
      .finally(() => setLoading(false));
  }, [t]);

  async function handleDeleteAccount() {
    const token = readAccessToken();

    if (!token) {
      setError(t('loginRequired'));
      setShowDeleteConfirm(false);
      return;
    }

    try {
      setDeletingAccount(true);
      setError('');

      const response = await fetch(`${getApiBaseUrl()}/auth/me`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        let message = t('genericError');

        try {
          const payload = await response.json();
          message = payload.message || payload.error || message;
        } catch {
          // ignore
        }

        throw new Error(message);
      }

      clearSession();
      window.location.href = `/${locale}/connexion`;
    } catch (err) {
      setError(err instanceof Error ? err.message : t('genericError'));
    } finally {
      setDeletingAccount(false);
      setShowDeleteConfirm(false);
    }
  }

  if (!readAccessToken()) {
    return (
      <div className="rounded-[28px] border border-dashed border-white/15 bg-white/5 p-8 text-center">
        <h1 className="text-2xl font-semibold text-white">{t('title')}</h1>
        <p className="mt-3 text-sm leading-7 text-white/65">{t('loginRequired')}</p>
        <Link
          href={`/${locale}/connexion`}
          className="mt-6 inline-flex rounded-full bg-gold px-5 py-3 text-sm font-semibold text-brand-950"
        >
          {t('goToLogin')}
        </Link>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">{t('title')}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-full border border-red-400/30 px-4 py-2 text-sm text-red-200 transition hover:border-red-300 hover:bg-red-500/10 hover:text-white"
            >
              {t('deleteAccount')}
            </button>

            <button
              type="button"
              onClick={() => {
                clearSession();
                window.location.href = `/${locale}/connexion`;
              }}
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/75 transition hover:border-gold hover:text-white"
            >
              {t('logout')}
            </button>
          </div>
        </div>
      </div>

      {loading ? <p className="text-sm text-white/60">{t('loading')}</p> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      {client ? (
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold text-white">{t('profile')}</h2>

            <div className="mt-4 space-y-2 text-sm text-white/70">
              <p>
                <span className="text-white">{t('fullName')}:</span>{' '}
                {[client.prenom, client.nom].filter(Boolean).join(' ') || '—'}
              </p>
              <p>
                <span className="text-white">{t('email')}:</span> {client.mail || '—'}
              </p>
              <p>
                <span className="text-white">{t('country')}:</span> {client.pays || '—'}
              </p>
              <p>
                <span className="text-white">{t('phone')}:</span>{' '}
                {[client.prefixe_tel, client.num_tel].filter(Boolean).join(' ') || '—'}
              </p>
            </div>

            <div className="mt-5">
              <Link
                href={`/${locale}/b2b`}
                className="inline-flex rounded-full border border-gold/40 px-4 py-2 text-sm font-semibold text-gold transition hover:bg-gold hover:text-brand-950"
              >
                {t('openB2B')}
              </Link>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-white">{t('reservations')}</h2>
              <Link
                href={`/${locale}/compte/reservations`}
                className="text-sm text-gold hover:text-gold-light"
              >
                {t('seeAll')}
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {visibleReservations.slice(0, 3).map((reservation) => (
                <Link
                  key={reservation.id_reservation}
                  href={`/${locale}/gestion-reservation?id=${reservation.id_reservation}`}
                  className="block rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-white/70"
                >
                  <p className="font-medium text-white">{reservation.id_reservation}</p>

                  <p className="mt-1">
                    {reservation.status || '—'} · {reservation.devise || 'MAD'}{' '}
                    {reservation.prix_final ?? '—'}
                  </p>

                  <p className="mt-1 text-white/60">{getVehicleName(reservation)}</p>

                  <p className="mt-1 text-white/50">
                    {formatDate(reservation.date_dep, locale)} —{' '}
                    {formatDate(reservation.date_ret, locale)}
                  </p>
                </Link>
              ))}

              {!visibleReservations.length && !loading ? (
                <p className="text-sm text-white/55">{t('empty')}</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {showDeleteConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-[24px] border border-white/10 bg-[#111318] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
            <h2 className="text-xl font-semibold text-white">{t('deleteAccountTitle')}</h2>
            <p className="mt-3 text-sm leading-7 text-white/65">
              {t('deleteAccountMessage')}
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  if (!deletingAccount) {
                    setShowDeleteConfirm(false);
                  }
                }}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/75 transition hover:border-white/20 hover:text-white"
                disabled={deletingAccount}
              >
                {t('cancel')}
              </button>

              <button
                type="button"
                onClick={handleDeleteAccount}
                className="rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:border-red-300 hover:bg-red-500/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={deletingAccount}
              >
                {deletingAccount ? t('deleteAccountLoading') : t('deleteAccountConfirm')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}