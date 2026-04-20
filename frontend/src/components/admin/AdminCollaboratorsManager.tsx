'use client';

import {useEffect, useMemo, useState} from 'react';
import {COUNTRIES, DEFAULT_COUNTRY, getCountryByCode} from '@/components/auth/countries';
import {Pencil, Plus, RefreshCcw, Trash2, UserRound, X} from 'lucide-react';
import type {
  B2BCentreCout,
  B2BCollaborateur,
  B2BEntreprise,
  B2BProfilBeneficiaire
} from '@/lib/types';
import {
  createAdminB2BCollaborateur,
  deleteAdminB2BCollaborateur,
  fetchAdminB2BCentresCout,
  fetchAdminB2BCollaborateurs,
  fetchAdminB2BCompanies,
  fetchAdminB2BProfilsBeneficiaires,
  updateAdminB2BCollaborateur
} from '@/lib/api';

const COUNTRY_LABELS: Record<string, string> = {
  MA: 'Maroc',
  DZ: 'Algérie',
  TN: 'Tunisie',
  LY: 'Libye',
  EG: 'Égypte',
  MR: 'Mauritanie',
  SN: 'Sénégal',
  CI: 'Côte d’Ivoire',
  ML: 'Mali',
  GN: 'Guinée',
  CM: 'Cameroun',
  NG: 'Nigeria',
  ZA: 'Afrique du Sud',
  KE: 'Kenya',
  ET: 'Éthiopie',
  FR: 'France',
  ES: 'Espagne',
  GB: 'Royaume-Uni',
  US: 'États-Unis',
  CA: 'Canada',
  DE: 'Allemagne',
  IT: 'Italie',
  BE: 'Belgique',
  NL: 'Pays-Bas',
  PT: 'Portugal',
  CH: 'Suisse',
  AT: 'Autriche',
  SE: 'Suède',
  NO: 'Norvège',
  DK: 'Danemark',
  FI: 'Finlande',
  IE: 'Irlande',
  PL: 'Pologne',
  CZ: 'République tchèque',
  RO: 'Roumanie',
  HU: 'Hongrie',
  GR: 'Grèce',
  TR: 'Turquie',
  UA: 'Ukraine',
  RU: 'Russie',
  AE: 'Émirats arabes unis',
  SA: 'Arabie saoudite',
  QA: 'Qatar',
  KW: 'Koweït',
  BH: 'Bahreïn',
  OM: 'Oman',
  JO: 'Jordanie',
  LB: 'Liban',
  IQ: 'Irak',
  IN: 'Inde',
  PK: 'Pakistan',
  BD: 'Bangladesh',
  CN: 'Chine',
  JP: 'Japon',
  KR: 'Corée du Sud',
  SG: 'Singapour',
  MY: 'Malaisie',
  TH: 'Thaïlande',
  ID: 'Indonésie',
  PH: 'Philippines',
  VN: 'Vietnam',
  AU: 'Australie',
  NZ: 'Nouvelle-Zélande',
  BR: 'Brésil',
  AR: 'Argentine',
  MX: 'Mexique',
  CL: 'Chili',
  CO: 'Colombie',
  PE: 'Pérou'
};

type CollaboratorFormState = {
  nom: string;
  prenom: string;
  mail: string;
  password: string;
  pays: string;
  prefixe_tel: string;
  num_tel: string;
  date_naissance: string;
  language_favori: string;
  id_centre_cout: string;
  id_profil_beneficiaire: string;
  role_entreprise: string;
  matricule: string;
  validateur: string;
  manager_id_client_entreprise: string;
  actif: boolean;
};

const initialForm: CollaboratorFormState = {
  nom: '',
  prenom: '',
  mail: '',
  password: '',
  pays: DEFAULT_COUNTRY.code,
  prefixe_tel: DEFAULT_COUNTRY.dialCode,
  num_tel: '',
  date_naissance: '',
  language_favori: 'fr',
  id_centre_cout: '',
  id_profil_beneficiaire: '',
  role_entreprise: 'collaborateur',
  matricule: '',
  validateur: 'self',
  manager_id_client_entreprise: '',
  actif: true
};

const VALIDATEUR_OPTIONS = ['self', 'autre'] as const;
const LANGUAGE_OPTIONS = ['FR', 'EN', 'AR'] as const;

function sortCompanies(items: B2BEntreprise[]) {
  return [...items].sort((a, b) =>
    (a.raison_sociale || '').localeCompare(b.raison_sociale || '', 'fr')
  );
}

function sortCollaborateurs(items: B2BCollaborateur[]) {
  return [...items].sort((a, b) => {
    const aName = `${a.clients?.prenom || ''} ${a.clients?.nom || ''}`.trim();
    const bName = `${b.clients?.prenom || ''} ${b.clients?.nom || ''}`.trim();
    return aName.localeCompare(bName, 'fr');
  });
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

function fullName(item: B2BCollaborateur) {
  return `${item.clients?.prenom || ''} ${item.clients?.nom || ''}`.trim() || '—';
}

function toForm(item: B2BCollaborateur): CollaboratorFormState {
  const countryCode =
    item.clients?.pays && COUNTRY_LABELS[item.clients.pays]
      ? item.clients.pays
      : DEFAULT_COUNTRY.code;

  const country = getCountryByCode(countryCode);

  return {
    nom: item.clients?.nom ?? '',
    prenom: item.clients?.prenom ?? '',
    mail: item.clients?.mail ?? '',
    password: '',
    pays: country.code,
    prefixe_tel: item.clients?.prefixe_tel ?? country.dialCode,
    num_tel: item.clients?.num_tel ?? '',
    date_naissance: item.clients?.date_naissance
      ? String(item.clients.date_naissance).slice(0, 10)
      : '',
    language_favori: (item.clients?.language_favori ?? 'FR').toUpperCase(),
    id_centre_cout: item.id_centre_cout ?? '',
    id_profil_beneficiaire: item.id_profil_beneficiaire ?? '',
    role_entreprise: item.role_entreprise ?? '',
    matricule: item.matricule ?? '',
    validateur:
      item.manager_id_client_entreprise &&
      item.manager_id_client_entreprise !== item.id_client_entreprise
        ? 'autre'
        : 'self',
    manager_id_client_entreprise:
      item.manager_id_client_entreprise &&
      item.manager_id_client_entreprise !== item.id_client_entreprise
        ? item.manager_id_client_entreprise
        : '',
    actif: Boolean(item.actif)
  };
}

export default function AdminCollaboratorsManager() {
  const [companies, setCompanies] = useState<B2BEntreprise[]>([]);
  const [selectedEntrepriseId, setSelectedEntrepriseId] = useState('');

  const [collaborateurs, setCollaborateurs] = useState<B2BCollaborateur[]>([]);
  const [centresCout, setCentresCout] = useState<B2BCentreCout[]>([]);
  const [profilsBeneficiaires, setProfilsBeneficiaires] = useState<B2BProfilBeneficiaire[]>([]);

  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingCollaborateurs, setLoadingCollaborateurs] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCollaborateur, setEditingCollaborateur] = useState<B2BCollaborateur | null>(null);
  const [form, setForm] = useState<CollaboratorFormState>(initialForm);

  const countryOptions = useMemo(() => {
    return COUNTRIES.map((country) => ({
      code: country.code,
      dialCode: country.dialCode,
      label: COUNTRY_LABELS[country.code] ?? country.code
    }));
  }, []);

  const dialCodeOptions = useMemo(() => {
    return Array.from(new Set(COUNTRIES.map((country) => country.dialCode))).sort((a, b) =>
      a.localeCompare(b, undefined, {numeric: true})
    );
  }, []);

  function handleCountryChange(countryCode: string) {
    const country = getCountryByCode(countryCode);

    setForm((current) => ({
      ...current,
      pays: country.code,
      prefixe_tel: country.dialCode
    }));
  }

  function handlePrefixChange(dialCode: string) {
    const matchedCountry = COUNTRIES.find((country) => country.dialCode === dialCode);

    setForm((current) => ({
      ...current,
      prefixe_tel: dialCode,
      pays: matchedCountry?.code ?? current.pays
    }));
  }

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
    async function loadEntrepriseData() {
      if (!selectedEntrepriseId) {
        setCollaborateurs([]);
        setCentresCout([]);
        setProfilsBeneficiaires([]);
        return;
      }

      try {
        setLoadingCollaborateurs(true);
        setError(null);

        const [collabs, centres, profils] = await Promise.all([
          fetchAdminB2BCollaborateurs(selectedEntrepriseId),
          fetchAdminB2BCentresCout(selectedEntrepriseId),
          fetchAdminB2BProfilsBeneficiaires(selectedEntrepriseId)
        ]);

        setCollaborateurs(sortCollaborateurs(collabs || []));
        setCentresCout(centres || []);
        setProfilsBeneficiaires(profils || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Impossible de charger les données de l'entreprise sélectionnée."
        );
      } finally {
        setLoadingCollaborateurs(false);
      }
    }

    loadEntrepriseData();
  }, [selectedEntrepriseId]);

  const selectedEntreprise = useMemo(
    () => companies.find((item) => item.id_entreprise === selectedEntrepriseId) ?? null,
    [companies, selectedEntrepriseId]
  );

    const validateurOptions = useMemo(() => {
    return collaborateurs.filter(
        (item) =>
        item.actif &&
        (!editingCollaborateur ||
            item.id_client_entreprise !== editingCollaborateur.id_client_entreprise)
    );
    }, [collaborateurs, editingCollaborateur]);

  function resetMessages() {
    setError(null);
    setSuccess(null);
  }

  function openCreateModal() {
    setEditingCollaborateur(null);
    setForm(initialForm);
    resetMessages();
    setModalOpen(true);
  }

  function openEditModal(item: B2BCollaborateur) {
    setEditingCollaborateur(item);
    setForm(toForm(item));
    resetMessages();
    setModalOpen(true);
  }

  function closeModal() {
    if (submitting) return;
    setModalOpen(false);
    setEditingCollaborateur(null);
    setForm(initialForm);
  }

  function handleChange<K extends keyof CollaboratorFormState>(
    key: K,
    value: CollaboratorFormState[K]
  ) {
    setForm((current) => ({...current, [key]: value}));
  }

  async function reloadCurrentEntrepriseData() {
    if (!selectedEntrepriseId) return;

    const [collabs, centres, profils] = await Promise.all([
      fetchAdminB2BCollaborateurs(selectedEntrepriseId),
      fetchAdminB2BCentresCout(selectedEntrepriseId),
      fetchAdminB2BProfilsBeneficiaires(selectedEntrepriseId)
    ]);

    setCollaborateurs(sortCollaborateurs(collabs || []));
    setCentresCout(centres || []);
    setProfilsBeneficiaires(profils || []);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!selectedEntrepriseId) {
      setError('Veuillez sélectionner une entreprise.');
      return;
    }

    if (!form.nom.trim() || !form.prenom.trim() || !form.mail.trim()) {
      setError('Nom, prénom et email sont obligatoires.');
      return;
    }

    if (!editingCollaborateur && !form.password.trim()) {
      setError('Le mot de passe est obligatoire à la création.');
      return;
    }

    if (form.validateur === 'autre' && !form.manager_id_client_entreprise) {
      setError('Veuillez sélectionner un manager valideur.');
      return;
    }

    try {
      setSubmitting(true);
      resetMessages();

      if (editingCollaborateur) {
        const payload = {
          nom: form.nom.trim(),
          prenom: form.prenom.trim(),
          mail: form.mail.trim(),
          ...(form.password.trim() ? {password: form.password.trim()} : {}),
          pays: form.pays.trim() || undefined,
          prefixe_tel: form.prefixe_tel.trim() || undefined,
          num_tel: form.num_tel.trim() || undefined,
          date_naissance: form.date_naissance || undefined,
          language_favori: form.language_favori?.toUpperCase() || undefined,
          id_centre_cout: form.id_centre_cout || null,
          id_profil_beneficiaire: form.id_profil_beneficiaire || null,
          role_entreprise: form.role_entreprise,
          matricule: form.matricule.trim() || undefined,
          validateur: form.validateur,
          manager_id_client_entreprise:
            form.validateur === 'autre'
              ? form.manager_id_client_entreprise || null
              : null,
          actif: form.actif
        };

        const response = await updateAdminB2BCollaborateur(
          editingCollaborateur.id_client_entreprise,
          payload
        );

        setCollaborateurs((current) =>
          sortCollaborateurs(
            current.map((item) =>
              item.id_client_entreprise === response.collaborateur.id_client_entreprise
                ? response.collaborateur
                : item
            )
          )
        );

        setSuccess(response.message || 'Collaborateur modifié avec succès.');
      } else {
        const payload = {
          nom: form.nom.trim(),
          prenom: form.prenom.trim(),
          mail: form.mail.trim(),
          password: form.password.trim(),
          pays: form.pays.trim() || undefined,
          prefixe_tel: form.prefixe_tel.trim() || undefined,
          num_tel: form.num_tel.trim() || undefined,
          date_naissance: form.date_naissance || undefined,
          language_favori: form.language_favori || undefined,
          id_centre_cout: form.id_centre_cout || undefined,
          id_profil_beneficiaire: form.id_profil_beneficiaire || undefined,
          role_entreprise: form.role_entreprise,
          matricule: form.matricule.trim() || undefined,
          validateur: form.validateur,
          manager_id_client_entreprise:
            form.validateur === 'autre'
              ? form.manager_id_client_entreprise || undefined
              : undefined
        };

        const response = await createAdminB2BCollaborateur(selectedEntrepriseId, payload);

        setCollaborateurs((current) =>
          sortCollaborateurs([response.collaborateur, ...current])
        );

        setSuccess(response.message || 'Collaborateur créé avec succès.');
      }

      closeModal();
      await reloadCurrentEntrepriseData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible d'enregistrer le collaborateur."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(item: B2BCollaborateur) {
    const confirmed = window.confirm(
      `Supprimer le collaborateur "${fullName(item)}" ?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(item.id_client_entreprise);
      resetMessages();

      const response = await deleteAdminB2BCollaborateur(item.id_client_entreprise);

      setCollaborateurs((current) =>
        current.filter(
          (collab) => collab.id_client_entreprise !== item.id_client_entreprise
        )
      );

      setSuccess(response.message || 'Collaborateur supprimé avec succès.');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Impossible de supprimer le collaborateur.'
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
              Collaborateurs
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Sélectionne d’abord une entreprise. La liste des collaborateurs, des centres
              de coût et des profils bénéficiaires dépend de cette entreprise.
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
              onClick={() => void reloadCurrentEntrepriseData()}
              disabled={!selectedEntrepriseId || loadingCollaborateurs}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw className={`h-4 w-4 ${loadingCollaborateurs ? 'animate-spin' : ''}`} />
              Actualiser
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              disabled={!selectedEntrepriseId}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              Ajouter un collaborateur
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
            Liste des collaborateurs ({collaborateurs.length})
          </h3>
        </div>

        {loadingCompanies || loadingCollaborateurs ? (
          <div className="px-6 py-10 text-sm text-slate-500">Chargement...</div>
        ) : !selectedEntrepriseId ? (
          <div className="px-6 py-10 text-sm text-slate-500">
            Sélectionne une entreprise pour afficher les collaborateurs.
          </div>
        ) : collaborateurs.length === 0 ? (
          <div className="px-6 py-10 text-sm text-slate-500">
            Aucun collaborateur trouvé pour cette entreprise.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  <th className="px-6 py-4">Collaborateur</th>
                  <th className="px-6 py-4">Rôle</th>
                  <th className="px-6 py-4">Centre de coût</th>
                  <th className="px-6 py-4">Profil bénéficiaire</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4">Création</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {collaborateurs.map((item) => (
                  <tr key={item.id_client_entreprise}>
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                          <UserRound className="h-5 w-5" />
                        </div>

                        <div>
                          <p className="font-semibold text-slate-900">{fullName(item)}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.clients?.mail || '—'}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.matricule ? `Matricule : ${item.matricule}` : 'Sans matricule'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 align-top text-sm text-slate-700">
                      {item.role_entreprise || '—'}
                    </td>

                    <td className="px-6 py-4 align-top text-sm text-slate-700">
                      {item.centres_cout
                        ? `${item.centres_cout.code} — ${item.centres_cout.libelle}`
                        : '—'}
                    </td>

                    <td className="px-6 py-4 align-top text-sm text-slate-700">
                      {item.profils_beneficiaires
                        ? `${item.profils_beneficiaires.code} — ${item.profils_beneficiaires.libelle}`
                        : '—'}
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
                          disabled={deletingId === item.id_client_entreprise}
                          className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 className="h-4 w-4" />
                          {deletingId === item.id_client_entreprise ? 'Suppression...' : 'Supprimer'}
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
            <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-2xl">            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">
                  {editingCollaborateur ? 'Modifier le collaborateur' : 'Ajouter un collaborateur'}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  L’entreprise est automatiquement celle sélectionnée dans la page.
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

            <form onSubmit={handleSubmit} className="max-h-[calc(90vh-88px)] overflow-y-auto space-y-6 px-6 py-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Nom</span>
                  <input
                    type="text"
                    value={form.nom}
                    onChange={(e) => handleChange('nom', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Prénom</span>
                  <input
                    type="text"
                    value={form.prenom}
                    onChange={(e) => handleChange('prenom', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Email</span>
                  <input
                    type="email"
                    value={form.mail}
                    onChange={(e) => handleChange('mail', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    {editingCollaborateur ? 'Mot de passe (optionnel)' : 'Mot de passe'}
                  </span>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                </label>

                <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Pays</span>
                <select
                    value={form.pays}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                >
                    {countryOptions.map((country) => (
                    <option key={country.code} value={country.code}>
                        {country.label}
                    </option>
                    ))}
                </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Date de naissance</span>
                  <input
                    type="date"
                    value={form.date_naissance}
                    onChange={(e) => handleChange('date_naissance', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                </label>

                <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Préfixe téléphone</span>
                <select
                    value={form.prefixe_tel}
                    onChange={(e) => handlePrefixChange(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                >
                    {dialCodeOptions.map((dialCode) => (
                    <option key={dialCode} value={dialCode}>
                        {dialCode}
                    </option>
                    ))}
                </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Téléphone</span>
                  <input
                    type="text"
                    value={form.num_tel}
                    onChange={(e) => handleChange('num_tel', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Langue favorite</span>
                  <select
                    value={form.language_favori}
                    onChange={(e) => handleChange('language_favori', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  >
                    {LANGUAGE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Rôle entreprise</span>
                <input
                    type="text"
                    value={form.role_entreprise}
                    onChange={(e) => handleChange('role_entreprise', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                    placeholder="Ex: collaborateur, manager, superviseur..."
                />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Matricule</span>
                  <input
                    type="text"
                    value={form.matricule}
                    onChange={(e) => handleChange('matricule', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Validateur</span>
                  <select
                    value={form.validateur}
                    onChange={(e) => {
                      const value = e.target.value;
                      setForm((current) => ({
                        ...current,
                        validateur: value,
                        manager_id_client_entreprise: value === 'autre'
                          ? current.manager_id_client_entreprise
                          : ''
                      }));
                    }}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  >
                    {VALIDATEUR_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 xl:col-span-3">
                  <span className="text-sm font-medium text-slate-700">Centre de coût</span>
                  <select
                    value={form.id_centre_cout}
                    onChange={(e) => handleChange('id_centre_cout', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  >
                    <option value="">Aucun centre de coût</option>
                    {centresCout.map((item) => (
                      <option key={item.id_centre_cout} value={item.id_centre_cout}>
                        {item.code} — {item.libelle}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 xl:col-span-3">
                  <span className="text-sm font-medium text-slate-700">Profil bénéficiaire</span>
                  <select
                    value={form.id_profil_beneficiaire}
                    onChange={(e) => handleChange('id_profil_beneficiaire', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  >
                    <option value="">Aucun profil bénéficiaire</option>
                    {profilsBeneficiaires.map((item) => (
                      <option
                        key={item.id_profil_beneficiaire}
                        value={item.id_profil_beneficiaire}
                      >
                        {item.code} — {item.libelle}
                      </option>
                    ))}
                  </select>
                </label>

                {form.validateur === 'autre' ? (
                <label className="space-y-2 xl:col-span-3">
                    <span className="text-sm font-medium text-slate-700">Collaborateur valideur</span>
                    <select
                    value={form.manager_id_client_entreprise}
                    onChange={(e) =>
                        handleChange('manager_id_client_entreprise', e.target.value)
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                    >
                    <option value="">Sélectionner un collaborateur</option>
                    {validateurOptions.map((item) => (
                        <option
                        key={item.id_client_entreprise}
                        value={item.id_client_entreprise}
                        >
                        {fullName(item)}
                        {item.matricule ? ` — ${item.matricule}` : ''}
                        {item.clients?.mail ? ` — ${item.clients.mail}` : ''}
                        </option>
                    ))}
                    </select>
                </label>
                ) : null}

                {editingCollaborateur ? (
                  <label className="space-y-2 xl:col-span-3">
                    <span className="text-sm font-medium text-slate-700">Actif</span>
                    <select
                      value={form.actif ? 'true' : 'false'}
                      onChange={(e) => handleChange('actif', e.target.value === 'true')}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                    >
                      <option value="true">Actif</option>
                      <option value="false">Inactif</option>
                    </select>
                  </label>
                ) : null}
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
                    : editingCollaborateur
                      ? 'Enregistrer les modifications'
                      : 'Créer le collaborateur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}