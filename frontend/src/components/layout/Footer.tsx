import Link from 'next/link';
import {getLocale, getTranslations} from 'next-intl/server';
import {
  CarFront,
  ChevronRight,
  Landmark,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  UserCircle2
} from 'lucide-react';
import {FaInstagram, FaFacebook, FaWhatsapp} from 'react-icons/fa';

function withLocale(locale: string, href: string) {
  return `/${locale}${href}`;
}

export default async function Footer() {
  const locale = await getLocale();
  const t = await getTranslations('Footer');

  const navigationLinks = [
    {key: 'navHome', href: '', icon: Landmark},
    {key: 'navFleet', href: '/flotte', icon: CarFront},
    {key: 'navAgencies', href: '/agences', icon: MapPin},
    {key: 'navAccount', href: '/b2b', icon: UserCircle2}
  ];

  const serviceLinks = [
    {key: 'manageBooking', href: '/news', icon: Search},
    {key: 'account', href: '/b2b', icon: UserCircle2},
    {key: 'navFleet', href: '/flotte', icon: CarFront},
    {key: 'navAgencies', href: '/agences', icon: MapPin}
  ];

  const contactItems = [
    {
      label: '+212 6 00 00 00 00',
      icon: Phone
    },
    {
      label: 'contact@hireautomotive.ma',
      icon: Mail
    },
    {
      label: t('whatsapp247'),
      icon: MessageCircle
    }
  ];

  return (
    <footer className="border-t border-white/10 bg-[#0f1115]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-[1.3fr_0.8fr_0.9fr_0.9fr]">
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold text-brand-950">
                <CarFront className="h-5 w-5" />
              </div>

              <div>
                <p className="text-lg font-bold uppercase tracking-tight text-white">
                  Hire Automotive Group
                </p>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
                  {t('brandSubtitle')}
                </p>
              </div>
            </div>

            <p className="max-w-md text-sm leading-7 text-white/70">
              {t('description')}
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href={withLocale(locale, '/b2b')}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-white transition hover:border-gold/40 hover:bg-white/10"
              >
                <UserCircle2 className="h-4 w-4 text-gold" />
                {t('account')}
              </Link>

              <Link
                href={withLocale(locale, '/news')}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-white transition hover:border-gold/40 hover:bg-white/10"
              >
                <Search className="h-4 w-4 text-gold" />
                {t('manageBooking')}
              </Link>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/75 transition hover:border-gold/40 hover:text-white"
                aria-label="Instagram"
              >
                <FaInstagram className="h-4 w-4" />
              </button>

              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/75 transition hover:border-gold/40 hover:text-white"
                aria-label="Facebook"
              >
                <FaFacebook className="h-4 w-4" />
              </button>

              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/75 transition hover:border-gold/40 hover:text-white"
                aria-label="WhatsApp"
              >
                <FaWhatsapp className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div>
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-white">
              {t('navigation')}
            </p>

            <nav className="space-y-3">
              {navigationLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.key}
                    href={withLocale(locale, item.href)}
                    className="group flex min-h-11 items-center justify-between rounded-xl px-3 text-sm text-white/72 transition hover:bg-white/5 hover:text-white"
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-gold" />
                      {t(item.key)}
                    </span>

                    <ChevronRight className="h-4 w-4 text-white/35 transition group-hover:translate-x-0.5 group-hover:text-gold" />
                  </Link>
                );
              })}
            </nav>
          </div>

          <div>
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-white">
              {t('information')}
            </p>

            <nav className="space-y-3">
              {serviceLinks.map((item, index) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={`${item.key}-${index}`}
                    href={withLocale(locale, item.href)}
                    className="group flex min-h-11 items-center justify-between rounded-xl px-3 text-sm text-white/72 transition hover:bg-white/5 hover:text-white"
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-gold" />
                      {t(item.key)}
                    </span>

                    <ChevronRight className="h-4 w-4 text-white/35 transition group-hover:translate-x-0.5 group-hover:text-gold" />
                  </Link>
                );
              })}
            </nav>
          </div>

          <div>
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-white">
              {t('contact')}
            </p>

            <div className="space-y-3">
              {contactItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-white/72"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-gold" />
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-5">
          <div className="flex flex-col gap-3 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
            <p>{t('copyright')}</p>

            <div className="flex flex-wrap items-center gap-4">
              <Link href="/fr" className="transition hover:text-white">
                FR
              </Link>
              <Link href="/en" className="transition hover:text-white">
                EN
              </Link>
              <Link href="/ar" className="transition hover:text-white">
                AR
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}