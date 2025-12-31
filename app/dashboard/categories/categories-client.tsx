'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogTrigger,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { createCategory, updateCategory, deleteCategory } from '@/actions/category';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { TransactionType } from '@prisma/client';

interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  _count: {
    transactions: number;
  };
}

interface CategoriesPageClientProps {
  categories: Category[];
}

export default function CategoriesPageClient({
  categories: initialCategories,
}: CategoriesPageClientProps) {
  const [isPending, startTransition] = useTransition();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const expenseCategories = initialCategories.filter(
    (cat) => cat.type === 'EXPENSE'
  );
  const incomeCategories = initialCategories.filter((cat) => cat.type === 'INCOME');

  const handleCreateCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    startTransition(async () => {
      const formData = new FormData(e.currentTarget);
      const result = await createCategory(formData);

      if (result?.error) {
        toast({
          title: 'Lỗi',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Thành Công',
          description: 'Tạo danh mục thành công',
        });
        setIsCreateDialogOpen(false);
        e.currentTarget.reset();
      }
    });
  };

  const handleUpdateCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!editingCategory) return;

    startTransition(async () => {
      const formData = new FormData(e.currentTarget);
      const result = await updateCategory(editingCategory.id, formData);

      if (result?.error) {
        toast({
          title: 'Lỗi',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Thành Công',
          description: 'Cập nhật danh mục thành công',
        });
        setIsEditDialogOpen(false);
        setEditingCategory(null);
      }
    });
  };

  const handleDeleteCategory = async (categoryId: string) => {
    setDeletingCategoryId(categoryId);

    startTransition(async () => {
      const result = await deleteCategory(categoryId);

      if (result?.error) {
        toast({
          title: 'Lỗi',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Thành Công',
          description: 'Xóa danh mục thành công',
        });
      }

      setDeletingCategoryId(null);
    });
  };

  const CategoryList = ({ categories }: { categories: Category[] }) => (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
      {categories.map((category) => (
        <Card key={category.id} className='relative'>
          <CardContent className='pt-6'>
            <div className='flex items-start justify-between'>
              <div className='flex items-center gap-3 flex-1'>
                <div className='text-4xl'>{category.icon}</div>
                <div className='flex-1 min-w-0'>
                  <h3 className='font-semibold text-lg truncate'>{category.name}</h3>
                  <p className='text-sm text-muted-foreground'>
                    {category._count.transactions} giao dịch
                  </p>
                </div>
              </div>

              <div className='flex gap-1 ml-2'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => {
                    setEditingCategory(category);
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Pencil className='h-4 w-4' />
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant='ghost'
                      size='sm'
                      disabled={deletingCategoryId === category.id}
                    >
                      {deletingCategoryId === category.id ? (
                        <Loader2 className='h-4 w-4 animate-spin' />
                      ) : (
                        <Trash2 className='h-4 w-4 text-destructive' />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Xóa Danh Mục?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Bạn có chắc chắn muốn xóa "{category.name}" không?
                        {category._count.transactions > 0 && (
                          <span className='block mt-2 text-destructive font-medium'>
                            Cảnh báo: Danh mục này có {category._count.transactions}{' '}
                            giao dịch liên quan và không thể xóa.
                          </span>
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteCategory(category.id)}
                        className='bg-destructive hover:bg-destructive/90'
                        disabled={category._count.transactions > 0}
                      >
                        Xóa
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {categories.length === 0 && (
        <div className='col-span-full text-center py-12 text-muted-foreground'>
          Không tìm thấy danh mục. Hãy tạo danh mục đầu tiên của bạn!
        </div>
      )}
    </div>
  );

  const CategoryForm = ({
    category,
    type,
    onSubmit,
  }: {
    category?: Category;
    type: TransactionType;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  }) => (
    <form onSubmit={onSubmit} className='space-y-4'>
      <input type='hidden' name='type' value={type} />

      <div className='space-y-2'>
        <Label htmlFor='name'>Tên Danh Mục</Label>
        <Input
          id='name'
          name='name'
          type='text'
          placeholder='Ví dụ: Mua sắm'
          defaultValue={category?.name}
          required
          maxLength={50}
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='icon'>Biểu Tượng (Emoji)</Label>
        <Input
          id='icon'
          name='icon'
          type='text'
          placeholder='Ví dụ: 🛒'
          defaultValue={category?.icon}
          required
          maxLength={10}
        />
        <p className='text-xs text-muted-foreground'>
          Nhập ký tự emoji (ví dụ: 🍔, 💰, 🚗)
        </p>
      </div>

      <DialogFooter>
        <Button type='submit' disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Đang lưu...
            </>
          ) : category ? (
            'Cập Nhật Danh Mục'
          ) : (
            'Tạo Danh Mục'
          )}
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <div className='container mx-auto p-6 max-w-7xl'>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-3xl font-bold'>Quản Lý Danh Mục</h1>
          <p className='text-muted-foreground mt-1'>
            Sắp xếp thu nhập và chi tiêu của bạn với danh mục tùy chỉnh
          </p>
        </div>
      </div>

      <Tabs defaultValue='expense' className='space-y-6'>
        <TabsList className='grid w-full max-w-md grid-cols-2'>
          <TabsTrigger value='expense'>
            Danh Mục Chi Tiêu ({expenseCategories.length})
          </TabsTrigger>
          <TabsTrigger value='income'>
            Danh Mục Thu Nhập ({incomeCategories.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value='expense' className='space-y-4'>
          <div className='flex justify-end'>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className='mr-2 h-4 w-4' />
                  Thêm Danh Mục Chi Tiêu
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tạo Danh Mục Chi Tiêu</DialogTitle>
                  <DialogDescription>
                    Thêm danh mục mới để theo dõi chi tiêu
                  </DialogDescription>
                </DialogHeader>
                <CategoryForm type='EXPENSE' onSubmit={handleCreateCategory} />
              </DialogContent>
            </Dialog>
          </div>

          <CategoryList categories={expenseCategories} />
        </TabsContent>

        <TabsContent value='income' className='space-y-4'>
          <div className='flex justify-end'>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className='mr-2 h-4 w-4' />
                  Thêm Danh Mục Thu Nhập
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tạo Danh Mục Thu Nhập</DialogTitle>
                  <DialogDescription>
                    Thêm danh mục mới để theo dõi thu nhập
                  </DialogDescription>
                </DialogHeader>
                <CategoryForm type='INCOME' onSubmit={handleCreateCategory} />
              </DialogContent>
            </Dialog>
          </div>

          <CategoryList categories={incomeCategories} />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh Sửa Danh Mục</DialogTitle>
            <DialogDescription>
              Cập nhật tên hoặc biểu tượng danh mục
            </DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <CategoryForm
              category={editingCategory}
              type={editingCategory.type}
              onSubmit={handleUpdateCategory}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
