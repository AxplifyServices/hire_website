import {getTranslations} from 'next-intl/server';
import {
  BadgeDollarSign,
  Bolt,
  CarFront,
  ClipboardList,
  Headset,
  MapPin,
  Route,
  ShieldCheck
} from 'lucide-react';

const items = [
  {
    key: 'hiddenFees',
    icon: BadgeDollarSign
  },
  {
    key: 'airport',
    icon: Bolt
  },
  {
    key: 'premiumFleet',
    icon: ShieldCheck
  },
  {
    key: 'guaranteedModel',
    icon: CarFront
  },
  {
    key: 'support',
    icon: Headset
  },
  {
    key: 'cities',
    icon: MapPin
  },
  {
    key: 'oneWay',
    icon: Route
  },
  {
    key: 'invoice',
    icon: ClipboardList
  }
] as const;

export default async function WhyChooseSection() {
  const t = await getTranslations('WhyChoose');

  return (
    <section
      aria-labelledby="why-choose-title"
      className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
    >
      <div className="mx-auto max-w-5xl text-center">
        <div className="inline-flex rounded-full border border-gold/40 bg-transparent px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
          {t('badge')}
        </div>

        <h2
          id="why-choose-title"
          className="mx-auto mt-5 max-w-3xl text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl"
        >
          {t('titleBefore')}{' '}
          <span className="text-gold">{t('titleHighlight')}</span>
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
          {t('description')}
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.key}
              className="rounded-[24px] border border-white/10 bg-white/[0.02] p-6 transition hover:border-gold/30 hover:bg-white/[0.03]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/25 bg-white/[0.03] text-gold">
                <Icon className="h-5 w-5" />
              </div>

              <h3 className="mt-5 text-xl font-bold text-white">
                {t(`items.${item.key}.title`)}
              </h3>

              <p className="mt-3 text-base leading-7 text-white/68">
                {t(`items.${item.key}.description`)}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}