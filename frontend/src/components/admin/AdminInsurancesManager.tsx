'use client';

import {useEffect, useMemo, useState} from 'react';
import {Pencil, Plus, RefreshCcw, Search, ShieldCheck, Trash2, X} from 'lucide-react';
import type {AdminInsurance, AdminInsurancesListResponse} from '@/lib/types';
import {
  createAdminInsurance,
  deleteAdminInsurance,
  fetchAdminInsurances,
  updateAdminInsurance
} from '@/lib/api';

type InsuranceFormState = {
  nom: string;
  qualificatif: string;
  description: string;
  avantages: string;
  prix_jour: string;
};

const initialForm: InsuranceFormState = {
  nom: '',
  qualificatif: '',
  description: '',
  avantages: '',
  prix_jour: ''
};

function toForm(insurance: AdminInsurance): InsuranceFormState {
  return {
    nom: insurance.nom ?? '',
    qualificatif: insurance.qualificatif ?? '',
    description: insurance.description ?? '',
    avantages: (insurance.avantages ?? []).join('\n'),
    prix_jour:
      insurance.prix_jour !== null && insurance.prix_jour !== undefined
        ? String(insurance.prix_jour)
        : ''
  };
}

function formatPrice(value?: number | string | null) {
  if (value === null || value === undefined || value === '') return '—';
  const amount = Number(value);
  if (Number.isNaN(amount)) return '—';
  return `${amount.toFixed(2)} MAD / jour`;
}

function parseAdvantages(value: string) {
  return value
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function AdminInsurancesManager() {
  const [response, setResponse] = useState<AdminInsurancesListResponse | null>(null);
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
  const [editingInsurance, setEditingInsurance] = useState<AdminInsurance | null>(null);
  const [form, setForm] = useState<InsuranceFormState>(initialForm);

  const items = response?.data ?? [];
  const pagination = response?.pagination;
  const totalInsurances = pagination?.total ?? 0;
  const totalPages = Math.max(pagination?.total_pages ?? 1, 1);

  const modalTitle = useMemo(
    () => (editingInsurance ? 'Modifier l’assurance' : 'Créer une assurance'),
    [editingInsurance]
  );

  async function loadInsurances(nextPage = page, silent = false) {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const result = await fetchAdminInsurances({
        page: nextPage,
        limit: 10,
        search
      });

      setResponse(result);
      setPage(result.pagination.page);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Impossible de charger les assurances.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadInsurances(1);
  }, [search]);

  function openCreateModal() {
    setEditingInsurance(null);
    setForm(initialForm);
    setError(null);
    setSuccess(null);
    setModalOpen(true);
  }

  function openEditModal(insurance: AdminInsurance) {
    setEditingInsurance(insurance);
    setForm(toForm(insurance));
    setError(null);
    setSuccess(null);
    setModalOpen(true);
  }

  function closeModal() {
    if (submitting) return;
    setModalOpen(false);
    setEditingInsurance(null);
    setForm(initialForm);
  }

  function handleChange<K extends keyof InsuranceFormState>(
    key: K,
    value: InsuranceFormState[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const nom = form.nom.trim();
    const prixJour = Number(form.prix_jour);

    if (!nom) {
      setError('Veuillez renseigner un nom.');
      return;
    }

    if (Number.isNaN(prixJour) || prixJour < 0) {
      setError('Veuillez renseigner un prix journalier valide.');
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
        prix_jour: prixJour
      };

      const response = editingInsurance
        ? await updateAdminInsurance(editingInsurance.id_assurance, payload)
        : await createAdminInsurance(payload);

      const savedInsurance = response.assurance;

      if (editingInsurance) {
        setResponse((current) => {
          if (!current) return current;
          return {
            ...current,
            data: current.data.map((item) =>
              item.id_assurance === savedInsurance.id_assurance ? savedInsurance : item
            )
          };
        });
      } else {
        setResponse((current) => {
          if (!current) return current;
          return {
            ...current,
            data: [savedInsurance, ...current.data].slice(0, current.pagination.limit),
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
      loadInsurances(editingInsurance ? page : 1, true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Impossible d’enregistrer l’assurance.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(insurance: AdminInsurance) {
    const confirmed = window.confirm(
      `Supprimer définitivement l’assurance "${insurance.nom}" ?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(insurance.id_assurance);
      setError(null);
      setSuccess(null);

      const response = await deleteAdminInsurance(insurance.id_assurance);

      setResponse((current) => {
        if (!current) return current;
        const nextData = current.data.filter(
          (item) => item.id_assurance !== insurance.id_assurance
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
      loadInsurances(page, true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Impossible de supprimer l’assurance.'
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
              Gestion des assurances
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
              Assurances
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Création, modification et suppression des assurances proposées dans le tunnel de réservation.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => loadInsurances(page, true)}
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
          <p className="text-sm text-slate-500">Total assurances</p>
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
                <th className="px-6 py-4">Assurance</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Avantages</th>
                <th className="px-6 py-4">Prix</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                    Chargement des assurances...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                    Aucune assurance trouvée.
                  </td>
                </tr>
              ) : (
                items.map((insurance) => (
                  <tr key={insurance.id_assurance} className="align-top">
                    <td className="px-6 py-5">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{insurance.nom || '—'}</p>
                          <p className="mt-1 text-sm text-slate-500">{insurance.id_assurance}</p>
                          <p className="mt-1 text-sm text-slate-600">{insurance.qualificatif || '—'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-700">
                      {insurance.description || '—'}
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-700">
                      {insurance.avantages?.length ? (
                        <ul className="space-y-1">
                          {insurance.avantages.map((advantage, index) => (
                            <li key={`${insurance.id_assurance}-${index}`}>• {advantage}</li>
                          ))}
                        </ul>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="px-6 py-5 text-sm font-medium text-slate-900">
                      {formatPrice(insurance.prix_jour)}
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(insurance)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          <Pencil className="h-4 w-4" />
                          Modifier
                        </button>

                        <button
                          type="button"
                          disabled={deletingId === insurance.id_assurance}
                          onClick={() => handleDelete(insurance)}
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
            {totalInsurances} assurance{totalInsurances > 1 ? 's' : ''} trouvée{totalInsurances > 1 ? 's' : ''}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => loadInsurances(page - 1)}
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
              onClick={() => loadInsurances(page + 1)}
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
                <p className="text-sm font-medium text-cyan-700">Paramétrage assurance</p>
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
                    placeholder="Assurance Premium"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Qualificatif</label>
                  <input
                    value={form.qualificatif}
                    onChange={(e) => handleChange('qualificatif', e.target.value)}
                    placeholder="La plus complète"
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
                  placeholder="Description détaillée de l’assurance"
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
                    placeholder={"Rachat partiel de franchise\nAssistance 24/7\nVéhicule de remplacement"}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Prix journalier</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.prix_jour}
                    onChange={(e) => handleChange('prix_jour', e.target.value)}
                    placeholder="120"
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
                    : editingInsurance
                      ? 'Enregistrer les modifications'
                      : 'Créer l’assurance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}