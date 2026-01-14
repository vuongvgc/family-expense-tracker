'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { EventType } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function getEvents() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      familyGroup: {
        include: {
          events: {
            include: {
              _count: {
                select: {
                  transactions: true,
                  eventEstimations: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  });

  if (!user?.familyGroup) {
    throw new Error('No family group found');
  }

  return user.familyGroup.events;
}

export async function getEvent(eventId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { familyGroupId: true },
  });

  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      familyGroupId: user?.familyGroupId,
    },
    include: {
      transactions: {
        include: {
          category: true,
          createdBy: true,
        },
        orderBy: { date: 'desc' },
      },
      eventEstimations: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!event) {
    throw new Error('Event not found');
  }

  return event;
}

export async function createEvent(data: {
  name: string;
  budget: number;
  type: EventType;
  startDate?: Date;
  endDate?: Date;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { familyGroupId: true },
  });

  if (!user?.familyGroupId) {
    throw new Error('No family group found');
  }

  const event = await prisma.event.create({
    data: {
      name: data.name,
      budget: data.budget,
      type: data.type,
      startDate: data.startDate,
      endDate: data.endDate,
      familyGroupId: user.familyGroupId,
    },
  });

  revalidatePath('/dashboard/events');
  return event;
}

export async function updateEvent(
  eventId: string,
  data: {
    name?: string;
    budget?: number;
    type?: EventType;
    startDate?: Date;
    endDate?: Date;
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { familyGroupId: true },
  });

  const event = await prisma.event.updateMany({
    where: {
      id: eventId,
      familyGroupId: user?.familyGroupId,
    },
    data,
  });

  revalidatePath('/dashboard/events');
  revalidatePath(`/dashboard/events/${eventId}`);
  return event;
}

export async function deleteEvent(eventId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { familyGroupId: true },
  });

  await prisma.event.deleteMany({
    where: {
      id: eventId,
      familyGroupId: user?.familyGroupId,
    },
  });

  revalidatePath('/dashboard/events');
}

// Event Estimation actions
export async function createEventEstimation(data: {
  eventId: string;
  itemName: string;
  estimatedAmount: number;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { familyGroupId: true },
  });

  // Verify event belongs to user's family group
  const event = await prisma.event.findFirst({
    where: {
      id: data.eventId,
      familyGroupId: user?.familyGroupId,
    },
  });

  if (!event) {
    throw new Error('Event not found');
  }

  const estimation = await prisma.eventEstimation.create({
    data: {
      itemName: data.itemName,
      estimatedAmount: data.estimatedAmount,
      eventId: data.eventId,
    },
  });

  revalidatePath(`/dashboard/events/${data.eventId}`);
  return estimation;
}

export async function updateEventEstimation(
  estimationId: string,
  data: {
    itemName?: string;
    estimatedAmount?: number;
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const estimation = await prisma.eventEstimation.update({
    where: { id: estimationId },
    data,
  });

  revalidatePath(`/dashboard/events/${estimation.eventId}`);
  return estimation;
}

export async function deleteEventEstimation(estimationId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const estimation = await prisma.eventEstimation.findUnique({
    where: { id: estimationId },
  });

  if (!estimation) {
    throw new Error('Estimation not found');
  }

  await prisma.eventEstimation.delete({
    where: { id: estimationId },
  });

  revalidatePath(`/dashboard/events/${estimation.eventId}`);
}

// Get Tết statistics
export async function getTetStatistics(eventId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { familyGroupId: true },
  });

  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      familyGroupId: user?.familyGroupId,
    },
    include: {
      transactions: {
        include: {
          category: true,
        },
      },
      eventEstimations: true,
    },
  });

  if (!event) {
    throw new Error('Event not found');
  }

  // Calculate totals
  const totalEstimated = event.eventEstimations.reduce(
    (sum, est) => sum + Number(est.estimatedAmount),
    0
  );

  const totalSpent = event.transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Category breakdown
  const categoryBreakdown = event.transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((acc, t) => {
      const categoryName = t.category?.name || 'Khác';
      acc[categoryName] = (acc[categoryName] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);

  // Special categories for Tết
  const lixiTotal = event.transactions
    .filter(
      (t) =>
        t.type === 'EXPENSE' &&
        (t.category?.name === 'Lì xì' ||
          t.description.toLowerCase().includes('lì xì'))
    )
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const shoppingTotal = event.transactions
    .filter(
      (t) =>
        t.type === 'EXPENSE' &&
        (t.category?.name === 'Sắm đồ Tết' ||
          t.description.toLowerCase().includes('sắm'))
    )
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const giftTotal = event.transactions
    .filter(
      (t) =>
        t.type === 'EXPENSE' &&
        (t.category?.name === 'Quà biếu' ||
          t.description.toLowerCase().includes('quà'))
    )
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const foodTotal = event.transactions
    .filter(
      (t) =>
        t.type === 'EXPENSE' &&
        (t.category?.name === 'Thực phẩm Tết' ||
          t.description.toLowerCase().includes('thực phẩm'))
    )
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = Number(event.budget) - totalSpent;

  return {
    totalEstimated,
    totalSpent,
    budget: Number(event.budget),
    balance,
    categoryBreakdown,
    lixiTotal,
    shoppingTotal,
    giftTotal,
    foodTotal,
    transactions: event.transactions,
  };
}
