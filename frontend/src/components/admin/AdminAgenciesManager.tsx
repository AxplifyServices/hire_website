'use client';

import {useEffect, useMemo, useState} from 'react';
import {useRouter} from 'next/navigation';
import {Building2, Pencil, Plus, RefreshCcw, Trash2, Upload, X} from 'lucide-react';
import type {Agency} from '@/lib/types';
import {
  createAdminAgency,
  deleteAdminAgency,
  resolveMediaUrl,
  updateAdminAgency
} from '@/lib/api';

type AgencyFormState = {
  nom: string;
  ville: string;
  categorie: string;
  adresse: string;
  num_tel: string;
  num_tel_deux: string;
  mail: string;
  disponibilite_agence: string;
  description: string;
  latitude: string;
  longitude: string;
};

type Props = {
  initialAgencies: Agency[];
};

const CATEGORY_OPTIONS = ['Ville', 'Aéroport'] as const;

const fallbackImage =
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80';

const initialForm: AgencyFormState = {
  nom: '',
  ville: '',
  categorie: 'Ville',
  adresse: '',
  num_tel: '',
  num_tel_deux: '',
  mail: '',
  disponibilite_agence: '',
  description: '',
  latitude: '',
  longitude: ''
};

function sortAgencies(items: Agency[]) {
  return [...items].sort((a, b) => {
    const cityCompare = (a.ville || '').localeCompare(b.ville || '', 'fr');
    if (cityCompare !== 0) return cityCompare;
    return (a.nom || '').localeCompare(b.nom || '', 'fr');
  });
}

function mapAgencyToForm(agency: Agency): AgencyFormState {
  return {
    nom: agency.nom ?? '',
    ville: agency.ville ?? '',
    categorie: agency.categorie ?? 'Ville',
    adresse: agency.adresse ?? '',
    num_tel: agency.num_tel ?? '',
    num_tel_deux: agency.num_tel_deux ?? '',
    mail: agency.mail ?? '',
    disponibilite_agence: agency.disponibilite_agence ?? '',
    description: agency.description ?? '',
    latitude:
      agency.latitude !== null && agency.latitude !== undefined
        ? String(agency.latitude)
        : '',
    longitude:
      agency.longitude !== null && agency.longitude !== undefined
        ? String(agency.longitude)
        : ''
  };
}

function toFormData(values: AgencyFormState, imageFile: File | null) {
  const formData = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    if (value !== '') {
      formData.append(key, value);
    }
  });

  if (imageFile) {
    formData.append('image', imageFile);
  }

  return formData;
}

function getAgencyLabel(agency: Agency) {
  return [agency.nom, agency.ville].filter(Boolean).join(' — ') || agency.id_agence;
}

export default function AdminAgenciesManager({initialAgencies}: Props) {
  const router = useRouter();

  const [agencies, setAgencies] = useState<Agency[]>(sortAgencies(initialAgencies || []));
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [form, setForm] = useState<AgencyFormState>(initialForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    setAgencies(sortAgencies(initialAgencies || []));
  }, [initialAgencies]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile]);

  const modalTitle = useMemo(() => {
    return editingAgency ? 'Modifier l’agence' : 'Ajouter une agence';
  }, [editingAgency]);

  function openCreateModal() {
    setEditingAgency(null);
    setForm(initialForm);
    setImageFile(null);
    setImagePreview(null);
    setError(null);
    setSuccess(null);
    setModalOpen(true);
  }

  function openEditModal(agency: Agency) {
    setEditingAgency(agency);
    setForm(mapAgencyToForm(agency));
    setImageFile(null);
    setImagePreview(null);
    setError(null);
    setSuccess(null);
    setModalOpen(true);
  }

  function closeModal() {
    if (submitting) return;
    setModalOpen(false);
    setEditingAgency(null);
    setForm(initialForm);
    setImageFile(null);
    setImagePreview(null);
  }

  function handleChange<K extends keyof AgencyFormState>(
    key: K,
    value: AgencyFormState[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  }

  function handleRefresh() {
    setRefreshing(true);
    setLoading(true);
    setError(null);
    router.refresh();

    setTimeout(() => {
      setRefreshing(false);
      setLoading(false);
    }, 300);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!form.nom.trim()) {
      setError('Veuillez renseigner le nom de l’agence.');
      return;
    }

    if (!form.ville.trim()) {
      setError('Veuillez renseigner la ville.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const payload = toFormData(form, imageFile);

      if (editingAgency) {
        const response = await updateAdminAgency(editingAgency.id_agence, payload);

        setAgencies((current) =>
          sortAgencies(
            current.map((item) =>
              item.id_agence === response.agence.id_agence ? response.agence : item
            )
          )
        );

        setSuccess(response.message || 'Agence modifiée avec succès.');
      } else {
        const response = await createAdminAgency(payload);

        setAgencies((current) => sortAgencies([response.agence, ...current]));
        setSuccess(response.message || 'Agence créée avec succès.');
      }

      closeModal();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "L'enregistrement de l’agence a échoué."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(agency: Agency) {
    const confirmed = window.confirm(
      `Supprimer l’agence "${getAgencyLabel(agency)}" ?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(agency.id_agence);
      setError(null);
      setSuccess(null);

      const response = await deleteAdminAgency(agency.id_agence);

      setAgencies((current) =>
        current.filter((item) => item.id_agence !== agency.id_agence)
      );

      setSuccess(
        response.message ||
          'Agence supprimée avec succès.'
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'La suppression de l’agence a échoué.'
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-950">
              Agences
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Ajoutez, modifiez ou supprimez les agences et leurs photos.
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
              Ajouter une agence
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm text-slate-500">Total</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{agencies.length}</p>
          </div>
        </div>
      </section>

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

      <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3 p-4">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-400">
                <th className="px-6 pb-2">Photo</th>
                <th className="px-6 pb-2">Agence</th>
                <th className="px-6 pb-2">Catégorie</th>
                <th className="px-6 pb-2">Contact</th>
                <th className="px-6 pb-2">Adresse</th>
                <th className="px-6 pb-2 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500"
                  >
                    Chargement des agences...
                  </td>
                </tr>
              ) : agencies.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500"
                  >
                    Aucune agence trouvée.
                  </td>
                </tr>
              ) : (
                agencies.map((agency) => {
                  const imageUrl = resolveMediaUrl(agency.url_image_agence) || fallbackImage;

                  return (
                    <tr key={agency.id_agence} className="bg-slate-50 text-sm text-slate-700">
                      <td className="rounded-l-2xl px-6 py-5 align-top">
                        <img
                          src={imageUrl}
                          alt={getAgencyLabel(agency)}
                          className="h-20 w-28 rounded-2xl object-cover"
                        />
                      </td>

                      <td className="px-6 py-5 align-top">
                        <p className="font-semibold text-slate-950">
                          {agency.nom || '—'}
                        </p>
                        <p className="mt-1 text-slate-500">{agency.ville || '—'}</p>
                        <p className="mt-2 text-xs text-slate-400">{agency.id_agence}</p>
                      </td>

                      <td className="px-6 py-5 align-top">
                        <span className="inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                          {agency.categorie || 'Ville'}
                        </span>
                      </td>

                      <td className="px-6 py-5 align-top">
                        <div className="space-y-1">
                          <p>{agency.num_tel || '—'}</p>
                          <p>{agency.num_tel_deux || '—'}</p>
                          <p className="text-slate-500">{agency.mail || '—'}</p>
                        </div>
                      </td>

                      <td className="px-6 py-5 align-top text-slate-500">
                        {agency.adresse || '—'}
                      </td>

                      <td className="rounded-r-2xl px-6 py-5 align-top">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(agency)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-white hover:text-slate-950"
                            title="Modifier"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(agency)}
                            disabled={deletingId === agency.id_agence}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
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
      </section>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-950">{modalTitle}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Renseigne les informations de l’agence et sa photo.
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
              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-6">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Nom
                      </label>
                      <input
                        type="text"
                        value={form.nom}
                        onChange={(e) => handleChange('nom', e.target.value)}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-500 focus:bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Ville
                      </label>
                      <input
                        type="text"
                        value={form.ville}
                        onChange={(e) => handleChange('ville', e.target.value)}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-500 focus:bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Catégorie
                      </label>
                      <select
                        value={form.categorie}
                        onChange={(e) => handleChange('categorie', e.target.value)}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-500 focus:bg-white"
                      >
                        {CATEGORY_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Disponibilité
                      </label>
                      <input
                        type="text"
                        value={form.disponibilite_agence}
                        onChange={(e) =>
                          handleChange('disponibilite_agence', e.target.value)
                        }
                        placeholder="Ex: 24h/24"
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Adresse
                    </label>
                    <textarea
                      value={form.adresse}
                      onChange={(e) => handleChange('adresse', e.target.value)}
                      rows={3}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white"
                    />
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Téléphone principal
                      </label>
                      <input
                        type="text"
                        value={form.num_tel}
                        onChange={(e) => handleChange('num_tel', e.target.value)}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Téléphone secondaire
                      </label>
                      <input
                        type="text"
                        value={form.num_tel_deux}
                        onChange={(e) => handleChange('num_tel_deux', e.target.value)}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-3">
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Email
                      </label>
                      <input
                        type="email"
                        value={form.mail}
                        onChange={(e) => handleChange('mail', e.target.value)}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Latitude
                      </label>
                      <input
                        type="text"
                        value={form.latitude}
                        onChange={(e) => handleChange('latitude', e.target.value)}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Longitude
                      </label>
                      <input
                        type="text"
                        value={form.longitude}
                        onChange={(e) => handleChange('longitude', e.target.value)}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Description
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      rows={6}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-700">Photo agence</p>

                    <div className="mt-4 overflow-hidden rounded-[22px] border border-slate-200 bg-white">
                      <div className="flex h-[260px] items-center justify-center bg-slate-100">
                        {imagePreview ? (
                          <img
                            src={imagePreview}
                            alt="Nouvelle image"
                            className="h-full w-full object-cover"
                          />
                        ) : editingAgency?.url_image_agence ? (
                          <img
                            src={resolveMediaUrl(editingAgency.url_image_agence) || fallbackImage}
                            alt={editingAgency.nom || editingAgency.id_agence}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                            <Building2 className="h-10 w-10" />
                            <span className="text-sm">Aucune image</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                      <Upload className="h-4 w-4" />
                      Choisir une image
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setImageFile(file);
                        }}
                      />
                    </label>

                    <p className="mt-2 text-xs text-slate-500">
                      Formats acceptés : jpg, jpeg, png, webp — 5 Mo max.
                    </p>
                  </div>
                </div>
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
                    : editingAgency
                      ? 'Enregistrer les modifications'
                      : 'Créer l’agence'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}