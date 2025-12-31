import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import CategoriesPageClient from './categories-client';

export default async function CategoriesPage() {
  const session = await auth();

  if (!session?.user?.familyGroupId) {
    redirect('/login');
  }

  // Fetch all categories for the family
  const categories = await prisma.category.findMany({
    where: {
      familyGroupId: session.user.familyGroupId,
    },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
    include: {
      _count: {
        select: {
          transactions: true,
        },
      },
    },
  });

  return <CategoriesPageClient categories={categories} />;
}
