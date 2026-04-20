'use client';

import {useEffect, useMemo, useState} from 'react';
import {
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardList,
  RefreshCcw,
  ShieldCheck,
  Timer,
} from 'lucide-react';
import type {AdminB2BReservation, B2BEntreprise} from '@/lib/types';
import {
  fetchAdminB2BCompanies,
  fetchAdminB2BReservations,
} from '@/lib/api';

type ViewMode = 'global' | 'company';

function normalizeStatus(value?: string | null) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function formatMoney(value?: number | null, currency = 'MAD') {
  const amount = Number(value ?? 0);

  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function formatDate(value?: string | null) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date);
}

function formatDateTime(value?: string | null) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getCompanyName(item?: B2BEntreprise | null) {
  return item?.raison_sociale || 'Entreprise inconnue';
}

function getCollaboratorName(item: AdminB2BReservation) {
  const demandeur =
    item.clients_entreprises_reservations_entreprises_id_client_entreprise_demandeurToclients_entreprises;

  const fullName = [demandeur?.clients?.prenom, demandeur?.clients?.nom]
    .filter(Boolean)
    .join(' ')
    .trim();

  return fullName || demandeur?.clients?.mail || 'Collaborateur inconnu';
}

function getVehicleLabel(item: AdminB2BReservation) {
  const vehicle = item.vehicules;

  if (!vehicle) return '—';

  return (
    vehicle.nom ||
    [vehicle.marque, vehicle.model].filter(Boolean).join(' ') ||
    vehicle.categorie ||
    vehicle.id_vehicule ||
    '—'
  );
}

function getStatusLabel(status?: string | null) {
  const normalized = normalizeStatus(status);

  const map: Record<string, string> = {
    en_attente_validation: 'En attente validation',
    en_attente: 'En attente',
    validee: 'Validée',
    valide: 'Validée',
    confirmee: 'Confirmée',
    confirme: 'Confirmée',
    en_cours: 'En cours',
    terminee: 'Terminée',
    termine: 'Terminée',
    annulee: 'Annulée',
    annule: 'Annulée',
    refusee: 'Refusée',
    refuse: 'Refusée',
  };

  return map[normalized] || status || '—';
}

function getStatusBadgeClass(status?: string | null) {
  const normalized = normalizeStatus(status);

  if (normalized === 'en_cours') {
    return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';
  }

  if (normalized === 'validee' || normalized === 'confirmee' || normalized === 'confirmee') {
    return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
  }

  if (normalized === 'en_attente_validation' || normalized === 'en_attente') {
    return 'bg-sky-50 text-sky-700 ring-1 ring-sky-200';
  }

  if (normalized === 'terminee' || normalized === 'termine') {
    return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200';
  }

  if (normalized === 'annulee' || normalized === 'refusee') {
    return 'bg-rose-50 text-rose-700 ring-1 ring-rose-200';
  }

  return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200';
}

function isRevenueEligible(status?: string | null) {
  const normalized = normalizeStatus(status);
  return ['validee', 'confirmee', 'confirmee', 'en_cours', 'terminee', 'termine'].includes(
    normalized
  );
}

function isPendingValidation(status?: string | null) {
  const normalized = normalizeStatus(status);
  return normalized === 'en_attente_validation' || normalized === 'en_attente';
}

function isActiveReservation(status?: string | null) {
  const normalized = normalizeStatus(status);
  return ['validee', 'confirmee', 'confirmee', 'en_cours'].includes(normalized);
}

function isCancelledReservation(status?: string | null) {
  const normalized = normalizeStatus(status);
  return normalized === 'annulee' || normalized === 'refusee';
}

function getMonthKey(value?: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}`;
}

export default function AdminB2BDashboard() {
  const [reservations, setReservations] = useState<AdminB2BReservation[]>([]);
  const [companies, setCompanies] = useState<B2BEntreprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('global');
  const [selectedEntrepriseId, setSelectedEntrepriseId] = useState<string>('all');

  async function loadDashboard(silent = false) {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const [companiesResponse, reservationsResponse] = await Promise.all([
        fetchAdminB2BCompanies(),
        fetchAdminB2BReservations(),
      ]);

      const sortedCompanies = [...(companiesResponse || [])].sort((a, b) =>
        (a.raison_sociale || '').localeCompare(b.raison_sociale || '', 'fr')
      );

      setCompanies(sortedCompanies);
      setReservations(reservationsResponse.data || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible de charger le dashboard B2B.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (viewMode === 'company' && selectedEntrepriseId === 'all' && companies.length > 0) {
      setSelectedEntrepriseId(companies[0].id_entreprise);
    }
  }, [viewMode, selectedEntrepriseId, companies]);

  const filteredReservations = useMemo(() => {
    if (viewMode === 'global' || selectedEntrepriseId === 'all') {
      return reservations;
    }

    return reservations.filter((item) => item.id_entreprise === selectedEntrepriseId);
  }, [reservations, viewMode, selectedEntrepriseId]);

  const selectedCompany = useMemo(() => {
    if (viewMode === 'global' || selectedEntrepriseId === 'all') return null;
    return companies.find((item) => item.id_entreprise === selectedEntrepriseId) || null;
  }, [companies, viewMode, selectedEntrepriseId]);

  const totalReservations = filteredReservations.length;

  const activeReservations = useMemo(() => {
    return filteredReservations.filter((item) =>
      isActiveReservation(item.statut_reservation)
    ).length;
  }, [filteredReservations]);

  const pendingValidations = useMemo(() => {
    return filteredReservations.filter((item) =>
      isPendingValidation(item.statut_validation || item.statut_reservation)
    ).length;
  }, [filteredReservations]);

  const cancelledReservations = useMemo(() => {
    return filteredReservations.filter((item) =>
      isCancelledReservation(item.statut_reservation)
    ).length;
  }, [filteredReservations]);

  const totalRevenue = useMemo(() => {
    return filteredReservations
      .filter((item) => isRevenueEligible(item.statut_reservation))
      .reduce((sum, item) => sum + Number(item.cout_final ?? item.cout_estime ?? 0), 0);
  }, [filteredReservations]);

  const currentMonthRevenue = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, '0')}`;

    return filteredReservations
      .filter(
        (item) =>
          isRevenueEligible(item.statut_reservation) &&
          getMonthKey(item.date_creation) === currentMonth
      )
      .reduce((sum, item) => sum + Number(item.cout_final ?? item.cout_estime ?? 0), 0);
  }, [filteredReservations]);

  const averageBasket = useMemo(() => {
    const eligible = filteredReservations.filter((item) =>
      isRevenueEligible(item.statut_reservation)
    );

    if (eligible.length === 0) return 0;

    const total = eligible.reduce(
      (sum, item) => sum + Number(item.cout_final ?? item.cout_estime ?? 0),
      0
    );

    return total / eligible.length;
  }, [filteredReservations]);

  const byCompany = useMemo(() => {
    const map = new Map<
      string,
      {
        entrepriseId: string;
        entreprise: string;
        totalReservations: number;
        activeReservations: number;
        pendingValidations: number;
        revenue: number;
      }
    >();

    reservations.forEach((item) => {
      const entrepriseId = item.id_entreprise || 'unknown';
      const entreprise = getCompanyName(item.entreprises);
      const current = map.get(entrepriseId) || {
        entrepriseId,
        entreprise,
        totalReservations: 0,
        activeReservations: 0,
        pendingValidations: 0,
        revenue: 0,
      };

      current.totalReservations += 1;

      if (isActiveReservation(item.statut_reservation)) {
        current.activeReservations += 1;
      }

      if (isPendingValidation(item.statut_validation || item.statut_reservation)) {
        current.pendingValidations += 1;
      }

      if (isRevenueEligible(item.statut_reservation)) {
        current.revenue += Number(item.cout_final ?? item.cout_estime ?? 0);
      }

      map.set(entrepriseId, current);
    });

    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [reservations]);

  const revenueByMonth = useMemo(() => {
    const map = new Map<string, {month: string; revenue: number; count: number}>();

    filteredReservations
      .filter((item) => isRevenueEligible(item.statut_reservation))
      .forEach((item) => {
        const key = getMonthKey(item.date_creation);
        if (!key) return;

        const current = map.get(key) || {
          month: key,
          revenue: 0,
          count: 0,
        };

        current.revenue += Number(item.cout_final ?? item.cout_estime ?? 0);
        current.count += 1;

        map.set(key, current);
      });

    return Array.from(map.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);
  }, [filteredReservations]);

  const maxRevenue = useMemo(() => {
    return Math.max(...revenueByMonth.map((item) => item.revenue), 1);
  }, [revenueByMonth]);

  const latestReservations = useMemo(() => {
    return [...filteredReservations]
      .sort((a, b) => {
        const aTime = a.date_creation ? new Date(a.date_creation).getTime() : 0;
        const bTime = b.date_creation ? new Date(b.date_creation).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 10);
  }, [filteredReservations]);

  const statCards = [
    {
      title: 'Réservations B2B',
      value: String(totalReservations),
      subtitle: viewMode === 'global' ? 'Vue globale' : 'Vue entreprise',
      icon: ClipboardList,
    },
    {
      title: "Chiffre d'affaires B2B",
      value: formatMoney(totalRevenue),
      subtitle: `${formatMoney(currentMonthRevenue)} ce mois`,
      icon: BarChart3,
    },
    {
      title: 'Réservations actives',
      value: String(activeReservations),
      subtitle: 'Validées, confirmées ou en cours',
      icon: CheckCircle2,
    },
    {
      title: 'Validations en attente',
      value: String(pendingValidations),
      subtitle: 'Demandes à traiter',
      icon: Timer,
    },
    {
      title: 'Annulations / refus',
      value: String(cancelledReservations),
      subtitle: 'Réservations non retenues',
      icon: ShieldCheck,
    },
    {
      title: 'Panier moyen B2B',
      value: formatMoney(averageBasket),
      subtitle: 'Sur réservations comptabilisées',
      icon: Building2,
    },
  ];

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700">
              <BarChart3 className="h-4 w-4" />
              Dashboard B2B
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
              Pilotage global B2B
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Cette vue permet d’analyser l’activité B2B de manière globale ou
              entreprise par entreprise, avec suivi des réservations, des
              validations et du chiffre d’affaires.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap xl:justify-end">
            <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => {
                  setViewMode('global');
                  setSelectedEntrepriseId('all');
                }}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  viewMode === 'global'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Vue globale
              </button>

              <button
                type="button"
                onClick={() => setViewMode('company')}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  viewMode === 'company'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Par entreprise
              </button>
            </div>

            <select
              value={selectedEntrepriseId}
              onChange={(e) => setSelectedEntrepriseId(e.target.value)}
              disabled={viewMode !== 'company'}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              {viewMode === 'global' ? (
                <option value="all">Toutes les entreprises</option>
              ) : null}

              {companies.map((company) => (
                <option key={company.id_entreprise} value={company.id_entreprise}>
                  {company.raison_sociale || company.slug || company.id_entreprise}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => loadDashboard(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>

        {selectedCompany ? (
          <div className="mt-5 rounded-2xl bg-slate-50 px-5 py-4">
            <p className="text-sm font-medium text-slate-500">Entreprise sélectionnée</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {selectedCompany.raison_sociale || 'Entreprise inconnue'}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Devise : {selectedCompany.devise || 'MAD'} · Statut :{' '}
              {selectedCompany.statut || '—'}
            </p>
          </div>
        ) : null}

        {error ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {statCards.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-base text-slate-500">{item.title}</p>

                <div className="rounded-2xl bg-slate-50 p-3 text-slate-500">
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <p className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
                {loading ? '...' : item.value}
              </p>

              <p className="mt-2 text-sm text-slate-400">{item.subtitle}</p>
            </div>
          );
        })}
      </div>

      {viewMode === 'global' ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">
                Répartition par entreprise
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Vision consolidée de la performance B2B par compte entreprise.
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-sm uppercase tracking-wide text-slate-400">
                  <th className="pb-2 pr-4">Entreprise</th>
                  <th className="pb-2 pr-4">Réservations</th>
                  <th className="pb-2 pr-4">Actives</th>
                  <th className="pb-2 pr-4">En attente</th>
                  <th className="pb-2 pr-4">CA B2B</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr className="bg-slate-50 text-sm text-slate-700">
                    <td colSpan={5} className="rounded-2xl px-4 py-6 text-center">
                      Chargement...
                    </td>
                  </tr>
                ) : byCompany.length === 0 ? (
                  <tr className="bg-slate-50 text-sm text-slate-700">
                    <td colSpan={5} className="rounded-2xl px-4 py-6 text-center">
                      Aucune donnée entreprise disponible.
                    </td>
                  </tr>
                ) : (
                  byCompany.map((item) => (
                    <tr key={item.entrepriseId} className="bg-slate-50 text-sm text-slate-700">
                      <td className="rounded-l-2xl px-4 py-4 font-semibold text-slate-950">
                        {item.entreprise}
                      </td>
                      <td className="px-4 py-4">{item.totalReservations}</td>
                      <td className="px-4 py-4">{item.activeReservations}</td>
                      <td className="px-4 py-4">{item.pendingValidations}</td>
                      <td className="rounded-r-2xl px-4 py-4 font-semibold text-slate-950">
                        {formatMoney(item.revenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-950">
            Tendance du chiffre d’affaires
          </h2>

          <div className="mt-8 space-y-5">
            {loading ? (
              <p className="text-sm text-slate-500">Chargement...</p>
            ) : revenueByMonth.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune donnée disponible.</p>
            ) : (
              revenueByMonth.map((item) => (
                <div key={item.month} className="flex items-center gap-6">
                  <span className="w-24 shrink-0 text-2xl text-slate-500">
                    {item.month}
                  </span>

                  <div className="h-8 flex-1 rounded-full bg-slate-100">
                    <div
                      className="flex h-8 items-center justify-end rounded-full bg-violet-500 px-4 text-sm font-bold text-white"
                      style={{
                        width: `${Math.max(12, (item.revenue / maxRevenue) * 100)}%`,
                      }}
                    >
                      {Math.round(item.revenue)}
                    </div>
                  </div>

                  <span className="w-10 text-right text-xl text-slate-400">
                    {item.count}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-950">
            Dernières réservations B2B
          </h2>

          <div className="mt-6 space-y-4">
            {loading ? (
              <p className="text-sm text-slate-500">Chargement...</p>
            ) : latestReservations.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune réservation trouvée.</p>
            ) : (
              latestReservations.map((item) => (
                <div
                  key={item.id_reservation_entreprise}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {item.id_reservation_entreprise}
                      </p>
                      <p className="text-sm text-slate-600">
                        {getCompanyName(item.entreprises)}
                      </p>
                      <p className="text-sm text-slate-500">
                        {getCollaboratorName(item)} · {getVehicleLabel(item)}
                      </p>
                      <p className="text-xs text-slate-400">
                        Créée le {formatDateTime(item.date_creation)}
                      </p>
                    </div>

                    <div className="flex flex-col items-start gap-2 lg:items-end">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                          item.statut_reservation
                        )}`}
                      >
                        {getStatusLabel(item.statut_reservation)}
                      </span>

                      <span className="text-sm text-slate-500">
                        Validation : {getStatusLabel(item.statut_validation)}
                      </span>

                      <span className="text-sm font-semibold text-slate-950">
                        {formatMoney(item.cout_final ?? item.cout_estime ?? 0)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-950">
          Détail des réservations
        </h2>

        <div className="mt-8 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-sm uppercase tracking-wide text-slate-400">
                <th className="pb-2 pr-4">Réservation</th>
                <th className="pb-2 pr-4">Entreprise</th>
                <th className="pb-2 pr-4">Demandeur</th>
                <th className="pb-2 pr-4">Véhicule</th>
                <th className="pb-2 pr-4">Départ</th>
                <th className="pb-2 pr-4">Retour</th>
                <th className="pb-2 pr-4">Montant</th>
                <th className="pb-2 pr-4">Statut</th>
                <th className="pb-2 pr-4">Validation</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr className="bg-slate-50 text-sm text-slate-700">
                  <td colSpan={9} className="rounded-2xl px-4 py-6 text-center">
                    Chargement...
                  </td>
                </tr>
              ) : filteredReservations.length === 0 ? (
                <tr className="bg-slate-50 text-sm text-slate-700">
                  <td colSpan={9} className="rounded-2xl px-4 py-6 text-center">
                    Aucune réservation B2B trouvée.
                  </td>
                </tr>
              ) : (
                filteredReservations.map((item) => (
                  <tr
                    key={item.id_reservation_entreprise}
                    className="bg-slate-50 text-sm text-slate-700"
                  >
                    <td className="rounded-l-2xl px-4 py-4 font-semibold text-slate-950">
                      {item.id_reservation_entreprise}
                    </td>
                    <td className="px-4 py-4">{getCompanyName(item.entreprises)}</td>
                    <td className="px-4 py-4">{getCollaboratorName(item)}</td>
                    <td className="px-4 py-4">{getVehicleLabel(item)}</td>
                    <td className="px-4 py-4">{formatDate(item.date_dep)}</td>
                    <td className="px-4 py-4">{formatDate(item.date_ret)}</td>
                    <td className="px-4 py-4 font-semibold text-slate-950">
                      {formatMoney(item.cout_final ?? item.cout_estime ?? 0)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                          item.statut_reservation
                        )}`}
                      >
                        {getStatusLabel(item.statut_reservation)}
                      </span>
                    </td>
                    <td className="rounded-r-2xl px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                          item.statut_validation
                        )}`}
                      >
                        {getStatusLabel(item.statut_validation)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}