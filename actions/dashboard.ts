'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

/**
 * Get comprehensive dashboard summary
 * Includes: Net Worth, Budget Progress, Total Debt, Total Assets, and Income vs Expenses for last 6 months
 */
export async function getDashboardSummary() {
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

    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);

    // Fetch all data in parallel
    const [
      totalAssets,
      totalDebts,
      currentMonthBudgets,
      currentMonthExpenses,
      last6MonthsData,
    ] = await Promise.all([
      // Total Assets
      prisma.asset.aggregate({
        where: { familyGroupId: user.familyGroupId },
        _sum: { amount: true },
      }),

      // Total Debts (only ACTIVE debts)
      prisma.debt.aggregate({
        where: {
          familyGroupId: user.familyGroupId,
          status: 'ACTIVE',
        },
        _sum: { remainingAmount: true },
      }),

      // Current Month Budgets
      prisma.budget.findMany({
        where: {
          familyGroupId: user.familyGroupId,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        },
        select: { amount: true },
      }),

      // Current Month Expenses
      prisma.transaction.aggregate({
        where: {
          familyGroupId: user.familyGroupId,
          type: 'EXPENSE',
          date: {
            gte: currentMonthStart,
            lte: currentMonthEnd,
          },
        },
        _sum: { amount: true },
      }),

      // Last 6 months income vs expenses
      Promise.all(
        Array.from({ length: 6 }, async (_, i) => {
          const monthDate = subMonths(now, 5 - i);
          const monthStart = startOfMonth(monthDate);
          const monthEnd = endOfMonth(monthDate);

          const [income, expenses] = await Promise.all([
            prisma.transaction.aggregate({
              where: {
                familyGroupId: user.familyGroupId,
                type: 'INCOME',
                date: { gte: monthStart, lte: monthEnd },
              },
              _sum: { amount: true },
            }),
            prisma.transaction.aggregate({
              where: {
                familyGroupId: user.familyGroupId,
                type: 'EXPENSE',
                date: { gte: monthStart, lte: monthEnd },
              },
              _sum: { amount: true },
            }),
          ]);

          return {
            month: monthDate.toLocaleString('en-US', { month: 'short' }),
            year: monthDate.getFullYear(),
            income: Number(income._sum.amount || 0),
            expenses: Number(expenses._sum.amount || 0),
          };
        })
      ),
    ]);

    const totalAssetsValue = Number(totalAssets._sum.amount || 0);
    const totalDebtsValue = Number(totalDebts._sum.remainingAmount || 0);
    const netWorth = totalAssetsValue - totalDebtsValue;

    const totalBudget = currentMonthBudgets.reduce(
      (sum, b) => sum + Number(b.amount),
      0
    );
    const totalSpent = Number(currentMonthExpenses._sum.amount || 0);
    const budgetProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return {
      success: true,
      summary: {
        netWorth,
        totalAssets: totalAssetsValue,
        totalDebts: totalDebtsValue,
        budgetProgress: {
          spent: totalSpent,
          total: totalBudget,
          percentage: budgetProgress,
        },
        incomeVsExpenses: last6MonthsData,
      },
    };
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to fetch dashboard summary',
      summary: {
        netWorth: 0,
        totalAssets: 0,
        totalDebts: 0,
        budgetProgress: {
          spent: 0,
          total: 0,
          percentage: 0,
        },
        incomeVsExpenses: [],
      },
    };
  }
}

/**
 * Get budget watchlist - categories using >70% of budget
 */
export async function getBudgetWatchlist() {
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

    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);

    // Get budgets for current month
    const budgets = await prisma.budget.findMany({
      where: {
        familyGroupId: user.familyGroupId,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      },
      include: {
        category: true,
      },
    });

    // Get spending per category
    const watchlist = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await prisma.transaction.aggregate({
          where: {
            familyGroupId: user.familyGroupId,
            categoryId: budget.categoryId,
            type: 'EXPENSE',
            date: {
              gte: currentMonthStart,
              lte: currentMonthEnd,
            },
          },
          _sum: { amount: true },
        });

        const spentAmount = Number(spent._sum.amount || 0);
        const budgetAmount = Number(budget.amount);
        const percentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;

        return {
          categoryId: budget.categoryId,
          categoryName: budget.category.name,
          categoryIcon: budget.category.icon,
          spent: spentAmount,
          budget: budgetAmount,
          percentage,
        };
      })
    );

    // Filter only categories using >70%
    const filtered = watchlist
      .filter((item) => item.percentage > 70)
      .sort((a, b) => b.percentage - a.percentage);

    return {
      success: true,
      watchlist: filtered,
    };
  } catch (error) {
    console.error('Error fetching budget watchlist:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to fetch budget watchlist',
      watchlist: [],
    };
  }
}

/**
 * Get active debts summary with progress
 */
export async function getActiveDebtsSummary() {
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

    const debts = await prisma.debt.findMany({
      where: {
        familyGroupId: user.familyGroupId,
        status: 'ACTIVE',
      },
      orderBy: {
        dueDate: 'asc',
      },
      take: 5, // Limit to 5 most urgent debts
    });

    const debtsWithProgress = debts.map((debt) => {
      const totalAmount = Number(debt.totalAmount);
      const remainingAmount = Number(debt.remainingAmount);
      const paidAmount = totalAmount - remainingAmount;
      const progress = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

      return {
        id: debt.id,
        title: debt.title,
        totalAmount,
        remainingAmount,
        paidAmount,
        progress,
        dueDate: debt.dueDate,
      };
    });

    return {
      success: true,
      debts: debtsWithProgress,
    };
  } catch (error) {
    console.error('Error fetching active debts:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to fetch active debts',
      debts: [],
    };
  }
}

/**
 * Get recent transactions (last 5)
 */
export async function getRecentTransactions() {
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

    const transactions = await prisma.transaction.findMany({
      where: {
        familyGroupId: user.familyGroupId,
      },
      include: {
        category: true,
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
      take: 5,
    });

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
      createdBy: t.createdBy,
    }));

    return {
      success: true,
      transactions: serialized,
    };
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch recent transactions',
      transactions: [],
    };
  }
}
