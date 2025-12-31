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
        title: 'Error',
        description: 'Title is required',
        variant: 'destructive',
      });
      return;
    }

    if (newDebt.totalAmount <= 0) {
      toast({
        title: 'Error',
        description: 'Amount must be greater than zero',
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
        title: 'Success',
        description: result.message,
      });
      setShowCreateDialog(false);
      setNewDebt({ title: '', description: '', totalAmount: 0, dueDate: '' });
      router.refresh();
    } else {
      toast({
        title: 'Error',
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
        title: 'Error',
        description: 'Payment amount must be greater than zero',
        variant: 'destructive',
      });
      return;
    }

    if (paymentAmount > selectedDebt.remainingAmount) {
      toast({
        title: 'Error',
        description: 'Payment exceeds remaining debt',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const result = await makePayment(selectedDebt.id, paymentAmount);

    if (result.success) {
      toast({
        title: 'Success',
        description: result.message,
      });
      setShowPaymentDialog(false);
      setPaymentAmount(0);
      setSelectedDebt(null);
      router.refresh();
    } else {
      toast({
        title: 'Error',
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
        title: 'Success',
        description: result.message,
      });
      setShowDeleteDialog(false);
      setSelectedDebt(null);
      router.refresh();
    } else {
      toast({
        title: 'Error',
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
          <h2 className='text-3xl font-bold text-gray-900'>Debt Management</h2>
          <p className='text-muted-foreground mt-1'>
            Track money you owe and monitor repayment progress
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className='h-4 w-4 mr-2' />
          Add Debt
        </Button>
      </div>

      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardHeader className='pb-3'>
            <CardDescription>Total Outstanding</CardDescription>
            <CardTitle className='text-2xl text-red-600'>
              {formatCurrency(initialSummary.totalOutstanding)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-xs text-muted-foreground'>Amount left to pay</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardDescription>Total Debts</CardDescription>
            <CardTitle className='text-2xl text-gray-600'>
              {initialSummary.totalDebts}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-xs text-muted-foreground'>All debt records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardDescription>Active Debts</CardDescription>
            <CardTitle className='text-2xl text-orange-600'>
              {initialSummary.activeDebts}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-xs text-muted-foreground'>Currently owing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardDescription>Paid Off</CardDescription>
            <CardTitle className='text-2xl text-green-600'>
              {initialSummary.paidDebts}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-xs text-muted-foreground'>Fully repaid</p>
          </CardContent>
        </Card>
      </div>

      {/* Debt Cards */}
      {initialDebts.length === 0 ? (
        <Card>
          <CardContent className='py-12 text-center text-muted-foreground'>
            <Wallet className='h-12 w-12 mx-auto mb-4 opacity-50' />
            <p>No debts recorded. Click "Add Debt" to start tracking.</p>
          </CardContent>
        </Card>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {initialDebts.map((debt) => {
            const paidAmount = debt.totalAmount - debt.remainingAmount;
            const progressPercentage = (paidAmount / debt.totalAmount) * 100;
            const isPaid = debt.status === 'PAID';

            return (
              <Card key={debt.id} className={isPaid ? 'bg-green-50' : ''}>
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
                      <p className='text-muted-foreground'>Total Amount</p>
                      <p className='font-medium'>
                        {formatCurrency(debt.totalAmount)}
                      </p>
                    </div>
                    <div>
                      <p className='text-muted-foreground'>Remaining</p>
                      <p className='font-medium text-red-600'>
                        {formatCurrency(debt.remainingAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className='space-y-2'>
                    <div className='flex items-center justify-between text-xs'>
                      <span className='text-muted-foreground'>
                        {progressPercentage.toFixed(1)}% paid
                      </span>
                      <span className='text-muted-foreground'>
                        {formatCurrency(paidAmount)} /{' '}
                        {formatCurrency(debt.totalAmount)}
                      </span>
                    </div>
                    <Progress
                      value={progressPercentage}
                      className={`h-2 ${
                        isPaid ? '[&>div]:bg-green-500' : '[&>div]:bg-blue-500'
                      }`}
                    />
                  </div>

                  {/* Due Date */}
                  {debt.dueDate && (
                    <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                      <Calendar className='h-4 w-4' />
                      <span>Due: {new Date(debt.dueDate).toLocaleDateString()}</span>
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
                      Make a Payment
                    </Button>
                  )}

                  {/* Payment History */}
                  {debt.payments.length > 0 && (
                    <div className='border-t pt-4'>
                      <h4 className='text-sm font-medium mb-2'>Recent Payments</h4>
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
                            +{debt.payments.length - 3} more payments
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Debt Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Debt</DialogTitle>
            <DialogDescription>
              Record a new debt to track repayment progress
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='title'>Title *</Label>
              <Input
                id='title'
                placeholder='e.g., Bank Loan, Credit Card'
                value={newDebt.title}
                onChange={(e) => setNewDebt({ ...newDebt, title: e.target.value })}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='description'>Description</Label>
              <Textarea
                id='description'
                placeholder='Optional details about this debt'
                value={newDebt.description}
                onChange={(e) =>
                  setNewDebt({ ...newDebt, description: e.target.value })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='amount'>Total Amount (VND) *</Label>
              <MoneyInput
                id='amount'
                value={newDebt.totalAmount}
                onValueChange={(value) =>
                  setNewDebt({ ...newDebt, totalAmount: value })
                }
                placeholder='Enter amount'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='dueDate'>Due Date (Optional)</Label>
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
              Cancel
            </Button>
            <Button onClick={handleCreateDebt} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Debt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Make Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make a Payment</DialogTitle>
            <DialogDescription>
              Record a payment for: {selectedDebt?.title}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='p-4 bg-gray-50 rounded-lg space-y-2'>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Remaining Amount</span>
                <span className='font-medium'>
                  {formatCurrency(selectedDebt?.remainingAmount || 0)}
                </span>
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='paymentAmount'>Payment Amount (VND) *</Label>
              <MoneyInput
                id='paymentAmount'
                value={paymentAmount}
                onValueChange={setPaymentAmount}
                placeholder='Enter payment amount'
              />
            </div>
            <p className='text-xs text-muted-foreground'>
              This payment will be recorded as an expense in your transactions.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowPaymentDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleMakePayment} disabled={isSubmitting}>
              {isSubmitting ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Debt?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedDebt?.title}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDebt}
              disabled={isSubmitting}
              className='bg-red-600 hover:bg-red-700'
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
