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
import { TransactionType, PaymentMethod } from '@prisma/client';
import { getDescriptionDictionary } from '@/actions/transaction';

interface CategoryOption {
  id: string;
  name: string;
  icon: string;
  type: TransactionType;
}

interface EventOption {
  id: string;
  name: string;
  type: string;
}

interface Transaction {
  id: string;
  amount: number;
  description: string;
  type: TransactionType;
  paymentMethod: PaymentMethod;
  categoryId: string | null;
  eventId?: string | null;
  date: string;
  category?: {
    id: string;
    name: string;
    icon: string;
  };
  event?: {
    id: string;
    name: string;
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
  const [events, setEvents] = useState<EventOption[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const [formData, setFormData] = useState({
    amount: transaction?.amount ? Number(transaction.amount) : 0,
    description: transaction?.description || '',
    type: (transaction?.type || 'EXPENSE') as TransactionType,
    paymentMethod: (transaction?.paymentMethod || 'CASH') as PaymentMethod,
    categoryId: transaction?.categoryId || '',
    eventId: transaction?.eventId || 'none',
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

  // Fetch events when component mounts
  useEffect(() => {
    const fetchEvents = async () => {
      setLoadingEvents(true);
      try {
        const response = await fetch('/api/events');
        const data = await response.json();
        setEvents(data.events || []);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, []);

  // Fetch categories when component mounts or type changes
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        // Build URL with type and eventType parameters
        let url = `/api/categories?type=${formData.type}`;

        // If an event is selected, get its type and filter categories
        if (formData.eventId && formData.eventId !== 'none') {
          const selectedEvent = events.find((e) => e.id === formData.eventId);
          console.log('🔍 Debug filter:', {
            eventId: formData.eventId,
            selectedEvent,
            eventType: selectedEvent?.type,
            eventsLoaded: events.length,
          });
          if (selectedEvent?.type) {
            url += `&eventType=${selectedEvent.type}`;
          }
        } else if (formData.eventId === 'none') {
          // When "no event" is selected, only show general categories (eventType = null)
          url += `&eventType=null`;
        }

        console.log('📡 Fetching categories with URL:', url);
        const response = await fetch(url);
        const data = await response.json();
        const fetchedCategories = data.categories || [];
        console.log(
          '✅ Categories loaded:',
          fetchedCategories.length,
          fetchedCategories
        );

        setCategories(fetchedCategories);

        // If no category selected and categories available, select first one
        if (!formData.categoryId && fetchedCategories.length > 0) {
          setFormData((prev) => ({ ...prev, categoryId: fetchedCategories[0].id }));
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [formData.type, formData.eventId, events]);

  useEffect(() => {
    if (transaction) {
      setFormData({
        amount: Number(transaction.amount),
        description: transaction.description,
        type: transaction.type,
        paymentMethod: transaction.paymentMethod || 'CASH',
        categoryId: transaction.categoryId || '',
        eventId: transaction.eventId || '',
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
        paymentMethod: formData.paymentMethod as PaymentMethod,
        categoryId: formData.categoryId || null,
        eventId:
          formData.eventId && formData.eventId !== 'none' ? formData.eventId : null,
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
        setError(result.error || 'Không thể lưu giao dịch');
        return;
      }

      onSuccess();
    } catch (err) {
      setError('Đã xảy ra lỗi không mong muốn');
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
          <Label htmlFor='type'>Loại</Label>
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
              <SelectItem value='EXPENSE'>Chi Tiêu</SelectItem>
              <SelectItem value='INCOME'>Thu Nhập</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='amount'>Số Tiền (VND)</Label>
          <MoneyInput
            id='amount'
            value={formData.amount}
            onValueChange={(value) => setFormData({ ...formData, amount: value })}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='paymentMethod'>Phương Thức Thanh Toán</Label>
        <Select
          value={formData.paymentMethod}
          onValueChange={(value) =>
            setFormData({ ...formData, paymentMethod: value as PaymentMethod })
          }
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='CASH'>💵 Tiền Mặt</SelectItem>
            <SelectItem value='BANK_TRANSFER'>🏦 Chuyển Khoản</SelectItem>
            <SelectItem value='CREDIT_CARD'>💳 Thẻ Tín Dụng</SelectItem>
            <SelectItem value='E_WALLET'>📱 Ví Điện Tử</SelectItem>
            <SelectItem value='OTHER'>💼 Khác</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='category'>Danh Mục</Label>
        <Select
          value={formData.categoryId}
          onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
          disabled={isLoading || loadingCategories}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                loadingCategories ? 'Đang tải danh mục...' : 'Chọn danh mục'
              }
            />
          </SelectTrigger>
          <SelectContent>
            {loadingCategories ? (
              <SelectItem value='loading' disabled>
                Đang tải danh mục...
              </SelectItem>
            ) : categories.length === 0 ? (
              <SelectItem value='empty' disabled>
                Không có danh mục nào
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
        <Label htmlFor='event'>Sự Kiện (Tùy Chọn)</Label>
        <Select
          value={formData.eventId}
          onValueChange={(value) => setFormData({ ...formData, eventId: value })}
          disabled={isLoading || loadingEvents}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={loadingEvents ? 'Đang tải sự kiện...' : 'Chọn sự kiện'}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='none'>Không có sự kiện</SelectItem>
            {loadingEvents ? (
              <SelectItem value='loading' disabled>
                Đang tải sự kiện...
              </SelectItem>
            ) : events.length === 0 ? (
              <SelectItem value='empty' disabled>
                Chưa có sự kiện nào
              </SelectItem>
            ) : (
              events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.type === 'TET'
                    ? '🧧'
                    : event.type === 'TRAVEL'
                    ? '✈️'
                    : '📅'}{' '}
                  {event.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {formData.eventId &&
          formData.eventId !== 'none' &&
          events.find((e) => e.id === formData.eventId) && (
            <p className='text-xs text-muted-foreground'>
              💡 Danh mục sẽ được lọc theo sự kiện đã chọn
            </p>
          )}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='description'>Mô Tả</Label>
        <Input
          id='description'
          placeholder='Ví dụ: Mua sắm tại siêu thị'
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
              <span>Gợi Ý Thông Minh</span>
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
        <Label htmlFor='date'>Ngày & Giờ</Label>
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
              Đang lưu...
            </>
          ) : transaction ? (
            'Cập Nhật Giao Dịch'
          ) : (
            'Thêm Giao Dịch'
          )}
        </Button>
        {onCancel && (
          <Button
            type='button'
            variant='outline'
            onClick={onCancel}
            disabled={isLoading}
          >
            Hủy
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
            <CardTitle>{transaction ? 'Sửa Giao Dịch' : 'Thêm Giao Dịch'}</CardTitle>
            <CardDescription>
              {transaction
                ? 'Cập nhật thông tin giao dịch'
                : 'Ghi lại thu nhập hoặc chi tiêu mới'}
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
