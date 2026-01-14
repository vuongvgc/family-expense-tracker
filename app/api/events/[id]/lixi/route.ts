import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { familyGroupId: true },
    });

    // Verify event belongs to user's family
    const event = await prisma.event.findFirst({
      where: {
        id,
        familyGroupId: user?.familyGroupId,
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Fetch transactions with "Lì xì" category or description containing "lì xì"
    const transactions = await prisma.transaction.findMany({
      where: {
        eventId: id,
        type: 'EXPENSE',
        OR: [
          {
            category: {
              name: {
                contains: 'Lì xì',
                mode: 'insensitive',
              },
            },
          },
          {
            description: {
              contains: 'lì xì',
              mode: 'insensitive',
            },
          },
        ],
      },
      include: {
        category: true,
        createdBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Error fetching lixi transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lixi transactions' },
      { status: 500 }
    );
  }
}
