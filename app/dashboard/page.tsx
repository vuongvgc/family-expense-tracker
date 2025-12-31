import {
  getDashboardSummary,
  getBudgetWatchlist,
  getActiveDebtsSummary,
  getRecentTransactions,
} from '@/actions/dashboard';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertCircle, CreditCard, DollarSign, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import IncomeExpenseChart from '@/components/dashboard/income-expense-chart';
import {
  AnimatedSummaryCards,
  AnimatedBudgetWatchlist,
  AnimatedDebtsList,
} from '@/components/dashboard/animated-dashboard-components';
import { AnimatedCard } from '@/components/ui/animated-card';
import { StaggerList } from '@/components/ui/animated-list';
import { formatCurrency } from '@/lib/utils';

export default async function DashboardPage() {
  const [summaryResult, watchlistResult, debtsResult, transactionsResult] =
    await Promise.all([
      getDashboardSummary(),
      getBudgetWatchlist(),
      getActiveDebtsSummary(),
      getRecentTransactions(),
    ]);

  const { summary } = summaryResult;
  const { watchlist } = watchlistResult;
  const { debts } = debtsResult;
  const { transactions } = transactionsResult;

  return (
    <div className='p-8'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold mb-2'>Tổng Quan Tài Chính</h1>
        <p className='text-muted-foreground'>
          Tổng quan sức khỏe tài chính gia đình của bạn
        </p>
      </div>

      {/* Global Summary - Top 4 Cards with Animation */}
      <AnimatedSummaryCards
        netWorth={summary.netWorth}
        totalAssets={summary.totalAssets}
        totalDebts={summary.totalDebts}
        budgetProgress={summary.budgetProgress}
      />

      {/* Main Content - Two Columns */}
      <div className='grid gap-6 lg:grid-cols-5 mb-6'>
        {/* Left Side - Income vs Expenses Chart (60%) */}
        <AnimatedCard delay={0.4} className='lg:col-span-3'>
          <Card>
            <CardHeader>
              <CardTitle>Thu Nhập vs Chi Tiêu</CardTitle>
              <CardDescription>So sánh 6 tháng gần đây</CardDescription>
            </CardHeader>
            <CardContent>
              <IncomeExpenseChart data={summary.incomeVsExpenses} />
            </CardContent>
          </Card>
        </AnimatedCard>

        {/* Right Side - Budget Watchlist (40%) */}
        <AnimatedCard delay={0.5} className='lg:col-span-2'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <AlertCircle className='h-5 w-5 text-orange-500' />
                Danh Mục Theo Dõi
              </CardTitle>
              <CardDescription>Danh mục vượt quá 70% ngân sách</CardDescription>
            </CardHeader>
            <CardContent>
              {watchlist.length === 0 ? (
                <div className='text-center py-8'>
                  <p className='text-muted-foreground text-sm'>
                    Tất cả ngân sách đều tốt! 🎉
                  </p>
                </div>
              ) : (
                <AnimatedBudgetWatchlist
                  watchlist={watchlist.map((item) => ({
                    category: {
                      id: item.categoryId,
                      name: item.categoryName,
                      icon: item.categoryIcon,
                    },
                    budgetAmount: item.budget,
                    spent: item.spent,
                    percentage: item.percentage,
                  }))}
                />
              )}
            </CardContent>
          </Card>
        </AnimatedCard>
      </div>

      {/* Bottom Row */}
      <div className='grid gap-6 lg:grid-cols-2'>
        {/* Active Debts */}
        <AnimatedCard delay={0.6}>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <CreditCard className='h-5 w-5' />
                Khoản Nợ Đang Hoạt Động
              </CardTitle>
              <CardDescription>Theo dõi tiến độ trả nợ của bạn</CardDescription>
            </CardHeader>
            <CardContent>
              {debts.length === 0 ? (
                <div className='text-center py-8'>
                  <p className='text-muted-foreground text-sm'>
                    Không có khoản nợ nào. Tuyệt vời! 🎉
                  </p>
                </div>
              ) : (
                <AnimatedDebtsList debts={debts} />
              )}
            </CardContent>
          </Card>
        </AnimatedCard>

        {/* Recent Transactions */}
        <AnimatedCard delay={0.7}>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <DollarSign className='h-5 w-5' />
                Giao Dịch Gần Đây
              </CardTitle>
              <CardDescription>5 giao dịch mới nhất</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className='text-center py-8'>
                  <p className='text-muted-foreground text-sm'>
                    Chưa có giao dịch nào
                  </p>
                </div>
              ) : (
                <StaggerList staggerDelay={0.05} className='space-y-3'>
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className='flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors'
                    >
                      <div className='flex items-center gap-3'>
                        {transaction.category && (
                          <div className='text-2xl'>{transaction.category.icon}</div>
                        )}
                        <div>
                          <p className='font-medium text-sm'>
                            {transaction.description}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            {format(new Date(transaction.date), 'MMM dd, yyyy')} •{' '}
                            {transaction.category?.name || 'Chưa phân loại'}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`font-semibold text-sm ${
                          transaction.type === 'INCOME'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {transaction.type === 'INCOME' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  ))}
                </StaggerList>
              )}
            </CardContent>
          </Card>
        </AnimatedCard>
      </div>
    </div>
  );
}
