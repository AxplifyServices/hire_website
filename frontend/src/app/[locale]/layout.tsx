import {NextIntlClientProvider, hasLocale} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import {routing} from '@/i18n/routing';

const localeMeta = {
  fr: {
    title: 'Location de voitures premium au Maroc',
    description: 'Front-end Next.js multilingue connecté uniquement aux APIs déjà exposées du back-end.'
  },
  en: {
    title: 'Premium car rental in Morocco',
    description: 'Multilingual Next.js front-end connected only to the APIs already exposed by the back-end.'
  },
  ar: {
    title: 'تأجير سيارات بريميوم في المغرب',
    description: 'واجهة Next.js متعددة اللغات متصلة فقط بالواجهات البرمجية المنشورة حالياً في الخلفية.'
  }
} as const;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale: rawLocale} = await params;
  const locale = hasLocale(routing.locales, rawLocale) ? rawLocale : routing.defaultLocale;
  const meta = localeMeta[locale as keyof typeof localeMeta];

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      languages: {
        fr: '/fr',
        en: '/en',
        ar: '/ar'
      }
    }
  };
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="page-shell" dir={dir}>
        <Header />
        <main className="mx-auto flex min-h-[calc(100vh-160px)] w-full max-w-7xl flex-1 flex-col px-4 pb-12 pt-4 sm:px-6 lg:px-8">
          {children}
        </main>
        <Footer />
      </div>
    </NextIntlClientProvider>
  );
}