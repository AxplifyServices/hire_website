'use client';

import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import SearchBox from '@/components/reservation/SearchBox';
import {
  CalendarDays,
  CarFront,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Pencil,
  Shield,
  TriangleAlert
} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {
  createReservationCart,
  fetchAgencies,
  fetchAssurances,
  fetchOptions,
  fetchReservationPrefill,
  fetchTarifications,
  finalizeReservationCart,
  getReservationQuote,
  updateReservationCart
} from '@/lib/api';
import {
  readAccessToken,
  readCartSession,
  saveCartSession
} from '@/lib/session';
import type {
  Agency,
  ClientProfile,
  CreateCartResponse,
  QuoteResponse,
  ReservationPrefillResponse,
  Tarification
} from '@/lib/types';
import {COUNTRIES} from '@/components/auth/countries';


type Assurance = {
  id_assurance: string;
  nom: string;
  description: string;
  qualificatif?: string;
  avantages?: string[];
  prix_jour: number;
};

type OptionItem = {
  id_option: string;
  nom: string;
  description: string;
  qualificatif?: string;
  prix_jour: number;
};

type Props = {
  locale: string;
  agency: string;
  pickupDate: string;
  returnDate: string;
  vehicleId: string;
  vehicleName?: string;
};

type DetailsFormState = {
  nom: string;
  prenom: string;
  mail: string;
  prefixe_tel: string;
  num_tel: string;
  date_naissance: string;
  pays: string;
  retour_different: boolean;
  id_lieu_ret: string;
  heure_dep: string;
  heure_ret: string;
  id_politique_age: string | null;
  code_promo: string;
};

type WizardStep = 1 | 2 | 3 | 4;

type FinalizedReservation = {
  id_reservation: string;
  status?: string | null;
  payment_status?: string | null;
};



const DEFAULT_PICKUP_TIME = '10:00';
const DEFAULT_RETURN_TIME = '09:00';
const DEFAULT_ASSURANCE_ID = 'ASS00000001';
const DEFAULT_AGE_POLICY_ID = 'AGE00000002';


const AGE_POLICIES = [
  {
    id: 'AGE00000001',
    label: '18 - 25',
    surchargePerDay: 80
  },
  {
    id: 'AGE00000002',
    label: '25 - 65',
    surchargePerDay: 0
  },
  {
    id: 'AGE00000003',
    label: '+65',
    surchargePerDay: 80
  }
];

function formatDate(value: string, locale: string) {
  if (!value) return '—';

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat(
    locale === 'ar' ? 'ar-MA' : locale === 'en' ? 'en-GB' : 'fr-FR',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }
  ).format(date);
}

function normalizeText(value?: string | null) {
  if (!value) return '';
  try {
    return decodeURIComponent(escape(value));
  } catch {
    return value;
  }
}

function normalizeList(values?: string[]) {
  return (values || []).map((item) => normalizeText(item));
}

function formatMoney(value: number | null | undefined, locale: string) {
  if (value == null || Number.isNaN(value)) return '—';

  return new Intl.NumberFormat(
    locale === 'ar' ? 'ar-MA' : locale === 'en' ? 'en-GB' : 'fr-FR',
    {
      style: 'currency',
      currency: 'MAD',
      maximumFractionDigits: 0
    }
  ).format(value);
}

function getAgencyDisplayName(agencies: Agency[], agencyId?: string | null) {
  if (!agencyId) return '—';
  const agency = agencies.find((item) => item.id_agence === agencyId);
  return agency?.nom || agencyId;
}

function getDaysLabel(days: number | null | undefined, locale: string) {
  if (days == null || Number.isNaN(days)) return '—';

  if (locale === 'fr') {
    return `${days} ${days > 1 ? 'jours' : 'jour'}`;
  }

  if (locale === 'ar') {
    return `${days} ${days > 1 ? 'أيام' : 'يوم'}`;
  }

  return `${days} ${days > 1 ? 'days' : 'day'}`;
}

function getDiscountDisplayLabel(
  discountRate: number | null | undefined,
  locale: string
) {
  if (!discountRate || discountRate <= 0) {
    if (locale === 'fr') return 'Plein tarif';
    if (locale === 'ar') return 'السعر الكامل';
    return 'Full Tariff';
  }

  return `-${discountRate}%`;
}

function getReservationDays(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) return null;

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return null;

  return diffDays;
}

function getReservationRecord(cart: CreateCartResponse | null) {
  return cart?.reservation || null;
}

function getAgePolicyMeta(agePolicyId?: string | null) {
  if (!agePolicyId) return null;
  return AGE_POLICIES.find((item) => item.id === agePolicyId) || null;
}

function getStepFromCartStep(etapePanier?: string | null): WizardStep {
  switch (etapePanier) {
    case 'tarification':
      return 2;
    case 'options':
      return 3;
    case 'formulaire':
      return 4;
    case 'agence_dates':
    default:
      return 1;
  }
}

function formatInputDate(value?: string | null) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

function formatToday() {
  const date = new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const TIME_OPTIONS = Array.from({length: 24 * 2}, (_, i) => {
  const hours = String(Math.floor(i / 2)).padStart(2, '0');
  const minutes = i % 2 === 0 ? '00' : '30';
  return `${hours}:${minutes}`;
});

export default function ReservationFlow({
  locale,
  agency,
  pickupDate,
  returnDate,
  vehicleId,
  vehicleName
}: Props) {
  const t = useTranslations('ReservationFlow');

  const tc = useTranslations('Countries');
  const countryOptions = useMemo(() => {
      return COUNTRIES.map((country) => ({
        code: country.code,
        dialCode: country.dialCode,
        label: tc(country.code)
      }));
  }, [tc]);

  const phonePrefixOptions = useMemo(() => {
    return Array.from(new Set(COUNTRIES.map((country) => country.dialCode)));
  }, []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [prefill, setPrefill] = useState<ReservationPrefillResponse | null>(null);
  const [cart, setCart] = useState<CreateCartResponse | null>(null);

  const [tarifications, setTarifications] = useState<Tarification[]>([]);
  const [assurances, setAssurances] = useState<Assurance[]>([]);
  const [options, setOptions] = useState<OptionItem[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);

  const [selectedTarificationId, setSelectedTarificationId] = useState<string | null>(null);
  const [selectedAssuranceId, setSelectedAssuranceId] = useState<string | null>(
    DEFAULT_ASSURANCE_ID
  );
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const [savingStep, setSavingStep] = useState(false);
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  const [finalizing, setFinalizing] = useState(false);
  const [finalizedReservation, setFinalizedReservation] =
    useState<FinalizedReservation | null>(null);

  const [form, setForm] = useState<DetailsFormState>({
    nom: '',
    prenom: '',
    mail: '',
    prefixe_tel: '+212',
    num_tel: '',
    date_naissance: '',
    pays: 'Maroc',
    retour_different: false,
    id_lieu_ret: agency,
    heure_dep: DEFAULT_PICKUP_TIME,
    heure_ret: DEFAULT_RETURN_TIME,
    id_politique_age: DEFAULT_AGE_POLICY_ID,
    code_promo: ''
  });

  const quoteRequestIdRef = useRef(0);
  const promoDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const birthDateRef = useRef<HTMLInputElement | null>(null);

  const isValidEntry = useMemo(() => {
    return Boolean(agency && pickupDate && returnDate && vehicleId);
  }, [agency, pickupDate, returnDate, vehicleId]);

  const debouncedPromoCode = useMemo(() => form.code_promo.trim(), [form.code_promo]);

  const today = formatToday();

  function openPicker(ref: React.RefObject<HTMLInputElement | null>) {
    if (!ref.current) return;

    try {
      ref.current.showPicker?.();
    } catch {
      ref.current.focus();
      ref.current.click();
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!isValidEntry) {
        try {
          const fetchedAgencies = await fetchAgencies();

          if (cancelled) return;

          setAgencies(fetchedAgencies);
          setLoading(false);
          return;
        } catch (err) {
          if (cancelled) return;
          setError(err instanceof Error ? err.message : t('genericError'));
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      setError('');

      try {
        const token = readAccessToken();
        const existingSessionId = readCartSession();

        let prefillResponse: ReservationPrefillResponse | null = null;

        try {
          prefillResponse = await fetchReservationPrefill(token);
        } catch {
          prefillResponse = {
            is_authenticated: false
          };
        }

        if (cancelled) return;
        setPrefill(prefillResponse);

        const client = prefillResponse?.client;
        const prefillAgePolicyId = null;

        const payload = {
          id_lieu_dep: agency,
          id_lieu_ret: agency,
          date_dep: pickupDate,
          date_ret: returnDate,
          heure_dep: DEFAULT_PICKUP_TIME,
          heure_ret: DEFAULT_RETURN_TIME,
          nom: client?.nom || undefined,
          prenom: client?.prenom || undefined,
          mail: client?.mail || undefined,
          prefixe_tel: client?.prefixe_tel || undefined,
          num_tel: client?.num_tel || undefined
        };

        const [
          createdCart,
          fetchedTarifications,
          fetchedAssurances,
          fetchedOptions,
          fetchedAgencies
        ] = await Promise.all([
          createReservationCart(payload, {
            token,
            sessionId: existingSessionId
          }),
          fetchTarifications(),
          fetchAssurances(),
          fetchOptions(),
          fetchAgencies()
        ]);

        if (cancelled) return;

        setCart(createdCart);
        setTarifications(fetchedTarifications);
        setAssurances(fetchedAssurances);
        setOptions(fetchedOptions);
        setAgencies(fetchedAgencies);
        setCurrentStep(getStepFromCartStep(createdCart.reservation.etape_panier));

        if (createdCart.reservation.id_tarification) {
          setSelectedTarificationId(createdCart.reservation.id_tarification);
        }

        if (createdCart.reservation.id_assurance) {
          setSelectedAssuranceId(createdCart.reservation.id_assurance);
        }

        if (
          Array.isArray(createdCart.reservation.liste_id_option) &&
          createdCart.reservation.liste_id_option.length > 0
        ) {
          setSelectedOptions(createdCart.reservation.liste_id_option);
        }

        setForm((prev) => ({
          ...prev,
          nom: createdCart.reservation.nom_snapshot || client?.nom || '',
          prenom: createdCart.reservation.prenom_snapshot || client?.prenom || '',
          mail: createdCart.reservation.mail_snapshot || client?.mail || '',
          prefixe_tel:
            createdCart.reservation.prefixe_tel_snapshot || client?.prefixe_tel || '+212',
          num_tel: createdCart.reservation.num_tel_snapshot || client?.num_tel || '',
          date_naissance: client?.date_naissance
            ? String(client.date_naissance).slice(0, 10)
            : '',
          pays: client?.pays || 'Maroc',
          retour_different:
            !!createdCart.reservation.id_lieu_ret &&
            createdCart.reservation.id_lieu_ret !== agency,
          id_lieu_ret: createdCart.reservation.id_lieu_ret || agency,
          heure_dep: createdCart.reservation.heure_dep
            ? String(createdCart.reservation.heure_dep).slice(11, 16)
            : DEFAULT_PICKUP_TIME,
          heure_ret: createdCart.reservation.heure_ret
            ? String(createdCart.reservation.heure_ret).slice(11, 16)
            : DEFAULT_RETURN_TIME,
          id_politique_age:
            createdCart.reservation.id_politique_age ||
            prefillAgePolicyId ||
            DEFAULT_AGE_POLICY_ID,
          code_promo: createdCart.reservation.code_promo || ''
        }));

        if (createdCart.reservation.session_panier) {
          saveCartSession(
            createdCart.reservation.session_panier,
            createdCart.reservation.id_reservation
          );
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : t('genericError'));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [agency, pickupDate, returnDate, vehicleId, isValidEntry, t]);

  const customer: ClientProfile | null = prefill?.client || null;
  const reservation = getReservationRecord(cart);

  const selectedTarification = tarifications.find(
    (item) => item.id_tarification === selectedTarificationId
  );

  const selectedAssurance = assurances.find(
    (item) => item.id_assurance === selectedAssuranceId
  );

  const selectedOptionItems = options.filter((item) =>
    selectedOptions.includes(item.id_option)
  );

  const vehicleDisplayName = vehicleName || vehicleId;
  const pickupAgencyName = getAgencyDisplayName(agencies, agency);
  const returnAgencyId = form.retour_different ? form.id_lieu_ret : agency;
  const returnAgency = agencies.find((item) => item.id_agence === returnAgencyId);
  const returnAgencyName = getAgencyDisplayName(agencies, returnAgencyId);
  const agePolicyMeta = getAgePolicyMeta(form.id_politique_age);
  const reservationDays = getReservationDays(pickupDate, returnDate);
  const effectiveAgePolicyId = form.id_politique_age ?? DEFAULT_AGE_POLICY_ID;

  const isAgeWarningPolicy =
       form.id_politique_age === 'AGE00000001' ||
       form.id_politique_age === 'AGE00000003';                

  const recalculateQuote = useCallback(
    async (promoCodeValue: string) => {
      if (!vehicleId || !pickupDate || !returnDate) return;

      const requestId = ++quoteRequestIdRef.current;
      setQuoteLoading(true);

      try {
        const token = readAccessToken();
        const sessionId = readCartSession();

        const quoteResponse = await getReservationQuote(
          {
            id_vehicule: vehicleId,
            date_dep: pickupDate,
            date_ret: returnDate,
            id_tarification: selectedTarificationId,
            id_politique_age: effectiveAgePolicyId,
            id_assurance: selectedAssuranceId,
            liste_id_option: selectedOptions,
            code_promo: promoCodeValue || null
          },
          {
            token,
            sessionId
          }
        );

        if (requestId === quoteRequestIdRef.current) {
          setQuote(quoteResponse);
        }
      } catch {
        if (requestId === quoteRequestIdRef.current) {
          setQuote(null);
        }
      } finally {
        if (requestId === quoteRequestIdRef.current) {
          setQuoteLoading(false);
        }
      }
    },
    [
      effectiveAgePolicyId,
      pickupDate,
      returnDate,
      selectedAssuranceId,
      selectedOptions,
      selectedTarificationId,
      vehicleId
    ]
  );

  useEffect(() => {
    if (loading) return;
    if (!reservation?.id_reservation) return;

    if (promoDebounceRef.current) {
      clearTimeout(promoDebounceRef.current);
    }

    promoDebounceRef.current = setTimeout(() => {
      recalculateQuote(debouncedPromoCode);
    }, 350);

    return () => {
      if (promoDebounceRef.current) {
        clearTimeout(promoDebounceRef.current);
      }
    };
  }, [debouncedPromoCode, loading, recalculateQuote, reservation?.id_reservation]);

  function toggleOption(optionId: string) {
    setSelectedOptions((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId]
    );
  }

  function updateForm<K extends keyof DetailsFormState>(
    key: K,
    value: DetailsFormState[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value
    }));
  }

  function handleCountryChange(countryLabel: string) {
    const selectedCountry = countryOptions.find(
      (country) => country.label === countryLabel
    );

    setForm((prev) => ({
      ...prev,
      pays: countryLabel,
      prefixe_tel: selectedCountry?.dialCode || prev.prefixe_tel
    }));
  }  

  function goPrevious() {
    setError('');
    setCurrentStep((prev) => (prev > 1 ? ((prev - 1) as WizardStep) : prev));
  }

  async function saveStepAndGoNext() {
    if (!reservation?.id_reservation) {
      setError(t('genericError'));
      return;
    }

    setSavingStep(true);
    setError('');

    try {
      const token = readAccessToken();
      const sessionId = readCartSession();

      if (currentStep === 1) {
        await updateReservationCart(
          reservation.id_reservation,
          {
            id_vehicule: vehicleId,
            id_tarification: selectedTarificationId,
            etape_panier: 'tarification'
          },
          {token, sessionId}
        );

        setCurrentStep(2);
        return;
      }

      if (currentStep === 2) {
        await updateReservationCart(
          reservation.id_reservation,
          {
            id_vehicule: vehicleId,
            id_tarification: selectedTarificationId,
            id_assurance: selectedAssuranceId,
            liste_id_option: selectedOptions,
            etape_panier: 'options'
          },
          {token, sessionId}
        );

        setCurrentStep(3);
        return;
      }

      if (currentStep === 3) {
        await updateReservationCart(
          reservation.id_reservation,
          {
            id_vehicule: vehicleId,
            id_tarification: selectedTarificationId,
            id_assurance: selectedAssuranceId,
            liste_id_option: selectedOptions,
            id_politique_age: form.id_politique_age ?? null,
            code_promo: form.code_promo.trim() || null,
            nom: form.nom,
            prenom: form.prenom,
            mail: form.mail,
            prefixe_tel: form.prefixe_tel,
            num_tel: form.num_tel,
            date_naissance: form.date_naissance,
            pays: form.pays,
            id_lieu_dep: agency,
            id_lieu_ret: returnAgencyId,
            date_dep: pickupDate,
            date_ret: returnDate,
            heure_dep: form.heure_dep,
            heure_ret: form.heure_ret,
            retour_different: form.retour_different,
            etape_panier: 'formulaire'
          },
          {token, sessionId}
        );

        setCurrentStep(4);
      }
    } catch (err) {
      if (currentStep === 1) {
        setError(err instanceof Error ? err.message : t('pricingSaveError'));
      } else if (currentStep === 2) {
        setError(err instanceof Error ? err.message : t('protectionSaveError'));
      } else {
        setError(err instanceof Error ? err.message : t('detailsSaveError'));
      }
    } finally {
      setSavingStep(false);
    }
  }

  async function handleFinalizeReservation() {
    if (!reservation?.id_reservation) {
      setError(t('genericError'));
      return;
    }

    setFinalizing(true);
    setError('');

    try {
      const token = readAccessToken();
      const sessionId = readCartSession();

      const response = await finalizeReservationCart(reservation.id_reservation, {
        token,
        sessionId
      });

      setFinalizedReservation(response.reservation);
      setQuote(response.quote);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('finalizeError'));
    } finally {
      setFinalizing(false);
    }
  }

  const stepTitleMap: Record<WizardStep, string> = {
    1: t('pricingTitle'),
    2: t('protectionTitle'),
    3: t('detailsTitle'),
    4: t('finalReviewTitle')
  };

  const isPricingStepInvalid = currentStep === 1 && !selectedTarificationId;

  const isDetailsStepInvalid =
    currentStep === 3 &&
    (
      !form.prenom.trim() ||
      !form.nom.trim() ||
      !form.mail.trim() ||
      !form.prefixe_tel.trim() ||
      !form.num_tel.trim() ||
      !form.date_naissance.trim() ||
      !form.pays.trim() ||
      !form.heure_dep.trim() ||
      !form.heure_ret.trim() ||
      !form.id_politique_age ||
      (form.retour_different && !form.id_lieu_ret.trim())
    );

  const isNextStepDisabled =
    savingStep || isPricingStepInvalid || isDetailsStepInvalid;  

  const showSearchFirst = !loading && !isValidEntry;

  return (
    <section className="space-y-6">
      <div className="glass-panel rounded-[28px] border border-gold/15 p-5 sm:p-6">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-white sm:text-3xl">
              {t('title')}
            </h1>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-white/70">
            <div className="inline-flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-400" />
              <span>{t('secureSsl')}</span>
            </div>

            <div className="inline-flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-400" />
              <span>{t('protectedData')}</span>
            </div>

            <div className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <span>{t('instantConfirmation')}</span>
            </div>

            <div className="inline-flex items-center gap-2">
              <CarFront className="h-4 w-4 text-gold" />
              <span>{t('unlimitedMileage')}</span>
            </div>

            <div className="inline-flex items-center gap-2">
              <Check className="h-4 w-4 text-green-400" />
              <span>{t('simpleProcess')}</span>
            </div>
          </div>

          <div className="border-t border-white/10 pt-5">
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
              {[
                t('steps.pricing'),
                t('steps.protection'),
                t('steps.details'),
                t('steps.review')
              ].map((label, index) => {
                const stepNumber = (index + 1) as WizardStep;
                const done = currentStep > stepNumber;
                const active = currentStep === stepNumber;

                return (
                  <div
                    key={label}
                    className={`flex items-center gap-2 rounded-full border px-4 py-2 ${
                      active
                        ? 'border-gold bg-gold/10 text-gold'
                        : done
                          ? 'border-gold/30 bg-gold/5 text-white'
                          : 'border-white/10 bg-white/5 text-white/55'
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                        active || done
                          ? 'bg-gold text-brand-950'
                          : 'bg-white/5 text-white/60'
                      }`}
                    >
                      {done ? <Check className="h-4 w-4" /> : stepNumber}
                    </span>
                    <span>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

        {loading ? (
          <div className="glass-panel rounded-[28px] p-10 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-gold" />
            <p className="mt-4 text-sm text-white/70">{t('loading')}</p>
          </div>
        ) : showSearchFirst ? (
          <div className="space-y-6">
            <div className="rounded-[28px] border border-gold/20 bg-gold/10 p-6">
              <h2 className="text-xl font-semibold text-white">{t('quoteVehicle')}</h2>
              <p className="mt-2 text-sm text-white/70">{t('missingParams')}</p>

              <div className="mt-4 inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white">
                <CarFront className="mr-3 h-5 w-5 text-gold" />
                <span>{normalizeText(vehicleName) || vehicleId || '—'}</span>
              </div>
            </div>

            <SearchBox
              agencies={agencies}
              locale={locale}
              submitPath={`/${locale}/reservation`}
              extraParams={{
                vehicleId,
                vehicleName: normalizeText(vehicleName) || vehicleId
              }}
            />
          </div>
        ) : error ? (
          <div className="rounded-[28px] border border-red-400/25 bg-red-500/10 p-6">
            <h2 className="text-lg font-semibold text-red-200">{t('errorTitle')}</h2>
            <p className="mt-2 text-sm text-red-100/80">{error}</p>
          </div>
        ) : (
          <>
          {finalizedReservation ? (
            <div className="rounded-[28px] border border-green-400/25 bg-green-500/10 p-6">
              <h2 className="text-2xl font-semibold text-green-100">
                {t('finalizedTitle')}
              </h2>
              <p className="mt-2 text-sm text-green-100/80">
                {t('finalizedSubtitle')}
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                    {t('reservationId')}
                  </p>
                  <p className="mt-2 text-white">{finalizedReservation.id_reservation}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                    {t('summaryStatus')}
                  </p>
                  <p className="mt-2 text-white">{finalizedReservation.status || '—'}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                    {t('paymentStatus')}
                  </p>
                  <p className="mt-2 text-white">
                    {finalizedReservation.payment_status || '—'}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                    {t('summaryTotal')}
                  </p>
                  <p className="mt-2 text-white">{formatMoney(quote?.prix_final, locale)}</p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_380px]">
            <div className="space-y-6">
              <div className="glass-panel rounded-[28px] p-6">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="mt-2 text-2xl font-semibold text-white">
                      {stepTitleMap[currentStep]}
                    </h2>
                  </div>

                  <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
                    {t('stepCounter', {current: currentStep, total: 4})}
                  </div>
                </div>

                {currentStep === 1 ? (
                  <>
                    <p className="text-sm text-white/60">{t('pricingSubtitle')}</p>

                    <div className="mt-6 grid gap-4 xl:grid-cols-2">
                      {tarifications.map((pricing) => {
                        const isSelected =
                          selectedTarificationId === pricing.id_tarification;
                        const normalizedName = normalizeText(pricing.nom);
                        const normalizedDescription = normalizeText(pricing.description);
                        const normalizedBenefits = normalizeList(pricing.avantages);

                        return (
                          <button
                            key={pricing.id_tarification}
                            type="button"
                            onClick={() =>
                              setSelectedTarificationId(pricing.id_tarification)
                            }
                            className={`rounded-[24px] border p-6 text-left transition ${
                              isSelected
                                ? 'border-gold bg-gold/10 shadow-[0_0_0_1px_rgba(214,176,83,0.35)]'
                                : 'border-white/10 bg-white/5 hover:border-gold/35 hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-xs uppercase tracking-[0.22em] text-gold">
                                  {normalizeText(pricing.qualificatif)}
                                </p>
                                <h3 className="mt-2 text-2xl font-semibold text-white">
                                  {normalizedName}
                                </h3>
                                <p className="mt-3 text-sm leading-6 text-white/65">
                                  {normalizedDescription}
                                </p>
                              </div>

                              <div className="shrink-0 rounded-full bg-black/30 px-4 py-3 text-center">
                                <p className="text-xs uppercase tracking-[0.18em] text-white/40">
                                  {t('discountLabel')}
                                </p>
                                <p className="mt-1 text-xl font-bold text-gold">
                                  {getDiscountDisplayLabel(pricing.discount_rate, locale)}
                                </p>
                              </div>
                            </div>

                            <div className="mt-5 space-y-3">
                              {normalizedBenefits.map((benefit) => (
                                <div
                                  key={benefit}
                                  className="flex items-start gap-3 text-sm text-white/80"
                                >
                                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                                  <span>{benefit}</span>
                                </div>
                              ))}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : null}

                {currentStep === 2 ? (
                  <>
                    <p className="text-sm text-white/60">{t('protectionSubtitle')}</p>

                    <div className="mt-6 grid gap-4 xl:grid-cols-2">
                      {assurances.map((assurance) => {
                        const isSelected =
                          selectedAssuranceId === assurance.id_assurance;

                        return (
                          <button
                            key={assurance.id_assurance}
                            type="button"
                            onClick={() =>
                              setSelectedAssuranceId(assurance.id_assurance)
                            }
                            className={`rounded-[24px] border p-5 text-left transition ${
                              isSelected
                                ? 'border-gold bg-gold/10 shadow-[0_0_0_1px_rgba(214,176,83,0.35)]'
                                : 'border-white/10 bg-white/5 hover:border-gold/35 hover:bg-white/10'
                            }`}
                          >
                            <p className="text-xs uppercase tracking-[0.22em] text-gold">
                              {normalizeText(assurance.qualificatif)}
                            </p>
                            <h3 className="mt-2 text-xl font-semibold text-white">
                              {normalizeText(assurance.nom)}
                            </h3>
                            <p className="mt-3 text-sm leading-6 text-white/65">
                              {normalizeText(assurance.description)}
                            </p>

                            <div className="mt-4 space-y-2">
                              {normalizeList(assurance.avantages).map((benefit) => (
                                <div
                                  key={benefit}
                                  className="flex items-start gap-3 text-sm text-white/80"
                                >
                                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                                  <span>{benefit}</span>
                                </div>
                              ))}
                            </div>

                            <div className="mt-5 border-t border-white/10 pt-4">
                              <p className="text-lg font-bold text-gold">
                                {assurance.prix_jour > 0
                                  ? `+${assurance.prix_jour} MAD / ${t('perDayShort')}`
                                  : t('includedFree')}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-8">
                      <h3 className="text-lg font-semibold text-white">
                        {t('optionsTitle')}
                      </h3>
                      <p className="mt-2 text-sm text-white/60">
                        {t('optionsSubtitle')}
                      </p>

                      <div className="mt-4 grid gap-3">
                        {options.map((option) => {
                          const isSelected = selectedOptions.includes(option.id_option);

                          return (
                            <button
                              key={option.id_option}
                              type="button"
                              onClick={() => toggleOption(option.id_option)}
                              className={`flex items-center justify-between gap-4 rounded-2xl border p-4 text-left transition ${
                                isSelected
                                  ? 'border-gold bg-gold/10'
                                  : 'border-white/10 bg-white/5 hover:border-gold/35 hover:bg-white/10'
                              }`}
                            >
                              <div>
                                <p className="font-medium text-white">
                                  {normalizeText(option.nom)}
                                </p>
                                <p className="mt-1 text-sm text-white/60">
                                  {normalizeText(option.description)}
                                </p>
                              </div>

                              <span className="shrink-0 font-semibold text-gold">
                                +{option.prix_jour} MAD
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : null}

                {currentStep === 3 ? (
                  <>
                    <p className="text-sm text-white/60">{t('detailsSubtitle')}</p>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-sm text-white/70">{t('firstName')}</span>
                        <input
                          value={form.prenom}
                          onChange={(e) => updateForm('prenom', e.target.value)}
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30"
                          placeholder={t('firstNamePlaceholder')}
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm text-white/70">{t('lastName')}</span>
                        <input
                          value={form.nom}
                          onChange={(e) => updateForm('nom', e.target.value)}
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30"
                          placeholder={t('lastNamePlaceholder')}
                        />
                      </label>

                      <label className="space-y-2 md:col-span-2">
                        <span className="text-sm text-white/70">{t('email')}</span>
                        <input
                          type="email"
                          value={form.mail}
                          onChange={(e) => updateForm('mail', e.target.value)}
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30"
                          placeholder={t('emailPlaceholder')}
                        />
                      </label>

                      <div className="space-y-2">
                        <span className="text-sm text-white/70">{t('birthDate')}</span>
                        <div className="relative">
                          <input
                            ref={birthDateRef}
                            type="date"
                            max={today}
                            value={formatInputDate(form.date_naissance)}
                            onChange={(e) => updateForm('date_naissance', e.target.value)}
                            className="pointer-events-none absolute inset-0 opacity-0"
                            tabIndex={-1}
                            aria-hidden="true"
                          />
                          <button
                            type="button"
                            onClick={() => openPicker(birthDateRef)}
                            className="flex h-[52px] w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 text-left text-white transition hover:border-gold/50"
                          >
                            <span className="flex items-center gap-3">
                              <CalendarDays className="h-4 w-4 text-gold" />
                              <span>
                                {form.date_naissance
                                  ? formatDate(form.date_naissance, locale)
                                  : t('birthDate')}
                              </span>
                            </span>
                            <Pencil className="h-4 w-4 text-white/45" />
                          </button>
                        </div>
                      </div>

                      <label className="space-y-2">
                        <span className="text-sm text-white/70">{t('country')}</span>

                        <div className="relative">
                          <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />

                          <select
                            value={form.pays}
                            onChange={(e) => handleCountryChange(e.target.value)}
                            className="w-full appearance-none rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-11 text-white outline-none transition focus:border-gold"
                          >
                            {countryOptions.map((country) => (
                              <option
                                key={country.code}
                                value={country.label}
                                className="bg-brand-950 text-white"
                              >
                                {country.label}
                              </option>
                            ))}
                          </select>

                          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
                        </div>
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm text-white/70">{t('phoneCode')}</span>

                        <div className="relative">
                          <select
                            value={form.prefixe_tel}
                            onChange={(e) => updateForm('prefixe_tel', e.target.value)}
                            className="w-full appearance-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-gold"
                          >
                            {phonePrefixOptions.map((prefix) => (
                              <option
                                key={prefix}
                                value={prefix}
                                className="bg-brand-950 text-white"
                              >
                                {prefix}
                              </option>
                            ))}
                          </select>

                          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
                        </div>
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm text-white/70">{t('phone')}</span>
                        <input
                          value={form.num_tel}
                          onChange={(e) => updateForm('num_tel', e.target.value)}
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30"
                          placeholder={t('phonePlaceholder')}
                        />
                      </label>

                      <label className="space-y-2 md:col-span-2">
                        <span className="text-sm text-white/70">{t('promoCode')}</span>
                        <input
                          value={form.code_promo}
                          onChange={(e) => updateForm('code_promo', e.target.value)}
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white uppercase outline-none placeholder:text-white/30"
                          placeholder={t('promoCodePlaceholder')}
                        />
                      </label>
                    </div>

                    <div className="mt-8 grid gap-4 md:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-sm text-white/70">{t('pickupTime')}</span>
                        <div className="relative">
                          <select
                            value={form.heure_dep}
                            onChange={(e) => updateForm('heure_dep', e.target.value)}
                            className="w-full appearance-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-gold"
                          >
                            {TIME_OPTIONS.map((time) => (
                              <option key={time} value={time} className="bg-brand-950 text-white">
                                {time}
                              </option>
                            ))}
                          </select>

                          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
                        </div>
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm text-white/70">{t('returnTime')}</span>
                        <div className="relative">
                          <select
                            value={form.heure_ret}
                            onChange={(e) => updateForm('heure_ret', e.target.value)}
                            className="w-full appearance-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-gold"
                          >
                            {TIME_OPTIONS.map((time) => (
                              <option key={time} value={time} className="bg-brand-950 text-white">
                                {time}
                              </option>
                            ))}
                          </select>

                          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
                        </div>
                      </label>
                    </div>

                    <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={form.retour_different}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setForm((prev) => ({
                              ...prev,
                              retour_different: checked,
                              id_lieu_ret: checked ? prev.id_lieu_ret || agency : agency
                            }));
                          }}
                          className="h-4 w-4 rounded border-white/20 bg-transparent"
                        />
                        <span className="text-sm text-white">
                          {t('differentReturnAgency')}
                        </span>
                      </label>

                      {form.retour_different ? (
                        <div className="mt-4">
                          <label className="space-y-2">
                            <span className="text-sm text-white/70">
                              {t('returnAgency')}
                            </span>
                            <select
                              value={form.id_lieu_ret}
                              onChange={(e) => updateForm('id_lieu_ret', e.target.value)}
                              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                            >
                              {agencies.map((item) => (
                                <option
                                  key={item.id_agence}
                                  value={item.id_agence}
                                  className="bg-brand-950 text-white"
                                >
                                  {item.nom || item.id_agence}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-8 rounded-[24px] border border-gold/20 bg-white/[0.03] p-5">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
                        {t('ageCategory')}
                      </p>

                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                          {AGE_POLICIES.map((policy) => {
                            const isSelected = form.id_politique_age === policy.id;
                            const isWarningPolicy =
                              policy.id === 'AGE00000001' || policy.id === 'AGE00000003';

                            const displayLabel =
                              policy.id === 'AGE00000001'
                                ? t('ageRanges.young')
                                : policy.id === 'AGE00000002'
                                  ? t('ageRanges.standard')
                                  : t('ageRanges.senior');

                            return (
                              <button
                                key={policy.id}
                                type="button"
                                onClick={() => updateForm('id_politique_age', policy.id)}
                                className={`rounded-2xl border px-4 py-4 text-center transition ${
                                  isSelected
                                    ? isWarningPolicy
                                      ? 'border-yellow-400/40 bg-yellow-500/10 text-white shadow-[0_0_0_1px_rgba(250,204,21,0.22)]'
                                      : 'border-gold bg-gold/10 text-white shadow-[0_0_0_1px_rgba(214,176,83,0.35)]'
                                    : 'border-white/10 bg-white/5 text-white hover:border-gold/35 hover:bg-white/10'
                                }`}
                              >
                                <div className="flex items-center justify-center gap-3">
                                  <div className="text-lg font-semibold">{displayLabel}</div>

                                  {isSelected ? (
                                    isWarningPolicy ? (
                                      <TriangleAlert className="h-5 w-5 shrink-0 text-yellow-400" />
                                    ) : (
                                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-400" />
                                    )
                                  ) : null}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        <div
                          className={`mt-4 rounded-2xl px-4 py-4 ${
                            isAgeWarningPolicy
                              ? 'border border-yellow-400/25 bg-yellow-500/10'
                              : 'border border-gold/25 bg-gold/8'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {isAgeWarningPolicy ? (
                              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" />
                            ) : (
                              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />
                            )}

                            <div className="text-sm text-white">
                              {form.id_politique_age === 'AGE00000001' ? (
                                <span>{t('ageDescriptions.young')}</span>
                              ) : form.id_politique_age === 'AGE00000002' ? (
                                <span>{t('ageDescriptions.standard')}</span>
                              ) : form.id_politique_age === 'AGE00000003' ? (
                                <span>{t('ageDescriptions.senior')}</span>
                              ) : (
                                <span className="text-white/50">{t('ageDescriptions.empty')}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <p className="mt-4 text-sm text-white/45">
                          {t('ageRequirementsNote')}
                        </p>
                    </div>
                  </>
                ) : null}

                {currentStep === 4 ? (
                  <>
                    <p className="text-sm leading-7 text-white/65">
                      {t('finalReviewSubtitle')}
                    </p>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                          {t('reviewCustomer')}
                        </p>
                        <p className="mt-2 text-white">
                          {[form.prenom, form.nom].filter(Boolean).join(' ') || '—'}
                        </p>
                        <p className="mt-1 text-sm text-white/60">
                          {form.mail || '—'}
                        </p>
                        <p className="mt-1 text-sm text-white/60">
                          {[form.prefixe_tel, form.num_tel]
                            .filter(Boolean)
                            .join(' ') || '—'}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                          {t('reviewTrip')}
                        </p>
                        <p className="mt-2 text-white">
                          {pickupAgencyName} → {returnAgencyName}
                        </p>
                        <p className="mt-1 text-sm text-white/60">
                          {formatDate(pickupDate, locale)} {form.heure_dep}
                        </p>
                        <p className="mt-1 text-sm text-white/60">
                          {formatDate(returnDate, locale)} {form.heure_ret}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                          {t('reviewProtection')}
                        </p>
                        <p className="mt-2 text-white">
                          {selectedAssurance
                            ? normalizeText(selectedAssurance.nom)
                            : t('notChosen')}
                        </p>
                        <p className="mt-1 text-sm text-white/60">
                          {selectedOptionItems.length > 0
                            ? selectedOptionItems
                                .map((item) => normalizeText(item.nom))
                                .join(', ')
                            : t('noneSelected')}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                          {t('reviewPricing')}
                        </p>
                        <p className="mt-2 text-white">
                          {selectedTarification
                            ? normalizeText(selectedTarification.nom)
                            : t('notChosen')}
                        </p>
                        {agePolicyMeta ? (
                          <p className="mt-1 text-sm text-white/60">
                            {t('ageCategory')} : {agePolicyMeta.label}
                          </p>
                        ) : null}
                        <p className="mt-1 text-sm text-white/60">
                          {t('promoCode')} : {form.code_promo.trim() || '—'}
                        </p>
                      </div>
                    </div>
                  </>
                ) : null}

                <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={goPrevious}
                    disabled={currentStep === 1 || savingStep || finalizing}
                    className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    {t('previousStep')}
                  </button>

                  {currentStep < 4 ? (
                    <button
                      type="button"
                      onClick={saveStepAndGoNext}
                      disabled={isNextStepDisabled}
                      className="inline-flex items-center justify-center rounded-2xl bg-gold px-6 py-3 text-sm font-semibold text-brand-950 transition hover:bg-gold-dark disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingStep ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('savingStep')}
                        </>
                      ) : (
                        <>
                          {t('nextStep')}
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleFinalizeReservation}
                      disabled={finalizing}
                      className="inline-flex items-center justify-center rounded-2xl bg-gold px-6 py-3 text-sm font-semibold text-brand-950 transition hover:bg-gold-dark disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {finalizing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('finalizing')}
                        </>
                      ) : (
                        t('finalizeReservation')
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="glass-panel rounded-[28px] p-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-semibold text-white">
                    {t('summaryTitle')}
                  </h2>

                  {quoteLoading ? (
                    <div className="inline-flex items-center gap-2 text-xs text-white/60">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" />
                      <span>{t('quoteRefreshing')}</span>
                    </div>
                  ) : null}
                </div>

                <div className="mt-5 space-y-4 text-sm">
                  <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                    <span className="text-white/60">{t('summaryVehicle')}</span>
                    <span className="text-right font-medium text-white">
                      {vehicleDisplayName}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                    <span className="text-white/60">{t('summaryAgency')}</span>
                    <span className="text-right font-medium text-white">
                      {pickupAgencyName}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                    <span className="text-white/60">{t('summaryReturnAgency')}</span>
                    <span className="text-right font-medium text-white">
                      {returnAgencyName}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                    <span className="text-white/60">{t('summaryPeriod')}</span>
                    <span className="text-right font-medium text-white">
                      {formatDate(pickupDate, locale)} {form.heure_dep} →{' '}
                      {formatDate(returnDate, locale)} {form.heure_ret}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                    <span className="text-white/60">{t('summaryPricing')}</span>
                    <span className="text-right font-medium text-white">
                      {selectedTarification
                        ? normalizeText(selectedTarification.nom)
                        : t('notChosen')}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                    <span className="text-white/60">{t('summaryProtection')}</span>
                    <span className="text-right font-medium text-white">
                      {selectedAssurance
                        ? normalizeText(selectedAssurance.nom)
                        : t('notChosen')}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                    <span className="text-white/60">{t('summaryOptions')}</span>
                    <span className="text-right font-medium text-white">
                      {selectedOptionItems.length > 0
                        ? selectedOptionItems
                            .map((item) => normalizeText(item.nom))
                            .join(', ')
                        : t('noneSelected')}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                    <span className="text-white/60">{t('summaryAgeCategory')}</span>
                    <span className="text-right font-medium text-white">
                      {agePolicyMeta?.label || '—'}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                    <span className="text-white/60">{t('summaryPromo')}</span>
                    <span className="text-right font-medium text-white">
                      {form.code_promo.trim() || '—'}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                    <span className="text-white/60">{t('summaryDays')}</span>
                    <span className="text-right font-medium text-white">
                      {getDaysLabel(reservationDays, locale)}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                    <span className="text-white/60">{t('summaryBase')}</span>
                    <span className="text-right font-medium text-white">
                      {formatMoney(quote?.prix_initial, locale)}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                    <span className="text-white/60">{t('summaryDiscount')}</span>
                    <span className="text-right font-medium text-green-400">
                      {quote ? `-${formatMoney(quote.discount, locale)}` : '—'}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <span className="text-base font-semibold text-white">
                      {t('summaryTotal')}
                    </span>
                    <span className="text-right text-2xl font-bold text-gold">
                      {formatMoney(quote?.prix_final, locale)}
                    </span>
                  </div>
                </div>
              </div>

              {quote ? (
                <div className="glass-panel rounded-[28px] p-6">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gold" />
                    <h2 className="text-base font-semibold uppercase tracking-[0.18em] text-white">
                      {t('quoteBreakdownTitle')}
                    </h2>
                  </div>

                  <div className="mt-4 space-y-3 text-sm text-white/75">
                    <div className="flex items-center justify-between gap-3">
                      <span>{t('quoteVehicle')}</span>
                      <span>{formatMoney(quote.breakdown.totalVehicule, locale)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>{t('quoteOptions')}</span>
                      <span>{formatMoney(quote.breakdown.totalOptions, locale)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>{t('quoteProtection')}</span>
                      <span>{formatMoney(quote.breakdown.totalAssurance, locale)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>{t('quoteAge')}</span>
                      <span>{formatMoney(quote.breakdown.totalAge, locale)}</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </aside>
          </div>
        </>
      )}
    </section>
  );
}

