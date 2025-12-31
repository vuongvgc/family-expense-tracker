'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { TransactionType } from '@prisma/client';

interface GetTransactionsParams {
  search?: string;
  categoryId?: string;
  fromDate?: Date;
  toDate?: Date;
  type?: TransactionType;
  page?: number;
  pageSize?: number;
}

/**
 * Get filtered and paginated transactions
 */
export async function getTransactions(params: GetTransactionsParams = {}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { familyGroupId: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const {
      search,
      categoryId,
      fromDate,
      toDate,
      type,
      page = 1,
      pageSize = 50,
    } = params;

    // Build where clause
    const where: any = {
      familyGroupId: user.familyGroupId,
    };

    if (search) {
      where.description = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (type) {
      where.type = type;
    }

    if (fromDate || toDate) {
      where.date = {};
      if (fromDate) where.date.gte = fromDate;
      if (toDate) where.date.lte = toDate;
    }

    // Get total count for pagination
    const totalCount = await prisma.transaction.count({ where });

    // Get transactions
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Serialize data
    const serialized = transactions.map((t) => ({
      id: t.id,
      amount: Number(t.amount),
      description: t.description,
      type: t.type,
      date: t.date.toISOString(),
      category: t.category
        ? {
            id: t.category.id,
            name: t.category.name,
            icon: t.category.icon,
          }
        : null,
      createdBy: {
        id: t.createdBy.id,
        name: t.createdBy.name,
      },
    }));

    return {
      success: true,
      transactions: serialized,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    };
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch transactions',
      transactions: [],
      pagination: {
        page: 1,
        pageSize: 50,
        totalCount: 0,
        totalPages: 0,
      },
    };
  }
}

/**
 * Get summary for filtered transactions
 */
export async function getFilteredTransactionsSummary(
  params: GetTransactionsParams = {}
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { familyGroupId: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const { search, categoryId, fromDate, toDate, type } = params;

    // Build where clause
    const where: any = {
      familyGroupId: user.familyGroupId,
    };

    if (search) {
      where.description = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (type) {
      where.type = type;
    }

    if (fromDate || toDate) {
      where.date = {};
      if (fromDate) where.date.gte = fromDate;
      if (toDate) where.date.lte = toDate;
    }

    // Get income and expense totals
    const [income, expense] = await Promise.all([
      prisma.transaction.aggregate({
        where: { ...where, type: 'INCOME' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { ...where, type: 'EXPENSE' },
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = Number(income._sum.amount || 0);
    const totalExpense = Number(expense._sum.amount || 0);
    const net = totalIncome - totalExpense;

    return {
      success: true,
      summary: {
        totalIncome,
        totalExpense,
        net,
      },
    };
  } catch (error) {
    console.error('Error calculating transaction summary:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate summary',
      summary: {
        totalIncome: 0,
        totalExpense: 0,
        net: 0,
      },
    };
  }
}

/**
 * Delete a transaction
 */
export async function deleteTransaction(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { familyGroupId: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify the transaction belongs to the user's family group
    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        familyGroupId: user.familyGroupId,
      },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    await prisma.transaction.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Transaction deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete transaction',
    };
  }
}

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
