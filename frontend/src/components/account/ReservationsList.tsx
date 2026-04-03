'use client';

import Link from 'next/link';
import {useEffect, useMemo, useState} from 'react';
import {useTranslations} from 'next-intl';
import {fetchBrowserApi} from '@/lib/api';
import {readAccessToken} from '@/lib/session';
import type {ReservationsMineResponse} from '@/lib/types';

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

function getVehicleName(
  reservation: ReservationsMineResponse['data'][number]
) {
  const vehicle = reservation.vehicules;

  if (!vehicle) return '—';

  return (
    vehicle.nom ||
    [vehicle.marque, vehicle.model].filter(Boolean).join(' ') ||
    vehicle.categorie ||
    '—'
  );
}

function isAbandonedReservation(status: string | null) {
  if (!status) return false;

  const normalized = status
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();

  return normalized.includes('ABANDON');
}

export default function ReservationsList({locale}: {locale: string}) {
  const t = useTranslations('ReservationsPage');
  const [data, setData] = useState<ReservationsMineResponse['data']>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = readAccessToken();

    if (!token) {
      setLoading(false);
      return;
    }

    fetchBrowserApi<ReservationsMineResponse>('/reservations/me', {
      headers: {Authorization: `Bearer ${token}`}
    })
      .then((response) => setData(response.data || []))
      .catch((err) => setError(err instanceof Error ? err.message : t('genericError')))
      .finally(() => setLoading(false));
  }, [t]);

  const visibleReservations = useMemo(
    () => data.filter((reservation) => !isAbandonedReservation(reservation.status)),
    [data]
  );

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
        <h1 className="text-3xl font-semibold text-white">{t('title')}</h1>
      </div>

      {loading ? <p className="text-sm text-white/60">{t('loading')}</p> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <div className="grid gap-4">
        {visibleReservations.map((reservation) => (
          <Link
            key={reservation.id_reservation}
            href={`/${locale}/gestion-reservation?id=${reservation.id_reservation}`}
            className="rounded-[24px] border border-white/10 bg-white/5 p-5 transition hover:border-gold/40"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.3em] text-gold">
                  {reservation.status || '—'}
                </p>

                <h2 className="mt-2 text-lg font-semibold text-white">
                  {reservation.id_reservation}
                </h2>

                <div className="mt-4 grid gap-2 text-sm text-white/70 sm:grid-cols-2">
                  <p>
                    <span className="text-white/90">{t('vehicleLabel')}:</span>{' '}
                    {getVehicleName(reservation)}
                  </p>

                  <p>
                    <span className="text-white/90">{t('amountLabel')}:</span>{' '}
                    {reservation.devise || 'MAD'} {reservation.prix_final ?? '—'}
                  </p>

                  <p>
                    <span className="text-white/90">{t('pickupDateLabel')}:</span>{' '}
                    {formatDate(reservation.date_dep, locale)}
                  </p>

                  <p>
                    <span className="text-white/90">{t('returnDateLabel')}:</span>{' '}
                    {formatDate(reservation.date_ret, locale)}
                  </p>
                </div>

                <p className="mt-3 text-sm text-white/65">
                  <span className="text-white/90">{t('periodLabel')}:</span>{' '}
                  {formatDate(reservation.date_dep, locale)} —{' '}
                  {formatDate(reservation.date_ret, locale)}
                </p>
              </div>
            </div>
          </Link>
        ))}

        {!visibleReservations.length && !loading ? (
          <div className="rounded-[24px] border border-dashed border-white/15 bg-white/5 p-8 text-center text-white/60">
            {t('empty')}
          </div>
        ) : null}
      </div>
    </section>
  );
}