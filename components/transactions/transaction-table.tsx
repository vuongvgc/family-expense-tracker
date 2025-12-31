'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { MoreHorizontal, Edit, Trash2, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { deleteTransaction } from '@/actions/transaction';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

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

interface TransactionTableProps {
  transactions: Transaction[];
  onEdit?: (transaction: Transaction) => void;
}

export default function TransactionTable({
  transactions,
  onEdit,
}: TransactionTableProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [deleteConfirm, setDeleteConfirm] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    setIsDeleting(true);
    const result = await deleteTransaction(deleteConfirm.id);
    setIsDeleting(false);

    if (result.success) {
      toast({
        title: 'Thành Công',
        description: 'Xóa giao dịch thành công',
      });
      setDeleteConfirm(null);
      router.refresh();
    } else {
      toast({
        title: 'Lỗi',
        description: result.error || 'Không thể xóa giao dịch',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (transaction: Transaction) => {
    if (onEdit) {
      onEdit(transaction);
    } else {
      // Dispatch global event for the modal
      window.dispatchEvent(
        new CustomEvent('editTransaction', { detail: transaction })
      );
    }
  };

  if (transactions.length === 0) {
    return (
      <div className='text-center py-12 border rounded-lg bg-muted/20'>
        <Receipt className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
        <h3 className='text-lg font-semibold mb-2'>Không Tìm Thấy Giao Dịch</h3>
        <p className='text-muted-foreground text-sm'>
          Thử điều chỉnh bộ lọc hoặc thêm giao dịch đầu tiên của bạn
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className='hidden md:block border rounded-lg overflow-hidden'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[120px]'>Ngày</TableHead>
              <TableHead className='w-[180px]'>Danh Mục</TableHead>
              <TableHead>Mô Tả</TableHead>
              <TableHead className='text-right w-[150px]'>Số Tiền</TableHead>
              <TableHead className='w-[80px]'></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id} className='hover:bg-muted/50'>
                <TableCell className='font-medium text-sm'>
                  {format(new Date(transaction.date), 'MMM dd, yyyy')}
                </TableCell>
                <TableCell>
                  {transaction.category ? (
                    <div className='flex items-center gap-2'>
                      <span className='text-xl'>{transaction.category.icon}</span>
                      <span className='text-sm'>{transaction.category.name}</span>
                    </div>
                  ) : (
                    <span className='text-sm text-muted-foreground'>
                      Chưa phân loại
                    </span>
                  )}
                </TableCell>
                <TableCell className='max-w-[300px] truncate'>
                  {transaction.description}
                </TableCell>
                <TableCell
                  className={`text-right font-semibold ${
                    transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {transaction.type === 'INCOME' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                        <MoreHorizontal className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem
                        onClick={() => handleEdit(transaction)}
                        className='cursor-pointer'
                      >
                        <Edit className='h-4 w-4 mr-2' />
                        Sửa
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteConfirm(transaction)}
                        className='cursor-pointer text-red-600 focus:text-red-600'
                      >
                        <Trash2 className='h-4 w-4 mr-2' />
                        Xóa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className='md:hidden space-y-3'>
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className='border rounded-lg p-4 space-y-3 bg-card'
          >
            <div className='flex items-start justify-between gap-2'>
              <div className='flex items-center gap-2 flex-1 min-w-0'>
                {transaction.category ? (
                  <>
                    <span className='text-2xl flex-shrink-0'>
                      {transaction.category.icon}
                    </span>
                    <div className='min-w-0 flex-1'>
                      <p className='font-medium text-sm truncate'>
                        {transaction.category.name}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {format(new Date(transaction.date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className='min-w-0 flex-1'>
                    <p className='font-medium text-sm text-muted-foreground'>
                      Chưa phân loại
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {format(new Date(transaction.date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-8 w-8 p-0 flex-shrink-0'
                  >
                    <MoreHorizontal className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem
                    onClick={() => handleEdit(transaction)}
                    className='cursor-pointer'
                  >
                    <Edit className='h-4 w-4 mr-2' />
                    Sửa
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDeleteConfirm(transaction)}
                    className='cursor-pointer text-red-600 focus:text-red-600'
                  >
                    <Trash2 className='h-4 w-4 mr-2' />
                    Xóa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className='space-y-1'>
              <p className='text-sm line-clamp-2'>{transaction.description}</p>
            </div>
            <div className='flex items-center justify-between pt-2 border-t'>
              <span className='text-xs text-muted-foreground'>
                {transaction.type === 'INCOME' ? 'Thu nhập' : 'Chi tiêu'}
              </span>
              <span
                className={`text-lg font-bold ${
                  transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {transaction.type === 'INCOME' ? '+' : '-'}
                {formatCurrency(transaction.amount)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa Giao Dịch</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa giao dịch này không? Hành động này không thể
              hoàn tác.
              <div className='mt-4 p-3 bg-muted rounded-lg'>
                <p className='font-medium'>{deleteConfirm?.description}</p>
                <p className='text-sm text-muted-foreground mt-1'>
                  {deleteConfirm?.category?.name || 'Chưa phân loại'} •{' '}
                  {deleteConfirm && formatCurrency(deleteConfirm.amount)}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className='bg-red-600 hover:bg-red-700'
            >
              {isDeleting ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
