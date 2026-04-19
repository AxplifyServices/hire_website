'use client';

import {useEffect, useMemo, useState} from 'react';
import {COUNTRIES, DEFAULT_COUNTRY, getCountryByCode} from '@/components/auth/countries';
import {Pencil, Plus, RefreshCcw, Search, Trash2, X} from 'lucide-react';
import type {AdminClient, AdminClientsListResponse} from '@/lib/types';
import {
  createAdminClient,
  deleteAdminClient,
  fetchAdminClients,
  updateAdminClient
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

function getCountryLabel(code: string) {
  return COUNTRY_LABELS[code] ?? code;
}
type ClientFormState = {
  mail: string;
  password: string;
  nom: string;
  prenom: string;
  date_naissance: string;
  pays: string;
  prefixe_tel: string;
  num_tel: string;
  statut_client: string;
  type_client: string;
  language_favori: string;
  banned: boolean;
};

const initialForm: ClientFormState = {
  mail: '',
  password: '',
  nom: '',
  prenom: '',
  date_naissance: '',
  pays: DEFAULT_COUNTRY.code,
  prefixe_tel: DEFAULT_COUNTRY.dialCode,
  num_tel: '',
  statut_client: 'Actif',
  type_client: 'Particulier',
  language_favori: 'FR',
  banned: false
};

function toForm(client: AdminClient): ClientFormState {
  const countryCode = client.pays && COUNTRY_LABELS[client.pays] ? client.pays : DEFAULT_COUNTRY.code;
  const country = getCountryByCode(countryCode);

  return {
    mail: client.mail ?? '',
    password: '',
    nom: client.nom ?? '',
    prenom: client.prenom ?? '',
    date_naissance: client.date_naissance ? client.date_naissance.slice(0, 10) : '',
    pays: country.code,
    prefixe_tel: client.prefixe_tel ?? country.dialCode,
    num_tel: client.num_tel ?? '',
    statut_client: client.statut_client ?? 'Actif',
    type_client: 'Particulier',
    language_favori: client.language_favori ?? 'FR',
    banned: Boolean(client.banned)
  };
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR').format(date);
}

function formatPhone(client: AdminClient) {
  return [client.prefixe_tel, client.num_tel].filter(Boolean).join(' ') || '—';
}

export default function AdminClientsManager() {
  const [response, setResponse] = useState<AdminClientsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [typeFilter] = useState('Particulier');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<AdminClient | null>(null);
  const [form, setForm] = useState<ClientFormState>(initialForm);

  const countryOptions = useMemo(() => {
    return COUNTRIES.map((country) => ({
      code: country.code,
      dialCode: country.dialCode,
      label: getCountryLabel(country.code)
    }));
  }, []);

  const dialCodeOptions = useMemo(() => {
    return Array.from(new Set(COUNTRIES.map((country) => country.dialCode))).sort((a, b) =>
      a.localeCompare(b, undefined, {numeric: true})
    );
  }, []);  

  const clients = response?.data ?? [];
  const pagination = response?.pagination;
  const totalClients = pagination?.total ?? 0;
  const totalPages = Math.max(pagination?.total_pages ?? 1, 1);

  async function loadClients(nextPage = page, silent = false) {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const result = await fetchAdminClients({
        page: nextPage,
        limit: 10,
        search,
        statut_client: statutFilter,
        type_client: 'Particulier',
        sort_by: 'date_creation',
        sort_order: 'desc'
      });

      setResponse(result);
      setPage(result.pagination.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les clients.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadClients(1);
  }, [search, statutFilter, typeFilter]);

  const modalTitle = useMemo(() => {
    return editingClient ? 'Modifier le client' : 'Ajouter un client';
  }, [editingClient]);

  function handleChange<K extends keyof ClientFormState>(
    key: K,
    value: ClientFormState[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  }

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

  function openCreateModal() {
    setEditingClient(null);
    setForm(initialForm);
    setError(null);
    setSuccess(null);
    setModalOpen(true);
  }

  function openEditModal(client: AdminClient) {
    setEditingClient(client);
    setForm(toForm(client));
    setError(null);
    setSuccess(null);
    setModalOpen(true);
  }

  function closeModal() {
    if (submitting) return;
    setModalOpen(false);
    setEditingClient(null);
    setForm(initialForm);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const payload = {
        mail: form.mail,
        ...(form.password ? {password: form.password} : {}),
        nom: form.nom,
        prenom: form.prenom,
        date_naissance: form.date_naissance || undefined,
        pays: form.pays || undefined,
        prefixe_tel: form.prefixe_tel || undefined,
        num_tel: form.num_tel || undefined,
        statut_client: form.statut_client,
        type_client: form.type_client,
        language_favori: form.language_favori,
        banned: form.banned
      };

      if (editingClient) {
        const result = await updateAdminClient(editingClient.id_client, payload);
        setSuccess(result.message || 'Client modifié avec succès.');
      } else {
        if (!form.password) {
          throw new Error('Le mot de passe est obligatoire à la création.');
        }

        const result = await createAdminClient({
          ...payload,
          password: form.password
        });
        setSuccess(result.message || 'Client créé avec succès.');
      }

      closeModal();
      await loadClients(page, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "L'enregistrement a échoué.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(client: AdminClient) {
    const confirmed = window.confirm(
      `Désactiver le client "${client.prenom || ''} ${client.nom || ''}" ?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(client.id_client);
      setError(null);
      setSuccess(null);

      const result = await deleteAdminClient(client.id_client);
      setSuccess(result.message || 'Client désactivé avec succès.');

      const shouldGoPrev = clients.length === 1 && page > 1;
      await loadClients(shouldGoPrev ? page - 1 : page, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'La suppression a échoué.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Gestion des clients B2C</p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Clients</h2>
            <p className="mt-2 text-sm text-slate-500">
              {totalClients} client{totalClients > 1 ? 's' : ''} au total — 10 par page
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => loadClients(page, true)}
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
              Ajouter un client
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Recherche</label>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-cyan-500 focus-within:bg-white">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setPage(1);
                    setSearch(searchInput.trim());
                  }
                }}
                placeholder="Nom, prénom, email, téléphone, ID..."
                className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Statut</label>
            <select
              value={statutFilter}
              onChange={(e) => {
                setPage(1);
                setStatutFilter(e.target.value);
              }}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
            >
              <option value="">Tous</option>
              <option value="Actif">Actif</option>
              <option value="Rupture relation">Rupture relation</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => {
              setPage(1);
              setSearch(searchInput.trim());
            }}
            className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Rechercher
          </button>

          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setSearch('');
              setStatutFilter('');
              setPage(1);
            }}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Réinitialiser
          </button>
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
                <th className="pb-2 pr-4">Client</th>
                <th className="pb-2 pr-4">Contact</th>
                <th className="pb-2 pr-4">Statut</th>
                <th className="pb-2 pr-4">Création</th>
                <th className="pb-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                    Chargement des clients...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                    Aucun client trouvé.
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id_client} className="overflow-hidden rounded-2xl bg-slate-50 text-sm text-slate-700">
                    <td className="rounded-l-2xl px-4 py-4">
                      <div>
                        <p className="font-semibold text-slate-950">
                          {[client.prenom, client.nom].filter(Boolean).join(' ') || 'Sans nom'}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">{client.id_client}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p>{client.mail || '—'}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatPhone(client)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-2">
                        <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${client.statut_client === 'Actif' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {client.statut_client || '—'}
                        </span>
                        {client.banned ? (
                          <span className="inline-flex w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                            Bloqué
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-4">{formatDate(client.date_creation)}</td>
                    <td className="rounded-r-2xl px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(client)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          <Pencil className="h-4 w-4" />
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(client)}
                          disabled={deletingId === client.id_client}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 className="h-4 w-4" />
                          {deletingId === client.id_client ? 'Suppression...' : 'Supprimer'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">Page {page} sur {totalPages}</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={page <= 1 || loading || refreshing}
              onClick={() => loadClients(page - 1, true)}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Précédent
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading || refreshing}
              onClick={() => loadClients(page + 1, true)}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      </section>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[28px] bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <h3 className="text-2xl font-bold text-slate-950">{modalTitle}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Renseigne les informations du client B2C.
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
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Prénom</label>
                  <input value={form.prenom} onChange={(e) => handleChange('prenom', e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" required />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Nom</label>
                  <input value={form.nom} onChange={(e) => handleChange('nom', e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" required />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
                  <input type="email" value={form.mail} onChange={(e) => handleChange('mail', e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" required />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Mot de passe {editingClient ? '(laisser vide pour ne pas changer)' : ''}
                  </label>
                  <input type="password" value={form.password} onChange={(e) => handleChange('password', e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" required={!editingClient} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Date de naissance</label>
                  <input type="date" value={form.date_naissance} onChange={(e) => handleChange('date_naissance', e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Pays</label>
                  <select
                    value={form.pays}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                  >
                    {countryOptions.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Préfixe téléphone</label>
                  <select
                    value={form.prefixe_tel}
                    onChange={(e) => handlePrefixChange(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                  >
                    {dialCodeOptions.map((dialCode) => (
                      <option key={dialCode} value={dialCode}>
                        {dialCode}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Numéro téléphone</label>
                  <input value={form.num_tel} onChange={(e) => handleChange('num_tel', e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Statut</label>
                  <select value={form.statut_client} onChange={(e) => handleChange('statut_client', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none">
                    <option value="Actif">Actif</option>
                    <option value="Rupture relation">Rupture relation</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Langue favorite</label>
                  <select value={form.language_favori} onChange={(e) => handleChange('language_favori', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none">
                    <option value="FR">FR</option>
                    <option value="EN">EN</option>
                    <option value="AR">AR</option>
                  </select>
                </div>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                  <input type="checkbox" checked={form.banned} onChange={(e) => handleChange('banned', e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
                  Compte bloqué
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
                <button type="button" onClick={closeModal} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  Annuler
                </button>
                <button type="submit" disabled={submitting} className="rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {submitting ? 'Enregistrement...' : editingClient ? 'Enregistrer les modifications' : 'Créer le client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}