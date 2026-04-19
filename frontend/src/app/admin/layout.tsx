import type {Metadata} from 'next';
import AdminShell from '@/components/admin/AdminShell';

export const metadata: Metadata = {
  title: 'hire.ma Admin',
  description: 'Plateforme d’administration hire.ma'
};

export default function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}