import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { TransactionType, EventType } from '@prisma/client';

// GET /api/categories - Fetch categories for the user's family
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.familyGroupId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as TransactionType | null;
    const eventTypeParam = searchParams.get('eventType');

    const where: any = {
      familyGroupId: session.user.familyGroupId,
    };

    if (type) {
      where.type = type;
    }

    // Handle eventType filtering
    if (eventTypeParam === 'null') {
      // Only show general categories (eventType = null)
      where.eventType = null;
    } else if (eventTypeParam) {
      // Show ONLY categories for specific event type (not including general categories)
      where.eventType = eventTypeParam as EventType;
    }
    // If no eventTypeParam, show all categories (default behavior)

    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        icon: true,
        type: true,
        eventType: true,
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
