import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { TransactionFilterWhereClause } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.familyGroupId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const categoryId = searchParams.get('categoryId');

    // Build base where clause
    const baseWhere: TransactionFilterWhereClause = {
      familyGroupId: session.user.familyGroupId,
    };

    // Add date range filter
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Create new Date at end of day to include all transactions
      const endOfDay = new Date(
        end.getFullYear(),
        end.getMonth(),
        end.getDate(),
        23,
        59,
        59,
        999
      );

      baseWhere.date = {
        gte: start,
        lte: endOfDay,
      };
    }

    // Add category filter if specified
    if (categoryId) {
      baseWhere.categoryId = categoryId;
    }

    // Get expense breakdown by category
    const expensesByCategory = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        ...baseWhere,
        type: 'EXPENSE',
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // Get income breakdown by category
    const incomeByCategory = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        ...baseWhere,
        type: 'INCOME',
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // Fetch category details for all categoryIds
    const allCategoryIds = [
      ...expensesByCategory.map((item) => item.categoryId),
      ...incomeByCategory.map((item) => item.categoryId),
    ].filter(Boolean) as string[];

    const categories = await prisma.category.findMany({
      where: { id: { in: allCategoryIds } },
      select: { id: true, name: true, icon: true },
    });

    const categoryMap = Object.fromEntries(categories.map((cat) => [cat.id, cat]));

    // Calculate totals
    const totalExpenses = expensesByCategory.reduce(
      (sum, item) => sum + Number(item._sum.amount || 0),
      0
    );

    const totalIncome = incomeByCategory.reduce(
      (sum, item) => sum + Number(item._sum.amount || 0),
      0
    );

    // Format data with percentages
    const expensesFormatted = expensesByCategory.map((item) => {
      const cat = item.categoryId ? categoryMap[item.categoryId] : null;
      return {
        category: cat?.name || 'Uncategorized',
        icon: cat?.icon || '❓',
        categoryId: item.categoryId,
        amount: Number(item._sum.amount || 0),
        count: item._count.id,
        percentage:
          totalExpenses > 0
            ? ((Number(item._sum.amount || 0) / totalExpenses) * 100).toFixed(1)
            : '0',
      };
    });

    const incomeFormatted = incomeByCategory.map((item) => {
      const cat = item.categoryId ? categoryMap[item.categoryId] : null;
      return {
        category: cat?.name || 'Uncategorized',
        icon: cat?.icon || '❓',
        categoryId: item.categoryId,
        amount: Number(item._sum.amount || 0),
        count: item._count.id,
        percentage:
          totalIncome > 0
            ? ((Number(item._sum.amount || 0) / totalIncome) * 100).toFixed(1)
            : '0',
      };
    });

    return NextResponse.json({
      expenses: {
        byCategory: expensesFormatted,
        total: totalExpenses,
      },
      income: {
        byCategory: incomeFormatted,
        total: totalIncome,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
