import type {Metadata} from 'next';
import {getTranslations} from 'next-intl/server';
import {fetchAgencies} from '@/lib/api';
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
    title: dict.Seo.agencies.title,
    description: dict.Seo.agencies.description
  };
}

export default async function AgenciesPage() {
  const [t, agencies] = await Promise.all([
    getTranslations('AgenciesPage'),
    fetchAgencies()
  ]);

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.35em] text-gold">{t('kicker')}</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">{t('title')}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/65">{t('subtitle')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {agencies.map((agency) => (
          <article
            key={agency.id_agence}
            className="rounded-[24px] border border-white/10 bg-white/5 p-5"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-gold">
              {agency.ville || agency.id_agence}
            </p>
            <h2 className="mt-2 text-lg font-semibold text-white">
              {agency.nom || agency.ville || agency.id_agence}
            </h2>
            <div className="mt-4 space-y-2 text-sm text-white/65">
              <p>{agency.adresse || t('missingAddress')}</p>
              <p>{agency.num_tel || t('missingPhone')}</p>
              <p>{agency.mail || t('missingEmail')}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}