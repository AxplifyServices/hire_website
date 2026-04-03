'use client';

import {useEffect, useState} from 'react';
import {X} from 'lucide-react';
import {useTranslations} from 'next-intl';

export default function MemberRibbon() {
  const t = useTranslations('MemberRibbon');
  const [isBottom, setIsBottom] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const updateRibbonState = () => {
      const bottom = window.scrollY > 80;
      setIsBottom(bottom);

      if (bottom) {
        document.body.classList.remove('has-top-ribbon');
      } else {
        document.body.classList.add('has-top-ribbon');
      }
    };

    updateRibbonState();
    window.addEventListener('scroll', updateRibbonState, {passive: true});

    return () => {
      window.removeEventListener('scroll', updateRibbonState);
      document.body.classList.remove('has-top-ribbon');
    };
  }, []);

  const handleClose = () => {
    document.body.classList.remove('has-top-ribbon');
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div
      className={`relative member-ribbon ${
        isBottom ? 'member-ribbon--bottom' : 'member-ribbon--top'
      }`}
    >
      <div className="flex items-center justify-center gap-2">
        <span className="font-semibold">🏷️ {t('save')}</span>
        <span className="hidden sm:inline">—</span>
        <span className="hidden sm:inline">{t('join')}</span>
      </div>

      <button
        type="button"
        onClick={handleClose}
        aria-label={t('close')}
        title={t('close')}
        className="
          absolute right-2 top-1/2 -translate-y-1/2
          flex items-center justify-center
          h-6 w-6
          rounded-full
          text-brand-950/70
          hover:text-brand-950
          hover:bg-black/10
          transition
        "
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}