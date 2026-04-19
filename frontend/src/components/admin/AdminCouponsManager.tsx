'use client';

import {useEffect, useMemo, useState} from 'react';
import {Pencil, Plus, Percent, RefreshCcw, Search, Trash2, X} from 'lucide-react';
import type {AdminCoupon, AdminCouponsListResponse} from '@/lib/types';
import {
  createAdminCoupon,
  deleteAdminCoupon,
  fetchAdminCoupons,
  updateAdminCoupon
} from '@/lib/api';

type CouponFormState = {
  code: string;
  type_promo: string;
  valeur_promo: string;
  status: string;
  date_fin_validite: string;
  nb_max_utilisation: string;
};

const initialForm: CouponFormState = {
  code: '',
  type_promo: 'Pourcentage',
  valeur_promo: '',
  status: 'Valide',
  date_fin_validite: '',
  nb_max_utilisation: ''
};

function toForm(coupon: AdminCoupon): CouponFormState {
  return {
    code: coupon.code ?? '',
    type_promo: coupon.type_promo ?? 'Pourcentage',
    valeur_promo:
      coupon.valeur_promo !== null && coupon.valeur_promo !== undefined
        ? String(coupon.valeur_promo)
        : '',
    status: coupon.status ?? 'Valide',
    date_fin_validite: coupon.date_fin_validite
      ? new Date(coupon.date_fin_validite).toISOString().slice(0, 10)
      : '',
    nb_max_utilisation:
      coupon.nb_max_utilisation !== null && coupon.nb_max_utilisation !== undefined
        ? String(coupon.nb_max_utilisation)
        : ''
  };
}

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

function formatValue(typePromo?: string | null, value?: number | string | null) {
  if (value === null || value === undefined || value === '') return '—';
  const amount = Number(value);
  if (Number.isNaN(amount)) return '—';
  return typePromo === 'Pourcentage' ? `${amount}%` : `${amount} MAD`;
}

export default function AdminCouponsManager() {
  const [response, setResponse] = useState<AdminCouponsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<AdminCoupon | null>(null);
  const [form, setForm] = useState<CouponFormState>(initialForm);

  const items = response?.data ?? [];
  const pagination = response?.pagination;
  const totalCoupons = pagination?.total ?? 0;
  const totalPages = Math.max(pagination?.total_pages ?? 1, 1);

  const modalTitle = useMemo(
    () => (editingCoupon ? 'Modifier le coupon' : 'Créer un coupon'),
    [editingCoupon]
  );

  async function loadCoupons(nextPage = page, silent = false) {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const result = await fetchAdminCoupons({
        page: nextPage,
        limit: 10,
        search,
        status: statusFilter || undefined,
        type_promo: typeFilter || undefined
      });

      setResponse(result);
      setPage(result.pagination.page);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Impossible de charger les coupons.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadCoupons(1);
  }, [search, statusFilter, typeFilter]);

  function openCreateModal() {
    setEditingCoupon(null);
    setForm(initialForm);
    setError(null);
    setSuccess(null);
    setModalOpen(true);
  }

  function openEditModal(coupon: AdminCoupon) {
    setEditingCoupon(coupon);
    setForm(toForm(coupon));
    setError(null);
    setSuccess(null);
    setModalOpen(true);
  }

  function closeModal() {
    if (submitting) return;
    setModalOpen(false);
    setEditingCoupon(null);
    setForm(initialForm);
  }

  function handleChange<K extends keyof CouponFormState>(
    key: K,
    value: CouponFormState[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const code = form.code.trim().toUpperCase();
    const valeurPromo = Number(form.valeur_promo);
    const nbMaxUtilisation =
      form.nb_max_utilisation.trim() === ''
        ? null
        : Number(form.nb_max_utilisation);

    if (!code) {
      setError('Veuillez renseigner un code.');
      return;
    }

    if (!form.type_promo) {
      setError('Veuillez sélectionner un type.');
      return;
    }

    if (Number.isNaN(valeurPromo) || valeurPromo < 0) {
      setError('Veuillez renseigner une valeur promo valide.');
      return;
    }

    if (form.type_promo === 'Pourcentage' && valeurPromo > 100) {
      setError('Un pourcentage ne peut pas dépasser 100.');
      return;
    }

    if (
      nbMaxUtilisation !== null &&
      (Number.isNaN(nbMaxUtilisation) || nbMaxUtilisation < 0)
    ) {
      setError("Le maximum d'utilisations est invalide.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const payload = {
        code,
        type_promo: form.type_promo,
        valeur_promo: valeurPromo,
        status: form.status,
        date_fin_validite: form.date_fin_validite || undefined,
        nb_max_utilisation: nbMaxUtilisation
      };

      const response = editingCoupon
        ? await updateAdminCoupon(editingCoupon.id_coupon, payload)
        : await createAdminCoupon(payload);

      const savedCoupon = response.coupon;

      if (editingCoupon) {
        setResponse((current) => {
          if (!current) return current;
          return {
            ...current,
            data: current.data.map((item) =>
              item.id_coupon === savedCoupon.id_coupon ? savedCoupon : item
            )
          };
        });
      } else {
        setResponse((current) => {
          if (!current) return current;
          return {
            ...current,
            data: [savedCoupon, ...current.data].slice(0, current.pagination.limit),
            pagination: {
              ...current.pagination,
              total: current.pagination.total + 1,
              total_pages: Math.max(
                Math.ceil((current.pagination.total + 1) / current.pagination.limit),
                1
              ),
              has_next: true
            }
          };
        });
      }

      setSuccess(response.message);
      closeModal();
      loadCoupons(editingCoupon ? page : 1, true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Impossible d’enregistrer le coupon.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(coupon: AdminCoupon) {
    const confirmed = window.confirm(
      `Supprimer définitivement le coupon "${coupon.code}" ?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(coupon.id_coupon);
      setError(null);
      setSuccess(null);

      const response = await deleteAdminCoupon(coupon.id_coupon);

      setResponse((current) => {
        if (!current) return current;
        const nextData = current.data.filter(
          (item) => item.id_coupon !== coupon.id_coupon
        );
        const nextTotal = Math.max(current.pagination.total - 1, 0);

        return {
          ...current,
          data: nextData,
          pagination: {
            ...current.pagination,
            total: nextTotal,
            total_pages: Math.max(
              Math.ceil(nextTotal / current.pagination.limit),
              1
            ),
            has_next: current.pagination.page * current.pagination.limit < nextTotal
          }
        };
      });

      setSuccess(response.message);
      loadCoupons(page, true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Impossible de supprimer le coupon.'
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700">
              <Percent className="h-4 w-4" />
              Coupons
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
              Gestion des coupons
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Création, modification et suppression des coupons promotionnels.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => loadCoupons(page, true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#081a33] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0d2547]"
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px_220px_160px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setSearch(searchInput.trim());
              }}
              placeholder="Rechercher par ID ou code..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-cyan-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500"
          >
            <option value="">Tous les statuts</option>
            <option value="Valide">Valide</option>
            <option value="Invalide">Invalide</option>
          </select>

            <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500"
            >
            <option value="">Tous les types</option>
            <option value="Pourcentage">Pourcentage</option>
            <option value="Fixe">Fixe</option>
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
          <p className="text-sm text-slate-500">Total coupons</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {pagination?.total ?? 0}
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
                <th className="px-6 py-4">Coupon</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Valeur</th>
                <th className="px-6 py-4">Utilisation</th>
                <th className="px-6 py-4">Validité</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">
                    Chargement des coupons...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">
                    Aucun coupon trouvé.
                  </td>
                </tr>
              ) : (
                items.map((coupon) => (
                  <tr key={coupon.id_coupon} className="align-top">
                    <td className="px-6 py-5">
                      <p className="font-semibold text-slate-900">{coupon.code || '—'}</p>
                      <p className="mt-1 text-sm text-slate-500">{coupon.id_coupon}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Créé le {formatDate(coupon.date_creation)}
                      </p>
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-700">
                      {coupon.type_promo || '—'}
                    </td>

                    <td className="px-6 py-5 text-sm font-medium text-slate-900">
                      {formatValue(coupon.type_promo, coupon.valeur_promo)}
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-700">
                      <p>{coupon.count_use ?? 0} utilisation(s)</p>
                      <p className="mt-1 text-slate-500">
                        Max : {coupon.nb_max_utilisation ?? 'Illimité'}
                      </p>
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-700">
                      {formatDate(coupon.date_fin_validite)}
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          coupon.status === 'Valide'
                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                            : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'
                        }`}
                      >
                        {coupon.status || '—'}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(coupon)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          <Pencil className="h-4 w-4" />
                          Modifier
                        </button>

                        <button
                          type="button"
                          disabled={deletingId === coupon.id_coupon}
                          onClick={() => handleDelete(coupon)}
                          className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                        >
                          <Trash2 className="h-4 w-4" />
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            {totalCoupons} coupon{totalCoupons > 1 ? 's' : ''} trouvé{totalCoupons > 1 ? 's' : ''}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => loadCoupons(page - 1)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Précédent
            </button>

            <span className="px-3 text-sm text-slate-600">
              Page {page} / {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => loadCoupons(page + 1)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6">
          <div className="w-full max-w-2xl rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-sm font-medium text-cyan-700">Paramétrage promotionnel</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                  {modalTitle}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Code</label>
                  <input
                    value={form.code}
                    onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                    placeholder="SUMMER2026"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Type</label>
                    <select
                    value={form.type_promo}
                    onChange={(e) => handleChange('type_promo', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500"
                    >
                    <option value="Pourcentage">Pourcentage</option>
                    <option value="Fixe">Fixe</option>
                    </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Valeur promo</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.valeur_promo}
                    onChange={(e) => handleChange('valeur_promo', e.target.value)}
                    placeholder={form.type_promo === 'Pourcentage' ? '10' : '100'}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Statut</label>
                  <select
                    value={form.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500"
                  >
                    <option value="Valide">Valide</option>
                    <option value="Invalide">Invalide</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Date fin validité</label>
                  <input
                    type="date"
                    value={form.date_fin_validite}
                    onChange={(e) => handleChange('date_fin_validite', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Maximum d’utilisations
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.nb_max_utilisation}
                    onChange={(e) => handleChange('nb_max_utilisation', e.target.value)}
                    placeholder="Laisser vide pour illimité"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-2xl bg-[#081a33] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0d2547] disabled:opacity-60"
                >
                  {submitting ? 'Enregistrement...' : editingCoupon ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}