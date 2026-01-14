import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import EventsClient from '@/components/events/events-client';

export default async function EventsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return <EventsClient />;
}
