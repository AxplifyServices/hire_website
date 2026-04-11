'use client';

import {useRouter} from 'next/navigation';

type AgencyOption = {
  id_agence: string;
  label: string;
};

type Props = {
  locale: string;
  selectedAgencyId?: string;
  allLabel: string;
  filterLabel: string;
  agencies: AgencyOption[];
};

export default function NewsAgencyFilter({
  locale,
  selectedAgencyId,
  allLabel,
  filterLabel,
  agencies
}: Props) {
  const router = useRouter();

  return (
    <div className="mt-6 max-w-md">
      <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/45">
        {filterLabel}
      </label>

      <div className="relative">
        <select
          value={selectedAgencyId || ''}
          onChange={(event) => {
            const value = event.target.value;
            router.push(value ? `/${locale}/news?id_agence=${value}` : `/${locale}/news`);
          }}
          className="h-14 w-full appearance-none rounded-[20px] border border-white/10 bg-[#131922] px-5 pr-12 text-sm font-medium text-white outline-none transition focus:border-gold/45"
        >
          <option value="">{allLabel}</option>
          {agencies.map((agency) => (
            <option key={agency.id_agence} value={agency.id_agence}>
              {agency.label}
            </option>
          ))}
        </select>

        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-white/45">
          <svg
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M5 7.5L10 12.5L15 7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}