'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject
} from 'react';
import {
  CalendarDays,
  ChevronDown,
  Check,
  MapPin,
  Users,
  Cog,
  Snowflake
} from 'lucide-react';
import {useTranslations} from 'next-intl';
import dynamic from 'next/dynamic';

import {
  createB2bReservation,
  fetchAgencies,
  fetchEntrepriseCollaborateurs,
  getB2bQuote,
  searchVehicles
} from '@/lib/api';

import type {
  Agency,
  B2BCollaborateur,
  B2BContextResponse,
  B2BQuoteResponse,
  B2BReservationRecord,
  CreateB2BReservationPayload,
  Vehicle
} from '@/lib/types';

const B2BLocationMap = dynamic(() => import('./B2BLocationMap'), {
  ssr: false
});

type Props = {
  locale: string;
  token: string;
  context: B2BContextResponse;
  onReservationCreated?: (reservation: B2BReservationRecord | null) => void;
};

type LocationMode = 'agence' | 'localisation';
type FlowStep = 'form' | 'recap';

type SelectOption = {
  value: string;
  label: string;
};

type SelectGroup = {
  label: string;
  options: SelectOption[];
};

const DEFAULT_TARIFICATION_ID = 'TAR00000002';
const DEFAULT_ASSURANCE_ID = 'ASS00000001';
const fallbackImage =
  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80';

const TIME_OPTIONS: SelectOption[] = Array.from({length: 24 * 2}, (_, i) => {
  const hours = String(Math.floor(i / 2)).padStart(2, '0');
  const minutes = i % 2 === 0 ? '00' : '30';
  const value = `${hours}:${minutes}`;

  return {
    value,
    label: value
  };
});

const ALLOWED_CITIES = [
  {key: 'casablanca', label: 'Casablanca', latitude: 33.5731, longitude: -7.5898, radius: 20},
  {key: 'marrakech', label: 'Marrakech', latitude: 31.6295, longitude: -7.9811, radius: 18},
  {key: 'tanger', label: 'Tanger', latitude: 35.7595, longitude: -5.834, radius: 16},
  {key: 'rabat', label: 'Rabat', latitude: 34.0209, longitude: -6.8416, radius: 14},
  {key: 'fes', label: 'Fès', latitude: 34.0331, longitude: -5.0003, radius: 16},
  {key: 'agadir', label: 'Agadir', latitude: 30.4278, longitude: -9.5981, radius: 16},
  {key: 'oujda', label: 'Oujda', latitude: 34.6814, longitude: -1.9086, radius: 14}
];

function normalizeText(value: string | null | undefined) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function isRenderable(value: unknown) {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

function safeRender(value: unknown) {
  if (value === null || value === undefined) return '—';

  if (isRenderable(value)) return value;

  if (typeof value === 'object') {
    const v = value as any;

    // cas quota (ton bug)
    if ('jours_alloues' in v || 'budget_alloue' in v) {
      return (
        <div className="text-xs text-white/70 space-y-1">
          {v.jours_alloues !== undefined && (
            <p>Jours: {v.jours_utilises ?? 0} / {v.jours_alloues ?? 0}</p>
          )}
          {v.budget_alloue !== undefined && (
            <p>Budget: {v.budget_utilise ?? 0} / {v.budget_alloue ?? 0}</p>
          )}
          {v.reservations_max_simultanees !== undefined && (
            <p>
              Réservations: {v.reservations_simultanees_utilisees ?? 0} /{' '}
              {v.reservations_max_simultanees ?? 0}
            </p>
          )}
        </div>
      );
    }

    // fallback
    return JSON.stringify(value);
  }

  return String(value);
}

function findAgencyByCityLabel(agencies: Agency[], cityLabel: string) {
  const normalizedCity = normalizeText(cityLabel);

  return (
    agencies.find((agency) => normalizeText(agency.ville) === normalizedCity) ||
    agencies.find((agency) => normalizeText(agency.nom).includes(normalizedCity)) ||
    null
  );
}

function vehicleLabel(vehicle: Vehicle) {
  return (
    vehicle.nom ||
    [vehicle.marque, vehicle.model].filter(Boolean).join(' ') ||
    vehicle.categorie ||
    vehicle.id_vehicule
  );
}

function formatToday() {
  const date = new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(value: string | null, locale: string) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

function formatMoney(value: number | null | undefined, currency = 'MAD', locale = 'fr') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2
    }).format(Number(value));
  } catch {
    return `${value} ${currency}`;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function formatQuotaDetails(value: Record<string, unknown>, locale: string, currency = 'MAD') {
  const rows: string[] = [];

  const joursAlloues = value.jours_alloues;
  const joursUtilises = value.jours_utilises;
  const joursRestants = value.jours_restants;

  const budgetAlloue = value.budget_alloue;
  const budgetUtilise = value.budget_utilise;
  const budgetRestant = value.budget_restant;

  const reservationsMax = value.reservations_max_simultanees;
  const reservationsUtilisees = value.reservations_simultanees_utilisees;
  const reservationsRestantes = value.reservations_simultanees_restantes;

  if (
    joursAlloues !== undefined ||
    joursUtilises !== undefined ||
    joursRestants !== undefined
  ) {
    rows.push(
      `Jours — alloués: ${joursAlloues ?? '—'}, utilisés: ${joursUtilises ?? '—'}, restants: ${joursRestants ?? '—'}`
    );
  }

  if (
    budgetAlloue !== undefined ||
    budgetUtilise !== undefined ||
    budgetRestant !== undefined
  ) {
    rows.push(
      `Budget — alloué: ${
        typeof budgetAlloue === 'number' ? formatMoney(budgetAlloue, currency, locale) : '—'
      }, utilisé: ${
        typeof budgetUtilise === 'number' ? formatMoney(budgetUtilise, currency, locale) : '—'
      }, restant: ${
        typeof budgetRestant === 'number' ? formatMoney(budgetRestant, currency, locale) : '—'
      }`
    );
  }

  if (
    reservationsMax !== undefined ||
    reservationsUtilisees !== undefined ||
    reservationsRestantes !== undefined
  ) {
    rows.push(
      `Réservations simultanées — max: ${reservationsMax ?? '—'}, utilisées: ${reservationsUtilisees ?? '—'}, restantes: ${reservationsRestantes ?? '—'}`
    );
  }

  return rows.length ? rows : [JSON.stringify(value)];
}

function normalizeMessageList(
  items: unknown,
  locale: string,
  currency = 'MAD'
): string[] {
  if (!Array.isArray(items) || items.length === 0) return [];

  return items.flatMap((item) => {
    if (typeof item === 'string') {
      return [item];
    }

    if (isPlainObject(item)) {
      return formatQuotaDetails(item, locale, currency);
    }

    return [String(item)];
  });
}


type QuotaSummary = {
  jours_alloues: number | null;
  jours_utilises: number | null;
  jours_restants: number | null;
  budget_alloue: number | null;
  budget_utilise: number | null;
  budget_restant: number | null;
  reservations_max_simultanees: number | null;
  reservations_simultanees_utilisees: number | null;
  reservations_simultanees_restantes: number | null;
};

function parseNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;

  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : value;
  }

  if (typeof value === 'string') {
    const normalized = value.replace(',', '.').trim();
    if (!normalized) return null;

    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}

function parseQuotaSource(value: unknown): Record<string, unknown> | null {
  if (isPlainObject(value)) return value;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    try {
      const parsed = JSON.parse(trimmed);
      return isPlainObject(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  return null;
}

function parseQuotaSummary(value: unknown): QuotaSummary | null {
  const parsedValue = parseQuotaSource(value);
  if (!parsedValue) return null;

  return {
    jours_alloues: parseNullableNumber(parsedValue.jours_alloues),
    jours_utilises: parseNullableNumber(parsedValue.jours_utilises),
    jours_restants: parseNullableNumber(parsedValue.jours_restants),
    budget_alloue: parseNullableNumber(parsedValue.budget_alloue),
    budget_utilise: parseNullableNumber(parsedValue.budget_utilise),
    budget_restant: parseNullableNumber(parsedValue.budget_restant),
    reservations_max_simultanees: parseNullableNumber(
      parsedValue.reservations_max_simultanees
    ),
    reservations_simultanees_utilisees: parseNullableNumber(
      parsedValue.reservations_simultanees_utilisees
    ),
    reservations_simultanees_restantes: parseNullableNumber(
      parsedValue.reservations_simultanees_restantes
    )
  };
}

function formatCountOrUnlimited(value: number | null | undefined, unlimitedLabel: string) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return unlimitedLabel;
  }

  return String(value);
}

function normalizeSeatCount(value: number | null) {
  if (value == null || value < 1 || value > 9) return null;
  return value;
}

function openPicker(ref: RefObject<HTMLInputElement | null>) {
  if (!ref.current) return;

  try {
    ref.current.showPicker?.();
  } catch {
    ref.current.focus();
    ref.current.click();
  }
}

function smoothScrollTo(ref: RefObject<HTMLElement | null>, offset = 110) {
  if (typeof window === 'undefined') return;

  window.requestAnimationFrame(() => {
    const element = ref.current;
    if (!element) return;

    const top = element.getBoundingClientRect().top + window.scrollY - offset;

    window.scrollTo({
      top: Math.max(top, 0),
      behavior: 'smooth'
    });
  });
}

function useOutsideClose<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!ref.current) return;
      if (ref.current.contains(event.target as Node)) return;
      onClose();
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return ref;
}

function DarkSelect({
  value,
  onChange,
  placeholder,
  options,
  groups,
  disabled = false,
  leftIcon,
  buttonClassName = ''
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options?: SelectOption[];
  groups?: SelectGroup[];
  disabled?: boolean;
  leftIcon?: ReactNode;
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useOutsideClose<HTMLDivElement>(() => setOpen(false));

  const flatOptions = useMemo(() => {
    if (groups?.length) {
      return groups.flatMap((group) => group.options);
    }
    return options || [];
  }, [groups, options]);

  const selected = flatOptions.find((item) => item.value === value);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => !prev);
        }}
        className={`flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-left text-white outline-none transition hover:border-gold/40 disabled:cursor-not-allowed disabled:opacity-60 ${buttonClassName}`}
      >
        <span className="flex min-w-0 items-center gap-3">
          {leftIcon}
          <span className={`truncate ${selected ? 'text-white' : 'text-white/55'}`}>
            {selected?.label || placeholder}
          </span>
        </span>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-white/70 transition ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 z-50 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-white/10 bg-[#111111] p-2 shadow-2xl">
          {groups?.length ? (
            <div className="space-y-2">
              {groups.map((group) => (
                <div key={group.label}>
                  <p className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-gold/80">
                    {group.label}
                  </p>

                  <div className="space-y-1">
                    {group.options.map((option) => {
                      const isSelected = option.value === value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            onChange(option.value);
                            setOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                            isSelected
                              ? 'bg-gold/15 text-white'
                              : 'text-white/80 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <span className="truncate">{option.label}</span>
                          {isSelected ? <Check className="h-4 w-4 text-gold" /> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {(options || []).map((option) => {
                const isSelected = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                      isSelected
                        ? 'bg-gold/15 text-white'
                        : 'text-white/80 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected ? <Check className="h-4 w-4 text-gold" /> : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function SelectableVehicleCard({
  vehicle,
  currency,
  isSelected,
  onClick,
  seatLabel,
  perDayLabel,
  selectedLabel
}: {
  vehicle: Vehicle;
  currency: string;
  isSelected: boolean;
  onClick: () => void;
  seatLabel: string;
  perDayLabel: string;
  selectedLabel: string;
}) {
  const title =
    [vehicle.marque, vehicle.model].filter(Boolean).join(' ') ||
    vehicle.nom ||
    vehicle.id_vehicule;

  const seatCount = normalizeSeatCount(vehicle.nb_place);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group block overflow-hidden rounded-[24px] border bg-gradient-to-b from-white/5 to-black/30 text-left shadow-[0_10px_40px_rgba(0,0,0,0.4)] transition hover:-translate-y-1 ${
        isSelected ? 'border-gold ring-1 ring-gold/50' : 'border-white/10 hover:border-gold/30'
      }`}
    >
      <div className="relative">
        <img
          src={vehicle.url_image_vehicule || fallbackImage}
          alt={title}
          className="h-52 w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

        <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3">
          <span className="rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
            {vehicle.categorie || '—'}
          </span>

          {isSelected ? (
            <span className="rounded-full bg-gold px-3 py-1 text-xs font-semibold text-brand-950">
              {selectedLabel}
            </span>
          ) : null}
        </div>
      </div>

      <div className="space-y-4 p-5">
        <h3 className="line-clamp-2 min-h-[56px] text-lg font-semibold leading-7 text-white">
          {title}
        </h3>

        <div className="grid grid-cols-3 gap-3">
          <div className="flex min-w-0 flex-col items-center justify-center rounded-xl bg-white/5 px-2 py-3 text-xs text-white/80">
            <Users className="mb-1 h-4 w-4 shrink-0 text-gold" />
            <span className="block text-center leading-5">
              {seatCount ? `${seatCount} ${seatLabel}` : '—'}
            </span>
          </div>

          <div className="flex min-w-0 flex-col items-center justify-center rounded-xl bg-white/5 px-2 py-3 text-xs text-white/80">
            <Cog className="mb-1 h-4 w-4 shrink-0 text-gold" />
            <span className="block w-full truncate text-center leading-5">
              {vehicle.transmission || '—'}
            </span>
          </div>

          <div className="flex min-w-0 flex-col items-center justify-center rounded-xl bg-white/5 px-2 py-3 text-xs text-white/80">
            <Snowflake className="mb-1 h-4 w-4 shrink-0 text-gold" />
            <span className="block w-full truncate text-center leading-5">
              {vehicle.climatisation ? 'A/C' : '—'}
            </span>
          </div>
        </div>

        <div className="flex items-end justify-between gap-3 border-t border-white/10 pt-4">
          <div className="min-w-0">
            <p className="text-2xl font-bold text-gold">
              {vehicle.prix_jour ?? '—'} {currency}
            </p>
            <p className="text-xs text-white/50">{perDayLabel}</p>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function B2BReservationFlow({
  locale,
  token,
  context,
  onReservationCreated
}: Props) {
  const t = useTranslations('B2BPage');
  const agencyT = useTranslations('Agencies');
  const fleetT = useTranslations('FleetPage');
  const chooseAgencyLabel = t('chooseAgency');

  const defaultMembership = context.default_membership || context.memberships?.[0] || null;

  const [step, setStep] = useState<FlowStep>('form');

  const [typeTrajet, setTypeTrajet] = useState('simple');
  const [lieuPriseEnCharge, setLieuPriseEnCharge] = useState('');
  const [lieuDestination, setLieuDestination] = useState('');
  const [reservePourTiers, setReservePourTiers] = useState(false);
  const [tarificationId, setTarificationId] = useState(DEFAULT_TARIFICATION_ID);
  const [assuranceId, setAssuranceId] = useState(DEFAULT_ASSURANCE_ID);

  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [agenciesLoading, setAgenciesLoading] = useState(true);

  const [collaborateurs, setCollaborateurs] = useState<B2BCollaborateur[]>([]);

  const [departureMode, setDepartureMode] = useState<LocationMode>('agence');
  const [returnMode, setReturnMode] = useState<LocationMode>('agence');

  const [departureAgencyId, setDepartureAgencyId] = useState('');
  const [returnAgencyId, setReturnAgencyId] = useState('');

  const [departureAddress, setDepartureAddress] = useState('');
  const [departureLatitude, setDepartureLatitude] = useState('');
  const [departureLongitude, setDepartureLongitude] = useState('');

  const [returnAddress, setReturnAddress] = useState('');
  const [returnLatitude, setReturnLatitude] = useState('');
  const [returnLongitude, setReturnLongitude] = useState('');

  const [dateDep, setDateDep] = useState('');
  const [dateRet, setDateRet] = useState('');
  const [heureDep, setHeureDep] = useState('10:00');
  const [heureRet, setHeureRet] = useState('09:00');

  const [beneficiaireId, setBeneficiaireId] = useState(
    defaultMembership?.id_client_entreprise || ''
  );

  const [avecChauffeur, setAvecChauffeur] = useState(false);
  const [nbPassagers, setNbPassagers] = useState('1');
  const [instructions, setInstructions] = useState('');

  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [vehiclesError, setVehiclesError] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');

  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState('');
  const [quote, setQuote] = useState<B2BQuoteResponse | null>(null);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const departureDateRef = useRef<HTMLInputElement | null>(null);
  const returnDateRef = useRef<HTMLInputElement | null>(null);

  const vehiclesSectionRef = useRef<HTMLDivElement | null>(null);
  const validationActionRef = useRef<HTMLDivElement | null>(null);

  const today = formatToday();

  useEffect(() => {
    async function loadFormData() {
      if (!defaultMembership?.id_entreprise) {
        setAgenciesLoading(false);
        return;
      }

      try {
        const [agenciesData, collaborateursData] = await Promise.all([
          fetchAgencies(),
          fetchEntrepriseCollaborateurs(defaultMembership.id_entreprise, token)
        ]);

        setAgencies(agenciesData || []);
        setCollaborateurs(collaborateursData || []);
      } finally {
        setAgenciesLoading(false);
      }
    }

    void loadFormData();
  }, [defaultMembership?.id_entreprise, token]);

  const availableBeneficiaries = collaborateurs;
  const currency = defaultMembership?.entreprises?.devise || 'MAD';

  const selectedBeneficiary = collaborateurs.find(
    (item) => item.id_client_entreprise === beneficiaireId
  );

  const effectiveBeneficiary =
    selectedBeneficiary ||
    collaborateurs.find(
      (item) => item.id_client_entreprise === defaultMembership?.id_client_entreprise
    ) ||
    null;

  const validatorMembershipId =
    effectiveBeneficiary?.manager_id_client_entreprise ||
    defaultMembership?.manager_id_client_entreprise ||
    null;

  const validatorCollaborateur =
    collaborateurs.find(
      (item) => item.id_client_entreprise === validatorMembershipId
    ) || null;

  const validatorName =
    [validatorCollaborateur?.clients?.prenom, validatorCollaborateur?.clients?.nom]
      .filter(Boolean)
      .join(' ') ||
    validatorCollaborateur?.clients?.mail ||
    '';

  const validatorDisplay =
    validatorMembershipId &&
    validatorMembershipId !== effectiveBeneficiary?.id_client_entreprise
      ? validatorName || t('automaticValidation')
      : t('automaticValidation');

  const effectiveCentreCoutId = selectedBeneficiary?.id_centre_cout || undefined;
  const effectiveProfilBeneficiaireId =
    selectedBeneficiary?.id_profil_beneficiaire || undefined;

  const selectedVehicle =
    vehicles.find((vehicle) => vehicle.id_vehicule === selectedVehicleId) || null;

  const quotaSummary = useMemo(() => {
    return (
      parseQuotaSummary(quote?.quota_status) ??
      parseQuotaSummary(selectedBeneficiary?.role_entreprise) ??
      parseQuotaSummary(defaultMembership?.role_entreprise)
    );
  }, [
    quote?.quota_status,
    selectedBeneficiary?.role_entreprise,
    defaultMembership?.role_entreprise
  ]);

  const remainingBudgetDisplay = useMemo(() => {
    if (!quote) return '—';
    if (!quotaSummary || quotaSummary.budget_restant === null) {
      return t('unlimited');
    }

    return formatMoney(quotaSummary.budget_restant, currency, locale);
  }, [currency, locale, quote, quotaSummary, t]);

  const remainingBudgetAfterApprovalDisplay = useMemo(() => {
    if (!quote) return '—';
    if (!quotaSummary || quotaSummary.budget_restant === null) {
      return t('unlimited');
    }

    const projected = Math.max(
      quotaSummary.budget_restant - Number(quote.quota_consomme?.budget ?? quote.prix_estime ?? 0),
      0
    );

    return formatMoney(projected, currency, locale);
  }, [currency, locale, quote, quotaSummary, t]);

  const availableDaysDisplay = useMemo(() => {
    if (!quote) return '—';
    return formatCountOrUnlimited(quotaSummary?.jours_restants, t('unlimited'));
  }, [quote, quotaSummary, t]);

  const remainingDaysAfterReservationDisplay = useMemo(() => {
    if (!quote) return '—';
    if (!quotaSummary || quotaSummary.jours_restants === null) {
      return t('unlimited');
    }

    const projected = Math.max(
      quotaSummary.jours_restants - Number(quote.quota_consomme?.jours ?? 0),
      0
    );

    return String(projected);
  }, [quote, quotaSummary, t]);

  const canSearchVehicles =
    !!dateDep &&
    !!dateRet &&
    !!heureDep &&
    !!heureRet &&
    !!departureAgencyId;

  const canPrepareReservation =
    !!defaultMembership?.id_client_entreprise &&
    !!selectedVehicleId &&
    !!departureAgencyId &&
    !!dateDep &&
    !!dateRet &&
    !!heureDep &&
    !!heureRet;

  function getAgencyLabel(item: Agency | null | undefined) {
    if (!item) return '—';
    return item.nom || item.ville || item.id_agence;
  }

  const beneficiaryOptions: SelectOption[] = availableBeneficiaries.map((collab) => {
    const fullName =
      [collab.clients?.prenom, collab.clients?.nom].filter(Boolean).join(' ') ||
      collab.clients?.mail ||
      collab.id_client_entreprise;

    return {
      value: collab.id_client_entreprise,
      label: fullName
    };
  });

  const agenciesByCategory = useMemo(() => {
    const normalizeCategory = (value?: string | null) => {
      if (!value) return 'Ville';

      const normalized = value.trim().toLowerCase();

      if (
        normalized === 'aéroport' ||
        normalized === 'aeroport' ||
        normalized === 'airport'
      ) {
        return 'Aéroport';
      }

      return 'Ville';
    };

    return agencies.reduce(
      (acc, item) => {
        const category = normalizeCategory(item.categorie);

        if (!acc[category]) acc[category] = [];
        acc[category].push(item);

        return acc;
      },
      {} as Record<string, Agency[]>
    );
  }, [agencies]);

  const agencyGroups: SelectGroup[] = [
    {
      label: agencyT('categories.Ville'),
      options: (agenciesByCategory['Ville'] || []).map((agency) => ({
        value: agency.id_agence,
        label: getAgencyLabel(agency)
      }))
    },
    {
      label: agencyT('categories.Aéroport'),
      options: (agenciesByCategory['Aéroport'] || []).map((agency) => ({
        value: agency.id_agence,
        label: getAgencyLabel(agency)
      }))
    }
  ].filter((group) => group.options.length > 0);

  async function handleSearchVehicles() {
    if (!canSearchVehicles) return;

    try {
      setVehiclesLoading(true);
      setVehiclesError('');
      setVehicles([]);
      setSelectedVehicleId('');
      setQuote(null);
      setQuoteError('');
      setSubmitError('');
      setSubmitSuccess('');
      setStep('form');

      const result = await searchVehicles({
        id_agence_depart: departureAgencyId,
        date_dep: dateDep,
        date_ret: dateRet,
        heure_dep: heureDep,
        heure_ret: heureRet
      });

      const nextVehicles = result || [];
      setVehicles(nextVehicles);

      if (nextVehicles.length > 0) {
        setTimeout(() => {
          smoothScrollTo(vehiclesSectionRef);
        }, 120);
      }
    } catch (err) {
      setVehiclesError(err instanceof Error ? err.message : t('genericError'));
    } finally {
      setVehiclesLoading(false);
    }
  }

  async function handlePrepareReservation() {
    if (!canPrepareReservation) return;

    try {
      setQuoteLoading(true);
      setQuoteError('');
      setQuote(null);
      setSubmitSuccess('');
      setSubmitError('');

    const response = await getB2bQuote(
      {
        id_client_entreprise_demandeur: defaultMembership!.id_client_entreprise,
        id_client_entreprise_beneficiaire: beneficiaireId || undefined,
        id_centre_cout: effectiveCentreCoutId,
        id_profil_beneficiaire: effectiveProfilBeneficiaireId,
        id_vehicule: selectedVehicleId,

        id_agence_depart: departureAgencyId,
        id_agence_retour: returnAgencyId || departureAgencyId,

        type_lieu_depart: departureMode,
        adresse_depart:
          departureMode === 'localisation' ? departureAddress || undefined : undefined,
        latitude_depart:
          departureMode === 'localisation' && departureLatitude
            ? Number(departureLatitude)
            : undefined,
        longitude_depart:
          departureMode === 'localisation' && departureLongitude
            ? Number(departureLongitude)
            : undefined,

        type_lieu_retour: returnMode,
        adresse_retour:
          returnMode === 'localisation' ? returnAddress || undefined : undefined,
        latitude_retour:
          returnMode === 'localisation' && returnLatitude
            ? Number(returnLatitude)
            : undefined,
        longitude_retour:
          returnMode === 'localisation' && returnLongitude
            ? Number(returnLongitude)
            : undefined,

        date_dep: dateDep,
        date_ret: dateRet,
        heure_dep: heureDep,
        heure_ret: heureRet,

        avec_chauffeur: avecChauffeur,
        type_trajet: typeTrajet,
        lieu_prise_en_charge: lieuPriseEnCharge || undefined,
        lieu_destination: lieuDestination || undefined,

        id_tarification: tarificationId || undefined,
        id_assurance: assuranceId || undefined
      },
      token
    );

      setQuote(response);
      setStep('recap');
    } catch (err) {
      setQuoteError(err instanceof Error ? err.message : t('genericError'));
      setStep('form');
    } finally {
      setQuoteLoading(false);
    }
  }

  async function handleCreateReservation() {
    if (!defaultMembership?.id_client_entreprise || !selectedVehicleId || !quote) {
      return;
    }

    try {
      setSubmitLoading(true);
      setSubmitError('');
      setSubmitSuccess('');

      const payload: CreateB2BReservationPayload = {
        id_client_entreprise_demandeur: defaultMembership.id_client_entreprise,
        id_client_entreprise_beneficiaire: beneficiaireId || undefined,
        id_centre_cout: effectiveCentreCoutId,
        id_profil_beneficiaire: effectiveProfilBeneficiaireId,
        id_vehicule: selectedVehicleId,

        id_agence_depart: departureAgencyId,
        type_lieu_depart: departureMode,
        adresse_depart:
          departureMode === 'localisation' ? departureAddress || undefined : undefined,
        latitude_depart:
          departureMode === 'localisation' && departureLatitude
            ? Number(departureLatitude)
            : undefined,
        longitude_depart:
          departureMode === 'localisation' && departureLongitude
            ? Number(departureLongitude)
            : undefined,

        id_agence_retour: returnAgencyId || departureAgencyId,
        type_lieu_retour: returnMode,
        adresse_retour:
          returnMode === 'localisation' ? returnAddress || undefined : undefined,
        latitude_retour:
          returnMode === 'localisation' && returnLatitude
            ? Number(returnLatitude)
            : undefined,
        longitude_retour:
          returnMode === 'localisation' && returnLongitude
            ? Number(returnLongitude)
            : undefined,

        retour_different:
          returnMode !== departureMode ||
          (returnAgencyId || departureAgencyId) !== departureAgencyId,

        date_dep: dateDep,
        date_ret: dateRet,
        heure_dep: heureDep,
        heure_ret: heureRet,

        avec_chauffeur: avecChauffeur,
        type_trajet: typeTrajet,
        lieu_prise_en_charge: lieuPriseEnCharge || undefined,
        lieu_destination: lieuDestination || undefined,
        nb_passagers: avecChauffeur ? Number(nbPassagers || 1) : 1,
        instructions_specifiques: instructions || undefined,
        reserve_pour_tiers: reservePourTiers,

        id_tarification: tarificationId || undefined,
        id_assurance: assuranceId || undefined
      };

      const result = await createB2bReservation(payload, token);

      setSubmitSuccess(result.message || t('reservationCreated'));
      onReservationCreated?.((result as any).reservation || null);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('genericError'));
    } finally {
      setSubmitLoading(false);
    }
  }

  const departureAgency = agencies.find((item) => item.id_agence === departureAgencyId) || null;
  const returnAgency = agencies.find((item) => item.id_agence === (returnAgencyId || departureAgencyId)) || null;

  return (
    <div className="space-y-6">
      <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
        <h3 className="text-base font-semibold text-white">{t('reservationInfo')}</h3>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_auto] lg:items-end">
          <div className="space-y-2 text-sm">
            <span className="text-white/75">{t('beneficiary')}</span>
            <DarkSelect
              value={beneficiaireId}
              onChange={setBeneficiaireId}
              options={beneficiaryOptions}
              placeholder={t('beneficiary')}
            />
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="inline-flex rounded-full border border-white/10 bg-black/10 p-1">
              <button
                type="button"
                onClick={() => setAvecChauffeur(true)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  avecChauffeur ? 'bg-gold text-brand-950' : 'text-white/75'
                }`}
              >
                {t('withDriver')}
              </button>

              <button
                type="button"
                onClick={() => {
                  setAvecChauffeur(false);
                  setNbPassagers('1');
                }}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  !avecChauffeur ? 'bg-gold text-brand-950' : 'text-white/75'
                }`}
              >
                {t('withoutDriver')}
              </button>
            </div>
          </div>

          <label className="space-y-2 text-sm">
            <span className="text-white/75">{t('passengers')}</span>
            <input
              type="number"
              min="1"
              max="5"
              value={nbPassagers}
              onChange={(e) => {
                const next = e.target.value;

                if (next === '') {
                  setNbPassagers('1');
                  return;
                }

                const parsed = Math.max(1, Math.min(5, Number(next)));
                setNbPassagers(String(parsed));
              }}
              disabled={!avecChauffeur}
              className={`w-full rounded-2xl border px-4 py-3 text-white outline-none ${
                avecChauffeur
                  ? 'border-white/10 bg-black/10'
                  : 'cursor-not-allowed border-white/5 bg-white/5 text-white/35'
              }`}
            />
          </label>

          <div />

          <label className="space-y-2 text-sm lg:col-span-2">
            <span className="text-white/75">{t('instructions')}</span>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-white outline-none"
              placeholder={t('instructionsPlaceholder')}
            />
          </label>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <h3 className="text-base font-semibold text-white">{t('departureModeTitle')}</h3>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setDepartureMode('agence')}
                className={`rounded-full px-4 py-2 text-sm ${
                  departureMode === 'agence'
                    ? 'bg-gold text-brand-950'
                    : 'border border-white/10 bg-black/10 text-white/75'
                }`}
              >
                {t('agencyMode')}
              </button>

              <button
                type="button"
                onClick={() => setDepartureMode('localisation')}
                className={`rounded-full px-4 py-2 text-sm ${
                  departureMode === 'localisation'
                    ? 'bg-gold text-brand-950'
                    : 'border border-white/10 bg-black/10 text-white/75'
                }`}
              >
                {t('mapMode')}
              </button>
            </div>

            {departureMode === 'agence' ? (
              <div className="mt-4 space-y-2 text-sm">
                <span className="text-white/75">{t('departureAgency')}</span>
                <DarkSelect
                  value={departureAgencyId}
                  onChange={setDepartureAgencyId}
                  groups={agencyGroups}
                  placeholder={chooseAgencyLabel}
                  leftIcon={<MapPin className="h-4 w-4 text-gold" />}
                />
              </div>
            ) : (
              <>
                <div className="mt-4">
                  <B2BLocationMap
                    value={{
                      address: departureAddress,
                      latitude: departureLatitude ? Number(departureLatitude) : null,
                      longitude: departureLongitude ? Number(departureLongitude) : null
                    }}
                    onChange={(point) => {
                      setDepartureAddress(point.address);
                      setDepartureLatitude(String(point.latitude));
                      setDepartureLongitude(String(point.longitude));

                      const matchedAgency = findAgencyByCityLabel(agencies, point.address);

                      if (matchedAgency?.id_agence) {
                        setDepartureAgencyId(matchedAgency.id_agence);
                      } else {
                        setDepartureAgencyId('');
                      }
                    }}
                    allowedCities={ALLOWED_CITIES}
                  />
                </div>

                {departureAddress ? (
                  <div className="mt-3 rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-white/80">
                    {departureAddress} ({departureLatitude}, {departureLongitude})
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <h3 className="text-base font-semibold text-white">{t('returnModeTitle')}</h3>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setReturnMode('agence')}
                className={`rounded-full px-4 py-2 text-sm ${
                  returnMode === 'agence'
                    ? 'bg-gold text-brand-950'
                    : 'border border-white/10 bg-black/10 text-white/75'
                }`}
              >
                {t('agencyMode')}
              </button>

              <button
                type="button"
                onClick={() => setReturnMode('localisation')}
                className={`rounded-full px-4 py-2 text-sm ${
                  returnMode === 'localisation'
                    ? 'bg-gold text-brand-950'
                    : 'border border-white/10 bg-black/10 text-white/75'
                }`}
              >
                {t('mapMode')}
              </button>
            </div>

            {returnMode === 'agence' ? (
              <div className="mt-4 space-y-2 text-sm">
                <span className="text-white/75">{t('returnAgency')}</span>
                <DarkSelect
                  value={returnAgencyId}
                  onChange={setReturnAgencyId}
                  groups={agencyGroups}
                  placeholder={chooseAgencyLabel}
                  leftIcon={<MapPin className="h-4 w-4 text-gold" />}
                />
              </div>
            ) : (
              <>
                <div className="mt-4">
                  <B2BLocationMap
                    value={{
                      address: returnAddress,
                      latitude: returnLatitude ? Number(returnLatitude) : null,
                      longitude: returnLongitude ? Number(returnLongitude) : null
                    }}
                    onChange={(point) => {
                      setReturnAddress(point.address);
                      setReturnLatitude(String(point.latitude));
                      setReturnLongitude(String(point.longitude));

                      const matchedAgency = findAgencyByCityLabel(agencies, point.address);

                      if (matchedAgency?.id_agence) {
                        setReturnAgencyId(matchedAgency.id_agence);
                      } else {
                        setReturnAgencyId('');
                      }
                    }}
                    allowedCities={ALLOWED_CITIES}
                  />
                </div>

                {returnAddress ? (
                  <div className="mt-3 rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-white/80">
                    {returnAddress} ({returnLatitude}, {returnLongitude})
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
        <h3 className="text-base font-semibold text-white">{t('datesAndTimes')}</h3>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2 text-sm">
            <span className="text-white/75">{t('pickupDate')}</span>

            <div className="relative">
              <input
                ref={departureDateRef}
                type="date"
                min={today}
                value={dateDep}
                onChange={(e) => {
                  const next = e.target.value;
                  setDateDep(next);

                  if (dateRet && next && dateRet < next) {
                    setDateRet('');
                  }
                }}
                className="pointer-events-none absolute inset-0 opacity-0"
                tabIndex={-1}
                aria-hidden="true"
              />

              <button
                type="button"
                onClick={() => openPicker(departureDateRef)}
                className="flex h-[52px] w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 text-left text-white transition hover:border-gold/50"
              >
                <span className="flex items-center gap-3">
                  <CalendarDays className="h-4 w-4 text-gold" />
                  <span>{dateDep || t('pickupDate')}</span>
                </span>
              </button>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <span className="text-white/75">{t('pickupTime')}</span>
            <DarkSelect
              value={heureDep}
              onChange={setHeureDep}
              options={TIME_OPTIONS}
              placeholder={t('pickupTime')}
            />
          </div>

          <div className="space-y-2 text-sm">
            <span className="text-white/75">{t('returnDate')}</span>

            <div className="relative">
              <input
                ref={returnDateRef}
                type="date"
                min={dateDep || today}
                value={dateRet}
                onChange={(e) => setDateRet(e.target.value)}
                className="pointer-events-none absolute inset-0 opacity-0"
                tabIndex={-1}
                aria-hidden="true"
              />

              <button
                type="button"
                onClick={() => openPicker(returnDateRef)}
                className="flex h-[52px] w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 text-left text-white transition hover:border-gold/50"
              >
                <span className="flex items-center gap-3">
                  <CalendarDays className="h-4 w-4 text-gold" />
                  <span>{dateRet || t('returnDate')}</span>
                </span>
              </button>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <span className="text-white/75">{t('returnTime')}</span>
            <DarkSelect
              value={heureRet}
              onChange={setHeureRet}
              options={TIME_OPTIONS}
              placeholder={t('returnTime')}
            />
          </div>
        </div>

        <div className="mt-5">
          <button
            type="button"
            onClick={handleSearchVehicles}
            disabled={!canSearchVehicles || agenciesLoading || vehiclesLoading}
            className="rounded-full bg-gold px-5 py-3 text-sm font-semibold text-brand-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {vehiclesLoading ? t('loadingVehicles') : t('searchVehicles')}
          </button>
        </div>

        {vehiclesError ? <p className="mt-3 text-sm text-red-300">{vehiclesError}</p> : null}
      </div>

      <div ref={vehiclesSectionRef} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-base font-semibold text-white">{t('availableVehicles')}</h3>
          <span className="text-sm text-white/55">
            {vehicles.length} {t('vehiclesCount')}
          </span>
        </div>

        {!vehicles.length ? (
          <p className="mt-4 text-sm text-white/55">{t('noVehiclesLoaded')}</p>
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {vehicles.map((vehicle) => {
              const selected = vehicle.id_vehicule === selectedVehicleId;

              return (
                <SelectableVehicleCard
                  key={vehicle.id_vehicule}
                  vehicle={vehicle}
                  currency={currency}
                  isSelected={selected}
                  onClick={() => {
                    setSelectedVehicleId(vehicle.id_vehicule);
                    setQuote(null);
                    setQuoteError('');
                    setSubmitSuccess('');
                    setSubmitError('');
                    setStep('form');

                    setTimeout(() => {
                      smoothScrollTo(validationActionRef);
                    }, 120);
                  }}
                  seatLabel={fleetT('seats')}
                  perDayLabel={fleetT('perDay')}
                  selectedLabel={fleetT('selected')}
                />
              );
            })}
          </div>
        )}
      </div>

      <div ref={validationActionRef} className="flex justify-center">
        <button
          type="button"
          onClick={handlePrepareReservation}
          disabled={!canPrepareReservation || quoteLoading}
          className="rounded-full bg-gold px-6 py-3 text-sm font-semibold text-brand-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {quoteLoading ? t('loadingQuote') : t('getQuote')}
        </button>
      </div>

      {quoteError ? <p className="text-center text-sm text-red-300">{quoteError}</p> : null}

      {step === 'recap' && selectedVehicle && quote ? (
        <div className="space-y-6 rounded-[24px] border border-gold/20 bg-white/5 p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-gold">{t('recapTitle')}</p>
              <h3 className="mt-2 text-xl font-semibold text-white">
                {vehicleLabel(selectedVehicle)}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setStep('form')}
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-gold/40 hover:text-white"
            >
              {t('editReservation')}
            </button>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div className="space-y-4">
              <SelectableVehicleCard
                vehicle={selectedVehicle}
                currency={currency}
                isSelected
                onClick={() => {}}
                seatLabel={fleetT('seats')}
                perDayLabel={fleetT('perDay')}
                selectedLabel={fleetT('selected')}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-white/75">
                  <p className="text-white/45">{t('beneficiary')}</p>
                  <p className="mt-2 text-base font-semibold text-white">
                    {beneficiaryOptions.find((item) => item.value === beneficiaireId)?.label || '—'}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-white/75">
                  <p className="text-white/45">{t('driverMode')}</p>
                  <p className="mt-2 text-base font-semibold text-white">
                    {avecChauffeur ? t('withDriver') : t('withoutDriver')}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-white/75">
                  <p className="text-white/45">{t('departureAgency')}</p>
                  <p className="mt-2 text-base font-semibold text-white">
                    {departureMode === 'agence' ? getAgencyLabel(departureAgency) : departureAddress || '—'}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-white/75">
                  <p className="text-white/45">{t('returnAgency')}</p>
                  <p className="mt-2 text-base font-semibold text-white">
                    {returnMode === 'agence' ? getAgencyLabel(returnAgency) : returnAddress || '—'}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-white/75">
                  <p className="text-white/45">{t('period')}</p>
                  <p className="mt-2 text-base font-semibold text-white">
                    {formatDate(dateDep, locale)} · {heureDep}
                  </p>
                  <p className="mt-1 text-base font-semibold text-white">
                    {formatDate(dateRet, locale)} · {heureRet}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-white/75">
                  <p className="text-white/45">{t('passengers')}</p>
                  <p className="mt-2 text-base font-semibold text-white">
                    {avecChauffeur ? nbPassagers : '1'}
                  </p>
                </div>
              </div>

              {instructions ? (
                <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-white/75">
                  <p className="text-white/45">{t('instructions')}</p>
                  <p className="mt-2 whitespace-pre-line text-white">{instructions}</p>
                </div>
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <p className="text-sm text-white/45">{t('estimatedPrice')}</p>
                <p className="mt-2 text-3xl font-bold text-gold">
                  {formatMoney(quote.prix_estime, currency, locale)}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <p className="text-sm text-white/45">{t('validatorName')}</p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {validatorDisplay}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <p className="text-sm text-white/45">{t('remainingBalance')}</p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {remainingBudgetDisplay}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <p className="text-sm text-white/45">{t('remainingBalanceAfterApproval')}</p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {remainingBudgetAfterApprovalDisplay}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <p className="text-sm text-white/45">{t('availableDays')}</p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {availableDaysDisplay}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <p className="text-sm text-white/45">{t('remainingDaysAfterReservation')}</p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {remainingDaysAfterReservationDisplay}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white"
                >
                  Retour
                </button>

                <button
                  type="button"
                  onClick={handleCreateReservation}
                  disabled={!quote || submitLoading || !quote.allowed}
                  className="rounded-full bg-gold px-5 py-3 text-sm font-semibold text-brand-950 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitLoading ? t('creatingReservation') : t('confirmReservation')}
                </button>
              </div>

              {submitError ? <p className="text-sm text-red-300">{submitError}</p> : null}
              {submitSuccess ? <p className="text-sm text-emerald-300">{submitSuccess}</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
