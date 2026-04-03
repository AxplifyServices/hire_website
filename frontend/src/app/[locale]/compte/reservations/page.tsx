import type {Metadata} from 'next';
import ReservationsList from '@/components/account/ReservationsList';
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

  const dict = (await import(`../../../../messages/${locale}.json`)).default;

  return {
    title: dict.Seo.reservations.title,
    description: dict.Seo.reservations.description
  };
}

export default async function ReservationsPage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;

  return <ReservationsList locale={locale} />;
}