import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { TransactionType } from '@prisma/client';

// GET /api/categories - Fetch categories for the user's family
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.familyGroupId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as TransactionType | null;

    const where: any = {
      familyGroupId: session.user.familyGroupId,
    };

    if (type) {
      where.type = type;
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        icon: true,
        type: true,
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
