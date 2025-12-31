import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <main>{children}</main>
    </div>
  );
}
