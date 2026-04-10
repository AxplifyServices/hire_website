'use client';

import Link from 'next/link';
import {useEffect, useMemo, useState, type ReactNode} from 'react';
import {useTranslations} from 'next-intl';

import {
  approveB2bValidation,
  fetchCollaborateurContext,
  fetchEntrepriseCollaborateurs,
  fetchMyB2bReservations,
  fetchMyPendingValidations,
  rejectB2bValidation
} from '@/lib/api';

import {readAccessToken} from '@/lib/session';

import type {
  B2BCollaborateur,
  B2BContextResponse,
  B2BReservationRecord,
  B2BReservationsResponse,
  B2BValidationRecord,
  B2BValidationsResponse
} from '@/lib/types';

import B2BReservationFlow from '@/components/b2b/B2BReservationFlow';

type TabKey = 'reserve' | 'reservations' | 'pending' | 'history';

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

function formatMoney(value: number | null | undefined, currency = 'MAD', locale = 'fr') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency
    }).format(Number(value));
  } catch {
    return `${value} ${currency}`;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function renderScalar(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '—';
}

function buildRoleEntrepriseLines(role: unknown, locale: string, currency = 'MAD'): string[] {
  if (role === null || role === undefined || role === '') return ['—'];

  if (typeof role === 'string' || typeof role === 'number' || typeof role === 'boolean') {
    return [String(role)];
  }

  if (Array.isArray(role)) {
    const lines = role.flatMap((item) => buildRoleEntrepriseLines(item, locale, currency));
    return lines.length ? lines : ['—'];
  }

  if (isPlainObject(role)) {
    const joursAlloues = role.jours_alloues;
    const joursUtilises = role.jours_utilises;
    const joursRestants = role.jours_restants;

    const budgetAlloue = role.budget_alloue;
    const budgetUtilise = role.budget_utilise;
    const budgetRestant = role.budget_restant;

    const reservationsMax = role.reservations_max_simultanees;
    const reservationsUtilisees = role.reservations_simultanees_utilisees;
    const reservationsRestantes = role.reservations_simultanees_restantes;

    const quotaLines: string[] = [];

    if (
      joursAlloues !== undefined ||
      joursUtilises !== undefined ||
      joursRestants !== undefined
    ) {
      quotaLines.push(
        `Jours: ${renderScalar(joursUtilises)} / ${renderScalar(joursAlloues)} · Restants: ${renderScalar(joursRestants)}`
      );
    }

    if (
      budgetAlloue !== undefined ||
      budgetUtilise !== undefined ||
      budgetRestant !== undefined
    ) {
      quotaLines.push(
        `Budget: ${
          typeof budgetUtilise === 'number'
            ? formatMoney(budgetUtilise, currency, locale)
            : renderScalar(budgetUtilise)
        } / ${
          typeof budgetAlloue === 'number'
            ? formatMoney(budgetAlloue, currency, locale)
            : renderScalar(budgetAlloue)
        } · Restant: ${
          typeof budgetRestant === 'number'
            ? formatMoney(budgetRestant, currency, locale)
            : renderScalar(budgetRestant)
        }`
      );
    }

    if (
      reservationsMax !== undefined ||
      reservationsUtilisees !== undefined ||
      reservationsRestantes !== undefined
    ) {
      quotaLines.push(
        `Réservations: ${renderScalar(reservationsUtilisees)} / ${renderScalar(reservationsMax)} · Restantes: ${renderScalar(reservationsRestantes)}`
      );
    }

    if (quotaLines.length) {
      return quotaLines;
    }

    const genericEntries = Object.entries(role)
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`);

    return genericEntries.length ? genericEntries : ['—'];
  }

  return ['—'];
}

function renderRoleEntreprise(role: unknown, locale: string, currency = 'MAD'): ReactNode {
  const lines = buildRoleEntrepriseLines(role, locale, currency);

  if (lines.length === 1) {
    return lines[0];
  }

  return (
    <div className="space-y-1 text-sm font-medium text-white/85">
      {lines.map((line, index) => (
        <p key={`${index}-${line}`}>{line}</p>
      ))}
    </div>
  );
}

function getVehicleLabel(reservation: B2BReservationRecord) {
  const vehicle = reservation.vehicules;

  if (!vehicle) return '—';

  return (
    vehicle.nom ||
    [vehicle.marque, vehicle.model].filter(Boolean).join(' ') ||
    vehicle.categorie ||
    vehicle.id_vehicule ||
    '—'
  );
}

function getPersonName(validation: B2BValidationRecord['demandeur']) {
  const client = validation?.clients;

  if (!client) return '—';

  return [client.prenom, client.nom].filter(Boolean).join(' ') || client.mail || '—';
}

export default function B2BDashboard({locale}: {locale: string}) {
  const t = useTranslations('B2BPage');

  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabKey>('reserve');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [context, setContext] = useState<B2BContextResponse | null>(null);
  const [reservations, setReservations] = useState<B2BReservationsResponse | null>(null);
  const [validations, setValidations] = useState<B2BValidationsResponse | null>(null);
  const [collaborateurs, setCollaborateurs] = useState<B2BCollaborateur[]>([]);

  useEffect(() => {
    setMounted(true);
    setToken(readAccessToken());
  }, []);

  const historyReservations = useMemo(() => {
    return (reservations?.data || []).filter((item) => {
      const latest = String(item.latest_validation_status || '').toLowerCase();
      const status = String(item.statut_validation || '').toLowerCase();

      return ['validee', 'refusee'].includes(latest) || ['validee', 'refusee'].includes(status);
    });
  }, [reservations]);

  async function loadData(currentToken: string) {
    if (!currentToken) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const [ctx, resa, vals] = await Promise.all([
        fetchCollaborateurContext(currentToken),
        fetchMyB2bReservations(currentToken),
        fetchMyPendingValidations(currentToken)
      ]);

      setContext(ctx);
      setReservations(resa);
      setValidations(vals);

      const membership = ctx?.default_membership || ctx?.memberships?.[0] || null;

      if (ctx?.is_b2b && membership?.id_entreprise) {
        const collabs = await fetchEntrepriseCollaborateurs(membership.id_entreprise, currentToken);
        setCollaborateurs(collabs || []);
      } else {
        setCollaborateurs([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('genericError'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!mounted) return;

    if (!token) {
      setLoading(false);
      return;
    }

    void loadData(token);
  }, [mounted, token]);

  async function handleApprove(id: string) {
    if (!token) return;

    try {
      setActionLoadingId(id);
      setError('');
      await approveB2bValidation(id, token);
      await loadData(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('genericError'));
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleReject(id: string) {
    if (!token) return;

    try {
      setActionLoadingId(id);
      setError('');
      await rejectB2bValidation(id, token);
      await loadData(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('genericError'));
    } finally {
      setActionLoadingId(null);
    }
  }

  if (!mounted) {
    return <section className="space-y-6" />;
  }

  if (!token) {
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

  const isB2B = Boolean(context?.is_b2b);
  const defaultMembership = context?.default_membership || context?.memberships?.[0] || null;
  const currency = defaultMembership?.entreprises?.devise || 'MAD';

  const currentCollaborateur =
    collaborateurs.find(
      (item) => item.id_client_entreprise === defaultMembership?.id_client_entreprise
    ) || null;

  const managerCollaborateur =
    collaborateurs.find(
      (item) => item.id_client_entreprise === defaultMembership?.manager_id_client_entreprise
    ) || null;

  const currentCollaborateurName =
    [currentCollaborateur?.clients?.prenom, currentCollaborateur?.clients?.nom]
      .filter(Boolean)
      .join(' ') ||
    [context?.user?.prenom, context?.user?.nom].filter(Boolean).join(' ') ||
    currentCollaborateur?.clients?.mail ||
    context?.user?.mail ||
    '—';

  const managerName =
    [managerCollaborateur?.clients?.prenom, managerCollaborateur?.clients?.nom]
      .filter(Boolean)
      .join(' ') ||
    managerCollaborateur?.clients?.mail ||
    t('noValidator');

  return (
    <section className="space-y-6">
      {loading ? <p className="text-sm text-white/60">{t('loading')}</p> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      {!loading && context && !isB2B ? (
        <div className="rounded-[24px] border border-amber-300/20 bg-amber-500/10 p-5 text-sm text-amber-100">
          {t('notB2B')}
        </div>
      ) : null}

      {!loading && isB2B && context ? (
        <>
          <div className="grid gap-4">
            <article className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-gold">{t('collaboratorCard')}</p>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-xs text-white/45">{t('collaboratorName')}</p>
                  <div className="mt-1 text-base font-semibold text-white">{currentCollaborateurName}</div>
                </div>

                <div>
                  <p className="text-xs text-white/45">{t('collaboratorRole')}</p>
                  <div className="mt-1 text-base text-white">
                    {renderRoleEntreprise(defaultMembership?.role_entreprise, locale, currency)}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-white/45">{t('validatorName')}</p>
                  <div className="mt-1 text-base font-semibold text-white">{managerName}</div>
                </div>
              </div>
            </article>
          </div>

          <div className="flex flex-wrap gap-2">
            {(['reserve', 'reservations', 'pending', 'history'] as TabKey[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab
                    ? 'bg-gold text-brand-950'
                    : 'border border-white/10 bg-white/5 text-white/75 hover:border-gold/40 hover:text-white'
                }`}
              >
                {t(`tabs.${tab}`)}
              </button>
            ))}
          </div>

          {activeTab === 'reserve' ? (
            <B2BReservationFlow
              locale={locale}
              token={token}
              context={context}
              onReservationCreated={() => {
                void loadData(token);
                setActiveTab('reservations');
              }}
            />
          ) : null}

          {activeTab === 'reservations' ? (
            <div className="space-y-4">
              {!reservations?.data?.length ? (
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm text-white/60">
                  {t('emptyReservations')}
                </div>
              ) : (
                reservations.data.map((reservation) => (
                  <article
                    key={reservation.id_reservation_entreprise}
                    className="rounded-[24px] border border-white/10 bg-white/5 p-5"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.28em] text-gold">
                          {reservation.id_reservation_entreprise}
                        </p>
                        <h3 className="mt-2 text-lg font-semibold text-white">{getVehicleLabel(reservation)}</h3>
                        <p className="mt-2 text-sm text-white/65">
                          {reservation.entreprises?.raison_sociale || '—'}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/75">
                          {t('reservationStatus')}: {renderScalar(reservation.statut_reservation)}
                        </span>
                        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/75">
                          {t('validationStatus')}: {renderScalar(reservation.statut_validation)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl bg-black/10 p-3 text-sm text-white/70">
                        <p className="text-white/50">{t('period')}</p>
                        <p className="mt-1">
                          {formatDate(reservation.date_dep, locale)} — {formatDate(reservation.date_ret, locale)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-black/10 p-3 text-sm text-white/70">
                        <p className="text-white/50">{t('costCenter')}</p>
                        <p className="mt-1">{reservation.centres_cout?.libelle || '—'}</p>
                      </div>

                      <div className="rounded-2xl bg-black/10 p-3 text-sm text-white/70">
                        <p className="text-white/50">{t('beneficiaryProfile')}</p>
                        <p className="mt-1">{reservation.profils_beneficiaires?.libelle || '—'}</p>
                      </div>

                      <div className="rounded-2xl bg-black/10 p-3 text-sm text-white/70">
                        <p className="text-white/50">{t('estimatedPrice')}</p>
                        <p className="mt-1">
                          {formatMoney(
                            reservation.prix_estime ?? reservation.prix_final,
                            reservation.devise || currency,
                            locale
                          )}
                        </p>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          ) : null}

          {activeTab === 'pending' ? (
            <div className="space-y-4">
              {!validations?.data?.length ? (
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm text-white/60">
                  {t('emptyPending')}
                </div>
              ) : (
                validations.data.map((validation) => {
                  const reservation = validation.reservations_entreprises;

                  return (
                    <article
                      key={validation.id_demande_validation}
                      className="rounded-[24px] border border-white/10 bg-white/5 p-5"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.28em] text-gold">
                            {validation.id_demande_validation}
                          </p>
                          <h3 className="mt-2 text-lg font-semibold text-white">
                            {reservation ? getVehicleLabel(reservation) : '—'}
                          </h3>
                          <p className="mt-2 text-sm text-white/65">
                            {t('requestedBy')}: {getPersonName(validation.demandeur)}
                          </p>
                        </div>

                        <span className="rounded-full border border-amber-300/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-100">
                          {renderScalar(validation.statut || t('pending'))}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl bg-black/10 p-3 text-sm text-white/70">
                          <p className="text-white/50">{t('company')}</p>
                          <p className="mt-1">{reservation?.entreprises?.raison_sociale || '—'}</p>
                        </div>

                        <div className="rounded-2xl bg-black/10 p-3 text-sm text-white/70">
                          <p className="text-white/50">{t('period')}</p>
                          <p className="mt-1">
                            {formatDate(reservation?.date_dep || null, locale)} — {formatDate(reservation?.date_ret || null, locale)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-black/10 p-3 text-sm text-white/70">
                          <p className="text-white/50">{t('costCenter')}</p>
                          <p className="mt-1">{reservation?.centres_cout?.libelle || '—'}</p>
                        </div>

                        <div className="rounded-2xl bg-black/10 p-3 text-sm text-white/70">
                          <p className="text-white/50">{t('estimatedPrice')}</p>
                          <p className="mt-1">
                            {formatMoney(reservation?.prix_estime || null, reservation?.devise || currency, locale)}
                          </p>
                        </div>
                      </div>

                      {validation.commentaire_demande ? (
                        <p className="mt-4 rounded-2xl border border-white/10 bg-black/10 p-3 text-sm text-white/70">
                          <span className="text-white">{t('requestComment')}:</span> {validation.commentaire_demande}
                        </p>
                      ) : null}

                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => handleApprove(validation.id_demande_validation)}
                          disabled={actionLoadingId === validation.id_demande_validation}
                          className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-brand-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actionLoadingId === validation.id_demande_validation ? t('processing') : t('approve')}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleReject(validation.id_demande_validation)}
                          disabled={actionLoadingId === validation.id_demande_validation}
                          className="rounded-full border border-red-400/30 px-4 py-2 text-sm font-semibold text-red-200 transition hover:border-red-300 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actionLoadingId === validation.id_demande_validation ? t('processing') : t('reject')}
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          ) : null}

          {activeTab === 'history' ? (
            <div className="space-y-4">
              {!historyReservations.length ? (
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm text-white/60">
                  {t('emptyHistory')}
                </div>
              ) : (
                historyReservations.map((reservation) => (
                  <article
                    key={reservation.id_reservation_entreprise}
                    className="rounded-[24px] border border-white/10 bg-white/5 p-5"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.28em] text-gold">
                          {reservation.id_reservation_entreprise}
                        </p>
                        <h3 className="mt-2 text-lg font-semibold text-white">{getVehicleLabel(reservation)}</h3>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/75">
                          {t('validationStatus')}: {renderScalar(reservation.latest_validation_status || reservation.statut_validation)}
                        </span>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
