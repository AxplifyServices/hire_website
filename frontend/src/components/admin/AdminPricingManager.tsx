'use client';

import {useEffect, useMemo, useState} from 'react';
import {BadgePercent, Pencil, Plus, RefreshCcw, Search, Tags, Trash2, X} from 'lucide-react';
import type {AdminPricing, AdminPricingListResponse} from '@/lib/types';
import {
  createAdminPricing,
  deleteAdminPricing,
  fetchAdminPricing,
  updateAdminPricing
} from '@/lib/api';

type PricingFormState = {
  nom: string;
  qualificatif: string;
  description: string;
  avantages: string;
  discount_rate: string;
};

const initialForm: PricingFormState = {
  nom: '',
  qualificatif: '',
  description: '',
  avantages: '',
  discount_rate: ''
};

function toForm(pricing: AdminPricing): PricingFormState {
  return {
    nom: pricing.nom ?? '',
    qualificatif: pricing.qualificatif ?? '',
    description: pricing.description ?? '',
    avantages: (pricing.avantages ?? []).join('\n'),
    discount_rate:
      pricing.discount_rate !== null && pricing.discount_rate !== undefined
        ? String(pricing.discount_rate)
        : ''
  };
}

function formatDiscount(value?: number | string | null) {
  if (value === null || value === undefined || value === '') return '—';
  const amount = Number(value);
  if (Number.isNaN(amount)) return '—';
  return `${amount.toFixed(2)} %`;
}

function parseAdvantages(value: string) {
  return value
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function AdminPricingManager() {
  const [response, setResponse] = useState<AdminPricingListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPricing, setEditingPricing] = useState<AdminPricing | null>(null);
  const [form, setForm] = useState<PricingFormState>(initialForm);

  const items = response?.data ?? [];
  const pagination = response?.pagination;
  const totalPricing = pagination?.total ?? 0;
  const totalPages = Math.max(pagination?.total_pages ?? 1, 1);

  const modalTitle = useMemo(
    () => (editingPricing ? 'Modifier la tarification' : 'Créer une tarification'),
    [editingPricing]
  );

  async function loadPricing(nextPage = page, silent = false) {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const result = await fetchAdminPricing({
        page: nextPage,
        limit: 10,
        search
      });

      setResponse(result);
      setPage(result.pagination.page);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Impossible de charger les tarifications.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadPricing(1);
  }, [search]);

  function openCreateModal() {
    setEditingPricing(null);
    setForm(initialForm);
    setError(null);
    setSuccess(null);
    setModalOpen(true);
  }

  function openEditModal(pricing: AdminPricing) {
    setEditingPricing(pricing);
    setForm(toForm(pricing));
    setError(null);
    setSuccess(null);
    setModalOpen(true);
  }

  function closeModal() {
    if (submitting) return;
    setModalOpen(false);
    setEditingPricing(null);
    setForm(initialForm);
  }

  function handleChange<K extends keyof PricingFormState>(
    key: K,
    value: PricingFormState[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const nom = form.nom.trim();
    const discountRate = Number(form.discount_rate);

    if (!nom) {
      setError('Veuillez renseigner un nom.');
      return;
    }

    if (Number.isNaN(discountRate) || discountRate < 0 || discountRate > 100) {
      setError('Veuillez renseigner un taux de remise valide entre 0 et 100.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const payload = {
        nom,
        qualificatif: form.qualificatif.trim() || undefined,
        description: form.description.trim() || undefined,
        avantages: parseAdvantages(form.avantages),
        discount_rate: discountRate
      };

      const response = editingPricing
        ? await updateAdminPricing(editingPricing.id_tarification, payload)
        : await createAdminPricing(payload);

      const savedPricing = response.tarification;

      if (editingPricing) {
        setResponse((current) => {
          if (!current) return current;
          return {
            ...current,
            data: current.data.map((item) =>
              item.id_tarification === savedPricing.id_tarification ? savedPricing : item
            )
          };
        });
      } else {
        setResponse((current) => {
          if (!current) return current;
          return {
            ...current,
            data: [savedPricing, ...current.data].slice(0, current.pagination.limit),
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
      loadPricing(editingPricing ? page : 1, true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible d’enregistrer la tarification.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(pricing: AdminPricing) {
    const confirmed = window.confirm(
      `Supprimer définitivement la tarification "${pricing.nom}" ?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(pricing.id_tarification);
      setError(null);
      setSuccess(null);

      const response = await deleteAdminPricing(pricing.id_tarification);

      setResponse((current) => {
        if (!current) return current;
        const nextData = current.data.filter(
          (item) => item.id_tarification !== pricing.id_tarification
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
      loadPricing(page, true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible de supprimer la tarification.'
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
              Gestion de la tarification
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
              Tarification
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Création, modification et suppression des formules tarifaires appliquées aux réservations.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => loadPricing(page, true)}
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

        <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_160px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setSearch(searchInput.trim());
              }}
              placeholder="Rechercher par ID, nom, description, qualificatif..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-cyan-500"
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
          <p className="text-sm text-slate-500">Total tarifications</p>
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
                <th className="px-6 py-4">Tarification</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Avantages</th>
                <th className="px-6 py-4">Remise</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                    Chargement des tarifications...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                    Aucune tarification trouvée.
                  </td>
                </tr>
              ) : (
                items.map((pricing) => (
                  <tr key={pricing.id_tarification} className="align-top">
                    <td className="px-6 py-5">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                          <Tags className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{pricing.nom || '—'}</p>
                          <p className="mt-1 text-sm text-slate-500">{pricing.id_tarification}</p>
                          <p className="mt-1 text-sm text-slate-600">{pricing.qualificatif || '—'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-700">
                      {pricing.description || '—'}
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-700">
                      {pricing.avantages?.length ? (
                        <ul className="space-y-1">
                          {pricing.avantages.map((advantage, index) => (
                            <li key={`${pricing.id_tarification}-${index}`}>• {advantage}</li>
                          ))}
                        </ul>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="px-6 py-5 text-sm font-medium text-slate-900">
                      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                        <BadgePercent className="h-4 w-4" />
                        {formatDiscount(pricing.discount_rate)}
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(pricing)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          <Pencil className="h-4 w-4" />
                          Modifier
                        </button>

                        <button
                          type="button"
                          disabled={deletingId === pricing.id_tarification}
                          onClick={() => handleDelete(pricing)}
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
            {totalPricing} tarification{totalPricing > 1 ? 's' : ''} trouvée{totalPricing > 1 ? 's' : ''}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => loadPricing(page - 1)}
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
              onClick={() => loadPricing(page + 1)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6">
          <div className="w-full max-w-3xl rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-sm font-medium text-cyan-700">Paramétrage tarification</p>
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
                  <label className="text-sm font-medium text-slate-700">Nom</label>
                  <input
                    value={form.nom}
                    onChange={(e) => handleChange('nom', e.target.value)}
                    placeholder="Tarif Standard"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Qualificatif</label>
                  <input
                    value={form.qualificatif}
                    onChange={(e) => handleChange('qualificatif', e.target.value)}
                    placeholder="Le plus demandé"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={4}
                  placeholder="Description détaillée de la tarification"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_220px]">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Avantages (un avantage par ligne ou séparés par ;)
                  </label>
                  <textarea
                    value={form.avantages}
                    onChange={(e) => handleChange('avantages', e.target.value)}
                    rows={6}
                    placeholder={"Remise permanente\nOffre longue durée\nFormule flexible"}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Discount rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={form.discount_rate}
                    onChange={(e) => handleChange('discount_rate', e.target.value)}
                    placeholder="10"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-2xl bg-[#081a33] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0d2547] disabled:opacity-60"
                >
                  {submitting
                    ? 'Enregistrement...'
                    : editingPricing
                      ? 'Enregistrer les modifications'
                      : 'Créer la tarification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}