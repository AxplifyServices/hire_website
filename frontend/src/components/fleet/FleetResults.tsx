'use client';

import {useMemo, useState} from 'react';
import {usePathname, useRouter, useSearchParams} from 'next/navigation';
import {useTranslations} from 'next-intl';
import {Funnel, X, ChevronLeft, ChevronRight} from 'lucide-react';
import VehicleCard from '@/components/fleet/VehicleCard';
import type {Vehicle, VehiclesListResponse} from '@/lib/types';

type Props = {
  locale: string;
  vehicles: Vehicle[];
  agency: string;
  pickupDate: string;
  returnDate: string;
  selectedVehicleId?: string;
  hasAvailabilitySearch: boolean;
  serverPagination: VehiclesListResponse['pagination'];
};

type BudgetKey = 'lt400' | '400_700' | '700_1000' | 'gt1000';

function uniqueSorted(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[])).sort((a, b) =>
    a.localeCompare(b)
  );
}

function countBy<T extends string>(values: T[]) {
  return values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function getBudgetKey(price: number | null | undefined): BudgetKey | null {
  if (typeof price !== 'number') return null;
  if (price < 400) return 'lt400';
  if (price <= 700) return '400_700';
  if (price <= 1000) return '700_1000';
  return 'gt1000';
}

export default function FleetResults({
  locale,
  vehicles,
  agency,
  pickupDate,
  returnDate,
  selectedVehicleId = '',
  hasAvailabilitySearch,
  serverPagination
}: Props) {
  const t = useTranslations('FleetPage');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const categories = useMemo(
    () => uniqueSorted(vehicles.map((v) => v.categorie)),
    [vehicles]
  );

  const transmissions = useMemo(
    () => uniqueSorted(vehicles.map((v) => v.transmission)),
    [vehicles]
  );

  const categoryCounts = useMemo(
    () => countBy(vehicles.map((v) => v.categorie).filter(Boolean) as string[]),
    [vehicles]
  );

  const transmissionCounts = useMemo(
    () => countBy(vehicles.map((v) => v.transmission).filter(Boolean) as string[]),
    [vehicles]
  );

  const selectedCategories = searchParams.getAll('category');
  const selectedTransmissions = searchParams.getAll('transmission');
  const selectedBudget = searchParams.get('budget') || '';

  function buildParams(mutator: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutator(params);

    if (hasAvailabilitySearch) {
      params.delete('page');
    }

    return params;
  }

  function pushParams(params: URLSearchParams) {
    router.push(`${pathname}?${params.toString()}`, {scroll: false});
  }

  function toggleMultiValue(key: string, value: string) {
    const params = buildParams((draft) => {
      const current = draft.getAll(key);
      draft.delete(key);

      if (current.includes(value)) {
        current.filter((v) => v !== value).forEach((v) => draft.append(key, v));
      } else {
        [...current, value].forEach((v) => draft.append(key, v));
      }
    });

    pushParams(params);
  }

  function setSingleValue(key: string, value: string) {
    const params = buildParams((draft) => {
      if (!value) draft.delete(key);
      else draft.set(key, value);
    });

    pushParams(params);
  }

  function resetFilters() {
    const params = new URLSearchParams(searchParams.toString());

    params.delete('category');
    params.delete('transmission');
    params.delete('budget');

    if (hasAvailabilitySearch) {
      params.delete('page');
    } else {
      params.set('page', '1');
    }

    pushParams(params);
  }

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      if (
        selectedCategories.length &&
        (!vehicle.categorie || !selectedCategories.includes(vehicle.categorie))
      ) {
        return false;
      }

      if (
        selectedTransmissions.length &&
        (!vehicle.transmission ||
          !selectedTransmissions.includes(vehicle.transmission))
      ) {
        return false;
      }

      if (selectedBudget) {
        const vehicleBudget = getBudgetKey(vehicle.prix_jour);
        if (vehicleBudget !== selectedBudget) return false;
      }

      return true;
    });
  }, [vehicles, selectedCategories, selectedTransmissions, selectedBudget]);

  const clientSidePage = Math.max(1, Number(searchParams.get('page') || '1') || 1);
  const clientSideLimit = 12;

  const clientSidePagination = useMemo(() => {
    if (!hasAvailabilitySearch) return null;

    const total = filteredVehicles.length;
    const totalPages = Math.max(1, Math.ceil(total / clientSideLimit));
    const safePage = Math.min(clientSidePage, totalPages);
    const start = (safePage - 1) * clientSideLimit;
    const end = start + clientSideLimit;

    return {
      page: safePage,
      limit: clientSideLimit,
      total,
      total_pages: totalPages,
      has_next: safePage < totalPages,
      has_prev: safePage > 1,
      data: filteredVehicles.slice(start, end)
    };
  }, [filteredVehicles, hasAvailabilitySearch, clientSidePage]);

  const displayedVehicles = hasAvailabilitySearch
    ? (clientSidePagination?.data ?? [])
    : filteredVehicles;

  const effectivePagination = hasAvailabilitySearch
    ? clientSidePagination
    : serverPagination;

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    pushParams(params);
  }

  const FiltersPanel = (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">{t('filtersTitle')}</h2>
          <button
            type="button"
            onClick={resetFilters}
            className="text-sm font-medium text-gold"
          >
            {t('resetFilters')}
          </button>
        </div>

        <div className="space-y-5">
          <div className="rounded-[24px] border border-white/10 bg-black/10 p-5">
            <h3 className="mb-4 text-base font-semibold uppercase tracking-[0.08em] text-white">
              {t('filterCategory')}
            </h3>
            <div className="space-y-3">
              {categories.map((value) => {
                const checked = selectedCategories.includes(value);
                return (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMultiValue('category', value)}
                        className="h-4 w-4 accent-[#d4a63f]"
                      />
                      <span className="text-white/85">{value}</span>
                    </div>
                    <span className="text-sm text-white/45">
                      {categoryCounts[value] || 0}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-black/10 p-5">
            <h3 className="mb-4 text-base font-semibold uppercase tracking-[0.08em] text-white">
              {t('filterTransmission')}
            </h3>
            <div className="space-y-3">
              {transmissions.map((value) => {
                const checked = selectedTransmissions.includes(value);
                return (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMultiValue('transmission', value)}
                        className="h-4 w-4 accent-[#d4a63f]"
                      />
                      <span className="text-white/85">{value}</span>
                    </div>
                    <span className="text-sm text-white/45">
                      {transmissionCounts[value] || 0}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-black/10 p-5">
            <h3 className="mb-4 text-base font-semibold uppercase tracking-[0.08em] text-white">
              {t('budgetPerDay')}
            </h3>
            <div className="space-y-3">
              {[
                {key: 'lt400', label: t('budgetLt400')},
                {key: '400_700', label: t('budget400_700')},
                {key: '700_1000', label: t('budget700_1000')},
                {key: 'gt1000', label: t('budgetGt1000')}
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex cursor-pointer items-center gap-3"
                >
                  <input
                    type="radio"
                    name="budget"
                    checked={selectedBudget === item.key}
                    onChange={() => setSingleValue('budget', item.key)}
                    className="h-4 w-4 accent-[#d4a63f]"
                  />
                  <span className="text-white/85">{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(true)}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white"
        >
          <Funnel className="h-4 w-4 text-gold" />
          {t('filtersButton')}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
        <aside className="hidden lg:block lg:sticky lg:top-28">
          {FiltersPanel}
        </aside>

        <div className="space-y-6">
          {displayedVehicles.length ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
              {displayedVehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id_vehicule}
                  vehicle={vehicle}
                  locale={locale}
                  agency={agency}
                  pickupDate={pickupDate}
                  returnDate={returnDate}
                  isSelected={selectedVehicleId === vehicle.id_vehicule}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] border border-dashed border-white/15 bg-white/5 p-8 text-center text-white/65">
              {t('empty')}
            </div>
          )}

          {effectivePagination && effectivePagination.total_pages > 1 ? (
            <div className="flex flex-wrap items-center justify-center gap-3 rounded-[24px] border border-white/10 bg-white/5 p-4">
              <button
                type="button"
                disabled={!effectivePagination.has_prev}
                onClick={() => goToPage(effectivePagination.page - 1)}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                {t('previous')}
              </button>

              <span className="text-sm text-white/70">
                {t('paginationLabel', {
                  page: effectivePagination.page,
                  totalPages: effectivePagination.total_pages
                })}
              </span>

              <button
                type="button"
                disabled={!effectivePagination.has_next}
                onClick={() => goToPage(effectivePagination.page + 1)}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t('next')}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {mobileFiltersOpen ? (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden">
          <div className="absolute right-0 top-0 h-full w-[88vw] max-w-[380px] overflow-y-auto border-l border-white/10 bg-brand-950 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{t('filtersTitle')}</h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="rounded-xl border border-white/10 p-2 text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {FiltersPanel}

            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="mt-4 w-full rounded-2xl bg-gold px-4 py-3 font-semibold text-brand-950"
            >
              {t('applyFilters')}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}