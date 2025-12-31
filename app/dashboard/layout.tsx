import { auth } from '@/auth';
import AddTransactionModal from '@/components/add-transaction-modal';
import DashboardHeader from '@/components/dashboard-header';
import { Toaster } from '@/components/ui/toaster';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Get family group name
  const familyGroup = await prisma.familyGroup.findUnique({
    where: { id: session.user.familyGroupId },
    select: { name: true },
  });

  return (
    <div className='min-h-screen bg-gray-50'>
      <DashboardHeader
        userName={session.user.name || 'User'}
        familyGroupId={session.user.familyGroupId}
        familyGroupName={familyGroup?.name || 'Family Exp'}
        role={session.user.role}
      />
      <main>{children}</main>
      <AddTransactionModal />
      <Toaster />
    </div>
  );
}
