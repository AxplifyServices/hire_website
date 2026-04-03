'use client';

import {useEffect} from 'react';
import {X} from 'lucide-react';
import AuthPanel from '@/components/auth/AuthPanel';

type AuthModalProps = {
  locale: string;
  open: boolean;
  onClose: () => void;
};

export default function AuthModal({locale, open, onClose}: AuthModalProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        aria-label="Close auth modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div className="absolute inset-0 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto w-full max-w-3xl">
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#111318] shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/10 bg-[#111318]/95 px-5 py-4 backdrop-blur sm:px-6 lg:px-8">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-gold">Hire Automotive</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Connexion / Inscription
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-gold/40 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(100vh-120px)] overflow-y-auto px-5 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
              <AuthPanel locale={locale} onSuccess={onClose} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}