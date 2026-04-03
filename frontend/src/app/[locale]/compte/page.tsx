import type {Metadata} from 'next';
import AccountOverview from '@/components/account/AccountOverview';
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
    title: dict.Seo.account.title,
    description: dict.Seo.account.description
  };
}

export default async function AccountPage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;

  return <AccountOverview locale={locale} />;
}