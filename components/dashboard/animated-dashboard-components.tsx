'use client';

import { ReactNode } from 'react';
import { AnimatedCard } from '@/components/ui/animated-card';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { AnimatedProgress } from '@/components/ui/animated-progress';
import { StaggerList } from '@/components/ui/animated-list';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  DollarSign,
} from 'lucide-react';

interface SummaryCardsProps {
  netWorth: number;
  totalAssets: number;
  totalDebts: number;
  budgetProgress: {
    spent: number;
    total: number;
    percentage: number;
  };
}

export function AnimatedSummaryCards({
  netWorth,
  totalAssets,
  totalDebts,
  budgetProgress,
}: SummaryCardsProps) {
  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6'>
      {/* Net Worth */}
      <AnimatedCard delay={0}>
        <Card className='bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20'>
          <CardHeader className='pb-3'>
            <CardDescription className='flex items-center gap-2'>
              <DollarSign className='h-4 w-4' />
              Tài Sản Ròng
            </CardDescription>
            <CardTitle className='text-3xl font-bold text-primary'>
              <AnimatedNumber value={netWorth} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {netWorth >= 0 ? (
              <p className='text-sm text-green-600 flex items-center gap-1'>
                <TrendingUp className='h-4 w-4' />
                Số dư dương
              </p>
            ) : (
              <p className='text-sm text-red-600 flex items-center gap-1'>
                <TrendingDown className='h-4 w-4' />
                Số dư âm
              </p>
            )}
          </CardContent>
        </Card>
      </AnimatedCard>

      {/* Total Assets */}
      <AnimatedCard delay={0.1}>
        <Card>
          <CardHeader className='pb-3'>
            <CardDescription className='flex items-center gap-2'>
              <Wallet className='h-4 w-4' />
              Tổng Tài Sản
            </CardDescription>
            <CardTitle className='text-3xl font-bold text-green-600'>
              <AnimatedNumber value={totalAssets} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-muted-foreground'>Giá trị tài sản hiện tại</p>
          </CardContent>
        </Card>
      </AnimatedCard>

      {/* Total Debts */}
      <AnimatedCard delay={0.2}>
        <Card>
          <CardHeader className='pb-3'>
            <CardDescription className='flex items-center gap-2'>
              <CreditCard className='h-4 w-4' />
              Tổng Nợ
            </CardDescription>
            <CardTitle className='text-3xl font-bold text-red-600'>
              <AnimatedNumber value={totalDebts} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-muted-foreground'>Số tiền cần thanh toán</p>
          </CardContent>
        </Card>
      </AnimatedCard>

      {/* Budget Progress */}
      <AnimatedCard delay={0.3}>
        <Card>
          <CardHeader className='pb-3'>
            <CardDescription>Tiến Độ Ngân Sách</CardDescription>
            <CardTitle className='text-3xl font-bold'>
              {budgetProgress.percentage.toFixed(0)}%
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-2'>
            <AnimatedProgress
              value={budgetProgress.percentage}
              className='h-2'
              indicatorClassName={
                budgetProgress.percentage > 100
                  ? 'bg-red-600'
                  : budgetProgress.percentage > 80
                  ? 'bg-yellow-600'
                  : 'bg-green-600'
              }
            />
            <div className='flex justify-between text-xs text-muted-foreground'>
              <AnimatedNumber value={budgetProgress.spent} className='text-xs' />
              <AnimatedNumber value={budgetProgress.total} className='text-xs' />
            </div>
          </CardContent>
        </Card>
      </AnimatedCard>
    </div>
  );
}

interface BudgetWatchlistProps {
  watchlist: Array<{
    category: {
      id: string;
      name: string;
      icon: string;
    };
    budgetAmount: number;
    spent: number;
    percentage: number;
  }>;
}

export function AnimatedBudgetWatchlist({ watchlist }: BudgetWatchlistProps) {
  const getBudgetColor = (percentage: number) => {
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getBudgetBgColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-600';
    if (percentage >= 80) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  return (
    <StaggerList staggerDelay={0.05} className='space-y-4'>
      {watchlist.map((item) => (
        <div key={item.category.id} className='space-y-2'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <span className='text-2xl'>{item.category.icon}</span>
              <span className='font-medium'>{item.category.name}</span>
            </div>
            <span className={`font-semibold ${getBudgetColor(item.percentage)}`}>
              {item.percentage.toFixed(0)}%
            </span>
          </div>
          <AnimatedProgress
            value={item.percentage}
            className='h-2'
            indicatorClassName={getBudgetBgColor(item.percentage)}
          />
          <div className='flex justify-between text-sm text-muted-foreground'>
            <AnimatedNumber value={item.spent} className='text-sm' />
            <AnimatedNumber value={item.budgetAmount} className='text-sm' />
          </div>
        </div>
      ))}
    </StaggerList>
  );
}

interface DebtsListProps {
  debts: Array<{
    id: string;
    title: string;
    totalAmount: number;
    remainingAmount: number;
    paidAmount: number;
    progress: number;
    dueDate: Date | null;
  }>;
}

export function AnimatedDebtsList({ debts }: DebtsListProps) {
  return (
    <StaggerList staggerDelay={0.05} className='space-y-4'>
      {debts.map((debt) => (
        <div key={debt.id} className='space-y-2 p-4 bg-muted/50 rounded-lg'>
          <div className='flex justify-between items-start'>
            <div>
              <h4 className='font-semibold'>{debt.title}</h4>
              {debt.dueDate && (
                <p className='text-sm text-muted-foreground'>
                  Đến hạn: {new Date(debt.dueDate).toLocaleDateString('vi-VN')}
                </p>
              )}
            </div>
            <span className='text-sm font-medium text-red-600'>
              <AnimatedNumber value={debt.remainingAmount} className='text-sm' />
            </span>
          </div>
          <AnimatedProgress
            value={debt.progress}
            className='h-2'
            indicatorClassName='bg-primary'
          />
          <div className='flex justify-between text-xs text-muted-foreground'>
            <span>
              Đã trả: <AnimatedNumber value={debt.paidAmount} className='text-xs' />
            </span>
            <span>
              Tổng: <AnimatedNumber value={debt.totalAmount} className='text-xs' />
            </span>
          </div>
        </div>
      ))}
    </StaggerList>
  );
}
