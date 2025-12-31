import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.familyGroupId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get expense breakdown by category
    const expensesByCategory = await prisma.transaction.groupBy({
      by: ['category'],
      where: {
        familyGroupId: session.user.familyGroupId,
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
      by: ['category'],
      where: {
        familyGroupId: session.user.familyGroupId,
        type: 'INCOME',
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

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
    const expensesFormatted = expensesByCategory.map((item) => ({
      category: item.category,
      amount: Number(item._sum.amount || 0),
      count: item._count.id,
      percentage:
        totalExpenses > 0
          ? ((Number(item._sum.amount || 0) / totalExpenses) * 100).toFixed(1)
          : '0',
    }));

    const incomeFormatted = incomeByCategory.map((item) => ({
      category: item.category,
      amount: Number(item._sum.amount || 0),
      count: item._count.id,
      percentage:
        totalIncome > 0
          ? ((Number(item._sum.amount || 0) / totalIncome) * 100).toFixed(1)
          : '0',
    }));

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
