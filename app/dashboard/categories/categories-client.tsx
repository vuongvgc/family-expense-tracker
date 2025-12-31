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
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Category created successfully',
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
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Category updated successfully',
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
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Category deleted successfully',
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
                    {category._count.transactions} transaction(s)
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
                      <AlertDialogTitle>Delete Category?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{category.name}"?
                        {category._count.transactions > 0 && (
                          <span className='block mt-2 text-destructive font-medium'>
                            Warning: This category has {category._count.transactions}{' '}
                            associated transaction(s) and cannot be deleted.
                          </span>
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteCategory(category.id)}
                        className='bg-destructive hover:bg-destructive/90'
                        disabled={category._count.transactions > 0}
                      >
                        Delete
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
          No categories found. Create your first category!
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
        <Label htmlFor='name'>Category Name</Label>
        <Input
          id='name'
          name='name'
          type='text'
          placeholder='e.g., Groceries'
          defaultValue={category?.name}
          required
          maxLength={50}
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='icon'>Icon (Emoji)</Label>
        <Input
          id='icon'
          name='icon'
          type='text'
          placeholder='e.g., 🛒'
          defaultValue={category?.icon}
          required
          maxLength={10}
        />
        <p className='text-xs text-muted-foreground'>
          Enter an emoji character (e.g., 🍔, 💰, 🚗)
        </p>
      </div>

      <DialogFooter>
        <Button type='submit' disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Saving...
            </>
          ) : category ? (
            'Update Category'
          ) : (
            'Create Category'
          )}
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <div className='container mx-auto p-6 max-w-7xl'>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-3xl font-bold'>Category Management</h1>
          <p className='text-muted-foreground mt-1'>
            Organize your income and expenses with custom categories
          </p>
        </div>
      </div>

      <Tabs defaultValue='expense' className='space-y-6'>
        <TabsList className='grid w-full max-w-md grid-cols-2'>
          <TabsTrigger value='expense'>
            Expense Categories ({expenseCategories.length})
          </TabsTrigger>
          <TabsTrigger value='income'>
            Income Categories ({incomeCategories.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value='expense' className='space-y-4'>
          <div className='flex justify-end'>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className='mr-2 h-4 w-4' />
                  Add Expense Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Expense Category</DialogTitle>
                  <DialogDescription>
                    Add a new category for tracking expenses
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
                  Add Income Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Income Category</DialogTitle>
                  <DialogDescription>
                    Add a new category for tracking income
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
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update category name or icon</DialogDescription>
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
