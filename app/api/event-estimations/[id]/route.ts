import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const estimation = await prisma.eventEstimation.findUnique({
      where: { id },
      include: {
        event: {
          include: {
            familyGroup: true,
          },
        },
      },
    });

    if (!estimation) {
      return NextResponse.json({ error: 'Estimation not found' }, { status: 404 });
    }

    // Verify the user has access to this estimation
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { familyGroupId: true },
    });

    if (estimation.event.familyGroupId !== user?.familyGroupId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.eventEstimation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event estimation:', error);
    return NextResponse.json(
      { error: 'Failed to delete event estimation' },
      { status: 500 }
    );
  }
}
