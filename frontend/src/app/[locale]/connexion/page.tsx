import AuthPanel from '@/components/auth/AuthPanel';

export default async function ConnexionPage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-[28px] border border-white/10 bg-[#111318] shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
        <div className="border-b border-white/10 px-5 py-5 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-[0.35em] text-gold">
            Hire Automotive
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white">
            Connexion / Inscription
          </h1>
          <p className="mt-2 text-sm text-white/65">
            Accédez à votre espace client ou créez votre compte.
          </p>
        </div>

        <div className="px-5 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <AuthPanel locale={locale} />
        </div>
      </div>
    </section>
  );
}