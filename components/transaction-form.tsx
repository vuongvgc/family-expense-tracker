'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, X, Sparkles } from 'lucide-react';
import { TransactionType } from '@prisma/client';
import { getDescriptionDictionary } from '@/actions/transaction';

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
  onCancel?: () => void;
  showCard?: boolean; // Option to render without Card wrapper for modal use
}

export default function TransactionForm({
  transaction,
  onSuccess,
  onCancel,
  showCard = true,
}: TransactionFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [suggestionsMap, setSuggestionsMap] = useState<Record<string, string[]>>({});
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  const [formData, setFormData] = useState({
    amount: transaction?.amount ? Number(transaction.amount) : 0,
    description: transaction?.description || '',
    type: (transaction?.type || 'EXPENSE') as TransactionType,
    categoryId: transaction?.categoryId || '',
    date: transaction?.date
      ? new Date(transaction.date).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
  });

  // Fetch suggestions dictionary once when component mounts
  useEffect(() => {
    const fetchSuggestions = async () => {
      setLoadingSuggestions(true);
      try {
        const dictionary = await getDescriptionDictionary();
        setSuggestionsMap(dictionary);
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    fetchSuggestions();
  }, []);

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

  // Get suggestions for current category
  const currentSuggestions = formData.categoryId
    ? suggestionsMap[formData.categoryId] || []
    : [];

  const handleSuggestionClick = (suggestion: string) => {
    setFormData({ ...formData, description: suggestion });
  };

  const formContent = (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor='type'>Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                type: value as TransactionType,
              })
            }
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='EXPENSE'>Expense</SelectItem>
              <SelectItem value='INCOME'>Income</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='amount'>Amount (VND)</Label>
          <MoneyInput
            id='amount'
            value={formData.amount}
            onValueChange={(value) => setFormData({ ...formData, amount: value })}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='category'>Category</Label>
        <Select
          value={formData.categoryId}
          onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
          disabled={isLoading || loadingCategories}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                loadingCategories ? 'Loading categories...' : 'Select category'
              }
            />
          </SelectTrigger>
          <SelectContent>
            {loadingCategories ? (
              <SelectItem value='loading' disabled>
                Loading categories...
              </SelectItem>
            ) : categories.length === 0 ? (
              <SelectItem value='empty' disabled>
                No categories available
              </SelectItem>
            ) : (
              categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='description'>Description</Label>
        <Input
          id='description'
          placeholder='e.g., Groceries at supermarket'
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          maxLength={200}
          disabled={isLoading}
        />

        {/* Smart Suggestions */}
        {currentSuggestions.length > 0 && (
          <div className='space-y-2'>
            <div className='flex items-center gap-1 text-xs text-muted-foreground'>
              <Sparkles className='h-3 w-3' />
              <span>Smart Suggestions</span>
            </div>
            <div className='flex flex-wrap gap-2'>
              {currentSuggestions.map((suggestion, index) => (
                <Badge
                  key={index}
                  variant='secondary'
                  className='cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors'
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          </div>
        )}
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
        {onCancel && (
          <Button
            type='button'
            variant='outline'
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );

  if (!showCard) {
    return formContent;
  }

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
          {onCancel && (
            <Button variant='ghost' size='icon' onClick={onCancel}>
              <X className='h-4 w-4' />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>{formContent}</CardContent>
    </Card>
  );
}
