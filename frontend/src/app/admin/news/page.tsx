import AdminNewsManager from '@/components/admin/AdminNewsManager';
import {fetchAgencies, fetchNews} from '@/lib/api';

export default async function AdminNewsPage({
  searchParams
}: {
  searchParams?: Promise<{page?: string; id_agence?: string}>;
}) {
  const query = (await searchParams) ?? {};

  const page = Math.max(Number(query.page || 1), 1);
  const id_agence = query.id_agence || undefined;

  const [newsResponse, agencies] = await Promise.all([
    fetchNews({page, id_agence}),
    fetchAgencies()
  ]);

  return (
    <AdminNewsManager
      initialNewsResponse={newsResponse}
      initialAgencies={agencies}
      initialPage={page}
      initialAgencyFilter={id_agence ?? ''}
    />
  );
}