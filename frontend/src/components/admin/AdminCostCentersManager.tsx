'use client';

import {useEffect, useMemo, useState} from 'react';
import {Landmark, Pencil, Plus, RefreshCcw, Trash2, X} from 'lucide-react';
import type {B2BCentreCout, B2BEntreprise} from '@/lib/types';
import {
  createAdminB2BCentreCout,
  deleteAdminB2BCentreCout,
  fetchAdminB2BCompanies,
  fetchAdminB2BCentresCout,
  updateAdminB2BCentreCout
} from '@/lib/api';

type CostCenterFormState = {
  code: string;
  libelle: string;
  actif: boolean;
};

const initialForm: CostCenterFormState = {
  code: '',
  libelle: '',
  actif: true
};

function sortCompanies(items: B2BEntreprise[]) {
  return [...items].sort((a, b) =>
    (a.raison_sociale || '').localeCompare(b.raison_sociale || '', 'fr')
  );
}

function sortCostCenters(items: B2BCentreCout[]) {
  return [...items].sort((a, b) =>
    (a.libelle || '').localeCompare(b.libelle || '', 'fr')
  );
}

function toForm(item: B2BCentreCout): CostCenterFormState {
  return {
    code: item.code ?? '',
    libelle: item.libelle ?? '',
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

export default function AdminCostCentersManager() {
  const [companies, setCompanies] = useState<B2BEntreprise[]>([]);
  const [selectedEntrepriseId, setSelectedEntrepriseId] = useState('');
  const [costCenters, setCostCenters] = useState<B2BCentreCout[]>([]);

  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingCostCenters, setLoadingCostCenters] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCostCenter, setEditingCostCenter] = useState<B2BCentreCout | null>(null);
  const [form, setForm] = useState<CostCenterFormState>(initialForm);

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
    async function loadCostCenters() {
      if (!selectedEntrepriseId) {
        setCostCenters([]);
        return;
      }

      try {
        setLoadingCostCenters(true);
        setError(null);
        const response = await fetchAdminB2BCentresCout(selectedEntrepriseId);
        setCostCenters(sortCostCenters(response || []));
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Impossible de charger les centres de coût.'
        );
      } finally {
        setLoadingCostCenters(false);
      }
    }

    loadCostCenters();
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
    setEditingCostCenter(null);
    setForm(initialForm);
    resetMessages();
    setModalOpen(true);
  }

  function openEditModal(item: B2BCentreCout) {
    setEditingCostCenter(item);
    setForm(toForm(item));
    resetMessages();
    setModalOpen(true);
  }

  function closeModal() {
    if (submitting) return;
    setModalOpen(false);
    setEditingCostCenter(null);
    setForm(initialForm);
  }

  function handleChange<K extends keyof CostCenterFormState>(
    key: K,
    value: CostCenterFormState[K]
  ) {
    setForm((current) => ({...current, [key]: value}));
  }

  async function reloadCostCenters() {
    if (!selectedEntrepriseId) return;
    const response = await fetchAdminB2BCentresCout(selectedEntrepriseId);
    setCostCenters(sortCostCenters(response || []));
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
        actif: form.actif
      };

      if (editingCostCenter) {
        const response = await updateAdminB2BCentreCout(
          editingCostCenter.id_centre_cout,
          payload
        );

        setCostCenters((current) =>
          sortCostCenters(
            current.map((item) =>
              item.id_centre_cout === response.centre_cout.id_centre_cout
                ? response.centre_cout
                : item
            )
          )
        );

        setSuccess(response.message || 'Centre de coût modifié avec succès.');
      } else {
        const response = await createAdminB2BCentreCout(
          selectedEntrepriseId,
          payload
        );

        setCostCenters((current) =>
          sortCostCenters([response.centre_cout, ...current])
        );

        setSuccess(response.message || 'Centre de coût créé avec succès.');
      }

      closeModal();
      await reloadCostCenters();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'enregistrer le centre de coût."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(item: B2BCentreCout) {
    const confirmed = window.confirm(
      `Supprimer le centre de coût "${item.libelle || item.code}" ?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(item.id_centre_cout);
      resetMessages();

      const response = await deleteAdminB2BCentreCout(item.id_centre_cout);

      setCostCenters((current) =>
        current.filter(
          (costCenter) => costCenter.id_centre_cout !== item.id_centre_cout
        )
      );

      setSuccess(response.message || 'Centre de coût supprimé avec succès.');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible de supprimer le centre de coût.'
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
              Centres de coût
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Sélectionne d’abord une entreprise. Ensuite tu peux créer, modifier ou
              supprimer ses centres de coût.
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
              onClick={() => void reloadCostCenters()}
              disabled={!selectedEntrepriseId || loadingCostCenters}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw className={`h-4 w-4 ${loadingCostCenters ? 'animate-spin' : ''}`} />
              Actualiser
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              disabled={!selectedEntrepriseId}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              Ajouter un centre de coût
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
            Liste des centres de coût ({costCenters.length})
          </h3>
        </div>

        {loadingCompanies || loadingCostCenters ? (
          <div className="px-6 py-10 text-sm text-slate-500">Chargement...</div>
        ) : !selectedEntrepriseId ? (
          <div className="px-6 py-10 text-sm text-slate-500">
            Sélectionne une entreprise pour afficher les centres de coût.
          </div>
        ) : costCenters.length === 0 ? (
          <div className="px-6 py-10 text-sm text-slate-500">
            Aucun centre de coût trouvé pour cette entreprise.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  <th className="px-6 py-4">Centre de coût</th>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4">Création</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {costCenters.map((item) => (
                  <tr key={item.id_centre_cout}>
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                          <Landmark className="h-5 w-5" />
                        </div>

                        <div>
                          <p className="font-semibold text-slate-900">
                            {item.libelle || '—'}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.id_centre_cout}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 align-top text-sm text-slate-700">
                      {item.code || '—'}
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
                          disabled={deletingId === item.id_centre_cout}
                          className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 className="h-4 w-4" />
                          {deletingId === item.id_centre_cout ? 'Suppression...' : 'Supprimer'}
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
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">
                  {editingCostCenter ? 'Modifier le centre de coût' : 'Ajouter un centre de coût'}
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
              <div className="grid gap-4 md:grid-cols-2">
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

                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2">
                  <input
                    type="checkbox"
                    checked={form.actif}
                    onChange={(e) => handleChange('actif', e.target.checked)}
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Centre de coût actif
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
                    : editingCostCenter
                      ? 'Enregistrer les modifications'
                      : 'Créer le centre de coût'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}