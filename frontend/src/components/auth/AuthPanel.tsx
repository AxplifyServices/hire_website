'use client';

import {useMemo, useState} from 'react';
import {useRouter} from 'next/navigation';
import {useTranslations} from 'next-intl';
import {fetchBrowserApi} from '@/lib/api';
import {saveSession} from '@/lib/session';
import type {LoginResponse} from '@/lib/types';
import {COUNTRIES, DEFAULT_COUNTRY, getCountryByCode} from '@/components/auth/countries';

type AuthPanelProps = {
  locale: string;
  onSuccess?: () => void;
  onClose?: () => void;
};

const initialRegisterState = {
  mail: '',
  password: '',
  nom: '',
  prenom: '',
  date_naissance: '',
  pays: DEFAULT_COUNTRY.code,
  prefixe_tel: DEFAULT_COUNTRY.dialCode,
  num_tel: '',
  type_client: 'Particulier',
  language_favori: 'FR'
};

export default function AuthPanel({locale, onSuccess}: AuthPanelProps) {
  const t = useTranslations('AuthPage');
  const tc = useTranslations('Countries');
  const router = useRouter();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [login, setLogin] = useState({mail: '', password: ''});
  const [register, setRegister] = useState({
    ...initialRegisterState,
    language_favori: locale.toUpperCase()
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedCountry = useMemo(() => {
    return getCountryByCode(register.pays);
  }, [register.pays]);

  const loginValid = useMemo(() => {
    return login.mail.trim() !== '' && login.password.trim().length >= 6;
  }, [login]);

  const registerValid = useMemo(() => {
    return (
      register.mail.trim() !== '' &&
      register.password.trim().length >= 6 &&
      register.nom.trim() !== '' &&
      register.prenom.trim() !== '' &&
      register.date_naissance.trim() !== '' &&
      register.pays.trim() !== '' &&
      register.prefixe_tel.trim() !== '' &&
      register.num_tel.trim() !== '' &&
      register.language_favori.trim() !== ''
    );
  }, [register]);

  async function handleLogin() {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetchBrowserApi<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(login)
      });

      saveSession(response.access_token, response.client);
      setSuccess(response.message);
      onSuccess?.();
      router.push(`/${locale}/compte`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('genericError'));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...register,
        pays: register.pays,
        type_client: 'Particulier',
        language_favori: locale.toUpperCase()
      };

      const response = await fetchBrowserApi<LoginResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      saveSession(response.access_token, response.client);
      setSuccess(response.message);
      onSuccess?.();
      router.push(`/${locale}/compte`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('genericError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <div className="mb-6 flex rounded-full border border-white/10 bg-white/5 p-1">
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setError('');
            setSuccess('');
          }}
          className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold transition ${
            mode === 'login' ? 'bg-gold text-brand-950' : 'text-white/70'
          }`}
        >
          {t('loginTab')}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('register');
            setError('');
            setSuccess('');
          }}
          className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold transition ${
            mode === 'register' ? 'bg-gold text-brand-950' : 'text-white/70'
          }`}
        >
          {t('registerTab')}
        </button>
      </div>

      {mode === 'login' ? (
        <div className="space-y-4">
          <label className="block text-sm text-white/75">
            <span className="mb-2 block">{t('email')}</span>
            <input
              value={login.mail}
              onChange={(event) => setLogin({...login, mail: event.target.value})}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-gold"
            />
          </label>

          <label className="block text-sm text-white/75">
            <span className="mb-2 block">{t('password')}</span>
            <input
              type="password"
              value={login.password}
              onChange={(event) => setLogin({...login, password: event.target.value})}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-gold"
            />
          </label>

          <button
            disabled={!loginValid || loading}
            onClick={handleLogin}
            className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              loginValid && !loading
                ? 'bg-gold text-brand-950'
                : 'cursor-not-allowed bg-white/10 text-white/40'
            }`}
          >
            {loading ? t('loading') : t('loginCta')}
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm text-white/75">
            <span className="mb-2 block">{t('lastName')}</span>
            <input
              value={register.nom}
              onChange={(event) => setRegister({...register, nom: event.target.value})}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-gold"
            />
          </label>

          <label className="block text-sm text-white/75">
            <span className="mb-2 block">{t('firstName')}</span>
            <input
              value={register.prenom}
              onChange={(event) => setRegister({...register, prenom: event.target.value})}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-gold"
            />
          </label>

          <label className="block text-sm text-white/75 md:col-span-2">
            <span className="mb-2 block">{t('email')}</span>
            <input
              value={register.mail}
              onChange={(event) => setRegister({...register, mail: event.target.value})}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-gold"
            />
          </label>

          <label className="block text-sm text-white/75 md:col-span-2">
            <span className="mb-2 block">{t('password')}</span>
            <input
              type="password"
              value={register.password}
              onChange={(event) => setRegister({...register, password: event.target.value})}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-gold"
            />
          </label>

          <label className="block text-sm text-white/75 md:col-span-2">
            <span className="mb-2 block">{t('birthDate')}</span>
            <input
              type="date"
              value={register.date_naissance}
              onChange={(event) =>
                setRegister({...register, date_naissance: event.target.value})
              }
              onClick={(event) => {
                const input = event.currentTarget as HTMLInputElement & {
                  showPicker?: () => void;
                };
                input.showPicker?.();
              }}
              onFocus={(event) => {
                const input = event.currentTarget as HTMLInputElement & {
                  showPicker?: () => void;
                };
                input.showPicker?.();
              }}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-gold"
            />
          </label>

          <label className="block text-sm text-white/75">
            <span className="mb-2 block">{t('country')}</span>
            <select
              value={register.pays}
              onChange={(event) => {
                const country = getCountryByCode(event.target.value);
                setRegister({
                  ...register,
                  pays: country.code,
                  prefixe_tel: country.dialCode
                });
              }}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-gold"
            >
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code} className="bg-brand-950">
                  {tc(country.code)}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm text-white/75">
            <span className="mb-2 block">{t('phonePrefix')}</span>
            <input
              value={register.prefixe_tel}
              onChange={(event) =>
                setRegister({...register, prefixe_tel: event.target.value})
              }
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-gold"
            />
          </label>

          <label className="block text-sm text-white/75 md:col-span-2">
            <span className="mb-2 block">{t('phone')}</span>
            <input
              value={register.num_tel}
              onChange={(event) => setRegister({...register, num_tel: event.target.value})}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-gold"
            />
          </label>

          <p className="md:col-span-2 text-xs text-white/45">
            {t('countryHelp', {dialCode: selectedCountry.dialCode})}
          </p>

          <button
            disabled={!registerValid || loading}
            onClick={handleRegister}
            className={`md:col-span-2 w-full rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              registerValid && !loading
                ? 'bg-gold text-brand-950'
                : 'cursor-not-allowed bg-white/10 text-white/40'
            }`}
          >
            {loading ? t('loading') : t('registerCta')}
          </button>
        </div>
      )}

      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      {success ? <p className="mt-4 text-sm text-emerald-300">{success}</p> : null}
    </div>
  );
}