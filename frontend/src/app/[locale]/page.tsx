import {getTranslations} from 'next-intl/server';
import type {Metadata} from 'next';
import SearchBox from '@/components/reservation/SearchBox';
import {fetchAgencies} from '@/lib/api';
import {routing} from '@/i18n/routing';
import MemberRibbon from '@/components/layout/MemberRibbon';
import WhyChooseSection from '@/components/home/WhyChooseSection';

export async function generateMetadata({
  params
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale: rawLocale} = await params;
  const locale = routing.locales.includes(rawLocale as 'fr' | 'en' | 'ar')
    ? rawLocale
    : routing.defaultLocale;

  const dict = (await import(`../../messages/${locale}.json`)).default;

  return {
    title: dict.Seo.home.title,
    description: dict.Seo.home.description
  };
}

export default async function HomePage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  const agencies = await fetchAgencies();
  const t = await getTranslations({locale, namespace: 'HomeHero'});

   return (
    <>
      <div className="space-y-8">
        <SearchBox agencies={agencies} locale={locale} />

        <section className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(198,167,94,0.18),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] px-6 py-10 text-center sm:px-8 lg:px-12 lg:py-14">
          <div className="mx-auto max-w-4xl">
            <div className="mx-auto inline-flex rounded-full border border-gold/30 bg-gold/10 px-5 py-2 text-sm font-semibold text-gold">
              {t('badge')}
            </div>

            <h1 className="mt-6 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              {t('titleBefore')} <span className="text-gold">{t('titleHighlight')}</span> {t('titleAfter')}
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
              {t('description')}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-gold/20 bg-black/20 px-4 py-5 text-center">
                <div className="text-2xl font-bold text-white">24/7</div>
                <div className="mt-1 text-sm text-white/65">{t('support')}</div>
              </div>

              <div className="rounded-2xl border border-gold/20 bg-black/20 px-4 py-5 text-center">
                <div className="text-2xl font-bold text-white">2400+</div>
                <div className="mt-1 text-sm text-white/65">{t('happyClients')}</div>
              </div>

              <div className="rounded-2xl border border-gold/20 bg-black/20 px-4 py-5 text-center">
                <div className="text-2xl font-bold text-white">50+</div>
                <div className="mt-1 text-sm text-white/65">{t('vehicles')}</div>
              </div>
            </div>
          </div>
        </section>

        <WhyChooseSection />
      </div>

      <MemberRibbon />
    </>
  );
}