'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export interface DebtWithPayments {
  id: string;
  title: string;
  description: string | null;
  totalAmount: number;
  remainingAmount: number;
  dueDate: Date | null;
  status: 'ACTIVE' | 'PAID';
  createdAt: Date;
  payments: {
    id: string;
    amount: number;
    date: Date;
  }[];
}

export interface DebtSummary {
  totalOutstanding: number;
  totalDebts: number;
  activeDebts: number;
  paidDebts: number;
}

/**
 * Creates a new debt
 */
export async function createDebt(
  title: string,
  totalAmount: number,
  description?: string,
  dueDate?: Date
): Promise<{ success: boolean; message: string; debtId?: string }> {
  try {
    const session = await auth();

    if (!session?.user?.familyGroupId) {
      return { success: false, message: 'Unauthorized' };
    }

    if (totalAmount <= 0) {
      return { success: false, message: 'Amount must be greater than zero' };
    }

    if (!title.trim()) {
      return { success: false, message: 'Title is required' };
    }

    const debt = await prisma.debt.create({
      data: {
        title: title.trim(),
        description: description?.trim(),
        totalAmount,
        remainingAmount: totalAmount,
        dueDate,
        familyGroupId: session.user.familyGroupId,
        status: 'ACTIVE',
      },
    });

    revalidatePath('/dashboard/debts');

    return {
      success: true,
      message: 'Debt created successfully',
      debtId: debt.id,
    };
  } catch (error) {
    console.error('Error creating debt:', error);
    return { success: false, message: 'Failed to create debt' };
  }
}

/**
 * Makes a payment on a debt and creates a transaction record
 */
export async function makePayment(
  debtId: string,
  amount: number
): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth();

    if (!session?.user?.familyGroupId || !session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    if (amount <= 0) {
      return { success: false, message: 'Payment amount must be greater than zero' };
    }

    // Fetch the debt
    const debt = await prisma.debt.findFirst({
      where: {
        id: debtId,
        familyGroupId: session.user.familyGroupId,
      },
    });

    if (!debt) {
      return { success: false, message: 'Debt not found' };
    }

    if (debt.status === 'PAID') {
      return { success: false, message: 'This debt is already paid off' };
    }

    if (amount > Number(debt.remainingAmount)) {
      return {
        success: false,
        message: 'Payment amount exceeds remaining debt',
      };
    }

    // Find or create "Debt Repayment" category
    let debtCategory = await prisma.category.findFirst({
      where: {
        familyGroupId: session.user.familyGroupId,
        name: 'Debt Repayment',
        type: 'EXPENSE',
      },
    });

    if (!debtCategory) {
      debtCategory = await prisma.category.create({
        data: {
          name: 'Debt Repayment',
          type: 'EXPENSE',
          icon: '💳',
          familyGroupId: session.user.familyGroupId,
        },
      });
    }

    const newRemainingAmount = Number(debt.remainingAmount) - amount;
    const newStatus = newRemainingAmount === 0 ? 'PAID' : 'ACTIVE';

    // Execute all operations in a transaction
    await prisma.$transaction([
      // Create debt payment record
      prisma.debtPayment.create({
        data: {
          debtId,
          amount,
        },
      }),

      // Update debt
      prisma.debt.update({
        where: { id: debtId },
        data: {
          remainingAmount: newRemainingAmount,
          status: newStatus,
        },
      }),

      // Create expense transaction
      prisma.transaction.create({
        data: {
          amount,
          description: `Debt payment: ${debt.title}`,
          type: 'EXPENSE',
          categoryId: debtCategory.id,
          familyGroupId: session.user.familyGroupId,
          createdById: session.user.id,
        },
      }),
    ]);

    revalidatePath('/dashboard/debts');
    revalidatePath('/dashboard');

    return {
      success: true,
      message:
        newStatus === 'PAID' ? 'Debt fully paid!' : 'Payment recorded successfully',
    };
  } catch (error) {
    console.error('Error making payment:', error);
    return { success: false, message: 'Failed to record payment' };
  }
}

/**
 * Fetches all debts with payment history
 */
export async function getDebts(): Promise<{
  summary: DebtSummary;
  debts: DebtWithPayments[];
}> {
  try {
    const session = await auth();

    if (!session?.user?.familyGroupId) {
      return {
        summary: {
          totalOutstanding: 0,
          totalDebts: 0,
          activeDebts: 0,
          paidDebts: 0,
        },
        debts: [],
      };
    }

    const debts = await prisma.debt.findMany({
      where: {
        familyGroupId: session.user.familyGroupId,
      },
      include: {
        payments: {
          orderBy: {
            date: 'desc',
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // ACTIVE first
        { createdAt: 'desc' },
      ],
    });

    const debtsData: DebtWithPayments[] = debts.map((debt) => ({
      id: debt.id,
      title: debt.title,
      description: debt.description,
      totalAmount: Number(debt.totalAmount),
      remainingAmount: Number(debt.remainingAmount),
      dueDate: debt.dueDate,
      status: debt.status,
      createdAt: debt.createdAt,
      payments: debt.payments.map((payment) => ({
        id: payment.id,
        amount: Number(payment.amount),
        date: payment.date,
      })),
    }));

    const totalOutstanding = debtsData
      .filter((d) => d.status === 'ACTIVE')
      .reduce((sum, d) => sum + d.remainingAmount, 0);

    const summary: DebtSummary = {
      totalOutstanding,
      totalDebts: debtsData.length,
      activeDebts: debtsData.filter((d) => d.status === 'ACTIVE').length,
      paidDebts: debtsData.filter((d) => d.status === 'PAID').length,
    };

    return { summary, debts: debtsData };
  } catch (error) {
    console.error('Error fetching debts:', error);
    return {
      summary: {
        totalOutstanding: 0,
        totalDebts: 0,
        activeDebts: 0,
        paidDebts: 0,
      },
      debts: [],
    };
  }
}

/**
 * Deletes a debt (only if no payments have been made)
 */
export async function deleteDebt(
  debtId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth();

    if (!session?.user?.familyGroupId) {
      return { success: false, message: 'Unauthorized' };
    }

    const debt = await prisma.debt.findFirst({
      where: {
        id: debtId,
        familyGroupId: session.user.familyGroupId,
      },
      include: {
        payments: true,
      },
    });

    if (!debt) {
      return { success: false, message: 'Debt not found' };
    }

    if (debt.payments.length > 0) {
      return {
        success: false,
        message: 'Cannot delete debt with payment history',
      };
    }

    await prisma.debt.delete({
      where: { id: debtId },
    });

    revalidatePath('/dashboard/debts');

    return { success: true, message: 'Debt deleted successfully' };
  } catch (error) {
    console.error('Error deleting debt:', error);
    return { success: false, message: 'Failed to delete debt' };
  }
}
