import AdminAgenciesManager from '@/components/admin/AdminAgenciesManager';
import {fetchAgencies} from '@/lib/api';

export default async function AdminAgenciesPage() {
  const agencies = await fetchAgencies();

  return <AdminAgenciesManager initialAgencies={agencies} />;
}