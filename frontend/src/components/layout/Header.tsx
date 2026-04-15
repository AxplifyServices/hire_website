'use client';

import {CarFront, Menu, X} from 'lucide-react';
import Link from 'next/link';
import {usePathname, useRouter} from 'next/navigation';
import {useEffect, useMemo, useState} from 'react';
import {useTranslations} from 'next-intl';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import AuthModal from '@/components/auth/AuthModal';
import {
  clearSession,
  readAccessToken,
  subscribeToSessionChange
} from '@/lib/session';

export default function Header() {
  const t = useTranslations('Nav');
  const pathname = usePathname();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const locale = pathname.split('/')[1] || 'fr';

  const links = useMemo(
    () => [
      {href: `/${locale}`, label: t('home')},
      {href: `/${locale}/flotte`, label: t('fleet')},
      {href: `/${locale}/agences`, label: t('agencies')},
      {href: `/${locale}/news`, label: t('news')},
      {href: `/${locale}/gestion-reservation`, label: t('manageReservation')},
      {href: `/${locale}/compte`, label: t('account')}
    ],
    [locale, t]
  );

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = open ? 'hidden' : original;

    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  useEffect(() => {
    const syncSession = () => {
      setIsAuthenticated(Boolean(readAccessToken()));
    };

    syncSession();
    const unsubscribe = subscribeToSessionChange(syncSession);

    return unsubscribe;
  }, []);

  function handleLogout() {
    clearSession();
    setAuthOpen(false);
    setOpen(false);
    router.push(`/${locale}`);
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-brand-950/92 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-[1560px] px-4 sm:px-6 xl:px-8">
          <div className="flex min-h-[78px] items-center justify-between gap-6">
            <div className="min-w-0 shrink-0">
              <Link href={`/${locale}`} className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold text-brand-950">
                  <CarFront className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold uppercase leading-none text-white sm:text-base">
                    Hire Automotive Group
                  </p>
                  <p className="mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.22em] text-gold sm:text-[11px]">
                    Premium Mobility
                  </p>
                </div>
              </Link>
            </div>

            <div className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
              <nav className="flex min-w-0 items-center justify-center gap-6 xl:gap-8">
                {links.map((link) => {
                  const active = pathname === link.href;

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`whitespace-nowrap text-sm transition ${
                        active ? 'text-white' : 'text-white/70 hover:text-white'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="hidden shrink-0 items-center gap-3 lg:flex">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-gold hover:text-gold"
                >
                  {t('logout')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthOpen(true)}
                  className="rounded-full border border-gold/40 px-4 py-2 text-sm font-semibold text-gold transition hover:bg-gold hover:text-brand-950"
                >
                  {t('login')}
                </button>
              )}

              <LanguageSwitcher />
            </div>

            <button
              type="button"
              aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
              onClick={() => setOpen((value) => !value)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white lg:hidden"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open ? (
          <div className="mobile-nav-panel lg:hidden">
            <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
              <div className="mb-4 flex justify-start">
                <LanguageSwitcher />
              </div>

              <nav className="flex flex-col gap-2">
                {links.map((link) => {
                  const active = pathname === link.href;

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`rounded-2xl border px-4 py-3 text-sm transition ${
                        active
                          ? 'border-gold/40 bg-gold/10 text-white'
                          : 'border-white/5 bg-white/5 text-white/80 hover:bg-white/10'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}

                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-2 rounded-2xl border border-white/10 px-4 py-3 text-center text-sm font-semibold text-white"
                  >
                    {t('logout')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      setAuthOpen(true);
                    }}
                    className="mt-2 rounded-2xl bg-gold px-4 py-3 text-center text-sm font-semibold text-brand-950"
                  >
                    {t('login')}
                  </button>
                )}
              </nav>
            </div>
          </div>
        ) : null}
      </header>

      <AuthModal locale={locale} open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}