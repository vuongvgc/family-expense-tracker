'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export interface BudgetCategoryData {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  limit: number;
  spent: number;
}

export interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
}

export interface BudgetPageData {
  summary: BudgetSummary;
  categories: BudgetCategoryData[];
}

/**
 * Fetches budget data for a specific month and year
 */
export async function getBudgetData(
  month: number,
  year: number
): Promise<BudgetPageData> {
  try {
    const session = await auth();

    if (!session?.user?.familyGroupId) {
      return {
        summary: {
          totalBudget: 0,
          totalSpent: 0,
          remaining: 0,
        },
        categories: [],
      };
    }

    const familyGroupId = session.user.familyGroupId;

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Fetch all EXPENSE categories for the family
    const categories = await prisma.category.findMany({
      where: {
        familyGroupId,
        type: 'EXPENSE',
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Fetch budgets for the period
    const budgets = await prisma.budget.findMany({
      where: {
        familyGroupId,
        month,
        year,
      },
    });

    // Create a map for quick budget lookup
    const budgetMap = new Map<string, number>();
    budgets.forEach((budget) => {
      budgetMap.set(budget.categoryId, Number(budget.amount));
    });

    // Fetch actual spending for the period
    const transactions = await prisma.transaction.findMany({
      where: {
        familyGroupId,
        type: 'EXPENSE',
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        categoryId: true,
        amount: true,
      },
    });

    // Aggregate spending by category
    const spendingMap = new Map<string, number>();
    transactions.forEach((tx) => {
      if (tx.categoryId) {
        const current = spendingMap.get(tx.categoryId) || 0;
        spendingMap.set(tx.categoryId, current + Number(tx.amount));
      }
    });

    // Merge data
    const categoryData: BudgetCategoryData[] = categories.map((cat) => ({
      categoryId: cat.id,
      categoryName: cat.name,
      categoryIcon: cat.icon,
      limit: budgetMap.get(cat.id) || 0,
      spent: spendingMap.get(cat.id) || 0,
    }));

    // Calculate summary
    const totalBudget = categoryData.reduce((sum, cat) => sum + cat.limit, 0);
    const totalSpent = categoryData.reduce((sum, cat) => sum + cat.spent, 0);
    const remaining = totalBudget - totalSpent;

    return {
      summary: {
        totalBudget,
        totalSpent,
        remaining,
      },
      categories: categoryData,
    };
  } catch (error) {
    console.error('Error fetching budget data:', error);
    return {
      summary: {
        totalBudget: 0,
        totalSpent: 0,
        remaining: 0,
      },
      categories: [],
    };
  }
}

/**
 * Updates or creates a budget for a specific category, month, and year
 */
export async function updateBudget(
  categoryId: string,
  amount: number,
  month: number,
  year: number
): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth();

    if (!session?.user?.familyGroupId) {
      return { success: false, message: 'Unauthorized' };
    }

    const familyGroupId = session.user.familyGroupId;

    // Validate inputs
    if (amount < 0) {
      return { success: false, message: 'Amount cannot be negative' };
    }

    if (month < 1 || month > 12) {
      return { success: false, message: 'Invalid month' };
    }

    // Verify category belongs to the family
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        familyGroupId,
      },
    });

    if (!category) {
      return { success: false, message: 'Category not found' };
    }

    // Upsert budget
    await prisma.budget.upsert({
      where: {
        familyGroupId_categoryId_month_year: {
          familyGroupId,
          categoryId,
          month,
          year,
        },
      },
      update: {
        amount,
      },
      create: {
        familyGroupId,
        categoryId,
        month,
        year,
        amount,
      },
    });

    revalidatePath('/dashboard/budget');

    return { success: true, message: 'Budget updated successfully' };
  } catch (error) {
    console.error('Error updating budget:', error);
    return { success: false, message: 'Failed to update budget' };
  }
}

/**
 * Clones all budgets from the previous month to the target month
 */
export async function clonePreviousMonth(
  targetMonth: number,
  targetYear: number
): Promise<{ success: boolean; message: string; count?: number }> {
  try {
    const session = await auth();

    if (!session?.user?.familyGroupId) {
      return { success: false, message: 'Unauthorized' };
    }

    const familyGroupId = session.user.familyGroupId;

    // Calculate previous month
    let prevMonth = targetMonth - 1;
    let prevYear = targetYear;

    if (prevMonth < 1) {
      prevMonth = 12;
      prevYear -= 1;
    }

    // Fetch budgets from previous month
    const previousBudgets = await prisma.budget.findMany({
      where: {
        familyGroupId,
        month: prevMonth,
        year: prevYear,
      },
    });

    if (previousBudgets.length === 0) {
      return {
        success: false,
        message: `No budgets found for ${prevMonth}/${prevYear}`,
      };
    }

    // Clone budgets to target month
    const cloneOperations = previousBudgets.map((budget) =>
      prisma.budget.upsert({
        where: {
          familyGroupId_categoryId_month_year: {
            familyGroupId,
            categoryId: budget.categoryId,
            month: targetMonth,
            year: targetYear,
          },
        },
        update: {
          amount: budget.amount,
        },
        create: {
          familyGroupId,
          categoryId: budget.categoryId,
          month: targetMonth,
          year: targetYear,
          amount: budget.amount,
        },
      })
    );

    await prisma.$transaction(cloneOperations);

    revalidatePath('/dashboard/budget');

    return {
      success: true,
      message: `Successfully cloned ${previousBudgets.length} budgets from ${prevMonth}/${prevYear}`,
      count: previousBudgets.length,
    };
  } catch (error) {
    console.error('Error cloning budgets:', error);
    return { success: false, message: 'Failed to clone budgets' };
  }
}
