import type {Metadata} from 'next';
import B2BDashboard from '@/components/b2b/B2BDashboard';
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
    title: dict.Seo.b2b.title,
    description: dict.Seo.b2b.description,
    alternates: {
      languages: {
        fr: '/fr/b2b',
        en: '/en/b2b',
        ar: '/ar/b2b'
      }
    }
  };
}

export default async function B2BPage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;

  return <B2BDashboard locale={locale} />;
}