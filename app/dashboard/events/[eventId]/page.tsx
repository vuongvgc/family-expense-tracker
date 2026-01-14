import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getEvent, getTetStatistics } from '@/actions/event';
import TetDashboardClient from '@/components/events/tet-dashboard-client';

export default async function TetEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const session = await auth();
  const { eventId } = await params;

  if (!session?.user) {
    redirect('/login');
  }

  try {
    const event = await getEvent(eventId);
    const stats = await getTetStatistics(eventId);

    return (
      <TetDashboardClient
        eventId={eventId}
        initialEvent={{
          id: event.id,
          name: event.name,
          type: event.type,
          budget: Number(event.budget),
          eventEstimations: event.eventEstimations.map((est) => ({
            id: est.id,
            itemName: est.itemName,
            estimatedAmount: Number(est.estimatedAmount),
          })),
        }}
        initialStats={{
          ...stats,
          budget: Number(event.budget),
        }}
      />
    );
  } catch (error) {
    redirect('/dashboard/events');
  }
}
