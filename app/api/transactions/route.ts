import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { TransactionType, PaymentMethod, DebtStatus } from '@prisma/client';
import { TransactionFilterWhereClause } from '@/lib/types';

// Validation schema for creating/updating transactions
const transactionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required').max(200),
  type: z.nativeEnum(TransactionType),
  paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.CASH),
  categoryId: z.string().optional().nullable(),
  date: z.string().datetime().optional(),
});

// GET /api/transactions - Fetch all transactions for the user's family
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.familyGroupId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Filter parameters
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const categoryId = searchParams.get('categoryId');

    // Build where clause with filters
    const whereClause: TransactionFilterWhereClause = {
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

      whereClause.date = {
        gte: start,
        lte: endOfDay,
      };
    }

    // Add category filter
    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    // Fetch transactions for the family, including creator info
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const total = await prisma.transaction.count({
      where: whereClause,
    });

    return NextResponse.json({
      transactions,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

// POST /api/transactions - Create a new transaction
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.familyGroupId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = transactionSchema.parse(body);

    // Use transaction to ensure atomicity for credit card debt logic
    const transaction = await prisma.$transaction(async (tx) => {
      // Create the transaction
      const newTransaction = await tx.transaction.create({
        data: {
          amount: validatedData.amount,
          description: validatedData.description,
          type: validatedData.type,
          paymentMethod: validatedData.paymentMethod,
          categoryId: validatedData.categoryId,
          date: validatedData.date ? new Date(validatedData.date) : new Date(),
          familyGroupId: session.user.familyGroupId,
          createdById: session.user.id,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              icon: true,
            },
          },
        },
      });

      // Credit Card Debt Logic: Only for EXPENSE transactions with CREDIT_CARD payment
      if (
        validatedData.type === TransactionType.EXPENSE &&
        validatedData.paymentMethod === PaymentMethod.CREDIT_CARD
      ) {
        // Find or create "Credit Card Debt"
        let creditCardDebt = await tx.debt.findFirst({
          where: {
            familyGroupId: session.user.familyGroupId,
            title: 'Credit Card Debt',
          },
        });

        if (!creditCardDebt) {
          // Auto-provision: Create the debt with 0 initial amount
          creditCardDebt = await tx.debt.create({
            data: {
              title: 'Tổng nợ thẻ tín dụng tự động',
              description:
                'Nợ thẻ tín dụng được tạo tự động khi ghi nhận giao dịch thẻ tín dụng.',
              totalAmount: 0,
              remainingAmount: 0,
              status: DebtStatus.ACTIVE,
              familyGroupId: session.user.familyGroupId,
            },
          });
        }

        // Increment the debt by transaction amount
        await tx.debt.update({
          where: { id: creditCardDebt.id },
          data: {
            totalAmount: { increment: validatedData.amount },
            remainingAmount: { increment: validatedData.amount },
          },
        });
      }

      return newTransaction;
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}
