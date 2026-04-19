const stats = [
  {
    title: 'Réservations totales',
    value: '1',
    subtitle: '1 actives'
  },
  {
    title: "Chiffre d'affaires total",
    value: '2100 MAD',
    subtitle: '0 MAD ce mois'
  },
  {
    title: 'Clients inscrits',
    value: '2',
    subtitle: 'Tous les utilisateurs'
  },
  {
    title: 'Véhicules',
    value: '20 / 20',
    subtitle: 'Disponibles / Total'
  },
  {
    title: 'Demandes B2B',
    value: '0',
    subtitle: 'En attente'
  },
  {
    title: 'Paniers abandonnés',
    value: '3',
    subtitle: 'Non convertis'
  },
  {
    title: 'Annulations',
    value: '0',
    subtitle: 'Total annulées'
  },
  {
    title: 'Taux de conversion',
    value: '25%',
    subtitle: 'Réservations / (Réservations + Paniers)'
  }
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.title}
            className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-base text-slate-500">{item.title}</p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
              {item.value}
            </p>
            <p className="mt-2 text-sm text-slate-400">{item.subtitle}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-950">
            Tendance du chiffre d'affaires
          </h2>

          <div className="mt-8 flex items-center gap-6">
            <span className="text-2xl text-slate-500">2026-03</span>
            <div className="h-8 flex-1 rounded-full bg-slate-100">
              <div className="flex h-8 w-[82%] items-center justify-end rounded-full bg-cyan-500 px-4 text-lg font-bold text-white">
                2100
              </div>
            </div>
            <span className="text-xl text-slate-400">1</span>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-950">Répartition par statut</h2>

          <div className="mt-8 rounded-2xl bg-slate-50 px-5 py-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="h-4 w-4 rounded-full bg-green-500" />
                <span className="text-2xl font-medium text-slate-900">Confirmée</span>
              </div>

              <span className="text-3xl font-bold text-slate-950">1</span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-950">Dernières réservations</h2>

        <div className="mt-8 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-sm uppercase tracking-wide text-slate-400">
                <th className="pb-2 pr-4">ID</th>
                <th className="pb-2 pr-4">Client</th>
                <th className="pb-2 pr-4">Email</th>
                <th className="pb-2 pr-4">Montant</th>
                <th className="pb-2 pr-4">Statut</th>
                <th className="pb-2 pr-4">Date</th>
              </tr>
            </thead>
            <tbody>
              <tr className="rounded-2xl bg-slate-50 text-sm text-slate-700">
                <td className="rounded-l-2xl px-4 py-4 font-semibold text-slate-950">#1</td>
                <td className="px-4 py-4">Zakariae ZITANE</td>
                <td className="px-4 py-4">zakariaezitane@gmail.com</td>
                <td className="px-4 py-4 font-semibold text-slate-950">2100 MAD</td>
                <td className="px-4 py-4">
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    Confirmée
                  </span>
                </td>
                <td className="rounded-r-2xl px-4 py-4">13/03/2026</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}