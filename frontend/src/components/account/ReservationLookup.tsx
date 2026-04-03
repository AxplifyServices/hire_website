'use client';

import Image from 'next/image';
import {useEffect, useMemo, useState} from 'react';
import {useSearchParams} from 'next/navigation';
import {useTranslations} from 'next-intl';
import {fetchBrowserApi} from '@/lib/api';
import {readAccessToken} from '@/lib/session';

type ReservationDetails = {
  id_reservation?: string;
  date_dep?: string | null;
  date_ret?: string | null;
  heure_dep?: string | null;
  heure_ret?: string | null;
  status?: string | null;
  devise?: string | null;
  prix_initial?: string | number | null;
  prix_final?: string | number | null;
  nb_jour?: number | null;
  date_creation?: string | null;
  payment_status?: string | null;
  source_reservation?: string | null;
  etape_panier?: string | null;
  is_abandoned?: boolean | null;

  nom_snapshot?: string | null;
  prenom_snapshot?: string | null;
  mail_snapshot?: string | null;
  prefixe_tel_snapshot?: string | null;
  num_tel_snapshot?: string | null;

  vehicules?: {
    nom?: string | null;
    categorie?: string | null;
    transmission?: string | null;
    carburant?: string | null;
    nb_place?: number | null;
    nb_porte?: number | null;
    climatisation?: boolean | null;
    model?: string | null;
    marque?: string | null;
    url_image_vehicule?: string | null;
    description?: string | null;
  } | null;

  assurances?: {
    nom?: string | null;
    qualificatif?: string | null;
    prix_jour?: string | number | null;
  } | null;

  tarifications?: {
    nom?: string | null;
    qualificatif?: string | null;
  } | null;

  politiques_age?: {
    nom?: string | null;
    qualificatif?: string | null;
    prix_jour?: string | number | null;
  } | null;

  agences_reservations_id_lieu_depToagences?: {
    nom?: string | null;
    ville?: string | null;
    adresse?: string | null;
    disponibilite_agence?: string | null;
    categorie?: string | null;
  } | null;

  agences_reservations_id_lieu_retToagences?: {
    nom?: string | null;
    ville?: string | null;
    adresse?: string | null;
    disponibilite_agence?: string | null;
    categorie?: string | null;
  } | null;
};

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

function formatTime(value: string | null | undefined, locale: string) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function formatAmount(value: string | number | null | undefined, currency: string, locale: string) {
  if (value === null || value === undefined || value === '') return '—';

  const numeric = Number(value);
  if (Number.isNaN(numeric)) return `${value} ${currency}`;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(numeric);
}

function normalizeStatus(value: string | null | undefined) {
  if (!value) return '—';
  return value.replaceAll('_', ' ');
}

function getStatusClasses(status: string | null | undefined) {
  const normalized = (status || '').toUpperCase();

  if (normalized.includes('CONFIRM')) {
    return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200';
  }

  if (normalized.includes('ATTENTE') || normalized.includes('PENDING')) {
    return 'border-amber-400/30 bg-amber-500/10 text-amber-200';
  }

  if (normalized.includes('ANNU') || normalized.includes('ABANDON')) {
    return 'border-red-400/30 bg-red-500/10 text-red-200';
  }

  return 'border-white/15 bg-white/10 text-white/80';
}

function getPaymentLabel(value: string | null | undefined) {
  if (!value) return '—';
  return value.replaceAll('_', ' ');
}

function getVehicleTitle(reservation: ReservationDetails) {
  const vehicle = reservation.vehicules;

  if (!vehicle) return '—';

  return (
    vehicle.nom ||
    [vehicle.marque, vehicle.model].filter(Boolean).join(' ') ||
    vehicle.categorie ||
    '—'
  );
}

function getCustomerFullName(reservation: ReservationDetails) {
  return [reservation.prenom_snapshot, reservation.nom_snapshot].filter(Boolean).join(' ') || '—';
}

function DetailItem({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-[10px] uppercase tracking-[0.08em] text-white/35">{label}</p>
      <p className="mt-2 text-sm text-white/85">{value}</p>
    </div>
  );
}

export default function ReservationLookup({locale}: {locale: string}) {
  const t = useTranslations('ReservationLookupPage');
  const searchParams = useSearchParams();

  const [id, setId] = useState(searchParams.get('id') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ReservationDetails | null>(null);

  async function handleLookup(reservationId?: string) {
    const finalId = (reservationId ?? id).trim();

    if (!finalId) return;

    setLoading(true);
    setError('');

    try {
      const token = readAccessToken();

      const reservation = await fetchBrowserApi<ReservationDetails>(
        `/reservations/${finalId}`,
        {
          headers: token ? {Authorization: `Bearer ${token}`} : undefined
        }
      );

      setResult(reservation);
      setId(finalId);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : t('genericError'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const reservationIdFromUrl = searchParams.get('id') || '';

    if (reservationIdFromUrl) {
      setId(reservationIdFromUrl);
      handleLookup(reservationIdFromUrl);
    }
  }, [searchParams]);

  const currency = result?.devise || 'MAD';

  const vehicleTitle = useMemo(() => getVehicleTitle(result || {}), [result]);

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <h1 className="text-3xl font-semibold text-white">{t('title')}</h1>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <label className="block text-sm text-white/75">
            <span className="mb-2 block">{t('reservationId')}</span>
            <input
              value={id}
              onChange={(event) => setId(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-gold"
              placeholder={t('reservationIdPlaceholder')}
            />
          </label>

          <button
            type="button"
            onClick={() => handleLookup()}
            disabled={!id.trim() || loading}
            className={`h-[52px] rounded-2xl px-6 text-sm font-semibold transition ${
              id.trim() && !loading
                ? 'bg-gold text-brand-950 hover:brightness-105'
                : 'cursor-not-allowed bg-white/10 text-white/40'
            }`}
          >
            {loading ? t('loading') : t('submit')}
          </button>
        </div>

        {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      </div>

      {result ? (
        <div className="space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] ${getStatusClasses(
                      result.status
                    )}`}
                  >
                    {normalizeStatus(result.status)}
                  </span>

                  {result.payment_status ? (
                    <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-white/75">
                      {t('paymentStatus')}: {getPaymentLabel(result.payment_status)}
                    </span>
                  ) : null}
                </div>

                <h2 className="mt-4 text-2xl font-semibold text-white">
                  {result.id_reservation || '—'}
                </h2>

                <p className="mt-2 text-sm text-white/65">
                  {t('createdOn')}: {formatDate(result.date_creation, locale)}
                </p>
              </div>

              <div className="grid min-w-[260px] gap-3 sm:grid-cols-2 lg:w-[360px] lg:grid-cols-1">
                <div className="rounded-2xl border border-gold/20 bg-gold/10 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-gold/80">
                    {t('finalAmount')}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {formatAmount(result.prix_final, currency, locale)}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/40">
                    {t('duration')}
                  </p>
                  <p className="mt-2 text-base text-white/85">
                    {result.nb_jour ?? '—'} {t('days')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/5">
                <div className="grid gap-0 md:grid-cols-[300px_1fr]">
                  <div className="relative min-h-[240px] bg-black/20">
                    {result.vehicules?.url_image_vehicule ? (
                      <Image
                        src={result.vehicules.url_image_vehicule}
                        alt={vehicleTitle}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 300px"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-white/40">
                        {t('noImage')}
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <p className="text-xs uppercase tracking-[0.28em] text-gold">
                      {t('vehicleSection')}
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold text-white">{vehicleTitle}</h3>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <DetailItem
                        label={t('category')}
                        value={result.vehicules?.categorie || '—'}
                      />
                      <DetailItem
                        label={t('transmission')}
                        value={result.vehicules?.transmission || '—'}
                      />
                      <DetailItem
                        label={t('fuel')}
                        value={result.vehicules?.carburant || '—'}
                      />
                      <DetailItem
                        label={t('airConditioning')}
                        value={
                          result.vehicules?.climatisation ? t('yes') : t('no')
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                <p className="text-xs uppercase tracking-[0.28em] text-gold">
                  {t('rentalSection')}
                </p>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <DetailItem
                    label={t('pickupDate')}
                    value={formatDate(result.date_dep, locale)}
                  />
                  <DetailItem
                    label={t('pickupTime')}
                    value={formatTime(result.heure_dep, locale)}
                  />
                  <DetailItem
                    label={t('returnDate')}
                    value={formatDate(result.date_ret, locale)}
                  />
                  <DetailItem
                    label={t('returnTime')}
                    value={formatTime(result.heure_ret, locale)}
                  />
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                <p className="text-xs uppercase tracking-[0.28em] text-gold">
                  {t('agenciesSection')}
                </p>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <p className="text-sm font-semibold text-white">{t('pickupAgency')}</p>
                    <p className="mt-3 text-base text-white/90">
                      {result.agences_reservations_id_lieu_depToagences?.nom || '—'}
                    </p>
                    <p className="mt-2 text-sm text-white/60">
                      {result.agences_reservations_id_lieu_depToagences?.ville || '—'}
                    </p>
                    <p className="mt-2 text-sm text-white/60">
                      {result.agences_reservations_id_lieu_depToagences?.adresse || '—'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <p className="text-sm font-semibold text-white">{t('returnAgency')}</p>
                    <p className="mt-3 text-base text-white/90">
                      {result.agences_reservations_id_lieu_retToagences?.nom || '—'}
                    </p>
                    <p className="mt-2 text-sm text-white/60">
                      {result.agences_reservations_id_lieu_retToagences?.ville || '—'}
                    </p>
                    <p className="mt-2 text-sm text-white/60">
                      {result.agences_reservations_id_lieu_retToagences?.adresse || '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                <p className="text-xs uppercase tracking-[0.28em] text-gold">
                  {t('priceSection')}
                </p>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <span className="text-sm text-white/65">{t('initialAmount')}</span>
                    <span className="text-sm font-medium text-white">
                      {formatAmount(result.prix_initial, currency, locale)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-gold/20 bg-gold/10 px-4 py-3">
                    <span className="text-sm text-gold/85">{t('finalAmount')}</span>
                    <span className="text-base font-semibold text-white">
                      {formatAmount(result.prix_final, currency, locale)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <span className="text-sm text-white/65">{t('insurance')}</span>
                    <span className="text-sm text-white">
                      {result.assurances?.nom || '—'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <span className="text-sm text-white/65">{t('pricingPlan')}</span>
                    <span className="text-sm text-white">
                      {result.tarifications?.nom || '—'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <span className="text-sm text-white/65">{t('driverPolicy')}</span>
                    <span className="text-sm text-white">
                      {result.politiques_age?.nom || '—'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                <p className="text-xs uppercase tracking-[0.28em] text-gold">
                  {t('customerSection')}
                </p>

                <div className="mt-5 space-y-3">
                  <DetailItem label={t('fullName')} value={getCustomerFullName(result)} />
                  <DetailItem label={t('email')} value={result.mail_snapshot || '—'} />
                  <DetailItem
                    label={t('phone')}
                    value={
                      [result.prefixe_tel_snapshot, result.num_tel_snapshot]
                        .filter(Boolean)
                        .join(' ') || '—'
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}