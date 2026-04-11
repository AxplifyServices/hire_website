import type {Metadata} from 'next';
import {routing} from '@/i18n/routing';
import {fetchAgencies} from '@/lib/api';
import AgenciesExplorer from '@/components/agencies/AgenciesExplorer';

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
    title: dict.Seo.agencies.title,
    description: dict.Seo.agencies.description,
    alternates: {
      languages: {
        fr: '/fr/agences',
        en: '/en/agences',
        ar: '/ar/agences'
      }
    }
  };
}

export default async function AgenciesPage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale: rawLocale} = await params;
  const locale = routing.locales.includes(rawLocale as 'fr' | 'en' | 'ar')
    ? rawLocale
    : routing.defaultLocale;

  const dict = (await import(`../../../messages/${locale}.json`)).default;
  const agencies = await fetchAgencies();

  return (
    <AgenciesExplorer
      locale={locale}
      agencies={agencies}
      agencyNames={dict.Agencies.items}
      categoryLabels={dict.Agencies.categories}
      labels={dict.AgenciesPage}
    />
  );
}