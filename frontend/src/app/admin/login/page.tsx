'use client';

import {useState} from 'react';
import {CarFront, Lock, Mail} from 'lucide-react';
import Link from 'next/link';
import {adminLogin, setAdminAccessToken} from '@/lib/api';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError(null);

      const response = await adminLogin({
        mail: email,
        password
      });

      setAdminAccessToken(response.access_token);
      window.location.href = '/admin/dashboard';
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Connexion admin impossible.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <div className="hidden w-[42%] flex-col justify-between bg-[#081a33] p-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500 text-white shadow-lg">
            <CarFront className="h-6 w-6" />
          </div>

          <div>
            <p className="text-2xl font-extrabold leading-none">hire.ma Admin</p>
            <p className="mt-1 text-sm text-white/70">Plateforme d’administration</p>
          </div>
        </div>

        <div className="max-w-md">
          <h1 className="text-4xl font-bold leading-tight">
            Gérez toute l’activité hire.ma depuis une seule interface.
          </h1>
          <p className="mt-4 text-base leading-7 text-white/75">
            Réservations, flotte, clients, agences, paramétrage commercial et B2B.
          </p>
        </div>

        <div className="text-sm text-white/60">
          <Link href="/" className="transition hover:text-white">
            Retourner vers le site
          </Link>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/70">
          <div className="mb-8 lg:hidden">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500 text-white shadow-lg">
                <CarFront className="h-6 w-6" />
              </div>

              <div>
                <p className="text-2xl font-extrabold leading-none text-slate-900">
                  hire.ma Admin
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Plateforme d’administration
                </p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900">Connexion admin</h2>
            <p className="mt-2 text-sm text-slate-500">
              Connectez-vous pour accéder à la plateforme.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email
              </label>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-cyan-500 focus-within:bg-white">
                <Mail className="h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@hire.ma"
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Mot de passe
              </label>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-cyan-500 focus-within:bg-white">
                <Lock className="h-5 w-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}