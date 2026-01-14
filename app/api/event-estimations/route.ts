import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { familyGroupId: true },
    });

    if (!user?.familyGroupId) {
      return NextResponse.json({ error: 'No family group found' }, { status: 404 });
    }

    const body = await request.json();
    const { eventId, itemName, estimatedAmount } = body;

    if (!eventId || !itemName || !estimatedAmount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify event belongs to user's family group
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        familyGroupId: user.familyGroupId,
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const estimation = await prisma.eventEstimation.create({
      data: {
        itemName,
        estimatedAmount: Number(estimatedAmount),
        eventId,
      },
    });

    return NextResponse.json({ estimation }, { status: 201 });
  } catch (error) {
    console.error('Error creating event estimation:', error);
    return NextResponse.json(
      { error: 'Failed to create event estimation' },
      { status: 500 }
    );
  }
}
