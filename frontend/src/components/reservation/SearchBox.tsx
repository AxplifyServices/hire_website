'use client';

import {CalendarDays, ChevronDown, MapPin, Pencil} from 'lucide-react';
import {useRouter} from 'next/navigation';
import {useTranslations} from 'next-intl';
import {useMemo, useRef, useState} from 'react';
import type {Agency} from '@/lib/types';

function formatToday() {
  const date = new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value: string, locale: string) {
  if (!value) return '';
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

export default function SearchBox({
  agencies,
  locale,
  initialAgency = '',
  initialPickupDate = '',
  initialReturnDate = '',
  submitPath,
  extraParams
}: {
  agencies: Agency[];
  locale: string;
  initialAgency?: string;
  initialPickupDate?: string;
  initialReturnDate?: string;
  submitPath?: string;
  extraParams?: Record<string, string>;
}) {
  const t = useTranslations('SearchBox');
  const tAgency = useTranslations('Agencies');
  const router = useRouter();
  const today = formatToday();
  const targetPath = submitPath || `/${locale}/flotte`;

  const [agency, setAgency] = useState(initialAgency);
  const [pickupDate, setPickupDate] = useState(initialPickupDate);
  const [returnDate, setReturnDate] = useState(initialReturnDate);

  const hasSearchedState = Boolean(
    initialAgency && initialPickupDate && initialReturnDate
  );

  const [mobileCollapsed, setMobileCollapsed] = useState(hasSearchedState);

  const pickupRef = useRef<HTMLInputElement | null>(null);
  const returnRef = useRef<HTMLInputElement | null>(null);

  const isMobileFlowReady = agency !== '';

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

    const grouped = agencies.reduce(
      (acc, item) => {
        const category = normalizeCategory(item.categorie);

        if (!acc[category]) {
          acc[category] = [];
        }

        acc[category].push(item);
        return acc;
      },
      {} as Record<string, Agency[]>
    );

    return grouped;
  }, [agencies]);

  const selectedAgency = useMemo(() => {
    return agencies.find((item) => item.id_agence === agency) || null;
  }, [agencies, agency]);

  const isValid = useMemo(() => {
    return (
      agency !== '' &&
      pickupDate !== '' &&
      returnDate !== '' &&
      pickupDate >= today &&
      returnDate >= pickupDate
    );
  }, [agency, pickupDate, returnDate, today]);

  function openPicker(ref: React.RefObject<HTMLInputElement | null>) {
    if (!ref.current) return;

    try {
      ref.current.showPicker?.();
    } catch {
      ref.current.focus();
      ref.current.click();
    }
  }

  function handleAgencyChange(value: string) {
    setAgency(value);

    if (!value) {
      setPickupDate('');
      setReturnDate('');
      return;
    }

    if (pickupDate && pickupDate < today) {
      setPickupDate('');
    }

    if (returnDate && pickupDate && returnDate < pickupDate) {
      setReturnDate('');
    }
  }

  function handlePickupChange(value: string) {
    setPickupDate(value);

    if (returnDate && value && returnDate < value) {
      setReturnDate('');
    }
  }

  function getAgencyLabel(item: Agency) {
    try {
      return tAgency(`items.${item.id_agence}`);
    } catch {
      return item.nom || item.ville || item.id_agence;
    }
  }

  function getCategoryLabel(category: string) {
    try {
      return tAgency(`categories.${category}`);
    } catch {
      return category;
    }
  }

  const summaryAgencyLabel = selectedAgency
    ? getAgencyLabel(selectedAgency)
    : tAgency('chooseAgency');

  return (
    <section className="searchbox-sticky">
      {hasSearchedState && mobileCollapsed ? (
        <div className="glass-panel rounded-[20px] border border-gold/15 px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.28)] sm:hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2 text-sm text-white">
                <MapPin className="h-4 w-4 shrink-0 text-gold" />
                <span className="truncate">{summaryAgencyLabel}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-white/75">
                <CalendarDays className="h-4 w-4 shrink-0 text-gold" />
                <span className="truncate">
                  {pickupDate ? formatDisplayDate(pickupDate, locale) : ''} →{' '}
                  {returnDate ? formatDisplayDate(returnDate, locale) : ''}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMobileCollapsed(false)}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:border-gold/50"
            >
              <Pencil className="h-4 w-4 text-gold" />
              {t('editSearch')}
            </button>
          </div>
        </div>
      ) : null}

      <div
        className={`glass-panel rounded-[24px] border border-gold/15 px-4 py-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)] sm:rounded-[28px] sm:px-5 sm:py-5 ${
          hasSearchedState && mobileCollapsed ? 'hidden sm:block' : 'block'
        }`}
      >
        <div className="mb-4 flex flex-col gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-gold">
            Hire Automotive
          </p>
          <h2 className="text-lg font-semibold text-white sm:text-xl">
            {t('title')}
          </h2>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_180px] lg:items-end">
          <label className="block text-sm text-white/75">
            <span className="mb-2 block font-medium">{t('pickupAgency')}</span>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
              <select
                value={agency}
                onChange={(event) => handleAgencyChange(event.target.value)}
                className="w-full appearance-none rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-11 text-white outline-none transition focus:border-gold"
              >
                <option value="" className="bg-brand-950 text-white">
                  {tAgency('chooseAgency')}
                </option>

                {(['Ville', 'Aéroport'] as const).flatMap((category) => {
                  const items = agenciesByCategory[category] || [];
                  if (items.length === 0) return [];

                  return [
                    <option
                      key={`label-${category}`}
                      value={`__label-${category}`}
                      disabled
                      className="bg-black text-gold font-semibold"
                    >
                      ── {getCategoryLabel(category)} ──
                    </option>,
                    ...items.map((item) => (
                      <option
                        key={item.id_agence}
                        value={item.id_agence}
                        className="bg-brand-950 text-white"
                      >
                        {getAgencyLabel(item)}
                      </option>
                    ))
                  ];
                })}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
            </div>
          </label>

          <div className={`${isMobileFlowReady ? 'block' : 'hidden'} lg:block`}>
            <span className="mb-2 block text-sm font-medium text-white/75">
              {t('pickupDate')}
            </span>
            <div className="relative">
              <input
                ref={pickupRef}
                type="date"
                min={today}
                value={pickupDate}
                onChange={(event) => handlePickupChange(event.target.value)}
                className="pointer-events-none absolute inset-0 opacity-0"
                tabIndex={-1}
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={() => openPicker(pickupRef)}
                disabled={!agency}
                className={`flex h-[52px] w-full items-center justify-between rounded-2xl border px-4 text-left transition ${
                  agency
                    ? 'border-white/10 bg-white/5 text-white hover:border-gold/50'
                    : 'cursor-not-allowed border-white/5 bg-white/5 text-white/35'
                }`}
              >
                <span className="flex items-center gap-3">
                  <CalendarDays className="h-4 w-4 text-gold" />
                  <span>
                    {pickupDate
                      ? formatDisplayDate(pickupDate, locale)
                      : t('pickupDate')}
                  </span>
                </span>
              </button>
            </div>
          </div>

          <div className={`${isMobileFlowReady ? 'block' : 'hidden'} lg:block`}>
            <span className="mb-2 block text-sm font-medium text-white/75">
              {t('returnDate')}
            </span>
            <div className="relative">
              <input
                ref={returnRef}
                type="date"
                min={pickupDate || today}
                value={returnDate}
                onChange={(event) => setReturnDate(event.target.value)}
                className="pointer-events-none absolute inset-0 opacity-0"
                tabIndex={-1}
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={() => openPicker(returnRef)}
                disabled={!agency || !pickupDate}
                className={`flex h-[52px] w-full items-center justify-between rounded-2xl border px-4 text-left transition ${
                  agency && pickupDate
                    ? 'border-white/10 bg-white/5 text-white hover:border-gold/50'
                    : 'cursor-not-allowed border-white/5 bg-white/5 text-white/35'
                }`}
              >
                <span className="flex items-center gap-3">
                  <CalendarDays className="h-4 w-4 text-gold" />
                  <span>
                    {returnDate
                      ? formatDisplayDate(returnDate, locale)
                      : t('returnDate')}
                  </span>
                </span>
              </button>
            </div>
          </div>

          <button
            type="button"
            disabled={!isValid}
            onClick={() => {
              if (!isValid) return;

              const params = new URLSearchParams({
                agency,
                pickupDate,
                returnDate,
                ...(extraParams || {})
              });

              router.push(`${targetPath}?${params.toString()}`);
              setMobileCollapsed(true);
            }}
            className={`h-[52px] rounded-2xl px-4 text-sm font-semibold transition ${
              isValid
                ? 'bg-gold text-brand-950 hover:bg-gold-dark'
                : 'cursor-not-allowed bg-white/10 text-white/40'
            } ${isMobileFlowReady ? 'block' : 'hidden'} lg:block`}
          >
            {t('submit')}
          </button>
        </div>

        {hasSearchedState ? (
          <div className="mt-3 sm:hidden">
            <button
              type="button"
              onClick={() => setMobileCollapsed(true)}
              className="text-sm font-medium text-gold"
            >
              {t('reduceSearch')}
            </button>
          </div>
        ) : null}

        {pickupDate && returnDate && returnDate < pickupDate ? (
          <p className="mt-3 text-sm text-red-300">{t('invalidDateRange')}</p>
        ) : null}
      </div>
    </section>
  );
}