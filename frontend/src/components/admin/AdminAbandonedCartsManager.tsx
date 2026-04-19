'use client';

import {useEffect, useState} from 'react';
import {RefreshCcw, Search, ShoppingCart} from 'lucide-react';
import type {
  AdminReservation,
  AdminReservationsListResponse
} from '@/lib/types';
import {fetchAdminReservations} from '@/lib/api';

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

export default function AdminAbandonedCartsManager() {
  const [response, setResponse] = useState<AdminReservationsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const carts = response?.data ?? [];
  const pagination = response?.pagination;
  const totalCarts = pagination?.total ?? 0;
  const totalPages = Math.max(pagination?.total_pages ?? 1, 1);

  async function loadCarts(nextPage = page, silent = false) {
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
        is_abandoned: 'true',
        include_incomplete: 'true'
      });

      setResponse(result);
      setPage(result.pagination.page);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible de charger les réservations abandonnées.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadCarts(1);
  }, [search]);

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
              <ShoppingCart className="h-4 w-4" />
              Paniers abandonnés
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
              Réservations abandonnées
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Cette vue affiche les paniers abandonnés pour suivi opérationnel.
              Aucune action n’est prévue pour le moment.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadCarts(page, true)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_160px]">
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
          <p className="text-sm text-slate-500">Total paniers abandonnés</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {totalCarts}
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

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                <th className="px-6 py-4">Réservation</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Véhicule</th>
                <th className="px-6 py-4">Départ / retour</th>
                <th className="px-6 py-4">Abandon</th>
                <th className="px-6 py-4">Statut</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                    Chargement des paniers abandonnés...
                  </td>
                </tr>
              ) : carts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                    Aucun panier abandonné trouvé.
                  </td>
                </tr>
              ) : (
                carts.map((item) => (
                  <tr key={item.id_reservation} className="align-top">
                    <td className="px-6 py-5">
                      <p className="font-semibold text-slate-900">
                        {item.id_reservation}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Créée le {formatDate(item.date_creation)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Étape : {item.etape_panier || '—'}
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
                      <p className="text-sm text-slate-700">
                        {formatDate(item.date_abandon)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Dernière activité : {formatDate(item.date_derniere_activite)}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                        {item.status || 'ABANDONNEE'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            {totalCarts} panier{totalCarts > 1 ? 's' : ''} abandonné{totalCarts > 1 ? 's' : ''} trouvé{totalCarts > 1 ? 's' : ''}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => loadCarts(page - 1)}
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
              onClick={() => loadCarts(page + 1)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}