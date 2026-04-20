'use client';

import {useEffect, useMemo, useState} from 'react';
import {ClipboardList, Pencil, Plus, RefreshCcw, Trash2, X} from 'lucide-react';
import type {B2BEntreprise, B2BProfilBeneficiaire} from '@/lib/types';
import {
  createAdminB2BProfilBeneficiaire,
  deleteAdminB2BProfilBeneficiaire,
  fetchAdminB2BCompanies,
  fetchAdminB2BProfilsBeneficiaires,
  updateAdminB2BProfilBeneficiaire
} from '@/lib/api';

type ProfileFormState = {
  code: string;
  libelle: string;
  description: string;
  validation_requise: boolean;
  budget_plafond_mensuel: string;
  nb_jours_mois: string;
  nb_reservations_simultanees: string;
  avec_chauffeur_autorise: boolean;
  sans_chauffeur_autorise: boolean;
  liste_type_autorise: string;
  actif: boolean;
};

const initialForm: ProfileFormState = {
  code: '',
  libelle: '',
  description: '',
  validation_requise: false,
  budget_plafond_mensuel: '',
  nb_jours_mois: '',
  nb_reservations_simultanees: '',
  avec_chauffeur_autorise: false,
  sans_chauffeur_autorise: true,
  liste_type_autorise: '',
  actif: true
};

function sortCompanies(items: B2BEntreprise[]) {
  return [...items].sort((a, b) =>
    (a.raison_sociale || '').localeCompare(b.raison_sociale || '', 'fr')
  );
}

function sortProfiles(items: B2BProfilBeneficiaire[]) {
  return [...items].sort((a, b) =>
    (a.libelle || '').localeCompare(b.libelle || '', 'fr')
  );
}

function toForm(item: B2BProfilBeneficiaire): ProfileFormState {
  return {
    code: item.code ?? '',
    libelle: item.libelle ?? '',
    description: item.description ?? '',
    validation_requise: Boolean(item.validation_requise),
    budget_plafond_mensuel:
      item.budget_plafond_mensuel !== null && item.budget_plafond_mensuel !== undefined
        ? String(item.budget_plafond_mensuel)
        : '',
    nb_jours_mois:
      item.nb_jours_mois !== null && item.nb_jours_mois !== undefined
        ? String(item.nb_jours_mois)
        : '',
    nb_reservations_simultanees:
      item.nb_reservations_simultanees !== null &&
      item.nb_reservations_simultanees !== undefined
        ? String(item.nb_reservations_simultanees)
        : '',
    avec_chauffeur_autorise: Boolean(item.avec_chauffeur_autorise),
    sans_chauffeur_autorise: Boolean(item.sans_chauffeur_autorise),
    liste_type_autorise: (item.liste_type_autorise || []).join(', '),
    actif: Boolean(item.actif)
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

function parseNumber(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function parseVehicleTypes(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function AdminBeneficiaryProfilesManager() {
  const [companies, setCompanies] = useState<B2BEntreprise[]>([]);
  const [selectedEntrepriseId, setSelectedEntrepriseId] = useState('');
  const [profiles, setProfiles] = useState<B2BProfilBeneficiaire[]>([]);

  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<B2BProfilBeneficiaire | null>(null);
  const [form, setForm] = useState<ProfileFormState>(initialForm);

  useEffect(() => {
    async function loadCompanies() {
      try {
        setLoadingCompanies(true);
        setError(null);
        const response = await fetchAdminB2BCompanies();
        const sorted = sortCompanies(response || []);
        setCompanies(sorted);

        if (sorted.length > 0) {
          setSelectedEntrepriseId((current) => current || sorted[0].id_entreprise);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Impossible de charger les entreprises.'
        );
      } finally {
        setLoadingCompanies(false);
      }
    }

    loadCompanies();
  }, []);

  useEffect(() => {
    async function loadProfiles() {
      if (!selectedEntrepriseId) {
        setProfiles([]);
        return;
      }

      try {
        setLoadingProfiles(true);
        setError(null);
        const response = await fetchAdminB2BProfilsBeneficiaires(selectedEntrepriseId);
        setProfiles(sortProfiles(response || []));
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Impossible de charger les profils bénéficiaires."
        );
      } finally {
        setLoadingProfiles(false);
      }
    }

    loadProfiles();
  }, [selectedEntrepriseId]);

  const selectedEntreprise = useMemo(
    () => companies.find((item) => item.id_entreprise === selectedEntrepriseId) ?? null,
    [companies, selectedEntrepriseId]
  );

  function resetMessages() {
    setError(null);
    setSuccess(null);
  }

  function openCreateModal() {
    setEditingProfile(null);
    setForm(initialForm);
    resetMessages();
    setModalOpen(true);
  }

  function openEditModal(item: B2BProfilBeneficiaire) {
    setEditingProfile(item);
    setForm(toForm(item));
    resetMessages();
    setModalOpen(true);
  }

  function closeModal() {
    if (submitting) return;
    setModalOpen(false);
    setEditingProfile(null);
    setForm(initialForm);
  }

  function handleChange<K extends keyof ProfileFormState>(
    key: K,
    value: ProfileFormState[K]
  ) {
    setForm((current) => ({...current, [key]: value}));
  }

  async function reloadProfiles() {
    if (!selectedEntrepriseId) return;
    const response = await fetchAdminB2BProfilsBeneficiaires(selectedEntrepriseId);
    setProfiles(sortProfiles(response || []));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!selectedEntrepriseId) {
      setError('Veuillez sélectionner une entreprise.');
      return;
    }

    if (!form.code.trim() || !form.libelle.trim()) {
      setError('Le code et le libellé sont obligatoires.');
      return;
    }

    try {
      setSubmitting(true);
      resetMessages();

      const payload = {
        code: form.code.trim(),
        libelle: form.libelle.trim(),
        description: form.description.trim() || undefined,
        validation_requise: form.validation_requise,
        budget_plafond_mensuel: parseNumber(form.budget_plafond_mensuel),
        nb_jours_mois: parseNumber(form.nb_jours_mois),
        nb_reservations_simultanees: parseNumber(form.nb_reservations_simultanees),
        avec_chauffeur_autorise: form.avec_chauffeur_autorise,
        sans_chauffeur_autorise: form.sans_chauffeur_autorise,
        liste_type_autorise: parseVehicleTypes(form.liste_type_autorise),
        actif: form.actif
      };

      if (editingProfile) {
        const response = await updateAdminB2BProfilBeneficiaire(
          editingProfile.id_profil_beneficiaire,
          payload
        );

        setProfiles((current) =>
          sortProfiles(
            current.map((item) =>
              item.id_profil_beneficiaire === response.profil_beneficiaire.id_profil_beneficiaire
                ? response.profil_beneficiaire
                : item
            )
          )
        );

        setSuccess(response.message || 'Profil bénéficiaire modifié avec succès.');
      } else {
        const response = await createAdminB2BProfilBeneficiaire(
          selectedEntrepriseId,
          payload
        );

        setProfiles((current) =>
          sortProfiles([response.profil_beneficiaire, ...current])
        );

        setSuccess(response.message || 'Profil bénéficiaire créé avec succès.');
      }

      closeModal();
      await reloadProfiles();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'enregistrer le profil bénéficiaire."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(item: B2BProfilBeneficiaire) {
    const confirmed = window.confirm(
      `Supprimer le profil bénéficiaire "${item.libelle || item.code}" ?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(item.id_profil_beneficiaire);
      resetMessages();

      const response = await deleteAdminB2BProfilBeneficiaire(
        item.id_profil_beneficiaire
      );

      setProfiles((current) =>
        current.filter(
          (profile) => profile.id_profil_beneficiaire !== item.id_profil_beneficiaire
        )
      );

      setSuccess(response.message || 'Profil bénéficiaire supprimé avec succès.');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible de supprimer le profil bénéficiaire.'
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Gestion administrative B2B</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
              Profils bénéficiaires
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Sélectionne d’abord une entreprise. Ensuite tu peux créer, modifier ou
              supprimer ses profils bénéficiaires.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={selectedEntrepriseId}
              onChange={(e) => setSelectedEntrepriseId(e.target.value)}
              disabled={loadingCompanies || companies.length === 0}
              className="min-w-[280px] rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
            >
              {companies.length === 0 ? (
                <option value="">Aucune entreprise</option>
              ) : (
                companies.map((company) => (
                  <option key={company.id_entreprise} value={company.id_entreprise}>
                    {company.raison_sociale || company.id_entreprise}
                  </option>
                ))
              )}
            </select>

            <button
              type="button"
              onClick={() => void reloadProfiles()}
              disabled={!selectedEntrepriseId || loadingProfiles}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw className={`h-4 w-4 ${loadingProfiles ? 'animate-spin' : ''}`} />
              Actualiser
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              disabled={!selectedEntrepriseId}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              Ajouter un profil
            </button>
          </div>
        </div>

        {selectedEntreprise ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            Entreprise sélectionnée :{' '}
            <span className="font-semibold">
              {selectedEntreprise.raison_sociale || selectedEntreprise.id_entreprise}
            </span>
          </div>
        ) : null}

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
            Liste des profils bénéficiaires ({profiles.length})
          </h3>
        </div>

        {loadingCompanies || loadingProfiles ? (
          <div className="px-6 py-10 text-sm text-slate-500">Chargement...</div>
        ) : !selectedEntrepriseId ? (
          <div className="px-6 py-10 text-sm text-slate-500">
            Sélectionne une entreprise pour afficher les profils bénéficiaires.
          </div>
        ) : profiles.length === 0 ? (
          <div className="px-6 py-10 text-sm text-slate-500">
            Aucun profil bénéficiaire trouvé pour cette entreprise.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  <th className="px-6 py-4">Profil</th>
                  <th className="px-6 py-4">Validation</th>
                  <th className="px-6 py-4">Budget / jours</th>
                  <th className="px-6 py-4">Trajets</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4">Création</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {profiles.map((item) => (
                  <tr key={item.id_profil_beneficiaire}>
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                          <ClipboardList className="h-5 w-5" />
                        </div>

                        <div>
                          <p className="font-semibold text-slate-900">
                            {item.libelle || '—'}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Code : {item.code || '—'}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.description || 'Sans description'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 align-top text-sm text-slate-700">
                      {item.validation_requise ? 'Requise' : 'Non requise'}
                    </td>

                    <td className="px-6 py-4 align-top text-sm text-slate-700">
                      <p>Budget : {item.budget_plafond_mensuel ?? '—'}</p>
                      <p className="mt-1">Jours/mois : {item.nb_jours_mois ?? '—'}</p>
                      <p className="mt-1">
                        Résa simultanées : {item.nb_reservations_simultanees ?? '—'}
                      </p>
                    </td>

                    <td className="px-6 py-4 align-top text-sm text-slate-700">
                      <p>
                        Avec chauffeur : {item.avec_chauffeur_autorise ? 'Oui' : 'Non'}
                      </p>
                      <p className="mt-1">
                        Sans chauffeur : {item.sans_chauffeur_autorise ? 'Oui' : 'Non'}
                      </p>
                      <p className="mt-1">
                        Types : {item.liste_type_autorise?.length ? item.liste_type_autorise.join(', ') : '—'}
                      </p>
                    </td>

                    <td className="px-6 py-4 align-top text-sm text-slate-700">
                      {item.actif ? 'Actif' : 'Inactif'}
                    </td>

                    <td className="px-6 py-4 align-top text-sm text-slate-700">
                      {formatDate(item.date_creation)}
                    </td>

                    <td className="px-6 py-4 align-top">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          <Pencil className="h-4 w-4" />
                          Modifier
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleDelete(item)}
                          disabled={deletingId === item.id_profil_beneficiaire}
                          className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 className="h-4 w-4" />
                          {deletingId === item.id_profil_beneficiaire ? 'Suppression...' : 'Supprimer'}
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
          <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">
                  {editingProfile ? 'Modifier le profil bénéficiaire' : 'Ajouter un profil bénéficiaire'}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  L’entreprise utilisée est automatiquement celle sélectionnée dans la page.
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

            <form
              onSubmit={handleSubmit}
              className="max-h-[calc(90vh-88px)] overflow-y-auto space-y-6 px-6 py-6"
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Code</span>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => handleChange('code', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Libellé</span>
                  <input
                    type="text"
                    value={form.libelle}
                    onChange={(e) => handleChange('libelle', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                </label>

                <label className="space-y-2 xl:col-span-3">
                  <span className="text-sm font-medium text-slate-700">Description</span>
                  <textarea
                    value={form.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={3}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Budget plafond mensuel</span>
                  <input
                    type="number"
                    min="0"
                    value={form.budget_plafond_mensuel}
                    onChange={(e) => handleChange('budget_plafond_mensuel', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Nombre de jours / mois</span>
                  <input
                    type="number"
                    min="0"
                    value={form.nb_jours_mois}
                    onChange={(e) => handleChange('nb_jours_mois', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Réservations simultanées max
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={form.nb_reservations_simultanees}
                    onChange={(e) =>
                      handleChange('nb_reservations_simultanees', e.target.value)
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                </label>

                <label className="space-y-2 xl:col-span-3">
                  <span className="text-sm font-medium text-slate-700">
                    Types autorisés
                  </span>
                  <input
                    type="text"
                    value={form.liste_type_autorise}
                    onChange={(e) => handleChange('liste_type_autorise', e.target.value)}
                    placeholder="Ex: SUV, Berline, Citadine"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={form.validation_requise}
                    onChange={(e) => handleChange('validation_requise', e.target.checked)}
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Validation requise
                  </span>
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={form.avec_chauffeur_autorise}
                    onChange={(e) =>
                      handleChange('avec_chauffeur_autorise', e.target.checked)
                    }
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Avec chauffeur autorisé
                  </span>
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={form.sans_chauffeur_autorise}
                    onChange={(e) =>
                      handleChange('sans_chauffeur_autorise', e.target.checked)
                    }
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Sans chauffeur autorisé
                  </span>
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 xl:col-span-3">
                  <input
                    type="checkbox"
                    checked={form.actif}
                    onChange={(e) => handleChange('actif', e.target.checked)}
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Profil actif
                  </span>
                </label>
              </div>

              <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white pt-4">
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
                    : editingProfile
                      ? 'Enregistrer les modifications'
                      : 'Créer le profil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}