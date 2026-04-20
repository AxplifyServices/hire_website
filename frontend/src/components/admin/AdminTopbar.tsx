'use client';

import Link from 'next/link';
import {ChevronRight} from 'lucide-react';
import {usePathname} from 'next/navigation';

const pageTitles: Record<string, string> = {
  '/admin/dashboard': 'Tableau de bord',
  '/admin/reservations': 'Réservations B2C',
  '/admin/fleet': 'Flotte',
  '/admin/clients': 'Clients',
  '/admin/agencies': 'Agences',
  '/admin/carts': 'Paniers abandonnés',
  '/admin/news': 'News',
  '/admin/coupons': 'Coupons',
  '/admin/options': 'Options',
  '/admin/insurances': 'Assurances',
  '/admin/age-policies': "Politiques d'âge",
  '/admin/pricing': 'Tarification',
  '/admin/dynamic-pricing': 'Prix dynamiques',
  '/admin/reviews': 'Avis clients',
  '/admin/faq': 'FAQ',
  '/admin/crm': 'Emails / CRM',
  '/admin/b2b/dashboard': 'Dashboard B2B',
  '/admin/b2b/b2b-reservations': 'Réservations B2B',
  '/admin/b2b/companies': 'Entreprises',
  '/admin/b2b/collaborators': 'Collaborateurs',
  '/admin/b2b/beneficiary-profiles': 'Profils bénéficiaires',
  '/admin/b2b/cost-centers': 'Centres de coût',
};

export default function AdminTopbar() {
  const pathname = usePathname();
  const title = pageTitles[pathname] || 'Administration';

  return (
    <header className="border-b border-slate-200 bg-white px-6 py-5 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>

        <Link
        href="/fr"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-600 transition hover:text-cyan-700"
        >
        Voir le site
        <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
}