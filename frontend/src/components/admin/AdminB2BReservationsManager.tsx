'use client';

import {useEffect, useMemo, useState} from 'react';
import {
  Ban,
  CheckCircle2,
  ClipboardList,
  PlayCircle,
  RefreshCcw
} from 'lucide-react';
import type {AdminB2BReservation} from '@/lib/types';
import {
  adminCancelB2BReservation,
  adminCompleteB2BReservation,
  adminStartB2BReservation,
  fetchAdminB2BReservations
} from '@/lib/api';

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  }).format(date);
}

function formatTimeValue(value?: string | null) {
  if (!value) return '—';
  if (value.includes('T')) {
    const parts = value.split('T')[1];
    return parts?.slice(0, 5) || '—';
  }
  return value.slice(0, 5);
}

function formatDateTime(dateValue?: string | null, timeValue?: string | null) {
  const date = formatDate(dateValue);
  const time = formatTimeValue(timeValue);
  return `${date} • ${time !== '—' ? time : '--:--'}`;
}

function formatPrice(value?: number | string | null) {
  if (value === null || value === undefined || value === '') return '—';
  const amount = Number(value);
  if (Number.isNaN(amount)) return '—';
  return `${amount.toFixed(2)} MAD`;
}

function normalizeStatus(status?: string | null) {
  return (status || '').toUpperCase();
}

function statusBadgeClass(status?: string | null) {
  const normalized = normalizeStatus(status);

  if (normalized === 'EN_COURS') {
    return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';
  }

  if (normalized === 'VALIDEE' || normalized === 'CONFIRMEE') {
    return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
  }

  if (normalized === 'EN_ATTENTE_VALIDATION') {
    return 'bg-sky-50 text-sky-700 ring-1 ring-sky-200';
  }

  if (normalized === 'TERMINEE') {
    return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200';
  }

  if (normalized === 'ANNULEE') {
    return 'bg-rose-50 text-rose-700 ring-1 ring-rose-200';
  }

  return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200';
}

function canStart(status?: string | null) {
  const normalized = normalizeStatus(status);
  return normalized === 'VALIDEE';
}

function canComplete(status?: string | null) {
  const normalized = normalizeStatus(status);
  return normalized === 'CONFIRMEE' || normalized === 'EN_COURS';
}

function canCancel(status?: string | null) {
  const normalized = normalizeStatus(status);
  return ['VALIDEE', 'CONFIRMEE'].includes(normalized);
}

function getCollabLabel(
  item?: AdminB2BReservation['clients_entreprises_reservations_entreprises_id_client_entreprise_demandeurToclients_entreprises'] | null
) {
  const nom = item?.clients?.nom || '';
  const prenom = item?.clients?.prenom || '';
  const fullName = `${prenom} ${nom}`.trim();
  return fullName || item?.clients?.mail || '—';
}

function getVehicleLabel(item: AdminB2BReservation) {
  return [item.vehicules?.marque, item.vehicules?.model, item.vehicules?.nom]
    .filter(Boolean)
    .join(' ') || item.id_vehicule || '—';
}

export default function AdminB2BReservationsManager() {
  const [reservations, setReservations] = useState<AdminB2BReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const totalReservations = useMemo(() => reservations.length, [reservations]);

  async function loadReservations(silent = false) {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const result = await fetchAdminB2BReservations();
      setReservations(result.data || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible de charger les réservations B2B.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadReservations();
  }, []);

  async function handleStart(item: AdminB2BReservation) {
    try {
      setActingId(item.id_reservation_entreprise);
      setError(null);
      setSuccess(null);

      const result = await adminStartB2BReservation(item.id_reservation_entreprise);

      setReservations((current) =>
        current.map((entry) =>
          entry.id_reservation_entreprise === item.id_reservation_entreprise
            ? result.reservation
            : entry
        )
      );

      setSuccess(result.message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de passer la réservation B2B en cours."
      );
    } finally {
      setActingId(null);
    }
  }

  async function handleComplete(item: AdminB2BReservation) {
    try {
      setActingId(item.id_reservation_entreprise);
      setError(null);
      setSuccess(null);

      const result = await adminCompleteB2BReservation(item.id_reservation_entreprise);

      setReservations((current) =>
        current.map((entry) =>
          entry.id_reservation_entreprise === item.id_reservation_entreprise
            ? result.reservation
            : entry
        )
      );

      setSuccess(result.message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible de terminer la réservation B2B.'
      );
    } finally {
      setActingId(null);
    }
  }

  async function handleCancel(item: AdminB2BReservation) {
    const confirmed = window.confirm(
      `Annuler la réservation ${item.id_reservation_entreprise} ?`
    );

    if (!confirmed) return;

    try {
      setActingId(item.id_reservation_entreprise);
      setError(null);
      setSuccess(null);

      const result = await adminCancelB2BReservation(item.id_reservation_entreprise);

      setReservations((current) =>
        current.map((entry) =>
          entry.id_reservation_entreprise === item.id_reservation_entreprise
            ? result.reservation
            : entry
        )
      );

      setSuccess(result.message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'annuler la réservation B2B."
      );
    } finally {
      setActingId(null);
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700">
              <ClipboardList className="h-4 w-4" />
              Réservations B2B
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
              Gestion opérationnelle des réservations B2B
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Cette vue empile les réservations B2B et permet de les annuler,
              les mettre en cours ou les terminer.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadReservations(true)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total réservations B2B</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {totalReservations}
          </p>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Réservations chargées</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {reservations.length}
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                <th className="px-6 py-4">Réservation</th>
                <th className="px-6 py-4">Entreprise</th>
                <th className="px-6 py-4">Demandeur / bénéficiaire</th>
                <th className="px-6 py-4">Véhicule</th>
                <th className="px-6 py-4">Départ / retour</th>
                <th className="px-6 py-4">Montant</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-sm text-slate-500">
                    Chargement des réservations B2B...
                  </td>
                </tr>
              ) : reservations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-sm text-slate-500">
                    Aucune réservation B2B trouvée.
                  </td>
                </tr>
              ) : (
                reservations.map((item) => {
                  const isBusy = actingId === item.id_reservation_entreprise;

                  return (
                    <tr key={item.id_reservation_entreprise} className="align-top">
                      <td className="px-6 py-5">
                        <p className="font-semibold text-slate-900">
                          {item.id_reservation_entreprise}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Créée le {formatDate(item.date_creation)}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Validation : {item.statut_validation || '—'}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <p className="font-medium text-slate-900">
                          {item.entreprises?.raison_sociale || item.id_entreprise || '—'}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Centre coût : {item.centres_cout?.libelle || '—'}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Profil : {item.profils_beneficiaires?.libelle || '—'}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <p className="font-medium text-slate-900">
                          Demandeur : {getCollabLabel(item.clients_entreprises_reservations_entreprises_id_client_entreprise_demandeurToclients_entreprises)}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Bénéficiaire : {getCollabLabel(item.clients_entreprises_reservations_entreprises_id_client_entreprise_beneficiaireToclients_entreprises)}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <p className="font-medium text-slate-900">
                          {getVehicleLabel(item)}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <p className="text-sm text-slate-700">
                          {formatDateTime(item.date_dep, item.heure_dep)}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatDateTime(item.date_ret, item.heure_ret)}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <p className="font-semibold text-slate-900">
                          {formatPrice(item.cout_final)}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(
                            item.statut_reservation
                          )}`}
                        >
                          {item.statut_reservation || '—'}
                        </span>
                      </td>

                        <td className="px-6 py-5">
                        <div className="flex flex-col items-stretch gap-2">
                          <button
                            type="button"
                            disabled={!canStart(item.statut_reservation) || isBusy}
                            onClick={() => handleStart(item)}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"                          >
                            <PlayCircle className="h-4 w-4" />
                            En cours
                          </button>

                          <button
                            type="button"
                            disabled={!canComplete(item.statut_reservation) || isBusy}
                            onClick={() => handleComplete(item)}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-sky-200 px-3 py-2 text-sm font-medium text-sky-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Terminer
                          </button>

                          <button
                            type="button"
                            disabled={!canCancel(item.statut_reservation) || isBusy}
                            onClick={() => handleCancel(item)}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"                          >
                            <Ban className="h-4 w-4" />
                            Annuler
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}