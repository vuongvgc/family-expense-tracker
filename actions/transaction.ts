'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';

/**
 * Fetches a dictionary of common descriptions grouped by category
 * Returns a map where key is categoryId and value is array of top 5 most common descriptions
 */
export async function getDescriptionDictionary(): Promise<Record<string, string[]>> {
  try {
    const session = await auth();

    if (!session?.user?.familyGroupId) {
      return {};
    }

    // Fetch recent transactions (last 3 months) from the family
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const transactions = await prisma.transaction.findMany({
      where: {
        familyGroupId: session.user.familyGroupId,
        categoryId: { not: null },
        date: { gte: threeMonthsAgo },
      },
      select: {
        categoryId: true,
        description: true,
      },
      orderBy: {
        date: 'desc',
      },
      take: 1000, // Limit to recent 1000 transactions for performance
    });

    // Group by categoryId and count occurrences of each description
    const categoryDescriptionMap = new Map<string, Map<string, number>>();

    transactions.forEach((tx) => {
      if (!tx.categoryId || !tx.description.trim()) return;

      const categoryId = tx.categoryId;
      const description = tx.description.trim();

      if (!categoryDescriptionMap.has(categoryId)) {
        categoryDescriptionMap.set(categoryId, new Map());
      }

      const descMap = categoryDescriptionMap.get(categoryId)!;
      descMap.set(description, (descMap.get(description) || 0) + 1);
    });

    // Convert to the desired format: top 5 descriptions per category
    const result: Record<string, string[]> = {};

    categoryDescriptionMap.forEach((descMap, categoryId) => {
      // Sort by count (descending) and take top 5
      const sortedDescriptions = Array.from(descMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([desc]) => desc);

      if (sortedDescriptions.length > 0) {
        result[categoryId] = sortedDescriptions;
      }
    });

    return result;
  } catch (error) {
    console.error('Error fetching description dictionary:', error);
    return {};
  }
}
