'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getTransactions,
  getFilteredTransactionsSummary,
} from '@/actions/transaction';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import TransactionTable from '@/components/transactions/transaction-table';
import {
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import {
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
} from 'date-fns';
import { AnimatedCard } from '@/components/ui/animated-card';
import { AnimatedNumber } from '@/components/ui/animated-number';

interface Transaction {
  id: string;
  amount: number;
  description: string;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  category: {
    id: string;
    name: string;
    icon: string;
  } | null;
  createdBy: {
    id: string;
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
  icon: string;
  type: string;
}

interface TransactionsClientProps {
  initialTransactions: Transaction[];
  initialSummary: {
    totalIncome: number;
    totalExpense: number;
    net: number;
  };
  initialPagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  categories: Category[];
}

export default function TransactionsClient({
  initialTransactions,
  initialSummary,
  initialPagination,
  categories,
}: TransactionsClientProps) {
  const router = useRouter();

  const [transactions, setTransactions] =
    useState<Transaction[]>(initialTransactions);
  const [summary, setSummary] = useState(initialSummary);
  const [pagination, setPagination] = useState(initialPagination);
  const [isLoading, setIsLoading] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('this-month');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch transactions and summary when filters change
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      try {
        // Calculate date range based on period
        let fromDate: Date | undefined;
        let toDate: Date | undefined;

        const now = new Date();
        switch (selectedPeriod) {
          case 'this-month':
            fromDate = startOfMonth(now);
            toDate = endOfMonth(now);
            break;
          case 'last-month':
            const lastMonth = subMonths(now, 1);
            fromDate = startOfMonth(lastMonth);
            toDate = endOfMonth(lastMonth);
            break;
          case 'this-year':
            fromDate = startOfYear(now);
            toDate = endOfYear(now);
            break;
          case 'all':
            // No date filter
            break;
        }

        const params = {
          search: searchQuery || undefined,
          categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
          fromDate,
          toDate,
          page: currentPage,
          pageSize: 50,
        };

        const [transactionsResult, summaryResult] = await Promise.all([
          getTransactions(params),
          getFilteredTransactionsSummary(params),
        ]);

        if (transactionsResult.success) {
          setTransactions(transactionsResult.transactions);
          setPagination(transactionsResult.pagination);
        }

        if (summaryResult.success) {
          setSummary(summaryResult.summary);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [searchQuery, selectedCategory, selectedPeriod, currentPage]);

  // Listen for transaction updates
  useEffect(() => {
    const handleUpdate = () => {
      setCurrentPage(1);
      router.refresh();
    };

    window.addEventListener('transactionUpdated', handleUpdate);
    return () => {
      window.removeEventListener('transactionUpdated', handleUpdate);
    };
  }, [router]);

  const handleAddNew = () => {
    window.dispatchEvent(new CustomEvent('openTransactionModal'));
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className='p-8'>
      {/* Header */}
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold mb-2'>Lịch Sử Giao Dịch</h1>
          <p className='text-muted-foreground'>
            Xem và quản lý tất cả giao dịch tài chính của bạn
          </p>
        </div>
        <Button onClick={handleAddNew} size='lg'>
          <Plus className='h-4 w-4 mr-2' />
          Thêm Mới
        </Button>
      </div>

      {/* Filters */}
      <AnimatedCard delay={0} className='mb-6'>
        <CardHeader>
          <CardTitle>Bộ Lọc</CardTitle>
          <CardDescription>
            Tìm kiếm và lọc giao dịch theo nhiều tiêu chí
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 md:grid-cols-3'>
            {/* Search */}
            <div>
              <Label htmlFor='search'>Tìm Kiếm</Label>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                  id='search'
                  placeholder='Tìm theo mô tả...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='pl-9'
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <Label htmlFor='category'>Danh Mục</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id='category'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất Cả Danh Mục</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time Period */}
            <div>
              <Label htmlFor='period'>Khoảng Thời Gian</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger id='period'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='this-month'>Tháng Này</SelectItem>
                  <SelectItem value='last-month'>Tháng Trước</SelectItem>
                  <SelectItem value='this-year'>Năm Nay</SelectItem>
                  <SelectItem value='all'>Tất Cả</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </AnimatedCard>

      {/* Summary Bar */}
      <div className='grid gap-4 md:grid-cols-3 mb-6'>
        <AnimatedCard delay={0.1}>
          <CardHeader className='pb-3'>
            <CardDescription className='flex items-center gap-2'>
              <TrendingUp className='h-4 w-4 text-green-600' />
              Tổng Thu Nhập
            </CardDescription>
            <CardTitle className='text-2xl font-bold text-green-600'>
              <AnimatedNumber value={summary.totalIncome} />
            </CardTitle>
          </CardHeader>
        </AnimatedCard>

        <AnimatedCard delay={0.2}>
          <CardHeader className='pb-3'>
            <CardDescription className='flex items-center gap-2'>
              <TrendingDown className='h-4 w-4 text-red-600' />
              Tổng Chi Tiêu
            </CardDescription>
            <CardTitle className='text-2xl font-bold text-red-600'>
              <AnimatedNumber value={summary.totalExpense} />
            </CardTitle>
          </CardHeader>
        </AnimatedCard>

        <AnimatedCard delay={0.3}>
          <CardHeader className='pb-3'>
            <CardDescription className='flex items-center gap-2'>
              <DollarSign className='h-4 w-4' />
              Số Dư Ròng
            </CardDescription>
            <CardTitle
              className={`text-2xl font-bold ${
                summary.net >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {summary.net >= 0 ? '+' : ''}
              <AnimatedNumber value={summary.net} />
            </CardTitle>
          </CardHeader>
        </AnimatedCard>
      </div>

      {/* Transactions Table */}
      <AnimatedCard delay={0.4}>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Giao Dịch</CardTitle>
              <CardDescription>
                Tìm thấy {pagination.totalCount} giao dịch
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='flex items-center justify-center py-12'>
              <Loader2 className='h-8 w-8 animate-spin text-primary' />
            </div>
          ) : (
            <>
              <TransactionTable transactions={transactions} />

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className='flex items-center justify-between mt-6'>
                  <p className='text-sm text-muted-foreground'>
                    Trang {pagination.page} / {pagination.totalPages}
                  </p>
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className='h-4 w-4 mr-1' />
                      Trước
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === pagination.totalPages}
                    >
                      Sau
                      <ChevronRight className='h-4 w-4 ml-1' />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </AnimatedCard>
    </div>
  );
}
