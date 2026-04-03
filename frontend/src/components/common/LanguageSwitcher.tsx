'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {routing} from '@/i18n/routing';

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const currentLocale = pathname.split('/')[1] || routing.defaultLocale;

  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
      {routing.locales.map((locale) => {
        const newPath = pathname.replace(`/${currentLocale}`, `/${locale}`) || `/${locale}`;

        return (
          <Link
            key={locale}
            href={newPath}
            className={`rounded-full px-3 py-1 transition ${
              currentLocale === locale ? 'bg-gold text-brand-950' : 'hover:bg-white/10'
            }`}
          >
            {locale}
          </Link>
        );
      })}
    </div>
  );
}
