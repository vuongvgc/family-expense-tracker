'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/ui/money-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface Event {
  id: string;
  name: string;
  budget: number;
  type: string;
  startDate: string | null;
  endDate: string | null;
  _count: {
    transactions: number;
    eventEstimations: number;
  };
}

export default function EventsClient() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    budget: 0,
    type: 'TET',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create event');
      }

      toast({
        title: 'Thành công!',
        description: 'Sự kiện đã được tạo',
      });

      setIsDialogOpen(false);
      setFormData({
        name: '',
        budget: 0,
        type: 'TET',
        startDate: '',
        endDate: '',
      });
      fetchEvents();
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tạo sự kiện',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'TET':
        return '🧧';
      case 'TRAVEL':
        return '✈️';
      default:
        return '📅';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'TET':
        return 'from-red-500 to-yellow-500';
      case 'TRAVEL':
        return 'from-blue-500 to-cyan-500';
      default:
        return 'from-purple-500 to-pink-500';
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className='container mx-auto p-4 md:p-6 space-y-6'>
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold'>Sự Kiện</h1>
          <p className='text-muted-foreground'>
            Quản lý chi tiêu cho các sự kiện đặc biệt
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size='lg'>
              <Plus className='mr-2 h-4 w-4' />
              Tạo Sự Kiện
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo Sự Kiện Mới</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateEvent} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='name'>Tên Sự Kiện</Label>
                <Input
                  id='name'
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder='Ví dụ: Tết Nguyên Đán 2026'
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='type'>Loại Sự Kiện</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='TET'>🧧 Tết</SelectItem>
                    <SelectItem value='TRAVEL'>✈️ Du lịch</SelectItem>
                    <SelectItem value='OTHER'>📅 Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='budget'>Ngân Sách (VND)</Label>
                <MoneyInput
                  id='budget'
                  value={formData.budget}
                  onValueChange={(value) =>
                    setFormData({ ...formData, budget: value })
                  }
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='startDate'>Ngày Bắt Đầu</Label>
                  <Input
                    id='startDate'
                    type='date'
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='endDate'>Ngày Kết Thúc</Label>
                  <Input
                    id='endDate'
                    type='date'
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <Button type='submit' className='w-full' disabled={isCreating}>
                {isCreating ? 'Đang tạo...' : 'Tạo Sự Kiện'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-12'>
            <Calendar className='h-12 w-12 text-muted-foreground mb-4' />
            <p className='text-lg font-medium'>Chưa có sự kiện nào</p>
            <p className='text-sm text-muted-foreground mb-4'>
              Tạo sự kiện đầu tiên để bắt đầu theo dõi chi tiêu
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/dashboard/events/${event.id}`}>
                <Card className='hover:shadow-xl transition-shadow cursor-pointer border-2 hover:border-primary'>
                  <CardHeader>
                    <div className='flex items-start justify-between'>
                      <div className='flex items-center gap-3'>
                        <span className='text-4xl'>{getEventIcon(event.type)}</span>
                        <div>
                          <CardTitle className='text-lg'>{event.name}</CardTitle>
                          <Badge variant='outline' className='mt-1'>
                            {event.type === 'TET'
                              ? 'Tết'
                              : event.type === 'TRAVEL'
                              ? 'Du lịch'
                              : 'Khác'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-muted-foreground'>
                        Ngân sách:
                      </span>
                      <span
                        className={`font-bold bg-gradient-to-r ${getEventColor(
                          event.type
                        )} bg-clip-text text-transparent`}
                      >
                        {formatCurrency(Number(event.budget))}
                      </span>
                    </div>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='flex items-center gap-1'>
                        <DollarSign className='h-4 w-4' />
                        {event._count.transactions} giao dịch
                      </span>
                      <span className='flex items-center gap-1'>
                        <TrendingUp className='h-4 w-4' />
                        {event._count.eventEstimations} dự toán
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
