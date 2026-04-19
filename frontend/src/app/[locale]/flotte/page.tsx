import type {Metadata} from 'next';
import {getTranslations} from 'next-intl/server';
import SearchBox from '@/components/reservation/SearchBox';
import FleetResults from '@/components/fleet/FleetResults';
import {fetchAgencies, fetchVehiclesList, searchVehicles} from '@/lib/api';
import {routing} from '@/i18n/routing';

type FleetSearchParams = {
  agency?: string;
  pickupDate?: string;
  returnDate?: string;
  category?: string | string[];
  vehicleId?: string;
  page?: string;
};

export async function generateMetadata({
  params,
  searchParams
}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<FleetSearchParams>;
}): Promise<Metadata> {
  const {locale: rawLocale} = await params;
  const resolvedSearchParams = await searchParams;

  const locale = routing.locales.includes(rawLocale as 'fr' | 'en' | 'ar')
    ? rawLocale
    : routing.defaultLocale;

  const dict = (await import(`../../../messages/${locale}.json`)).default;

  const baseTitle = dict.Seo.fleet.title;
  const baseDescription = dict.Seo.fleet.description;

  const hasSearch =
    resolvedSearchParams.agency &&
    resolvedSearchParams.pickupDate &&
    resolvedSearchParams.returnDate;

  if (hasSearch) {
    return {
      title: `${dict.FleetPage.availableVehiclesTitle} | Hire`,
      description: `${baseDescription} ${resolvedSearchParams.pickupDate} → ${resolvedSearchParams.returnDate}`
    };
  }

  return {
    title: baseTitle,
    description: baseDescription
  };
}

export default async function FleetPage({
  params,
  searchParams
}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<FleetSearchParams>;
}) {
  const [{locale}, resolvedSearchParams, agencies] = await Promise.all([
    params,
    searchParams,
    fetchAgencies()
  ]);

  const t = await getTranslations('FleetPage');

  const hasAvailabilitySearch = Boolean(
    resolvedSearchParams.agency &&
      resolvedSearchParams.pickupDate &&
      resolvedSearchParams.returnDate
  );

  const currentPage = Math.max(1, Number(resolvedSearchParams.page || '1') || 1);
  const limit = 12;

  let vehicles = [];
  let pagination = {
    page: currentPage,
    limit,
    total: 0,
    total_pages: 1,
    has_next: false,
    has_prev: false
  };

  if (hasAvailabilitySearch) {
    const searchedVehicles = await searchVehicles({
      id_agence_depart: resolvedSearchParams.agency!,
      date_dep: resolvedSearchParams.pickupDate!,
      date_ret: resolvedSearchParams.returnDate!,
      heure_dep: '10:00',
      heure_ret: '09:00'
    });

    vehicles = searchedVehicles;
    pagination = {
      page: 1,
      limit: searchedVehicles.length || limit,
      total: searchedVehicles.length,
      total_pages: 1,
      has_next: false,
      has_prev: false
    };
  } else {
    const response = await fetchVehiclesList({
      page: currentPage,
      limit,
      status_vehicule: 'Actif',
      disponibilite: 'Disponible'
    });

    vehicles = response.data;
    pagination = response.pagination;
  }

  return (
    <section className="space-y-6">
      <SearchBox
        agencies={agencies}
        locale={locale}
        initialAgency={resolvedSearchParams.agency || ''}
        initialPickupDate={resolvedSearchParams.pickupDate || ''}
        initialReturnDate={resolvedSearchParams.returnDate || ''}
      />

      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-gold sm:text-4xl">
          {t('availableVehiclesTitle')}
        </h1>
      </header>

      <FleetResults
        locale={locale}
        vehicles={vehicles}
        agency={resolvedSearchParams.agency || ''}
        pickupDate={resolvedSearchParams.pickupDate || ''}
        returnDate={resolvedSearchParams.returnDate || ''}
        selectedVehicleId={resolvedSearchParams.vehicleId || ''}
        hasAvailabilitySearch={hasAvailabilitySearch}
        serverPagination={pagination}
      />
    </section>
  );
}