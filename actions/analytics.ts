'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';

interface ComparativeSummary {
  targetTotal: number;
  refTotal: number;
  diff: number;
  percentChange: number;
}

interface ChartDataItem {
  categoryName: string;
  categoryIcon: string;
  targetAmount: number;
  refAmount: number;
}

interface ComparativeMonthlyData {
  summary: ComparativeSummary;
  chartData: ChartDataItem[];
}

/**
 * Fetches comparative data for two months
 * @param targetMonth - The target (current) month (1-12)
 * @param targetYear - The target year
 * @param refMonth - The reference (previous) month (1-12)
 * @param refYear - The reference year
 */
export async function getComparativeMonthlyData(
  targetMonth: number,
  targetYear: number,
  refMonth: number,
  refYear: number
): Promise<ComparativeMonthlyData> {
  try {
    const session = await auth();

    if (!session?.user?.familyGroupId) {
      return {
        summary: {
          targetTotal: 0,
          refTotal: 0,
          diff: 0,
          percentChange: 0,
        },
        chartData: [],
      };
    }

    // Calculate date ranges for both periods
    const targetStart = new Date(targetYear, targetMonth - 1, 1);
    const targetEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const refStart = new Date(refYear, refMonth - 1, 1);
    const refEnd = new Date(refYear, refMonth, 0, 23, 59, 59, 999);

    // Fetch target month expenses
    const targetTransactions = await prisma.transaction.findMany({
      where: {
        familyGroupId: session.user.familyGroupId,
        type: 'EXPENSE',
        date: {
          gte: targetStart,
          lte: targetEnd,
        },
      },
      include: {
        category: {
          select: {
            name: true,
            icon: true,
          },
        },
      },
    });

    // Fetch reference month expenses
    const refTransactions = await prisma.transaction.findMany({
      where: {
        familyGroupId: session.user.familyGroupId,
        type: 'EXPENSE',
        date: {
          gte: refStart,
          lte: refEnd,
        },
      },
      include: {
        category: {
          select: {
            name: true,
            icon: true,
          },
        },
      },
    });

    // Group by category for target month
    const targetByCategory = new Map<
      string,
      { name: string; icon: string; amount: number }
    >();
    targetTransactions.forEach((tx) => {
      if (!tx.categoryId || !tx.category) return;

      const existing = targetByCategory.get(tx.categoryId);
      if (existing) {
        existing.amount += Number(tx.amount);
      } else {
        targetByCategory.set(tx.categoryId, {
          name: tx.category.name,
          icon: tx.category.icon,
          amount: Number(tx.amount),
        });
      }
    });

    // Group by category for reference month
    const refByCategory = new Map<string, number>();
    refTransactions.forEach((tx) => {
      if (!tx.categoryId) return;

      const existing = refByCategory.get(tx.categoryId);
      refByCategory.set(tx.categoryId, (existing || 0) + Number(tx.amount));
    });

    // Merge categories: collect all unique category IDs
    const allCategoryIds = new Set([
      ...targetByCategory.keys(),
      ...refByCategory.keys(),
    ]);

    // Build chart data
    const chartData: ChartDataItem[] = [];
    allCategoryIds.forEach((categoryId) => {
      const targetData = targetByCategory.get(categoryId);
      const refAmount = refByCategory.get(categoryId) || 0;

      if (targetData) {
        chartData.push({
          categoryName: targetData.name,
          categoryIcon: targetData.icon,
          targetAmount: targetData.amount,
          refAmount,
        });
      } else {
        // Category exists only in reference month
        const refTx = refTransactions.find((tx) => tx.categoryId === categoryId);
        if (refTx?.category) {
          chartData.push({
            categoryName: refTx.category.name,
            categoryIcon: refTx.category.icon,
            targetAmount: 0,
            refAmount,
          });
        }
      }
    });

    // Sort by target amount descending
    chartData.sort((a, b) => b.targetAmount - a.targetAmount);

    // Calculate summary
    const targetTotal = chartData.reduce((sum, item) => sum + item.targetAmount, 0);
    const refTotal = chartData.reduce((sum, item) => sum + item.refAmount, 0);
    const diff = targetTotal - refTotal;
    const percentChange = refTotal === 0 ? 0 : (diff / refTotal) * 100;

    return {
      summary: {
        targetTotal,
        refTotal,
        diff,
        percentChange,
      },
      chartData,
    };
  } catch (error) {
    console.error('Error fetching comparative monthly data:', error);
    return {
      summary: {
        targetTotal: 0,
        refTotal: 0,
        diff: 0,
        percentChange: 0,
      },
      chartData: [],
    };
  }
}
