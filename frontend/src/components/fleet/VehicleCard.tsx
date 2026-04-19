'use client';

import Link from 'next/link';
import {CheckCircle2, Users, Snowflake, Cog} from 'lucide-react';
import {useTranslations} from 'next-intl';
import type {Vehicle} from '@/lib/types';
import { resolveMediaUrl } from '@/lib/api';

const fallbackImage =
  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80';

function normalizeSeatCount(value: number | null) {
  if (value == null || value < 1 || value > 9) return null;
  return value;
}

type Props = {
  vehicle: Vehicle;
  locale: string;
  agency?: string;
  pickupDate?: string;
  returnDate?: string;
  isSelected?: boolean;
};

export default function VehicleCard({
  vehicle,
  locale,
  agency,
  pickupDate,
  returnDate,
  isSelected = false
}: Props) {
  const t = useTranslations('FleetPage');

  const title =
    [vehicle.marque, vehicle.model].filter(Boolean).join(' ') ||
    vehicle.nom ||
    vehicle.id_vehicule;

  const seatCount = normalizeSeatCount(vehicle.nb_place);

  const params = new URLSearchParams();
  if (agency) params.set('agency', agency);
  if (pickupDate) params.set('pickupDate', pickupDate);
  if (returnDate) params.set('returnDate', returnDate);
  params.set('vehicleId', vehicle.id_vehicule);
  params.set(
    'vehicleName',
    [vehicle.marque, vehicle.model].filter(Boolean).join(' ') ||
      vehicle.nom ||
      vehicle.id_vehicule
  );

  const href = `/${locale}/reservation?${params.toString()}`;
  const imageUrl =
    resolveMediaUrl(vehicle.url_image_vehicule) || fallbackImage;

  return (
    <Link
      href={href}
      className={`group block overflow-hidden rounded-[24px] border bg-gradient-to-b from-white/5 to-black/30 shadow-[0_10px_40px_rgba(0,0,0,0.4)] transition hover:-translate-y-1 ${
        isSelected ? 'border-gold ring-1 ring-gold/50' : 'border-white/10'
      }`}
    >
      <div className="relative">
        <img
          src={imageUrl}
          alt={title}
          className="h-52 w-full object-cover"
        />

        <div className="absolute right-3 top-3 max-w-[calc(100%-24px)] rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          <span className="block truncate">
            {vehicle.categorie || t('categoryFallback')}
          </span>
        </div>

        {isSelected ? (
          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-gold px-3 py-1 text-xs font-semibold text-brand-950">
            <CheckCircle2 className="h-4 w-4" />
            {t('selected')}
          </div>
        ) : null}
      </div>

      <div className="space-y-4 p-5">
        <h3 className="line-clamp-2 min-h-[56px] text-lg font-semibold leading-7 text-white">
          {title}
        </h3>

        <div className="grid grid-cols-3 gap-3">
          <div className="flex min-w-0 flex-col items-center justify-center rounded-xl bg-white/5 px-2 py-3 text-xs text-white/80">
            <Users className="mb-1 h-4 w-4 shrink-0 text-gold" />
            <span className="block text-center leading-5">
              {seatCount ? `${seatCount} ${t('seats')}` : '—'}
            </span>
          </div>

          <div className="flex min-w-0 flex-col items-center justify-center rounded-xl bg-white/5 px-2 py-3 text-xs text-white/80">
            <Cog className="mb-1 h-4 w-4 shrink-0 text-gold" />
            <span className="block w-full truncate text-center leading-5">
              {vehicle.transmission || '—'}
            </span>
          </div>

          <div className="flex min-w-0 flex-col items-center justify-center rounded-xl bg-white/5 px-2 py-3 text-xs text-white/80">
            <Snowflake className="mb-1 h-4 w-4 shrink-0 text-gold" />
            <span className="block w-full truncate text-center leading-5">
              {vehicle.climatisation ? 'Climatisation' : '—'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-white/70">
          <span className="flex items-center gap-1 text-green-400">
            ✓ RC incluse
          </span>
          <span className="flex items-center gap-1 text-green-400">
            ✓ Kilométrage libre
          </span>
        </div>

        <div className="flex items-end justify-between gap-3 border-t border-white/10 pt-4">
          <div className="min-w-0">
            <p className="text-2xl font-bold text-gold">
              {vehicle.prix_jour ?? '—'} MAD
            </p>
            <p className="text-xs text-white/50">{t('perDay')}</p>
          </div>

          <span className="shrink-0 rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-brand-950 transition hover:bg-gold-dark">
            {t('bookNow')}
          </span>
        </div>
      </div>
    </Link>
  );
}