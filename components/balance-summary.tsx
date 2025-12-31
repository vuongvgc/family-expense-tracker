'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { TransactionType } from '@prisma/client';
import { formatCurrency } from '@/lib/utils';

interface Transaction {
  amount: number;
  type: TransactionType;
}

interface BalanceSummaryProps {
  transactions: Transaction[];
}

export default function BalanceSummary({ transactions }: BalanceSummaryProps) {
  const income = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expense = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = income - expense;

  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Total Balance</CardTitle>
          <Wallet className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              balance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {formatCurrency(balance)}
          </div>
          <p className='text-xs text-muted-foreground mt-1'>Family net balance</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Total Income</CardTitle>
          <TrendingUp className='h-4 w-4 text-green-600' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-green-600'>
            {formatCurrency(income)}
          </div>
          <p className='text-xs text-muted-foreground mt-1'>All family income</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Total Expenses</CardTitle>
          <TrendingDown className='h-4 w-4 text-red-600' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-red-600'>
            {formatCurrency(expense)}
          </div>
          <p className='text-xs text-muted-foreground mt-1'>All family expenses</p>
        </CardContent>
      </Card>
    </div>
  );
}
