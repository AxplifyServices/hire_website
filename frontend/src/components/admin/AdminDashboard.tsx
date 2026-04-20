'use client';

import {useEffect, useMemo, useState} from 'react';
import {
  BarChart3,
  ClipboardList,
  RefreshCcw,
  ShoppingCart,
  Users,
  XCircle
} from 'lucide-react';
import type {
  AdminB2BReservation,
  AdminReservation,
  AdminReservationsListResponse
} from '@/lib/types';
import {
  fetchAdminB2BReservations,
  fetchAdminClients,
  fetchAdminReservations
} from '@/lib/api';

type DashboardState = {
  b2cReservations: AdminReservation[];
  b2cTotal: number;
  b2bReservations: AdminB2BReservation[];
  b2bTotal: number;
  clientsTotal: number;
  abandonedCartsTotal: number;
};

type LatestReservationRow = {
  id: string;
  client: string;
  email: string;
  amount: number;
  currency: string;
  status: string;
  date: string | null;
  source: 'B2C' | 'B2B';
};

function normalizeStatus(status?: string | null) {
  return (status || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

function formatStatusLabel(status?: string | null) {
  const normalized = normalizeStatus(status);

  const map: Record<string, string> = {
    EN_ATTENTE_PAIEMENT: 'En attente paiement',
    EN_ATTENTE_VALIDATION: 'En attente validation',
    EN_ATTENTE: 'En attente',
    VALIDEE: 'Validée',
    CONFIRMEE: 'Confirmée',
    EN_COURS: 'En cours',
    TERMINEE: 'Terminée',
    TERMINE: 'Terminée',
    ANNULEE: 'Annulée',
    ANNULEE_: 'Annulée',
    REFUSEE: 'Refusée'
  };

  return map[normalized] || status || '—';
}

function getStatusBadgeClass(status?: string | null) {
  const normalized = normalizeStatus(status);

  if (normalized === 'EN_COURS') {
    return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';
  }

  if (normalized === 'VALIDEE' || normalized === 'CONFIRMEE') {
    return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
  }

  if (normalized === 'EN_ATTENTE_VALIDATION' || normalized === 'EN_ATTENTE') {
    return 'bg-sky-50 text-sky-700 ring-1 ring-sky-200';
  }

  if (normalized === 'TERMINEE' || normalized === 'TERMINE') {
    return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200';
  }

  if (normalized === 'ANNULEE' || normalized === 'REFUSEE') {
    return 'bg-rose-50 text-rose-700 ring-1 ring-rose-200';
  }

  return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200';
}

function formatCurrency(value: number, currency = 'MAD') {
  return `${value.toFixed(2)} ${currency}`;
}

function formatCompactCurrency(value: number) {
  return `${Math.round(value)} MAD`;
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

function getB2CClientLabel(item: AdminReservation) {
  const fullName = [item.clients?.prenom, item.clients?.nom]
    .filter(Boolean)
    .join(' ')
    .trim();

  if (fullName) return fullName;

  const snapshot = [item.prenom_snapshot, item.nom_snapshot]
    .filter(Boolean)
    .join(' ')
    .trim();

  if (snapshot) return snapshot;

  return item.mail_snapshot || item.clients?.mail || 'Client non renseigné';
}

function getB2CClientEmail(item: AdminReservation) {
  return item.mail_snapshot || item.clients?.mail || '—';
}

function getB2BCollaborateurLabel(
  item?: AdminB2BReservation['clients_entreprises_reservations_entreprises_id_client_entreprise_demandeurToclients_entreprises'] | null
) {
  const fullName = [item?.clients?.prenom, item?.clients?.nom]
    .filter(Boolean)
    .join(' ')
    .trim();

  return fullName || item?.clients?.mail || 'Collaborateur non renseigné';
}

function getB2BCollaborateurEmail(
  item?: AdminB2BReservation['clients_entreprises_reservations_entreprises_id_client_entreprise_demandeurToclients_entreprises'] | null
) {
  return item?.clients?.mail || '—';
}

function isCancelledStatus(status?: string | null) {
  const normalized = normalizeStatus(status);
  return normalized === 'ANNULEE' || normalized === 'REFUSEE';
}

function isActiveStatus(status?: string | null) {
  const normalized = normalizeStatus(status);
  return ['VALIDEE', 'CONFIRMEE', 'EN_COURS'].includes(normalized);
}

function isPendingB2B(status?: string | null, validationStatus?: string | null) {
  const reservationStatus = normalizeStatus(status);
  const validation = normalizeStatus(validationStatus);

  return (
    reservationStatus === 'EN_ATTENTE_VALIDATION' ||
    validation === 'EN_ATTENTE'
  );
}

function isB2CRevenueEligible(status?: string | null, isAbandoned?: boolean | null) {
  if (isAbandoned) return false;

  const normalized = normalizeStatus(status);

  return ['VALIDEE', 'CONFIRMEE', 'EN_COURS', 'TERMINEE', 'TERMINE'].includes(
    normalized
  );
}

function isB2BRevenueEligible(status?: string | null) {
  const normalized = normalizeStatus(status);

  return ['VALIDEE', 'CONFIRMEE', 'EN_COURS', 'TERMINEE', 'TERMINE'].includes(
    normalized
  );
}

function getMonthKey(dateValue?: string | null) {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;

  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}`;
}

function buildLatestRows(
  b2cReservations: AdminReservation[],
  b2bReservations: AdminB2BReservation[]
): LatestReservationRow[] {
  const b2cRows: LatestReservationRow[] = b2cReservations.map((item) => ({
    id: item.id_reservation,
    client: getB2CClientLabel(item),
    email: getB2CClientEmail(item),
    amount: Number(item.prix_final ?? 0),
    currency: item.devise || 'MAD',
    status: item.status || '—',
    date: item.date_creation,
    source: 'B2C'
  }));

  const b2bRows: LatestReservationRow[] = b2bReservations.map((item) => ({
    id: item.id_reservation_entreprise,
    client: getB2BCollaborateurLabel(
      item.clients_entreprises_reservations_entreprises_id_client_entreprise_demandeurToclients_entreprises
    ),
    email: getB2BCollaborateurEmail(
      item.clients_entreprises_reservations_entreprises_id_client_entreprise_demandeurToclients_entreprises
    ),
    amount: Number(item.cout_final ?? 0),
    currency: 'MAD',
    status: item.statut_reservation || '—',
    date: item.date_creation,
    source: 'B2B'
  }));

  return [...b2cRows, ...b2bRows]
    .sort((a, b) => {
      const aTime = a.date ? new Date(a.date).getTime() : 0;
      const bTime = b.date ? new Date(b.date).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 8);
}

async function fetchAllAdminReservations(): Promise<AdminReservationsListResponse> {
  const limit = 100;
  let page = 1;
  let total = 0;
  let totalPages = 1;
  const allData: AdminReservation[] = [];

  do {
    const response = await fetchAdminReservations({
      page,
      limit,
      include_incomplete: 'false'
    });

    allData.push(...(response.data || []));
    total = response.pagination?.total ?? response.total ?? allData.length;
    totalPages =
      response.pagination?.total_pages ??
      response.total_pages ??
      Math.max(Math.ceil(total / limit), 1);

    page += 1;
  } while (page <= totalPages);

  return {
    data: allData,
    page: 1,
    limit: allData.length || limit,
    total,
    total_pages: totalPages,
    pagination: {
      page: 1,
      limit: allData.length || limit,
      total,
      total_pages: totalPages,
      has_next: false,
      has_prev: false
    },
    filters: {
      include_incomplete: false,
      status: null,
      search: null,
      mail: null
    }
  };
}

export default function AdminDashboard() {
  const [state, setState] = useState<DashboardState>({
    b2cReservations: [],
    b2cTotal: 0,
    b2bReservations: [],
    b2bTotal: 0,
    clientsTotal: 0,
    abandonedCartsTotal: 0
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadDashboard(silent = false) {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const [
        reservationsB2CResponse,
        clientsResponse,
        abandonedResponse,
        reservationsB2BResponse
      ] = await Promise.all([
        fetchAllAdminReservations(),
        fetchAdminClients({
          page: 1,
          limit: 1
        }),
        fetchAdminReservations({
          page: 1,
          limit: 1,
          is_abandoned: 'true',
          include_incomplete: 'true'
        }),
        fetchAdminB2BReservations()
      ]);

      setState({
        b2cReservations: reservationsB2CResponse.data || [],
        b2cTotal: reservationsB2CResponse.pagination?.total ?? 0,
        b2bReservations: reservationsB2BResponse.data || [],
        b2bTotal: reservationsB2BResponse.meta?.total ?? 0,
        clientsTotal: clientsResponse.pagination?.total ?? 0,
        abandonedCartsTotal: abandonedResponse.pagination?.total ?? 0
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible de charger le tableau de bord.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const totalReservations = state.b2cTotal + state.b2bTotal;

  const activeReservations = useMemo(() => {
    const b2cActive = state.b2cReservations.filter((item) =>
      isActiveStatus(item.status)
    ).length;

    const b2bActive = state.b2bReservations.filter((item) =>
      isActiveStatus(item.statut_reservation)
    ).length;

    return b2cActive + b2bActive;
  }, [state.b2cReservations, state.b2bReservations]);

  const totalRevenue = useMemo(() => {
    const b2cRevenue = state.b2cReservations
      .filter((item) => isB2CRevenueEligible(item.status, item.is_abandoned))
      .reduce((sum, item) => sum + Number(item.prix_final ?? 0), 0);

    const b2bRevenue = state.b2bReservations
      .filter((item) => isB2BRevenueEligible(item.statut_reservation))
      .reduce((sum, item) => sum + Number(item.cout_final ?? 0), 0);

    return b2cRevenue + b2bRevenue;
  }, [state.b2cReservations, state.b2bReservations]);

  const currentMonthRevenue = useMemo(() => {
    const now = new Date();
    const key = `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, '0')}`;

    const b2cRevenue = state.b2cReservations
      .filter(
        (item) =>
          isB2CRevenueEligible(item.status, item.is_abandoned) &&
          getMonthKey(item.date_creation) === key
      )
      .reduce((sum, item) => sum + Number(item.prix_final ?? 0), 0);

    const b2bRevenue = state.b2bReservations
      .filter(
        (item) =>
          isB2BRevenueEligible(item.statut_reservation) &&
          getMonthKey(item.date_creation) === key
      )
      .reduce((sum, item) => sum + Number(item.cout_final ?? 0), 0);

    return b2cRevenue + b2bRevenue;
  }, [state.b2cReservations, state.b2bReservations]);

  const pendingB2BRequests = useMemo(() => {
    return state.b2bReservations.filter((item) =>
      isPendingB2B(item.statut_reservation, item.statut_validation)
    ).length;
  }, [state.b2bReservations]);

  const totalCancellations = useMemo(() => {
    const b2cCancelled = state.b2cReservations.filter((item) =>
      isCancelledStatus(item.status)
    ).length;

    const b2bCancelled = state.b2bReservations.filter((item) =>
      isCancelledStatus(item.statut_reservation)
    ).length;

    return b2cCancelled + b2bCancelled;
  }, [state.b2cReservations, state.b2bReservations]);

  const conversionRate = useMemo(() => {
    const denominator = totalReservations + state.abandonedCartsTotal;
    if (!denominator) return 0;
    return (totalReservations / denominator) * 100;
  }, [totalReservations, state.abandonedCartsTotal]);

  const revenueByMonth = useMemo(() => {
    const map = new Map<string, {revenue: number; count: number}>();

    state.b2cReservations
      .filter((item) => isB2CRevenueEligible(item.status, item.is_abandoned))
      .forEach((item) => {
        const key = getMonthKey(item.date_creation);
        if (!key) return;
        const current = map.get(key) ?? {revenue: 0, count: 0};
        current.revenue += Number(item.prix_final ?? 0);
        current.count += 1;
        map.set(key, current);
      });

    state.b2bReservations
      .filter((item) => isB2BRevenueEligible(item.statut_reservation))
      .forEach((item) => {
        const key = getMonthKey(item.date_creation);
        if (!key) return;
        const current = map.get(key) ?? {revenue: 0, count: 0};
        current.revenue += Number(item.cout_final ?? 0);
        current.count += 1;
        map.set(key, current);
      });

    return Array.from(map.entries())
      .map(([month, values]) => ({
        month,
        revenue: values.revenue,
        count: values.count
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);
  }, [state.b2cReservations, state.b2bReservations]);

  const maxMonthlyRevenue = useMemo(() => {
    return Math.max(...revenueByMonth.map((item) => item.revenue), 1);
  }, [revenueByMonth]);

  const statusDistribution = useMemo(() => {
    const map = new Map<string, number>();

    state.b2cReservations.forEach((item) => {
      const label = formatStatusLabel(item.status);
      map.set(label, (map.get(label) ?? 0) + 1);
    });

    state.b2bReservations.forEach((item) => {
      const label = formatStatusLabel(item.statut_reservation);
      map.set(label, (map.get(label) ?? 0) + 1);
    });

    return Array.from(map.entries())
      .map(([label, count]) => ({label, count}))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [state.b2cReservations, state.b2bReservations]);

  const latestReservations = useMemo(() => {
    return buildLatestRows(state.b2cReservations, state.b2bReservations);
  }, [state.b2cReservations, state.b2bReservations]);

  const statCards = [
    {
      title: 'Réservations totales',
      value: String(totalReservations),
      subtitle: `${activeReservations} actives`,
      icon: ClipboardList
    },
    {
      title: "Chiffre d'affaires total",
      value: formatCompactCurrency(totalRevenue),
      subtitle: `${formatCompactCurrency(currentMonthRevenue)} ce mois`,
      icon: BarChart3
    },
    {
      title: 'Clients inscrits',
      value: String(state.clientsTotal),
      subtitle: 'Tous les utilisateurs',
      icon: Users
    },
    {
      title: 'Demandes B2B',
      value: String(pendingB2BRequests),
      subtitle: 'En attente',
      icon: ClipboardList
    },
    {
      title: 'Paniers abandonnés',
      value: String(state.abandonedCartsTotal),
      subtitle: 'Non convertis',
      icon: ShoppingCart
    },
    {
      title: 'Annulations',
      value: String(totalCancellations),
      subtitle: 'Total annulées',
      icon: XCircle
    },
    {
      title: 'Taux de conversion',
      value: `${conversionRate.toFixed(0)}%`,
      subtitle: 'Réservations / (Réservations + Paniers)',
      icon: BarChart3
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => loadDashboard(true)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
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
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-950">
            Tendance du chiffre d'affaires
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
                      className="flex h-8 items-center justify-end rounded-full bg-cyan-500 px-4 text-lg font-bold text-white"
                      style={{
                        width: `${Math.max(
                          12,
                          (item.revenue / maxMonthlyRevenue) * 100
                        )}%`
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
          <h2 className="text-2xl font-bold text-slate-950">Répartition par statut</h2>

          <div className="mt-8 space-y-4">
            {loading ? (
              <p className="text-sm text-slate-500">Chargement...</p>
            ) : statusDistribution.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune donnée disponible.</p>
            ) : (
              statusDistribution.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl bg-slate-50 px-5 py-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="h-4 w-4 rounded-full bg-cyan-500" />
                      <span className="text-2xl font-medium text-slate-900">
                        {item.label}
                      </span>
                    </div>

                    <span className="text-3xl font-bold text-slate-950">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-950">Dernières réservations</h2>

        <div className="mt-8 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-sm uppercase tracking-wide text-slate-400">
                <th className="pb-2 pr-4">ID</th>
                <th className="pb-2 pr-4">Client</th>
                <th className="pb-2 pr-4">Email</th>
                <th className="pb-2 pr-4">Montant</th>
                <th className="pb-2 pr-4">Statut</th>
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 pr-4">Source</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr className="rounded-2xl bg-slate-50 text-sm text-slate-700">
                  <td colSpan={7} className="rounded-2xl px-4 py-6 text-center">
                    Chargement...
                  </td>
                </tr>
              ) : latestReservations.length === 0 ? (
                <tr className="rounded-2xl bg-slate-50 text-sm text-slate-700">
                  <td colSpan={7} className="rounded-2xl px-4 py-6 text-center">
                    Aucune réservation trouvée.
                  </td>
                </tr>
              ) : (
                latestReservations.map((item) => (
                  <tr key={`${item.source}-${item.id}`} className="rounded-2xl bg-slate-50 text-sm text-slate-700">
                    <td className="rounded-l-2xl px-4 py-4 font-semibold text-slate-950">
                      {item.id}
                    </td>
                    <td className="px-4 py-4">{item.client}</td>
                    <td className="px-4 py-4">{item.email}</td>
                    <td className="px-4 py-4 font-semibold text-slate-950">
                      {formatCurrency(item.amount, item.currency)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                          item.status
                        )}`}
                      >
                        {formatStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4">{formatDate(item.date)}</td>
                    <td className="rounded-r-2xl px-4 py-4">
                      <span className="inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                        {item.source}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}