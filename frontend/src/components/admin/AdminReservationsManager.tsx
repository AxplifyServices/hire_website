'use client';

import {useEffect, useMemo, useState} from 'react';
import {
  Ban,
  CheckCircle2,
  ClipboardList,
  MoreHorizontal,
  PlayCircle,
  RefreshCcw,
  Search,
  X
} from 'lucide-react';
import type {
  AdminReservation,
  AdminReservationsListResponse
} from '@/lib/types';
import {
  adminCancelReservation,
  adminCompleteReservation,
  adminStartReservation,
  fetchAdminReservations
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

function formatPrice(value?: number | string | null, devise?: string | null) {
  if (value === null || value === undefined || value === '') return '—';
  const amount = Number(value);
  if (Number.isNaN(amount)) return '—';
  return `${amount.toFixed(2)} ${devise || 'MAD'}`;
}

function getClientLabel(item: AdminReservation) {
  const fullName = [item.clients?.prenom, item.clients?.nom]
    .filter(Boolean)
    .join(' ')
    .trim();

  if (fullName) return fullName;
  if (item.prenom_snapshot || item.nom_snapshot) {
    return [item.prenom_snapshot, item.nom_snapshot].filter(Boolean).join(' ');
  }
  if (item.mail_snapshot) return item.mail_snapshot;
  if (item.clients?.mail) return item.clients.mail;
  return 'Client non renseigné';
}

function getVehicleLabel(item: AdminReservation) {
  const vehicle = [item.vehicules?.marque, item.vehicules?.model, item.vehicules?.nom]
    .filter(Boolean)
    .join(' ')
    .trim();

  return vehicle || item.id_vehicule || '—';
}

function getAgencyLabel(
  agency?: AdminReservation['agences_reservations_id_lieu_depToagences'] | null
) {
  if (!agency) return '—';
  return [agency.nom, agency.ville].filter(Boolean).join(' — ') || agency.id_agence;
}

function normalizeStatus(status?: string | null) {
  return (status || '').toUpperCase();
}

function statusBadgeClass(status?: string | null) {
  const normalized = normalizeStatus(status);

  if (normalized === 'EN_COURS') {
    return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';
  }

  if (normalized === 'EN_ATTENTE_PAIEMENT' || normalized === 'VALIDEE') {
    return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
  }

  if (normalized === 'TERMINEE' || normalized === 'TERMINE') {
    return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200';
  }

  if (normalized === 'ANNULEE' || normalized === 'ANNULÉE') {
    return 'bg-rose-50 text-rose-700 ring-1 ring-rose-200';
  }

  return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200';
}

function canStart(status?: string | null) {
  const normalized = normalizeStatus(status);
  return normalized === 'EN_ATTENTE_PAIEMENT' || normalized === 'VALIDEE';
}

function canComplete(status?: string | null) {
  return normalizeStatus(status) === 'EN_COURS';
}

function canCancel(status?: string | null) {
  const normalized = normalizeStatus(status);
  return !['TERMINEE', 'TERMINE', 'ANNULEE', 'ANNULÉE'].includes(normalized);
}

function DetailRow({
  label,
  value
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid gap-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      <div className="text-sm text-slate-800">{value || '—'}</div>
    </div>
  );
}

export default function AdminReservationsManager() {
  const [response, setResponse] = useState<AdminReservationsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [selectedReservation, setSelectedReservation] = useState<AdminReservation | null>(null);

  const reservations = response?.data ?? [];
  const pagination = response?.pagination;
  const totalReservations = pagination?.total ?? 0;
  const totalPages = Math.max(pagination?.total_pages ?? 1, 1);

  const statusOptions = useMemo(
    () => [
      {value: '', label: 'Tous'},
      {value: 'EN_ATTENTE_PAIEMENT', label: 'En attente de paiement'},
      {value: 'VALIDEE', label: 'Validée'},
      {value: 'EN_COURS', label: 'En cours'},
      {value: 'TERMINEE', label: 'Terminée'},
      {value: 'ANNULEE', label: 'Annulée'}
    ],
    []
  );

  async function loadReservations(nextPage = page, silent = false) {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const result = await fetchAdminReservations({
        page: nextPage,
        limit: 10,
        search,
        status: statusFilter || undefined
      });

      setResponse(result);
      setPage(result.pagination.page);

      if (selectedReservation) {
        const refreshedSelected = result.data.find(
          (entry) => entry.id_reservation === selectedReservation.id_reservation
        );
        if (refreshedSelected) {
          setSelectedReservation(refreshedSelected);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible de charger les réservations.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadReservations(1);
  }, [search, statusFilter]);

  async function handleStart(item: AdminReservation) {
    try {
      setActingId(item.id_reservation);
      setError(null);
      setSuccess(null);

      const result = await adminStartReservation(item.id_reservation);

      setResponse((current) => {
        if (!current) return current;
        return {
          ...current,
          data: current.data.map((entry) =>
            entry.id_reservation === item.id_reservation ? result.reservation : entry
          )
        };
      });

      if (selectedReservation?.id_reservation === item.id_reservation) {
        setSelectedReservation(result.reservation);
      }

      setSuccess(result.message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de passer la réservation en cours."
      );
    } finally {
      setActingId(null);
    }
  }

  async function handleComplete(item: AdminReservation) {
    try {
      setActingId(item.id_reservation);
      setError(null);
      setSuccess(null);

      const result = await adminCompleteReservation(item.id_reservation);

      setResponse((current) => {
        if (!current) return current;
        return {
          ...current,
          data: current.data.map((entry) =>
            entry.id_reservation === item.id_reservation ? result.reservation : entry
          )
        };
      });

      if (selectedReservation?.id_reservation === item.id_reservation) {
        setSelectedReservation(result.reservation);
      }

      setSuccess(result.message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible de terminer la réservation.'
      );
    } finally {
      setActingId(null);
    }
  }

  async function handleCancel(item: AdminReservation) {
    const confirmed = window.confirm(
      `Annuler la réservation ${item.id_reservation} ?`
    );

    if (!confirmed) return;

    try {
      setActingId(item.id_reservation);
      setError(null);
      setSuccess(null);

      const result = await adminCancelReservation(item.id_reservation);

      setResponse((current) => {
        if (!current) return current;
        return {
          ...current,
          data: current.data.map((entry) =>
            entry.id_reservation === item.id_reservation ? result.reservation : entry
          )
        };
      });

      if (selectedReservation?.id_reservation === item.id_reservation) {
        setSelectedReservation(result.reservation);
      }

      setSuccess(result.message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'annuler la réservation."
      );
    } finally {
      setActingId(null);
    }
  }

  return (
    <>
      <section className="space-y-6">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700">
                <ClipboardList className="h-4 w-4" />
                Réservations B2C
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
                Gestion opérationnelle des réservations
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Cette vue affiche uniquement les vraies réservations B2C.
                Les paniers incomplets ne remontent pas ici.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadReservations(page, true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px_160px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearch(searchInput.trim());
                  }
                }}
                placeholder="Rechercher par ID, client, email, véhicule..."
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none ring-0 transition focus:border-cyan-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500"
            >
              {statusOptions.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setSearch(searchInput.trim())}
              className="inline-flex items-center justify-center rounded-2xl bg-[#081a33] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0d2547]"
            >
              Filtrer
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total réservations</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {totalReservations}
            </p>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Page courante</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{page}</p>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Nombre de pages</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {totalPages}
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
                  <th className="px-6 py-4">Client</th>
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
                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">
                      Chargement des réservations...
                    </td>
                  </tr>
                ) : reservations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">
                      Aucune réservation trouvée.
                    </td>
                  </tr>
                ) : (
                  reservations.map((item) => {
                    const isBusy = actingId === item.id_reservation;

                    return (
                      <tr key={item.id_reservation} className="align-top">
                        <td className="px-6 py-5">
                          <p className="font-semibold text-slate-900">
                            {item.id_reservation}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Créée le {formatDate(item.date_creation)}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Paiement : {item.payment_status || '—'}
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <p className="font-medium text-slate-900">
                            {getClientLabel(item)}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {item.clients?.mail || item.mail_snapshot || '—'}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {[
                              item.clients?.prefixe_tel || item.prefixe_tel_snapshot,
                              item.clients?.num_tel || item.num_tel_snapshot
                            ]
                              .filter(Boolean)
                              .join(' ') || '—'}
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <p className="font-medium text-slate-900">
                            {getVehicleLabel(item)}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Départ : {getAgencyLabel(item.agences_reservations_id_lieu_depToagences)}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Retour : {getAgencyLabel(item.agences_reservations_id_lieu_retToagences)}
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
                            {formatPrice(item.prix_final, item.devise)}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Initial : {formatPrice(item.prix_initial, item.devise)}
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(
                              item.status
                            )}`}
                          >
                            {item.status || '—'}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedReservation(item)}
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                              title="Voir les détails"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>

                            {canStart(item.status) ? (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleStart(item)}
                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <PlayCircle className="h-4 w-4" />
                                Passer en cours
                              </button>
                            ) : null}

                            {canComplete(item.status) ? (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleComplete(item)}
                                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                Terminer
                              </button>
                            ) : null}

                            {canCancel(item.status) ? (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleCancel(item)}
                                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <Ban className="h-4 w-4" />
                                Annuler
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              {totalReservations} réservation{totalReservations > 1 ? 's' : ''} trouvée
              {totalReservations > 1 ? 's' : ''}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => loadReservations(page - 1)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Précédent
              </button>

              <span className="px-3 text-sm text-slate-600">
                Page {page} / {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => loadReservations(page + 1)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        </div>
      </section>

      {selectedReservation ? (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/45"
            onClick={() => setSelectedReservation(null)}
            aria-label="Fermer"
          />

          <aside className="relative ml-auto flex h-full w-full max-w-3xl flex-col overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <p className="text-sm font-medium text-cyan-700">Détails de la réservation</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                  {selectedReservation.id_reservation}
                </h2>
                <div className="mt-3">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(
                      selectedReservation.status
                    )}`}
                  >
                    {selectedReservation.status || '—'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedReservation(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 px-6 py-6">
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Client
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <DetailRow label="Nom complet" value={getClientLabel(selectedReservation)} />
                  <DetailRow
                    label="Email"
                    value={selectedReservation.clients?.mail || selectedReservation.mail_snapshot || '—'}
                  />
                  <DetailRow
                    label="Téléphone"
                    value={[
                      selectedReservation.clients?.prefixe_tel || selectedReservation.prefixe_tel_snapshot,
                      selectedReservation.clients?.num_tel || selectedReservation.num_tel_snapshot
                    ]
                      .filter(Boolean)
                      .join(' ') || '—'}
                  />
                  <DetailRow
                    label="ID client"
                    value={selectedReservation.id_client || '—'}
                  />
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Réservation
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <DetailRow label="Date création" value={formatDate(selectedReservation.date_creation)} />
                  <DetailRow label="Dernière mise à jour" value={formatDate(selectedReservation.date_dern_maj)} />
                  <DetailRow label="Statut paiement" value={selectedReservation.payment_status || '—'} />
                  <DetailRow label="Étape panier" value={selectedReservation.etape_panier || '—'} />
                  <DetailRow label="Session panier" value={selectedReservation.session_panier || '—'} />
                  <DetailRow label="Source" value={selectedReservation.source_reservation || '—'} />
                  <DetailRow label="Paniers abandonnés" value={selectedReservation.is_abandoned ? 'Oui' : 'Non'} />
                  <DetailRow label="Date abandon" value={formatDate(selectedReservation.date_abandon)} />
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Trajet
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <DetailRow
                    label="Agence de départ"
                    value={getAgencyLabel(selectedReservation.agences_reservations_id_lieu_depToagences)}
                  />
                  <DetailRow
                    label="Agence de retour"
                    value={getAgencyLabel(selectedReservation.agences_reservations_id_lieu_retToagences)}
                  />
                  <DetailRow
                    label="Départ"
                    value={formatDateTime(selectedReservation.date_dep, selectedReservation.heure_dep)}
                  />
                  <DetailRow
                    label="Retour"
                    value={formatDateTime(selectedReservation.date_ret, selectedReservation.heure_ret)}
                  />
                  <DetailRow
                    label="Nombre de jours"
                    value={
                      selectedReservation.date_dep && selectedReservation.date_ret
                        ? Math.max(
                            1,
                            Math.ceil(
                              (new Date(selectedReservation.date_ret).getTime() -
                                new Date(selectedReservation.date_dep).getTime()) /
                                (1000 * 60 * 60 * 24)
                            )
                          )
                        : '—'
                    }
                  />
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Véhicule & tarification
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <DetailRow label="Véhicule" value={getVehicleLabel(selectedReservation)} />
                  <DetailRow label="ID véhicule" value={selectedReservation.id_vehicule || '—'} />
                  <DetailRow label="Tarification" value={selectedReservation.id_tarification || '—'} />
                  <DetailRow label="Assurance" value={selectedReservation.id_assurance || '—'} />
                  <DetailRow label="Politique âge" value={selectedReservation.id_politic_age || '—'} />
                  <DetailRow
                    label="Options"
                    value={
                      Array.isArray(selectedReservation.liste_id_option) &&
                      selectedReservation.liste_id_option.length > 0
                        ? selectedReservation.liste_id_option.join(', ')
                        : 'Aucune'
                    }
                  />
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Prix
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <DetailRow
                    label="Prix initial"
                    value={formatPrice(selectedReservation.prix_initial, selectedReservation.devise)}
                  />
                  <DetailRow
                    label="Prix final"
                    value={formatPrice(selectedReservation.prix_final, selectedReservation.devise)}
                  />
                  <DetailRow label="Devise" value={selectedReservation.devise || 'MAD'} />
                  <DetailRow label="Code promo" value={selectedReservation.code_promo || '—'} />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-4">
                {canStart(selectedReservation.status) ? (
                  <button
                    type="button"
                    disabled={actingId === selectedReservation.id_reservation}
                    onClick={() => handleStart(selectedReservation)}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <PlayCircle className="h-4 w-4" />
                    Passer en cours
                  </button>
                ) : null}

                {canComplete(selectedReservation.status) ? (
                  <button
                    type="button"
                    disabled={actingId === selectedReservation.id_reservation}
                    onClick={() => handleComplete(selectedReservation)}
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Terminer
                  </button>
                ) : null}

                {canCancel(selectedReservation.status) ? (
                  <button
                    type="button"
                    disabled={actingId === selectedReservation.id_reservation}
                    onClick={() => handleCancel(selectedReservation)}
                    className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Ban className="h-4 w-4" />
                    Annuler
                  </button>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}