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
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  DollarSign,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import IncomeExpenseChart from '@/components/dashboard/income-expense-chart';

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
    <div className='p-8'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold mb-2'>Tổng Quan Tài Chính</h1>
        <p className='text-muted-foreground'>
          Tổng quan sức khỏe tài chính gia đình của bạn
        </p>
      </div>

      {/* Global Summary - Top 4 Cards */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6'>
        {/* Net Worth */}
        <Card className='bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20'>
          <CardHeader className='pb-3'>
            <CardDescription className='flex items-center gap-2'>
              <DollarSign className='h-4 w-4' />
              Tài Sản Ròng
            </CardDescription>
            <CardTitle className='text-3xl font-bold text-primary'>
              {formatCurrency(summary.netWorth)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary.netWorth >= 0 ? (
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

        {/* Total Assets */}
        <Card>
          <CardHeader className='pb-3'>
            <CardDescription className='flex items-center gap-2'>
              <Wallet className='h-4 w-4' />
              Tổng Tài Sản
            </CardDescription>
            <CardTitle className='text-3xl font-bold text-green-600'>
              {formatCurrency(summary.totalAssets)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-muted-foreground'>Giá trị tài sản hiện tại</p>
          </CardContent>
        </Card>

        {/* Total Debt */}
        <Card>
          <CardHeader className='pb-3'>
            <CardDescription className='flex items-center gap-2'>
              <CreditCard className='h-4 w-4' />
              Tổng Khoản Nợ
            </CardDescription>
            <CardTitle className='text-3xl font-bold text-red-600'>
              {formatCurrency(summary.totalDebts)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-muted-foreground'>Số dư còn lại</p>
          </CardContent>
        </Card>

        {/* Budget Progress */}
        <Card>
          <CardHeader className='pb-3'>
            <CardDescription className='flex items-center gap-2'>
              <TrendingUp className='h-4 w-4' />
              Tiến Độ Ngân Sách
            </CardDescription>
            <CardTitle
              className={`text-3xl font-bold ${getBudgetColor(
                summary.budgetProgress.percentage
              )}`}
            >
              {summary.budgetProgress.percentage.toFixed(0)}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress
              value={Math.min(summary.budgetProgress.percentage, 100)}
              className='mb-2'
            />
            <p className='text-sm text-muted-foreground'>
              {formatCurrency(summary.budgetProgress.spent)} /{' '}
              {formatCurrency(summary.budgetProgress.total)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Two Columns */}
      <div className='grid gap-6 lg:grid-cols-5 mb-6'>
        {/* Left Side - Income vs Expenses Chart (60%) */}
        <Card className='lg:col-span-3'>
          <CardHeader>
            <CardTitle>Thu Nhập vs Chi Tiêu</CardTitle>
            <CardDescription>So sánh 6 tháng gần đây</CardDescription>
          </CardHeader>
          <CardContent>
            <IncomeExpenseChart data={summary.incomeVsExpenses} />
          </CardContent>
        </Card>

        {/* Right Side - Budget Watchlist (40%) */}
        <Card className='lg:col-span-2'>
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
              <div className='space-y-4'>
                {watchlist.map((item) => (
                  <div key={item.categoryId} className='space-y-2'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <span className='text-lg'>{item.categoryIcon}</span>
                        <span className='font-medium text-sm'>
                          {item.categoryName}
                        </span>
                      </div>
                      <span
                        className={`text-sm font-bold ${getBudgetColor(
                          item.percentage
                        )}`}
                      >
                        {item.percentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className='relative h-2 w-full overflow-hidden rounded-full bg-gray-200'>
                      <div
                        className={`h-full transition-all ${getBudgetBgColor(
                          item.percentage
                        )}`}
                        style={{ width: `${Math.min(item.percentage, 100)}%` }}
                      />
                    </div>
                    <p className='text-xs text-muted-foreground'>
                      {formatCurrency(item.spent)} / {formatCurrency(item.budget)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className='grid gap-6 lg:grid-cols-2'>
        {/* Active Debts */}
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
              <div className='space-y-4'>
                {debts.map((debt) => (
                  <div key={debt.id} className='space-y-2'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='font-medium text-sm'>{debt.title}</p>
                        {debt.dueDate && (
                          <p className='text-xs text-muted-foreground flex items-center gap-1'>
                            <Calendar className='h-3 w-3' />
                            Hạn: {format(new Date(debt.dueDate), 'MMM dd, yyyy')}
                          </p>
                        )}
                      </div>
                      <span className='text-sm font-medium text-red-600'>
                        {formatCurrency(debt.remainingAmount)}
                      </span>
                    </div>
                    <Progress value={debt.progress} className='h-2' />
                    <p className='text-xs text-muted-foreground'>
                      Đã trả {formatCurrency(debt.paidAmount)} trong tổng số{' '}
                      {formatCurrency(debt.totalAmount)} ({debt.progress.toFixed(0)}
                      %)
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
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
              <div className='space-y-3'>
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
