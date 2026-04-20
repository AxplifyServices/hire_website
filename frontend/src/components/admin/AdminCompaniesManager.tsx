'use client';

import {useEffect, useMemo, useState} from 'react';
import {Building2, Pencil, Plus, RefreshCcw, Trash2, X} from 'lucide-react';
import type {B2BEntreprise} from '@/lib/types';
import {
  createAdminB2BCompany,
  deleteAdminB2BCompany,
  fetchAdminB2BCompanies,
  updateAdminB2BCompany
} from '@/lib/api';

type CompanyFormState = {
  raison_sociale: string;
  slug: string;
  email_contact: string;
  tel_contact: string;
  statut: string;
  mode_validation_defaut: string;
  devise: string;
};

const initialForm: CompanyFormState = {
  raison_sociale: '',
  slug: '',
  email_contact: '',
  tel_contact: '',
  statut: 'actif',
  mode_validation_defaut: 'manuelle',
  devise: 'MAD'
};

const STATUS_OPTIONS = ['actif', 'inactif', 'suspendu'] as const;
const VALIDATION_OPTIONS = ['automatique', 'manuelle', 'mixte'] as const;
const DEVISE_OPTIONS = ['MAD', 'EUR', 'USD'] as const;

function sortCompanies(items: B2BEntreprise[]) {
  return [...items].sort((a, b) =>
    (a.raison_sociale || '').localeCompare(b.raison_sociale || '', 'fr')
  );
}

function toForm(company: B2BEntreprise): CompanyFormState {
  return {
    raison_sociale: company.raison_sociale ?? '',
    slug: company.slug ?? '',
    email_contact: company.email_contact ?? '',
    tel_contact: company.tel_contact ?? '',
    statut: company.statut ?? 'actif',
    mode_validation_defaut: company.mode_validation_defaut ?? 'manuelle',
    devise: company.devise ?? 'MAD'
  };
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function AdminCompaniesManager() {
  const [companies, setCompanies] = useState<B2BEntreprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<B2BEntreprise | null>(null);
  const [form, setForm] = useState<CompanyFormState>(initialForm);

  async function loadCompanies() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchAdminB2BCompanies();
      setCompanies(sortCompanies(response || []));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Impossible de charger les entreprises.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadCompanies();
  }, []);

  const modalTitle = useMemo(() => {
    return editingCompany ? 'Modifier l’entreprise' : 'Ajouter une entreprise';
  }, [editingCompany]);

  function openCreateModal() {
    setEditingCompany(null);
    setForm(initialForm);
    setError(null);
    setSuccess(null);
    setModalOpen(true);
  }

  function openEditModal(company: B2BEntreprise) {
    setEditingCompany(company);
    setForm(toForm(company));
    setError(null);
    setSuccess(null);
    setModalOpen(true);
  }

  function closeModal() {
    if (submitting) return;
    setModalOpen(false);
    setEditingCompany(null);
    setForm(initialForm);
  }

  function handleChange<K extends keyof CompanyFormState>(
    key: K,
    value: CompanyFormState[K]
  ) {
    setForm((current) => ({...current, [key]: value}));
  }

  function handleRaisonSocialeChange(value: string) {
    setForm((current) => ({
      ...current,
      raison_sociale: value,
      slug:
        editingCompany || current.slug.trim()
          ? current.slug
          : slugify(value)
    }));
  }

  function handleRefresh() {
    setRefreshing(true);
    loadCompanies();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!form.raison_sociale.trim()) {
      setError('Veuillez renseigner la raison sociale.');
      return;
    }

    if (!form.slug.trim()) {
      setError('Veuillez renseigner le slug.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const payload = {
        raison_sociale: form.raison_sociale.trim(),
        slug: form.slug.trim(),
        email_contact: form.email_contact.trim() || undefined,
        tel_contact: form.tel_contact.trim() || undefined,
        statut: form.statut,
        mode_validation_defaut: form.mode_validation_defaut,
        devise: form.devise
      };

      if (editingCompany) {
        const response = await updateAdminB2BCompany(
          editingCompany.id_entreprise,
          payload
        );

        setCompanies((current) =>
          sortCompanies(
            current.map((item) =>
              item.id_entreprise === response.entreprise.id_entreprise
                ? response.entreprise
                : item
            )
          )
        );

        setSuccess(response.message || 'Entreprise modifiée avec succès.');
      } else {
        const response = await createAdminB2BCompany(payload);

        setCompanies((current) =>
          sortCompanies([response.entreprise, ...current])
        );

        setSuccess(response.message || 'Entreprise créée avec succès.');
      }

      closeModal();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible d'enregistrer l’entreprise."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(company: B2BEntreprise) {
    const confirmed = window.confirm(
      `Supprimer l’entreprise "${company.raison_sociale}" ?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(company.id_entreprise);
      setError(null);
      setSuccess(null);

      const response = await deleteAdminB2BCompany(company.id_entreprise);

      setCompanies((current) =>
        current.filter((item) => item.id_entreprise !== company.id_entreprise)
      );

      setSuccess(response.message || 'Entreprise supprimée avec succès.');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Impossible de supprimer l’entreprise.'
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Gestion administrative B2B
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
              Entreprises
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Crée, modifie ou supprime les entreprises rattachées au module B2B.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Ajouter une entreprise
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h3 className="text-base font-semibold text-slate-900">
            Liste des entreprises ({companies.length})
          </h3>
        </div>

        {loading ? (
          <div className="px-6 py-10 text-sm text-slate-500">Chargement...</div>
        ) : companies.length === 0 ? (
          <div className="px-6 py-10 text-sm text-slate-500">
            Aucune entreprise trouvée.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  <th className="px-6 py-4">Entreprise</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4">Validation</th>
                  <th className="px-6 py-4">Devise</th>
                  <th className="px-6 py-4">Création</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {companies.map((company) => (
                  <tr key={company.id_entreprise}>
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                          <Building2 className="h-5 w-5" />
                        </div>

                        <div>
                          <p className="font-semibold text-slate-900">
                            {company.raison_sociale || '—'}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {company.id_entreprise}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            slug : {company.slug || '—'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 align-top text-sm text-slate-600">
                      <p>{company.email_contact || '—'}</p>
                      <p className="mt-1">{company.tel_contact || '—'}</p>
                    </td>

                    <td className="px-6 py-4 align-top text-sm text-slate-700">
                      {company.statut || '—'}
                    </td>

                    <td className="px-6 py-4 align-top text-sm text-slate-700">
                      {company.mode_validation_defaut || '—'}
                    </td>

                    <td className="px-6 py-4 align-top text-sm text-slate-700">
                      {company.devise || '—'}
                    </td>

                    <td className="px-6 py-4 align-top text-sm text-slate-700">
                      {formatDate(company.date_creation)}
                    </td>

                    <td className="px-6 py-4 align-top">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(company)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          <Pencil className="h-4 w-4" />
                          Modifier
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(company)}
                          disabled={deletingId === company.id_entreprise}
                          className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 className="h-4 w-4" />
                          {deletingId === company.id_entreprise ? 'Suppression...' : 'Supprimer'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-3xl rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">{modalTitle}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Renseigne les informations principales de l’entreprise.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Raison sociale</span>
                  <input
                    type="text"
                    value={form.raison_sociale}
                    onChange={(e) => handleRaisonSocialeChange(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                    placeholder="Ex: Hire Corporate"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Slug</span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => handleChange('slug', slugify(e.target.value))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                    placeholder="hire-corporate"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Email contact</span>
                  <input
                    type="email"
                    value={form.email_contact}
                    onChange={(e) => handleChange('email_contact', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                    placeholder="contact@entreprise.com"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Téléphone contact</span>
                  <input
                    type="text"
                    value={form.tel_contact}
                    onChange={(e) => handleChange('tel_contact', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                    placeholder="+212..."
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Statut</span>
                  <select
                    value={form.statut}
                    onChange={(e) => handleChange('statut', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Mode validation par défaut</span>
                  <select
                    value={form.mode_validation_defaut}
                    onChange={(e) => handleChange('mode_validation_defaut', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  >
                    {VALIDATION_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-slate-700">Devise</span>
                  <select
                    value={form.devise}
                    onChange={(e) => handleChange('devise', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  >
                    {DEVISE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex items-center rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
                    ? 'Enregistrement...'
                    : editingCompany
                      ? 'Enregistrer les modifications'
                      : 'Créer l’entreprise'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}