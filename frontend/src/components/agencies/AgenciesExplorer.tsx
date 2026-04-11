'use client';

import {
  ArrowUpRight,
  Building2,
  Check,
  Clock3,
  Mail,
  MapPin,
  Phone,
  Plane,
  Star
} from 'lucide-react';
import Link from 'next/link';
import {useMemo, useState} from 'react';
import type {Agency} from '@/lib/types';

type Props = {
  locale: string;
  agencies: Agency[];
  agencyNames: Record<string, string>;
  categoryLabels: Record<string, string>;
  labels: {
    kicker: string;
    title: string;
    subtitle: string;
    cityTab: string;
    airportTab: string;
    emptyCategory: string;
    openNews: string;
    missingAddress: string;
    missingPhone: string;
    missingEmail: string;
    availableNow: string;
    open24h: string;
    premiumService: string;
    fastTrack: string;
    businessLounge: string;
    parkingIncluded: string;
    popular: string;
  };
};

function normalizeCategory(value?: string | null) {
  return value === 'Aéroport' ? 'Aéroport' : 'Ville';
}

function getAgencyImage(agency: Agency) {
  if (agency.url_image_agence && agency.url_image_agence.trim()) {
    return agency.url_image_agence;
  }

  return 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80';
}

function getAgencyDisplayName(
  agency: Agency,
  agencyNames: Record<string, string>
) {
  return (
    agencyNames[agency.id_agence] ||
    agency.nom ||
    agency.ville ||
    agency.id_agence
  );
}

export default function AgenciesExplorer({
  locale,
  agencies,
  agencyNames,
  categoryLabels,
  labels
}: Props) {
  const [activeCategory, setActiveCategory] = useState<'Ville' | 'Aéroport'>('Ville');

  const filteredAgencies = useMemo(() => {
    return agencies
      .filter((agency) => normalizeCategory(agency.categorie) === activeCategory)
      .sort((a, b) => {
        const cityA = (a.ville || '').localeCompare(b.ville || '', locale);
        if (cityA !== 0) return cityA;

        const nameA = getAgencyDisplayName(a, agencyNames);
        const nameB = getAgencyDisplayName(b, agencyNames);

        return nameA.localeCompare(nameB, locale);
      });
  }, [activeCategory, agencies, agencyNames, locale]);

  const cityCount = agencies.filter(
    (agency) => normalizeCategory(agency.categorie) === 'Ville'
  ).length;

  const airportCount = agencies.filter(
    (agency) => normalizeCategory(agency.categorie) === 'Aéroport'
  ).length;

  return (
    <section className="space-y-8">
      <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.28)] sm:p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-gold">{labels.kicker}</p>
        <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">{labels.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/65 sm:text-base">
          {labels.subtitle}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setActiveCategory('Ville')}
            className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-5 text-sm font-semibold transition ${
              activeCategory === 'Ville'
                ? 'border-gold/60 bg-gold text-brand-950'
                : 'border-white/10 bg-white/5 text-white hover:border-gold/35'
            }`}
          >
            <Building2 className="h-4 w-4" />
            {labels.cityTab} ({cityCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('Aéroport')}
            className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-5 text-sm font-semibold transition ${
              activeCategory === 'Aéroport'
                ? 'border-gold/60 bg-gold text-brand-950'
                : 'border-white/10 bg-white/5 text-white hover:border-gold/35'
            }`}
          >
            <Plane className="h-4 w-4" />
            {labels.airportTab} ({airportCount})
          </button>
        </div>
      </div>

      {filteredAgencies.length ? (
        <div className="grid gap-6 xl:grid-cols-2">
          {filteredAgencies.map((agency) => {
            const agencyName = getAgencyDisplayName(agency, agencyNames);
            const imageUrl = getAgencyImage(agency);

            return (
              <Link
                key={agency.id_agence}
                href={`/${locale}/news?id_agence=${agency.id_agence}`}
                className="group block overflow-hidden rounded-[28px] border border-white/10 bg-[#11151c] shadow-[0_30px_80px_rgba(0,0,0,0.28)] transition hover:-translate-y-1 hover:border-gold/35"
              >
                <div className="relative h-40 overflow-hidden sm:h-48">
                  <img
                    src={imageUrl}
                    alt={agencyName}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#11151c] via-[#11151c]/45 to-transparent" />

                  <div className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-gold px-4 py-2 text-sm font-semibold text-brand-950">
                    <Star className="h-4 w-4 fill-current" />
                    {labels.popular}
                  </div>

                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-semibold text-white sm:text-[30px]">
                        {agencyName}
                      </h2>

                      {agency.ville ? (
                        <span className="rounded-full bg-gold px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-brand-950">
                          {agency.ville}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-5 sm:p-6">
                  <div className="space-y-3 text-sm text-[#c8d0da]">
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                      <span>{agency.adresse || labels.missingAddress}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Clock3 className="h-4 w-4 shrink-0 text-gold" />
                      <span>{labels.open24h}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 shrink-0 text-gold" />
                      <span>{agency.num_tel || labels.missingPhone}</span>
                    </div>

                    {agency.num_tel_deux ? (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 shrink-0 text-gold" />
                        <span>{agency.num_tel_deux}</span>
                      </div>
                    ) : null}

                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 shrink-0 text-gold" />
                      <span>{agency.mail || labels.missingEmail}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-[#c8d0da]">
                      <Check className="h-4 w-4 text-gold" />
                      {labels.availableNow}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-[#c8d0da]">
                      <Check className="h-4 w-4 text-gold" />
                      {labels.fastTrack}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-[#c8d0da]">
                      <Check className="h-4 w-4 text-gold" />
                      {labels.businessLounge}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-[#c8d0da]">
                      <Check className="h-4 w-4 text-gold" />
                      {labels.parkingIncluded}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-gold">
                        {categoryLabels[normalizeCategory(agency.categorie)] ||
                          normalizeCategory(agency.categorie)}
                      </p>
                      <p className="mt-2 text-sm text-white/55">{labels.premiumService}</p>
                    </div>

                    <span className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gold px-5 text-sm font-semibold text-brand-950 transition group-hover:scale-[1.02]">
                      {labels.openNews}
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-6 text-sm text-white/65">
          {labels.emptyCategory}
        </div>
      )}
    </section>
  );
}