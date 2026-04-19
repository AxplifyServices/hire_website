'use client';

import {useEffect, useMemo, useState} from 'react';
import {
  Pencil,
  Plus,
  RefreshCcw,
  Trash2,
  X
} from 'lucide-react';
import type {Agency, Vehicle} from '@/lib/types';
import {
  createAdminVehicle,
  deleteAdminVehicle,
  fetchAdminVehicles,
  fetchAgencies,
  resolveMediaUrl,
  updateAdminVehicle
} from '@/lib/api';

const fallbackImage =
  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80';

const VEHICLE_CATEGORIES = [
  'Citadines',
  'Eco',
  'Berlines',
  'SUV',
  'Premium',
  'Vans'
] as const;

const VEHICLE_TYPES = [
  'sm-a',
  'sm-b',
  'sm-c',
  'sm-d',
  'sm-e',
  'sm-f'
] as const;

const FUEL_TYPES = [
  'Gazoil',
  'Essence',
  'Electrique',
  'Hybride'
] as const;

const TRANSMISSION_TYPES = [
  'Manuelle',
  'Automatique'
] as const;

const VEHICLE_STATUSES = [
  'Actif',
  'Maintenance',
  'Retire_flotte'
] as const;

const VEHICLE_AVAILABILITIES = [
  'Disponible',
  'Reserve',
  'Indisponible'
] as const;

type VehicleFormState = {
  nom: string;
  categorie: string;
  transmission: string;
  prix_jour: string;
  carburant: string;
  nb_place: string;
  nb_porte: string;
  climatisation: boolean;
  disponibilite: string;
  model: string;
  marque: string;
  status_vehicule: string;
  id_agence_actuelle: string;
  capacite_coffre: string;
  description: string;
  type_vehicule: string;
};

const initialForm: VehicleFormState = {
  nom: '',
  categorie: 'Citadines',
  transmission: 'Manuelle',
  prix_jour: '',
  carburant: 'Gazoil',
  nb_place: '',
  nb_porte: '',
  climatisation: false,
  disponibilite: 'Disponible',
  model: '',
  marque: '',
  status_vehicule: 'Actif',
  id_agence_actuelle: '',
  capacite_coffre: '',
  description: '',
  type_vehicule: 'sm-a'
};

function toFormData(values: VehicleFormState, imageFile: File | null) {
  const formData = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    if (typeof value === 'boolean') {
      formData.append(key, String(value));
      return;
    }

    if (value !== '') {
      formData.append(key, value);
    }
  });

  if (imageFile) {
    formData.append('image', imageFile);
  }

  return formData;
}

function formatAgencyLabel(agency: Agency) {
  return [agency.nom, agency.ville].filter(Boolean).join(' — ') || agency.id_agence;
}

function mapVehicleToForm(vehicle: Vehicle): VehicleFormState {
  return {
    nom: vehicle.nom ?? '',
    categorie: vehicle.categorie ?? '',
    transmission: vehicle.transmission ?? '',
    prix_jour:
      vehicle.prix_jour !== null && vehicle.prix_jour !== undefined
        ? String(vehicle.prix_jour)
        : '',
    carburant: vehicle.carburant ?? '',
    nb_place:
      vehicle.nb_place !== null && vehicle.nb_place !== undefined
        ? String(vehicle.nb_place)
        : '',
    nb_porte:
      vehicle.nb_porte !== null && vehicle.nb_porte !== undefined
        ? String(vehicle.nb_porte)
        : '',
    climatisation: Boolean(vehicle.climatisation),
    disponibilite: vehicle.disponibilite ?? 'Disponible',
    model: vehicle.model ?? '',
    marque: vehicle.marque ?? '',
    status_vehicule: vehicle.status_vehicule ?? 'Actif',
    id_agence_actuelle: vehicle.id_agence_actuelle ?? '',
    capacite_coffre:
      vehicle.capacite_coffre !== null && vehicle.capacite_coffre !== undefined
        ? String(vehicle.capacite_coffre)
        : '',
    description: vehicle.description ?? '',
    type_vehicule: vehicle.type_vehicule ?? ''
  };
}

export default function AdminFleetManager() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<VehicleFormState>(initialForm);
  const [imageFile, setImageFile] = useState<File | null>(null);

  async function loadVehicles(nextPage = page, silent = false) {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const response = await fetchAdminVehicles({
        page: nextPage,
        limit: 10
      });

      setVehicles(response.data);
      setTotalPages(Math.max(response.pagination.total_pages, 1));
      setTotalVehicles(response.pagination.total);
      setPage(response.pagination.page);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible de charger les véhicules.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadAgencies() {
    try {
      const data = await fetchAgencies();
      setAgencies(data);
    } catch {
      setAgencies([]);
    }
  }

  useEffect(() => {
    loadVehicles(1);
    loadAgencies();
  }, []);

  const modalTitle = useMemo(() => {
    return editingVehicle ? 'Modifier le véhicule' : 'Ajouter un véhicule';
  }, [editingVehicle]);

  function openCreateModal() {
    setEditingVehicle(null);
    setForm(initialForm);
    setImageFile(null);
    setSuccess(null);
    setError(null);
    setModalOpen(true);
  }

  function openEditModal(vehicle: Vehicle) {
    setEditingVehicle(vehicle);
    setForm(mapVehicleToForm(vehicle));
    setImageFile(null);
    setSuccess(null);
    setError(null);
    setModalOpen(true);
  }

  function closeModal() {
    if (submitting) return;
    setModalOpen(false);
    setEditingVehicle(null);
    setForm(initialForm);
    setImageFile(null);
  }

  function handleChange<K extends keyof VehicleFormState>(
    key: K,
    value: VehicleFormState[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const payload = toFormData(form, imageFile);

      if (editingVehicle) {
        const response = await updateAdminVehicle(
          editingVehicle.id_vehicule,
          payload
        );
        setSuccess(response.message || 'Véhicule modifié avec succès.');
      } else {
        const response = await createAdminVehicle(payload);
        setSuccess(response.message || 'Véhicule créé avec succès.');
      }

      closeModal();
      await loadVehicles(page, true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "L'enregistrement a échoué."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(vehicle: Vehicle) {
    const confirmed = window.confirm(
      `Supprimer le véhicule "${vehicle.marque || ''} ${vehicle.model || vehicle.nom || vehicle.id_vehicule}" ?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(vehicle.id_vehicule);
      setError(null);
      setSuccess(null);

      const response = await deleteAdminVehicle(vehicle.id_vehicule);

      setSuccess(response.message || 'Véhicule supprimé avec succès.');

      const shouldGoPrevPage = vehicles.length === 1 && page > 1;
      const nextPage = shouldGoPrevPage ? page - 1 : page;

      await loadVehicles(nextPage, true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'La suppression a échoué.'
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
            <p className="text-sm font-medium text-slate-500">
              Gestion de la flotte
            </p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
              Véhicules
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {totalVehicles} véhicule{totalVehicles > 1 ? 's' : ''} au total — 10 par page
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => loadVehicles(page, true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
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
              Ajouter une voiture
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-400">
                <th className="pb-2 pr-4">Véhicule</th>
                <th className="pb-2 pr-4">Catégorie</th>
                <th className="pb-2 pr-4">Agence</th>
                <th className="pb-2 pr-4">Prix / jour</th>
                <th className="pb-2 pr-4">Statut</th>
                <th className="pb-2 pr-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500"
                  >
                    Chargement des véhicules...
                  </td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500"
                  >
                    Aucun véhicule trouvé.
                  </td>
                </tr>
              ) : (
                vehicles.map((vehicle) => {
                  const title =
                    [vehicle.marque, vehicle.model].filter(Boolean).join(' ') ||
                    vehicle.nom ||
                    vehicle.id_vehicule;

                  const agency = agencies.find(
                    (item) => item.id_agence === vehicle.id_agence_actuelle
                  );

                  const imageUrl =
                    resolveMediaUrl(vehicle.url_image_vehicule) || fallbackImage;

                  return (
                    <tr
                      key={vehicle.id_vehicule}
                      className="overflow-hidden rounded-2xl bg-slate-50 text-sm text-slate-700"
                    >
                      <td className="rounded-l-2xl px-4 py-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={imageUrl}
                            alt={title}
                            className="h-16 w-24 rounded-2xl object-cover"
                          />

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-950">
                              {title}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {vehicle.id_vehicule}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        {vehicle.categorie || '—'}
                      </td>

                      <td className="px-4 py-4">
                        {agency ? formatAgencyLabel(agency) : '—'}
                      </td>

                      <td className="px-4 py-4 font-semibold text-slate-950">
                        {vehicle.prix_jour ?? '—'} MAD
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            vehicle.status_vehicule?.toLowerCase() === 'actif'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {vehicle.status_vehicule || '—'}
                        </span>
                      </td>

                      <td className="rounded-r-2xl px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(vehicle)}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                          >
                            <Pencil className="h-4 w-4" />
                            Modifier
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(vehicle)}
                            disabled={deletingId === vehicle.id_vehicule}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Trash2 className="h-4 w-4" />
                            {deletingId === vehicle.id_vehicule
                              ? 'Suppression...'
                              : 'Supprimer'}
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

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Page {page} sur {Math.max(totalPages, 1)}
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={page <= 1 || loading || refreshing}
              onClick={() => loadVehicles(page - 1, true)}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Précédent
            </button>

            <button
              type="button"
              disabled={page >= totalPages || loading || refreshing}
              onClick={() => loadVehicles(page + 1, true)}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      </section>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[28px] bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <h3 className="text-2xl font-bold text-slate-950">{modalTitle}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Renseigne les informations du véhicule et son image.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 p-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Nom *
                  </label>
                  <input
                    value={form.nom}
                    onChange={(e) => handleChange('nom', e.target.value)}
                    required
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500"
                    placeholder="Ex: Dacia Sandero"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Marque
                  </label>
                  <input
                    value={form.marque}
                    onChange={(e) => handleChange('marque', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500"
                    placeholder="Ex: Dacia"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Modèle
                  </label>
                  <input
                    value={form.model}
                    onChange={(e) => handleChange('model', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500"
                    placeholder="Ex: Sandero"
                  />
                </div>

                <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                    Catégorie
                </label>
                <select
                    value={form.categorie}
                    onChange={(e) => handleChange('categorie', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500"
                >
                    <option value="">Sélectionner</option>
                    {VEHICLE_CATEGORIES.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                    ))}
                </select>
                </div>

                <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                    Type véhicule
                </label>
                <select
                    value={form.type_vehicule}
                    onChange={(e) => handleChange('type_vehicule', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500"
                >
                    <option value="">Sélectionner</option>
                    {VEHICLE_TYPES.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                    ))}
                </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Prix / jour *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.prix_jour}
                    onChange={(e) => handleChange('prix_jour', e.target.value)}
                    required
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500"
                    placeholder="Ex: 350"
                  />
                </div>

                <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                    Carburant
                </label>
                <select
                    value={form.carburant}
                    onChange={(e) => handleChange('carburant', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500"
                >
                    <option value="">Sélectionner</option>
                    {FUEL_TYPES.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                    ))}
                </select>
                </div>

                <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                    Transmission
                </label>
                <select
                    value={form.transmission}
                    onChange={(e) => handleChange('transmission', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500"
                >
                    <option value="">Sélectionner</option>
                    {TRANSMISSION_TYPES.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                    ))}
                </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Agence actuelle
                  </label>
                  <select
                    value={form.id_agence_actuelle}
                    onChange={(e) =>
                      handleChange('id_agence_actuelle', e.target.value)
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500"
                  >
                    <option value="">Aucune</option>
                    {agencies.map((agency) => (
                      <option key={agency.id_agence} value={agency.id_agence}>
                        {formatAgencyLabel(agency)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Nombre de places
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.nb_place}
                    onChange={(e) => handleChange('nb_place', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Nombre de portes
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.nb_porte}
                    onChange={(e) => handleChange('nb_porte', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Capacité coffre
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.capacite_coffre}
                    onChange={(e) =>
                      handleChange('capacite_coffre', e.target.value)
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                    Disponibilité
                </label>
                <select
                    value={form.disponibilite}
                    onChange={(e) => handleChange('disponibilite', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500"
                >
                    <option value="">Sélectionner</option>
                    {VEHICLE_AVAILABILITIES.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                    ))}
                </select>
                </div>

                <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                    Statut véhicule
                </label>
                <select
                    value={form.status_vehicule}
                    onChange={(e) =>
                    handleChange('status_vehicule', e.target.value)
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500"
                >
                    <option value="">Sélectionner</option>
                    {VEHICLE_STATUSES.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                    ))}
                </select>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                  <input
                    id="climatisation"
                    type="checkbox"
                    checked={form.climatisation}
                    onChange={(e) =>
                      handleChange('climatisation', e.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <label
                    htmlFor="climatisation"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Climatisation
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500"
                  placeholder="Description du véhicule"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700">
                  Image du véhicule
                </label>

                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={(e) =>
                    setImageFile(e.target.files?.[0] ? e.target.files[0] : null)
                  }
                  className="block w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700"
                />

                {editingVehicle?.url_image_vehicule ? (
                  <div className="rounded-2xl border border-slate-200 p-3">
                    <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                      Image actuelle
                    </p>
                    <img
                      src={
                        resolveMediaUrl(editingVehicle.url_image_vehicule) ||
                        fallbackImage
                      }
                      alt="Image actuelle"
                      className="h-40 w-full rounded-2xl object-cover md:w-72"
                    />
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting
                    ? 'Enregistrement...'
                    : editingVehicle
                    ? 'Enregistrer les modifications'
                    : 'Créer le véhicule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}