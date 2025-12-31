import { ReactNode, Suspense } from 'react';
import DashboardHeader from '@/components/dashboard-header';
import GlobalFilterBar from '@/components/global-filter-bar';
import AddTransactionModal from '@/components/add-transaction-modal';
import { Toaster } from '@/components/ui/toaster';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { usePathname } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <DashboardHeader
        userName={session.user.name || 'User'}
        familyGroupId={session.user.familyGroupId}
        role={session.user.role}
      />
      <main>{children}</main>
      <AddTransactionModal />
      <Toaster />
    </div>
  );
}
