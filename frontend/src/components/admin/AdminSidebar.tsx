'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {
  Building2,
  CarFront,
  CircleHelp,
  ClipboardList,
  Gauge,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MessageSquare,
  Newspaper,
  Package,
  Percent,
  ShieldCheck,
  ShoppingCart,
  Tags,
  Users,
  Wallet,
  Wrench
} from 'lucide-react';
import {clearAdminAccessToken} from '@/lib/api';

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{className?: string}>;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const sections: NavSection[] = [
  {
    title: 'Pilotage',
    items: [
      {label: 'Tableau de bord', href: '/admin/dashboard', icon: LayoutDashboard},
      {label: 'Dashboard B2B', href: '/admin/b2b/dashboard', icon: Gauge}
    ]
  },
  {
    title: 'Exploitation B2C',
    items: [
      {label: 'Réservations B2C', href: '/admin/reservations', icon: ClipboardList},
      {label: 'Flotte', href: '/admin/fleet', icon: CarFront},
      {label: 'Clients', href: '/admin/clients', icon: Users},
      {label: 'Agences', href: '/admin/agencies', icon: Building2},
      {label: 'Paniers abandonnés', href: '/admin/carts', icon: ShoppingCart},
      {label: 'News', href: '/admin/news', icon: Newspaper}
    ]
  },
  {
    title: 'Exploitation B2B',
    items: [
      {label: 'Réservations B2B', href: '/admin/b2b/reservations', icon: ClipboardList},
      {label: 'Entreprises', href: '/admin/b2b/companies', icon: Building2},
      {label: 'Collaborateurs', href: '/admin/b2b/collaborators', icon: Users},
      {label: 'Profils bénéficiaires', href: '/admin/b2b/beneficiaries', icon: BadgeIcon},
      {label: 'Centres de coût', href: '/admin/b2b/cost-centers', icon: Wallet}
    ]
  },
  {
    title: 'Paramétrage',
    items: [
      {label: 'Coupons', href: '/admin/coupons', icon: Percent},
      {label: 'Options', href: '/admin/options', icon: Package},
      {label: 'Assurances', href: '/admin/insurances', icon: ShieldCheck},
      {label: 'Tarification', href: '/admin/pricing', icon: Tags},
    ]
  },
  {
    title: 'Contenu & support',
    items: [
      {label: 'Avis clients', href: '/admin/reviews', icon: MessageSquare},
      {label: 'FAQ', href: '/admin/faq', icon: CircleHelp},
    ]
  }
];

function BadgeIcon({className}: {className?: string}) {
  return <Users className={className} />;
}

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-[310px] shrink-0 flex-col border-r border-slate-800 bg-[#081a33] text-white xl:flex">
      <div className="flex shrink-0 items-center gap-3 border-b border-white/10 px-6 py-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500 text-white">
          <CarFront className="h-5 w-5" />
        </div>

        <div>
            <p className="text-[22px] font-extrabold leading-none tracking-tight">
            Hire Group
            </p>
            <p className="mt-1 text-sm text-white/70">Admin</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section.title} className="mb-6">
            <p className="px-3 pb-2 text-xs font-bold uppercase tracking-[0.18em] text-white/35">
              {section.title}
            </p>

            <nav className="space-y-1">
              {section.items.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);

                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-medium transition ${
                      active
                        ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/30'
                        : 'text-white/75 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-white/10 p-4">
        <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-white">Admin hire.ma</p>
            <p className="text-xs text-white/55">admin@hire.ma</p>
          </div>

          <button
            type="button"
            onClick={() => {
              clearAdminAccessToken();
              window.location.href = '/admin/login';
            }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/70 transition hover:text-white"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}