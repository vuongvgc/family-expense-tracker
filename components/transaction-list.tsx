'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Edit, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { TransactionType, Category } from '@prisma/client';
import { formatCurrency } from '@/lib/utils';

interface Transaction {
  id: string;
  amount: number;
  description: string;
  type: TransactionType;
  category: Category;
  date: string;
  createdBy: {
    id: string;
    name: string;
  };
}

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  currentUserId: string;
}

const CATEGORY_LABELS: Record<Category, string> = {
  FOOD: 'Food & Dining',
  TRANSPORT: 'Transport',
  UTILITIES: 'Utilities',
  HEALTHCARE: 'Healthcare',
  EDUCATION: 'Education',
  ENTERTAINMENT: 'Entertainment',
  SHOPPING: 'Shopping',
  SALARY: 'Salary',
  INVESTMENT: 'Investment',
  OTHER: 'Other',
};

export default function TransactionList({
  transactions,
  onEdit,
  onDelete,
  currentUserId,
}: TransactionListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className='py-12'>
          <div className='text-center text-muted-foreground'>
            <p className='text-lg font-medium mb-2'>No transactions yet</p>
            <p className='text-sm'>Add your first transaction to start tracking!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>
          All family transactions from newest to oldest
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className='flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors'
            >
              <div className='flex items-start gap-4 flex-1'>
                <div
                  className={`p-2 rounded-full ${
                    transaction.type === 'INCOME'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {transaction.type === 'INCOME' ? (
                    <TrendingUp className='h-5 w-5' />
                  ) : (
                    <TrendingDown className='h-5 w-5' />
                  )}
                </div>

                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 flex-wrap'>
                    <h3 className='font-semibold text-base'>
                      {transaction.description}
                    </h3>
                    <span className='text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full'>
                      {CATEGORY_LABELS[transaction.category]}
                    </span>
                  </div>

                  <div className='flex items-center gap-3 mt-1 text-sm text-muted-foreground'>
                    <span>
                      {transaction.createdBy.id === currentUserId
                        ? 'You'
                        : transaction.createdBy.name}
                    </span>
                    <span>•</span>
                    <span>
                      {format(new Date(transaction.date), 'MMM dd, yyyy h:mm a')}
                    </span>
                  </div>
                </div>

                <div className='text-right'>
                  <p
                    className={`text-lg font-bold ${
                      transaction.type === 'INCOME'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {transaction.type === 'INCOME' ? '+' : '-'}
                    {formatCurrency(Number(transaction.amount))}
                  </p>
                </div>
              </div>

              <div className='flex items-center gap-2 ml-4'>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => onEdit(transaction)}
                  disabled={deletingId === transaction.id}
                >
                  <Edit className='h-4 w-4' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => handleDelete(transaction.id)}
                  disabled={deletingId === transaction.id}
                >
                  <Trash2 className='h-4 w-4 text-destructive' />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
