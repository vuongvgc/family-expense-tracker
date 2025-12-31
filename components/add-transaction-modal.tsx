'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import TransactionForm from '@/components/transaction-form';
import { useRouter } from 'next/navigation';
import { TransactionType } from '@prisma/client';

interface Transaction {
  id: string;
  amount: number;
  description: string;
  type: TransactionType;
  categoryId: string | null;
  date: string;
  category?: {
    id: string;
    name: string;
    icon: string;
  };
}

export default function AddTransactionModal() {
  const [open, setOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(
    null
  );
  const router = useRouter();

  // Listen for edit transaction events
  useEffect(() => {
    const handleEditTransaction = (event: Event) => {
      const customEvent = event as CustomEvent<Transaction>;
      setEditingTransaction(customEvent.detail);
      setOpen(true);
    };

    window.addEventListener('editTransaction', handleEditTransaction);
    return () => {
      window.removeEventListener('editTransaction', handleEditTransaction);
    };
  }, []);

  const handleSuccess = () => {
    setOpen(false);
    setEditingTransaction(null);
    // Trigger refresh event for dashboard
    window.dispatchEvent(new CustomEvent('transactionUpdated'));
    router.refresh();
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditingTransaction(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size='icon'
          className='fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow'
          aria-label='Add transaction'
        >
          <Plus className='h-6 w-6' />
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[600px] max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {editingTransaction ? 'Sửa Giao Dịch' : 'Thêm Giao Dịch'}
          </DialogTitle>
          <DialogDescription>
            {editingTransaction
              ? 'Cập nhật thông tin giao dịch'
              : 'Ghi lại thu nhập hoặc chi tiêu mới cho gia đình của bạn'}
          </DialogDescription>
        </DialogHeader>
        <TransactionForm
          transaction={editingTransaction}
          onSuccess={handleSuccess}
          showCard={false}
        />
      </DialogContent>
    </Dialog>
  );
}
