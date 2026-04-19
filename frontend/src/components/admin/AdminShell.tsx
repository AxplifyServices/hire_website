'use client';

import {useEffect, useState} from 'react';
import {usePathname, useRouter} from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopbar from '@/components/admin/AdminTopbar';
import {getAdminAccessToken} from '@/lib/api';

export default function AdminShell({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/admin/login';
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getAdminAccessToken();

    if (!isLoginPage && !token) {
      router.replace('/admin/login');
      return;
    }

    if (isLoginPage && token) {
      router.replace('/admin/dashboard');
      return;
    }

    setReady(true);
  }, [isLoginPage, router]);

  if (!ready) {
    return null;
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-100 text-slate-900">
      <div className="flex h-full">
        <AdminSidebar />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <AdminTopbar />

          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}