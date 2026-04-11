import type {Metadata} from 'next';
import Link from 'next/link';
import {routing} from '@/i18n/routing';
import {fetchAgencies, fetchNews} from '@/lib/api';
import NewsAgencyFilter from '@/components/news/NewsAgencyFilter';

function buildNewsHref(
  locale: string,
  params: {page?: number; id_agence?: string | null}
) {
  const search = new URLSearchParams();

  if (params.page && params.page > 1) {
    search.set('page', String(params.page));
  }

  if (params.id_agence) {
    search.set('id_agence', params.id_agence);
  }

  const query = search.toString();
  return `/${locale}/news${query ? `?${query}` : ''}`;
}

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
    title: dict.Seo.news.title,
    description: dict.Seo.news.description,
    alternates: {
      languages: {
        fr: '/fr/news',
        en: '/en/news',
        ar: '/ar/news'
      }
    }
  };
}

export default async function NewsPage({
  params,
  searchParams
}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<{page?: string; id_agence?: string}>;
}) {
  const {locale: rawLocale} = await params;
  const locale = routing.locales.includes(rawLocale as 'fr' | 'en' | 'ar')
    ? rawLocale
    : routing.defaultLocale;

  const query = await searchParams;
  const dict = (await import(`../../../messages/${locale}.json`)).default;

  const page = Math.max(Number(query.page || 1), 1);
  const id_agence = query.id_agence || undefined;

  const [newsResponse, agencies] = await Promise.all([
    fetchNews({page, id_agence}),
    fetchAgencies()
  ]);

  const agenciesById = Object.fromEntries(agencies.map((agency) => [agency.id_agence, agency]));
  const selectedAgency = id_agence ? agenciesById[id_agence] : undefined;
  const selectedAgencyName = selectedAgency
    ? dict.Agencies.items[selectedAgency.id_agence] ||
      selectedAgency.nom ||
      selectedAgency.ville ||
      selectedAgency.id_agence
    : null;

  const items = newsResponse.data || [];
  const totalPages = newsResponse.total_pages || 1;

  const agencyOptions = agencies.map((agency) => ({
    id_agence: agency.id_agence,
    label:
      dict.Agencies.items[agency.id_agence] ||
      agency.nom ||
      agency.ville ||
      agency.id_agence
  }));

  return (
    <section className="space-y-6">
      <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.28)] sm:p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-gold">{dict.NewsPage.kicker}</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          {selectedAgencyName
            ? dict.NewsPage.titleFiltered.replace('{agency}', selectedAgencyName)
            : dict.NewsPage.title}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/65">
          {selectedAgencyName ? dict.NewsPage.subtitleFiltered : dict.NewsPage.subtitle}
        </p>

        <NewsAgencyFilter
          locale={locale}
          selectedAgencyId={id_agence}
          allLabel={dict.NewsPage.allAgencies}
          filterLabel={dict.NewsPage.filterLabel}
          agencies={agencyOptions}
        />
      </div>

      <div className="grid gap-5">
        {items.length ? (
          items.map((item) => {
            const relatedAgency = agenciesById[item.id_agence] || item.agences || undefined;

            const agencyName = relatedAgency
              ? dict.Agencies.items[relatedAgency.id_agence] ||
                relatedAgency.nom ||
                relatedAgency.ville ||
                relatedAgency.id_agence
              : item.id_agence;

            const date = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-MA' : locale, {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }).format(new Date(item.date_parution));

            return (
              <article
                key={item.id_news}
                className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]"
              >
                <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.26em]">
                  <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-gold">
                    {agencyName}
                  </span>
                  <span className="text-white/45">{date}</span>
                </div>

                <h2 className="mt-4 text-2xl font-semibold text-white">{item.titre}</h2>
                <p className="mt-4 whitespace-pre-line text-sm leading-8 text-white/68">
                  {item.contenu}
                </p>
              </article>
            );
          })
        ) : (
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-8 text-sm text-white/65">
            {dict.NewsPage.empty}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-white/10 bg-white/[0.03] px-5 py-4">
        <p className="text-sm text-white/60">
          {dict.NewsPage.paginationSummary
            .replace('{page}', String(newsResponse.page || 1))
            .replace('{totalPages}', String(totalPages))}
        </p>

        <div className="flex items-center gap-3">
          <Link
            href={buildNewsHref(locale, {page: Math.max(page - 1, 1), id_agence: id_agence || null})}
            className={`inline-flex min-h-11 items-center rounded-full border px-5 text-sm font-semibold transition ${
              page <= 1
                ? 'pointer-events-none border-white/10 bg-white/[0.03] text-white/25'
                : 'border-white/10 bg-white/5 text-white hover:border-gold/35'
            }`}
          >
            {dict.NewsPage.previous}
          </Link>

          <Link
            href={buildNewsHref(locale, {
              page: Math.min(page + 1, totalPages),
              id_agence: id_agence || null
            })}
            className={`inline-flex min-h-11 items-center rounded-full border px-5 text-sm font-semibold transition ${
              page >= totalPages
                ? 'pointer-events-none border-white/10 bg-white/[0.03] text-white/25'
                : 'border-gold/40 bg-gold text-brand-950 hover:opacity-95'
            }`}
          >
            {dict.NewsPage.next}
          </Link>
        </div>
      </div>
    </section>
  );
}