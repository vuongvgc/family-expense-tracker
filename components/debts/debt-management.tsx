'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { MoneyInput } from '@/components/ui/money-input';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar,
  CreditCard,
  Plus,
  TrendingDown,
  Trash2,
  Wallet,
  CheckCircle2,
} from 'lucide-react';
import {
  createDebt,
  makePayment,
  deleteDebt,
  type DebtWithPayments,
  type DebtSummary,
} from '@/actions/debt';
import { useRouter } from 'next/navigation';
import { AnimatedCard } from '@/components/ui/animated-card';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { AnimatedProgress } from '@/components/ui/animated-progress';

interface DebtManagementProps {
  initialSummary: DebtSummary;
  initialDebts: DebtWithPayments[];
}

export function DebtManagement({
  initialSummary,
  initialDebts,
}: DebtManagementProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<DebtWithPayments | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create debt form
  const [newDebt, setNewDebt] = useState({
    title: '',
    description: '',
    totalAmount: 0,
    dueDate: '',
  });

  // Payment form
  const [paymentAmount, setPaymentAmount] = useState(0);

  const handleCreateDebt = async () => {
    if (!newDebt.title.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Tiêu đề là bắt buộc',
        variant: 'destructive',
      });
      return;
    }

    if (newDebt.totalAmount <= 0) {
      toast({
        title: 'Lỗi',
        description: 'Số tiền phải lớn hơn 0',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const result = await createDebt(
      newDebt.title,
      newDebt.totalAmount,
      newDebt.description,
      newDebt.dueDate ? new Date(newDebt.dueDate) : undefined
    );

    if (result.success) {
      toast({
        title: 'Thành Công',
        description: result.message,
      });
      setShowCreateDialog(false);
      setNewDebt({ title: '', description: '', totalAmount: 0, dueDate: '' });
      router.refresh();
    } else {
      toast({
        title: 'Lỗi',
        description: result.message,
        variant: 'destructive',
      });
    }

    setIsSubmitting(false);
  };

  const handleMakePayment = async () => {
    if (!selectedDebt) return;

    if (paymentAmount <= 0) {
      toast({
        title: 'Lỗi',
        description: 'Số tiền thanh toán phải lớn hơn 0',
        variant: 'destructive',
      });
      return;
    }

    if (paymentAmount > selectedDebt.remainingAmount) {
      toast({
        title: 'Lỗi',
        description: 'Số tiền thanh toán vượt quá số nợ còn lại',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const result = await makePayment(selectedDebt.id, paymentAmount);

    if (result.success) {
      toast({
        title: 'Thành Công',
        description: result.message,
      });
      setShowPaymentDialog(false);
      setPaymentAmount(0);
      setSelectedDebt(null);
      router.refresh();
    } else {
      toast({
        title: 'Lỗi',
        description: result.message,
        variant: 'destructive',
      });
    }

    setIsSubmitting(false);
  };

  const handleDeleteDebt = async () => {
    if (!selectedDebt) return;

    setIsSubmitting(true);

    const result = await deleteDebt(selectedDebt.id);

    if (result.success) {
      toast({
        title: 'Thành Công',
        description: result.message,
      });
      setShowDeleteDialog(false);
      setSelectedDebt(null);
      router.refresh();
    } else {
      toast({
        title: 'Lỗi',
        description: result.message,
        variant: 'destructive',
      });
    }

    setIsSubmitting(false);
  };

  return (
    <div className='space-y-6'>
      {/* Header with Create Button */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-3xl font-bold text-gray-900'>Quản Lý Khoản Nợ</h2>
          <p className='text-muted-foreground mt-1'>
            Theo dõi số tiền bạn nợ và giám sát tiến độ trả nợ
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className='h-4 w-4 mr-2' />
          Thêm Khoản Nợ
        </Button>
      </div>

      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <AnimatedCard delay={0}>
          <CardHeader className='pb-3'>
            <CardDescription>Tổng Nợ Chưa Trả</CardDescription>
            <CardTitle className='text-2xl text-red-600'>
              <AnimatedNumber value={initialSummary.totalOutstanding} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-xs text-muted-foreground'>Số tiền còn phải trả</p>
          </CardContent>
        </AnimatedCard>

        <AnimatedCard delay={0.1}>
          <CardHeader className='pb-3'>
            <CardDescription>Tổng Số Khoản Nợ</CardDescription>
            <CardTitle className='text-2xl text-gray-600'>
              {initialSummary.totalDebts}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-xs text-muted-foreground'>Tất cả bản ghi nợ</p>
          </CardContent>
        </AnimatedCard>

        <AnimatedCard delay={0.2}>
          <CardHeader className='pb-3'>
            <CardDescription>Khoản Nợ Hoạt Động</CardDescription>
            <CardTitle className='text-2xl text-orange-600'>
              {initialSummary.activeDebts}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-xs text-muted-foreground'>Đang nợ</p>
          </CardContent>
        </AnimatedCard>

        <AnimatedCard delay={0.3}>
          <CardHeader className='pb-3'>
            <CardDescription>Đã Thanh Toán</CardDescription>
            <CardTitle className='text-2xl text-green-600'>
              {initialSummary.paidDebts}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-xs text-muted-foreground'>Đã trả hết</p>
          </CardContent>
        </AnimatedCard>
      </div>

      {/* Debt Cards */}
      {initialDebts.length === 0 ? (
        <AnimatedCard delay={0.4}>
          <CardContent className='py-12 text-center text-muted-foreground'>
            <Wallet className='h-12 w-12 mx-auto mb-4 opacity-50' />
            <p>
              Chưa ghi nhận khoản nợ nào. Nhấp "Thêm Khoản Nợ" để bắt đầu theo dõi.
            </p>
          </CardContent>
        </AnimatedCard>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {initialDebts.map((debt, index) => {
            const paidAmount = debt.totalAmount - debt.remainingAmount;
            const progressPercentage = (paidAmount / debt.totalAmount) * 100;
            const isPaid = debt.status === 'PAID';

            return (
              <AnimatedCard
                key={debt.id}
                delay={0.4 + index * 0.05}
                className={isPaid ? 'bg-green-50' : ''}
              >
                <CardHeader>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <CardTitle className='flex items-center gap-2'>
                        {debt.title}
                        {isPaid && (
                          <CheckCircle2 className='h-5 w-5 text-green-600' />
                        )}
                      </CardTitle>
                      {debt.description && (
                        <CardDescription className='mt-1'>
                          {debt.description}
                        </CardDescription>
                      )}
                    </div>
                    {!isPaid && debt.payments.length === 0 && (
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => {
                          setSelectedDebt(debt);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className='h-4 w-4 text-red-600' />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {/* Amount Info */}
                  <div className='grid grid-cols-2 gap-4 text-sm'>
                    <div>
                      <p className='text-muted-foreground'>Tổng Số Tiền</p>
                      <p className='font-medium'>
                        {formatCurrency(debt.totalAmount)}
                      </p>
                    </div>
                    <div>
                      <p className='text-muted-foreground'>Còn Lại</p>
                      <p className='font-medium text-red-600'>
                        {formatCurrency(debt.remainingAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className='space-y-2'>
                    <div className='flex items-center justify-between text-xs'>
                      <span className='text-muted-foreground'>
                        Đã trả {progressPercentage.toFixed(1)}%
                      </span>
                      <span className='text-muted-foreground'>
                        {formatCurrency(paidAmount)} /{' '}
                        {formatCurrency(debt.totalAmount)}
                      </span>
                    </div>
                    <AnimatedProgress
                      value={progressPercentage}
                      indicatorClassName={isPaid ? 'bg-green-500' : 'bg-blue-500'}
                    />
                  </div>

                  {/* Due Date */}
                  {debt.dueDate && (
                    <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                      <Calendar className='h-4 w-4' />
                      <span>Hạn: {new Date(debt.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}

                  {/* Make Payment Button */}
                  {!isPaid && (
                    <Button
                      className='w-full'
                      onClick={() => {
                        setSelectedDebt(debt);
                        setPaymentAmount(0);
                        setShowPaymentDialog(true);
                      }}
                    >
                      <CreditCard className='h-4 w-4 mr-2' />
                      Thực Hiện Thanh Toán
                    </Button>
                  )}

                  {/* Payment History */}
                  {debt.payments.length > 0 && (
                    <div className='border-t pt-4'>
                      <h4 className='text-sm font-medium mb-2'>
                        Thanh Toán Gần Đây
                      </h4>
                      <div className='space-y-2'>
                        {debt.payments.slice(0, 3).map((payment) => (
                          <div
                            key={payment.id}
                            className='flex items-center justify-between text-sm'
                          >
                            <span className='text-muted-foreground'>
                              {new Date(payment.date).toLocaleDateString()}
                            </span>
                            <span className='font-medium text-green-600'>
                              {formatCurrency(payment.amount)}
                            </span>
                          </div>
                        ))}
                        {debt.payments.length > 3 && (
                          <p className='text-xs text-muted-foreground'>
                            +{debt.payments.length - 3} thanh toán khác
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </AnimatedCard>
            );
          })}
        </div>
      )}

      {/* Create Debt Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm Khoản Nợ Mới</DialogTitle>
            <DialogDescription>
              Ghi nhận khoản nợ mới để theo dõi tiến độ trả nợ
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='title'>Tiêu Đề *</Label>
              <Input
                id='title'
                placeholder='Ví dụ: Vay Ngân Hàng, Thẻ Tín Dụng'
                value={newDebt.title}
                onChange={(e) => setNewDebt({ ...newDebt, title: e.target.value })}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='description'>Mô Tả</Label>
              <Textarea
                id='description'
                placeholder='Chi tiết tùy chọn về khoản nợ này'
                value={newDebt.description}
                onChange={(e) =>
                  setNewDebt({ ...newDebt, description: e.target.value })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='amount'>Tổng Số Tiền (VND) *</Label>
              <MoneyInput
                id='amount'
                value={newDebt.totalAmount}
                onValueChange={(value) =>
                  setNewDebt({ ...newDebt, totalAmount: value })
                }
                placeholder='Nhập số tiền'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='dueDate'>Hạn Trả (Tùy chọn)</Label>
              <Input
                id='dueDate'
                type='date'
                value={newDebt.dueDate}
                onChange={(e) => setNewDebt({ ...newDebt, dueDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowCreateDialog(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button onClick={handleCreateDebt} disabled={isSubmitting}>
              {isSubmitting ? 'Đang tạo...' : 'Tạo Khoản Nợ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Make Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thực Hiện Thanh Toán</DialogTitle>
            <DialogDescription>
              Ghi nhận thanh toán cho: {selectedDebt?.title}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='p-4 bg-gray-50 rounded-lg space-y-2'>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Số Tiền Còn Lại</span>
                <span className='font-medium'>
                  {formatCurrency(selectedDebt?.remainingAmount || 0)}
                </span>
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='paymentAmount'>Số Tiền Thanh Toán (VND) *</Label>
              <MoneyInput
                id='paymentAmount'
                value={paymentAmount}
                onValueChange={setPaymentAmount}
                placeholder='Nhập số tiền thanh toán'
              />
            </div>
            <p className='text-xs text-muted-foreground'>
              Khoản thanh toán này sẽ được ghi nhận là chi tiêu trong các giao dịch
              của bạn.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowPaymentDialog(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button onClick={handleMakePayment} disabled={isSubmitting}>
              {isSubmitting ? 'Đang ghi...' : 'Ghi Nhận Thanh Toán'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa Khoản Nợ?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa "{selectedDebt?.title}" không? Thao tác này
              không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDebt}
              disabled={isSubmitting}
              className='bg-red-600 hover:bg-red-700'
            >
              {isSubmitting ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
