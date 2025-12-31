'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MoneyInput } from '@/components/ui/money-input';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { Copy, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import {
  updateBudget,
  clonePreviousMonth,
  type BudgetCategoryData,
  type BudgetSummary,
} from '@/actions/budget-actions';

interface BudgetManagementProps {
  initialData: {
    summary: BudgetSummary;
    categories: BudgetCategoryData[];
  };
}

const MONTHS = [
  { value: 1, label: 'Tháng 1' },
  { value: 2, label: 'Tháng 2' },
  { value: 3, label: 'Tháng 3' },
  { value: 4, label: 'Tháng 4' },
  { value: 5, label: 'Tháng 5' },
  { value: 6, label: 'Tháng 6' },
  { value: 7, label: 'Tháng 7' },
  { value: 8, label: 'Tháng 8' },
  { value: 9, label: 'Tháng 9' },
  { value: 10, label: 'Tháng 10' },
  { value: 11, label: 'Tháng 11' },
  { value: 12, label: 'Tháng 12' },
];

const YEARS = Array.from({ length: 5 }, (_, i) => {
  const year = new Date().getFullYear() - 1 + i;
  return { value: year, label: year.toString() };
});

export function BudgetManagement({ initialData }: BudgetManagementProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [month, setMonth] = useState(
    parseInt(searchParams.get('month') || currentMonth.toString())
  );
  const [year, setYear] = useState(
    parseInt(searchParams.get('year') || currentYear.toString())
  );

  const [data, setData] = useState(initialData);
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [savingCategory, setSavingCategory] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<{
    categoryId: string;
    amount: number;
  } | null>(null);

  // Update data when initialData changes
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('month', month.toString());
    params.set('year', year.toString());

    router.push(`/dashboard/budget?${params.toString()}`);
    router.refresh();
  }, [month, year, router]);

  const handleBudgetChange = async (categoryId: string, amount: number) => {
    setSavingCategory(categoryId);

    const result = await updateBudget(categoryId, amount, month, year);

    if (result.success) {
      toast({
        title: 'Thành Công',
        description: 'Cập nhật ngân sách thành công',
      });

      // Update local state optimistically
      setData((prev) => ({
        ...prev,
        categories: prev.categories.map((cat) =>
          cat.categoryId === categoryId ? { ...cat, limit: amount } : cat
        ),
      }));

      setEditingCategory(null);
    } else {
      toast({
        title: 'Lỗi',
        description: result.message,
        variant: 'destructive',
      });
    }

    setSavingCategory(null);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
  };

  const handleClone = async () => {
    setIsCloning(true);

    const result = await clonePreviousMonth(month, year);

    if (result.success) {
      toast({
        title: 'Thành Công',
        description: result.message,
      });
      router.refresh();
    } else {
      toast({
        title: 'Lỗi',
        description: result.message,
        variant: 'destructive',
      });
    }

    setIsCloning(false);
    setShowCloneDialog(false);
  };

  const { summary, categories } = data;

  // Calculate previous month for clone button
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  return (
    <div className='space-y-6'>
      {/* Header with Period Picker */}
      <Card>
        <CardHeader>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <div>
              <CardTitle>Kế Hoạch Ngân Sách Hàng Tháng</CardTitle>
              <CardDescription>
                Đặt giới hạn chi tiêu cho từng danh mục và theo dõi tiến độ
              </CardDescription>
            </div>
            <div className='flex items-center gap-3'>
              <div className='flex items-center gap-2'>
                <Select
                  value={month.toString()}
                  onValueChange={(value) => setMonth(parseInt(value))}
                >
                  <SelectTrigger className='w-[130px]'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={m.value.toString()}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={year.toString()}
                  onValueChange={(value) => setYear(parseInt(value))}
                >
                  <SelectTrigger className='w-[100px]'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y.value} value={y.value.toString()}>
                        {y.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setShowCloneDialog(true)}
                disabled={isCloning}
              >
                <Copy className='h-4 w-4 mr-2' />
                Sao Chép từ {MONTHS[prevMonth - 1].label}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary KPI Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card>
          <CardHeader className='pb-3'>
            <CardDescription>Tổng Ngân Sách</CardDescription>
            <CardTitle className='text-2xl text-blue-600'>
              {formatCurrency(summary.totalBudget)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-xs text-muted-foreground'>
              Tổng giới hạn chi tiêu dự kiến
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardDescription>Tổng Đã Chi</CardDescription>
            <CardTitle className='text-2xl text-gray-600'>
              {formatCurrency(summary.totalSpent)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-xs text-muted-foreground'>
              {summary.totalBudget > 0
                ? `${((summary.totalSpent / summary.totalBudget) * 100).toFixed(
                    1
                  )}% ngân sách`
                : 'Chưa đặt ngân sách'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardDescription>Còn Lại</CardDescription>
            <CardTitle
              className={`text-2xl flex items-center gap-2 ${
                summary.remaining < 0 ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {summary.remaining < 0 ? (
                <TrendingUp className='h-5 w-5' />
              ) : (
                <Wallet className='h-5 w-5' />
              )}
              {formatCurrency(Math.abs(summary.remaining))}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-xs font-medium ${
                summary.remaining < 0 ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {summary.remaining < 0 ? 'Vượt ngân sách' : 'Dưới ngân sách'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Ngân Sách Theo Danh Mục</CardTitle>
          <CardDescription>
            Đặt giới hạn và theo dõi chi tiêu cho từng danh mục
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className='text-center py-12 text-muted-foreground'>
              Không tìm thấy danh mục chi tiêu. Hãy tạo danh mục trước.
            </div>
          ) : (
            <div className='space-y-6'>
              {categories.map((category) => {
                const percentage =
                  category.limit > 0 ? (category.spent / category.limit) * 100 : 0;
                const isOverBudget =
                  category.spent > category.limit && category.limit > 0;
                const isEditing =
                  editingCategory?.categoryId === category.categoryId;
                const currentValue = isEditing
                  ? editingCategory.amount
                  : category.limit;

                return (
                  <div
                    key={category.categoryId}
                    className='border rounded-lg p-4 space-y-3'
                  >
                    {/* Category Header */}
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <span className='text-2xl'>{category.categoryIcon}</span>
                        <div>
                          <h3 className='font-medium'>{category.categoryName}</h3>
                          <p className='text-sm text-muted-foreground'>
                            Đã chi: {formatCurrency(category.spent)}
                            {category.limit > 0 &&
                              ` / ${formatCurrency(category.limit)}`}
                          </p>
                        </div>
                      </div>
                      <div className='flex items-end gap-2'>
                        <div className='w-[200px]'>
                          <label className='text-xs text-muted-foreground block mb-1'>
                            Giới Hạn Ngân Sách
                          </label>
                          <MoneyInput
                            value={currentValue}
                            onValueChange={(value) =>
                              setEditingCategory({
                                categoryId: category.categoryId,
                                amount: value,
                              })
                            }
                            disabled={savingCategory === category.categoryId}
                            placeholder='Đặt giới hạn'
                          />
                        </div>
                        {isEditing && (
                          <div className='flex gap-2'>
                            <Button
                              size='sm'
                              onClick={() =>
                                handleBudgetChange(
                                  category.categoryId,
                                  editingCategory.amount
                                )
                              }
                              disabled={savingCategory === category.categoryId}
                            >
                              {savingCategory === category.categoryId
                                ? 'Đang lưu...'
                                : 'Lưu'}
                            </Button>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={handleCancelEdit}
                              disabled={savingCategory === category.categoryId}
                            >
                              Hủy
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {category.limit > 0 && (
                      <div className='space-y-1'>
                        <div className='flex items-center justify-between text-xs'>
                          <span className='text-muted-foreground'>
                            Đã dùng {percentage.toFixed(1)}%
                          </span>
                          {isOverBudget && (
                            <span className='text-red-600 font-medium'>
                              Vượt {formatCurrency(category.spent - category.limit)}
                            </span>
                          )}
                        </div>
                        <Progress
                          value={Math.min(percentage, 100)}
                          className={`h-2 ${
                            isOverBudget
                              ? '[&>div]:bg-red-500'
                              : percentage >= 80
                              ? '[&>div]:bg-yellow-500'
                              : '[&>div]:bg-green-500'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clone Confirmation Dialog */}
      <AlertDialog open={showCloneDialog} onOpenChange={setShowCloneDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sao Chép Ngân Sách Tháng Trước?</AlertDialogTitle>
            <AlertDialogDescription>
              Thao tác này sẽ sao chép tất cả giới hạn ngân sách từ{' '}
              <strong>
                {MONTHS[prevMonth - 1].label} {prevYear}
              </strong>{' '}
              sang{' '}
              <strong>
                {MONTHS[month - 1].label} {year}
              </strong>
              . Ngân sách hiện tại của tháng đích sẽ bị ghi đè.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCloning}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleClone} disabled={isCloning}>
              {isCloning ? 'Đang sao chép...' : 'Sao Chép Ngân Sách'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
