import type {Metadata} from 'next';
import {routing} from '@/i18n/routing';
import ReservationFlow from '@/components/reservation/ReservationFlow';

type ReservationPageSearchParams = {
  agency?: string;
  pickupDate?: string;
  returnDate?: string;
  vehicleId?: string;
  vehicleName?: string;
};

export async function generateMetadata({
  params
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale: rawLocale} = await params;

  const locale = routing.locales.includes(rawLocale as 'fr' | 'en' | 'ar')
    ? rawLocale
    : routing.defaultLocale;

  const dict = (await import(`../../../messages/${locale}.json`)).default;

  return {
    title: dict.Seo.reservation.title,
    description: dict.Seo.reservation.description
  };
}

export default async function ReservationPage({
  params,
  searchParams
}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<ReservationPageSearchParams>;
}) {
  const {locale} = await params;
  const resolvedSearchParams = await searchParams;

  return (
    <ReservationFlow
      locale={locale}
      agency={resolvedSearchParams.agency || ''}
      pickupDate={resolvedSearchParams.pickupDate || ''}
      returnDate={resolvedSearchParams.returnDate || ''}
      vehicleId={resolvedSearchParams.vehicleId || ''}
      vehicleName={resolvedSearchParams.vehicleName || ''}
    />
  );
}