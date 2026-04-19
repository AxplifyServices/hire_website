'use client';

import {useEffect, useMemo, useState} from 'react';
import {useRouter} from 'next/navigation';
import {Pencil, Plus, RefreshCcw, Trash2, X} from 'lucide-react';
import type {Agency, NewsItem, NewsListResponse} from '@/lib/types';
import {
  createAdminNews,
  deleteAdminNews,
  updateAdminNews
} from '@/lib/api';

type NewsFormState = {
  id_agence: string;
  date_parution: string;
  titre: string;
  contenu: string;
};

type AdminNewsManagerProps = {
  initialNewsResponse: NewsListResponse;
  initialAgencies: Agency[];
  initialPage: number;
  initialAgencyFilter: string;
};

const initialForm: NewsFormState = {
  id_agence: '',
  date_parution: '',
  titre: '',
  contenu: ''
};

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

function toDateInputValue(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function mapNewsToForm(item: NewsItem): NewsFormState {
  return {
    id_agence: item.id_agence ?? '',
    date_parution: toDateInputValue(item.date_parution),
    titre: item.titre ?? '',
    contenu: item.contenu ?? ''
  };
}

function formatAgencyLabel(agency: Agency) {
  return [agency.nom, agency.ville].filter(Boolean).join(' — ') || agency.id_agence;
}

function sortNews(items: NewsItem[]) {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.date_parution).getTime();
    const dateB = new Date(b.date_parution).getTime();
    return dateB - dateA;
  });
}

export default function AdminNewsManager({
  initialNewsResponse,
  initialAgencies,
  initialPage,
  initialAgencyFilter
}: AdminNewsManagerProps) {
  const router = useRouter();

  const [items, setItems] = useState<NewsItem[]>(
    sortNews(initialNewsResponse.data || [])
  );
  const [agencies, setAgencies] = useState<Agency[]>(initialAgencies || []);
  const [page, setPage] = useState(initialPage || 1);
  const [totalPages, setTotalPages] = useState(
    Math.max(initialNewsResponse.total_pages || 1, 1)
  );
  const [totalNews, setTotalNews] = useState(initialNewsResponse.total || 0);

  const [filterAgency, setFilterAgency] = useState(initialAgencyFilter || '');

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [form, setForm] = useState<NewsFormState>(initialForm);

  useEffect(() => {
    setItems(sortNews(initialNewsResponse.data || []));
    setAgencies(initialAgencies || []);
    setPage(initialPage || 1);
    setTotalPages(Math.max(initialNewsResponse.total_pages || 1, 1));
    setTotalNews(initialNewsResponse.total || 0);
    setFilterAgency(initialAgencyFilter || '');
  }, [initialNewsResponse, initialAgencies, initialPage, initialAgencyFilter]);

  const modalTitle = useMemo(() => {
    return editingNews ? 'Modifier la news' : 'Ajouter une news';
  }, [editingNews]);

  function openCreateModal() {
    setEditingNews(null);
    setForm(initialForm);
    setError(null);
    setSuccess(null);
    setModalOpen(true);
  }

  function openEditModal(item: NewsItem) {
    setEditingNews(item);
    setForm(mapNewsToForm(item));
    setError(null);
    setSuccess(null);
    setModalOpen(true);
  }

  function closeModal() {
    if (submitting) return;
    setModalOpen(false);
    setEditingNews(null);
    setForm(initialForm);
  }

  function handleChange<K extends keyof NewsFormState>(
    key: K,
    value: NewsFormState[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  }

  function getAgencyName(item: NewsItem) {
    if (item.agences?.nom || item.agences?.ville) {
      return [item.agences?.nom, item.agences?.ville].filter(Boolean).join(' — ');
    }

    const agency = agencies.find((entry) => entry.id_agence === item.id_agence);
    return agency ? formatAgencyLabel(agency) : item.id_agence;
  }

  function applyAgencyFilter(selectedAgency: string) {
    setFilterAgency(selectedAgency);
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (selectedAgency) {
      params.set('id_agence', selectedAgency);
    }

    const query = params.toString();
    router.push(query ? `/admin/news?${query}` : '/admin/news');
    router.refresh();
  }

  function handleRefresh() {
    setRefreshing(true);
    setError(null);
    router.refresh();
    setTimeout(() => {
      setRefreshing(false);
      setLoading(false);
    }, 300);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!form.id_agence) {
      setError('Veuillez sélectionner une agence.');
      return;
    }

    if (!form.date_parution) {
      setError('Veuillez renseigner une date de parution.');
      return;
    }

    if (!form.titre.trim()) {
      setError('Veuillez renseigner un titre.');
      return;
    }

    if (!form.contenu.trim()) {
      setError('Veuillez renseigner le contenu.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const payload = {
        id_agence: form.id_agence,
        date_parution: form.date_parution,
        titre: form.titre.trim(),
        contenu: form.contenu.trim()
      };

      const response = editingNews
        ? await updateAdminNews(editingNews.id_news, payload)
        : await createAdminNews(payload);

      const savedNews = response.news;

      if (editingNews) {
        setItems((current) =>
          sortNews(
            current.map((item) =>
              item.id_news === savedNews.id_news ? savedNews : item
            )
          )
        );
      } else {
        const shouldAppear =
          !filterAgency || savedNews.id_agence === filterAgency;

        if (shouldAppear) {
          setItems((current) => sortNews([savedNews, ...current]));
        }

        setTotalNews((current) => current + 1);
      }

      setSuccess(response.message);
      closeModal();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Impossible d’enregistrer la news.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(item: NewsItem) {
    const confirmed = window.confirm(
      `Supprimer définitivement la news "${item.titre}" ?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(item.id_news);
      setError(null);
      setSuccess(null);

      const response = await deleteAdminNews(item.id_news);

      setItems((current) =>
        current.filter((entry) => entry.id_news !== item.id_news)
      );
      setTotalNews((current) => Math.max(current - 1, 0));
      setSuccess(response.message);

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Impossible de supprimer la news.'
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              Gestion des news
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Ajoutez, modifiez ou supprimez les actualités du site.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
            >
              <Plus className="h-4 w-4" />
              Ajouter une news
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Filtrer par agence
            </label>
            <select
              value={filterAgency}
              onChange={(e) => applyAgencyFilter(e.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white"
            >
              <option value="">Toutes les agences</option>
              {agencies.map((agency) => (
                <option key={agency.id_agence} value={agency.id_agence}>
                  {formatAgencyLabel(agency)}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm text-slate-500">Total</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{totalNews}</p>
          </div>
        </div>
      </div>

      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-sm text-slate-500">Chargement des news...</div>
        ) : items.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-3 p-4">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-6 pb-2">News</th>
                    <th className="px-6 pb-2">Agence</th>
                    <th className="px-6 pb-2">Date</th>
                    <th className="px-6 pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id_news} className="bg-slate-50 text-sm text-slate-700">
                      <td className="rounded-l-2xl px-6 py-5 align-top">
                        <div className="max-w-[520px]">
                          <p className="font-semibold text-slate-950">{item.titre}</p>
                          <p className="mt-2 line-clamp-3 whitespace-pre-line text-slate-500">
                            {item.contenu}
                          </p>
                          <p className="mt-3 text-xs text-slate-400">{item.id_news}</p>
                        </div>
                      </td>

                      <td className="px-6 py-5 align-top">
                        <span className="inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                          {getAgencyName(item)}
                        </span>
                      </td>

                      <td className="px-6 py-5 align-top font-medium text-slate-900">
                        {formatDate(item.date_parution)}
                      </td>

                      <td className="rounded-r-2xl px-6 py-5 align-top">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-white hover:text-slate-950"
                            title="Modifier"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            disabled={deletingId === item.id_news}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 px-6 py-5">
              <p className="text-sm text-slate-500">
                Page {page} sur {Math.max(totalPages, 1)}
              </p>
            </div>
          </>
        ) : (
          <div className="p-8 text-sm text-slate-500">
            Aucune news trouvée.
          </div>
        )}
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-950">{modalTitle}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Renseigne les informations de la news.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Agence
                  </label>
                  <select
                    value={form.id_agence}
                    onChange={(e) => handleChange('id_agence', e.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white"
                    required
                  >
                    <option value="">Sélectionner une agence</option>
                    {agencies.map((agency) => (
                      <option key={agency.id_agence} value={agency.id_agence}>
                        {formatAgencyLabel(agency)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Date de parution
                  </label>
                  <input
                    type="date"
                    value={form.date_parution}
                    onChange={(e) => handleChange('date_parution', e.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Titre
                </label>
                <input
                  type="text"
                  value={form.titre}
                  onChange={(e) => handleChange('titre', e.target.value)}
                  maxLength={255}
                  placeholder="Titre de la news"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Contenu
                </label>
                <textarea
                  value={form.contenu}
                  onChange={(e) => handleChange('contenu', e.target.value)}
                  rows={10}
                  placeholder="Contenu de la news"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white"
                  required
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
                    ? 'Enregistrement...'
                    : editingNews
                      ? 'Enregistrer les modifications'
                      : 'Créer la news'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}