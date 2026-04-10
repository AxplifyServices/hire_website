import type {Metadata} from 'next';
import ReservationLookup from '@/components/account/ReservationLookup';
import {routing} from '@/i18n/routing';

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
    title: dict.Seo.lookup.title,
    description: dict.Seo.lookup.description
  };
}

export default function GestionReservationPage({ params }: { params: { locale: string } }) {
  return <ReservationLookup locale={params.locale} />;
}