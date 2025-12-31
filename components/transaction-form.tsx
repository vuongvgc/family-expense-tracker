'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, X } from 'lucide-react';
import { TransactionType } from '@prisma/client';

interface CategoryOption {
  id: string;
  name: string;
  icon: string;
  type: TransactionType;
}

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

interface TransactionFormProps {
  transaction?: Transaction | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TransactionForm({
  transaction,
  onSuccess,
  onCancel,
}: TransactionFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [formData, setFormData] = useState({
    amount: transaction?.amount ? Number(transaction.amount) : 0,
    description: transaction?.description || '',
    type: (transaction?.type || 'EXPENSE') as TransactionType,
    categoryId: transaction?.categoryId || '',
    date: transaction?.date
      ? new Date(transaction.date).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
  });

  // Fetch categories when component mounts or type changes
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await fetch(`/api/categories?type=${formData.type}`);
        const data = await response.json();
        setCategories(data.categories || []);

        // If no category selected and categories available, select first one
        if (!formData.categoryId && data.categories?.length > 0) {
          setFormData((prev) => ({ ...prev, categoryId: data.categories[0].id }));
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [formData.type]);

  useEffect(() => {
    if (transaction) {
      setFormData({
        amount: Number(transaction.amount),
        description: transaction.description,
        type: transaction.type,
        categoryId: transaction.categoryId || '',
        date: new Date(transaction.date).toISOString().slice(0, 16),
      });
    }
  }, [transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const payload = {
        amount: formData.amount,
        description: formData.description,
        type: formData.type as TransactionType,
        categoryId: formData.categoryId || null,
        date: new Date(formData.date).toISOString(),
      };

      const url = transaction
        ? `/api/transactions/${transaction.id}`
        : '/api/transactions';

      const method = transaction ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to save transaction');
        return;
      }

      onSuccess();
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle>
              {transaction ? 'Edit Transaction' : 'Add Transaction'}
            </CardTitle>
            <CardDescription>
              {transaction
                ? 'Update the transaction details'
                : 'Record a new income or expense'}
            </CardDescription>
          </div>
          <Button variant='ghost' size='icon' onClick={onCancel}>
            <X className='h-4 w-4' />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='type'>Type</Label>
              <Select
                id='type'
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as TransactionType,
                  })
                }
                disabled={isLoading}
              >
                <option value='EXPENSE'>Expense</option>
                <option value='INCOME'>Income</option>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='amount'>Amount (VND)</Label>
              <MoneyInput
                id='amount'
                value={formData.amount}
                onValueChange={(value) =>
                  setFormData({ ...formData, amount: value })
                }
                disabled={isLoading}
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='category'>Category</Label>
            <Select
              id='category'
              value={formData.categoryId}
              onChange={(e) =>
                setFormData({ ...formData, categoryId: e.target.value })
              }
              disabled={isLoading || loadingCategories}
            >
              {loadingCategories ? (
                <option value=''>Loading categories...</option>
              ) : categories.length === 0 ? (
                <option value=''>No categories available</option>
              ) : (
                categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))
              )}
            </Select>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>Description</Label>
            <Input
              id='description'
              placeholder='e.g., Groceries at supermarket'
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
              maxLength={200}
              disabled={isLoading}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='date'>Date & Time</Label>
            <Input
              id='date'
              type='datetime-local'
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className='bg-destructive/10 text-destructive text-sm p-3 rounded-md'>
              {error}
            </div>
          )}

          <div className='flex gap-3'>
            <Button type='submit' disabled={isLoading} className='flex-1'>
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Saving...
                </>
              ) : transaction ? (
                'Update Transaction'
              ) : (
                'Add Transaction'
              )}
            </Button>
            <Button
              type='button'
              variant='outline'
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
