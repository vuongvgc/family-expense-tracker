'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Copy,
  TrendingUp,
  DollarSign,
  Gift,
  ShoppingCart,
  UtensilsCrossed,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import EstimationManager from './estimation-manager';
import LixiList from './lixi-list';

interface TetStatistics {
  totalEstimated: number;
  totalSpent: number;
  budget: number;
  balance: number;
  categoryBreakdown: Record<string, number>;
  lixiTotal: number;
  shoppingTotal: number;
  giftTotal: number;
  foodTotal: number;
  transactions: any[];
}

interface EventDetails {
  id: string;
  name: string;
  type: string;
  budget: number;
  eventEstimations: Array<{
    id: string;
    itemName: string;
    estimatedAmount: number;
  }>;
}

export default function TetDashboardClient({
  eventId,
  initialEvent,
  initialStats,
}: {
  eventId: string;
  initialEvent: EventDetails;
  initialStats: TetStatistics;
}) {
  const [stats, setStats] = useState<TetStatistics>(initialStats);
  const [event, setEvent] = useState<EventDetails>(initialEvent);
  const { toast } = useToast();

  const refreshData = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`);
      if (response.ok) {
        const data = await response.json();
        setEvent(data.event);
      }
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const calculateProgress = () => {
    return Math.min((stats.totalSpent / event.budget) * 100, 100);
  };

  const handleZaloReport = async () => {
    const balance = event.budget - stats.totalSpent;
    const balanceText =
      balance >= 0
        ? `Còn dư ${formatCurrency(balance)}`
        : `Vượt ngân sách ${formatCurrency(Math.abs(balance))}`;

    const report = `🧧 Tổng kết ${event.name}:
📊 Tổng chi: ${formatCurrency(stats.totalSpent)}
💰 Ngân sách: ${formatCurrency(event.budget)}
${balanceText}

Chi tiết:
🧧 Lì xì: ${formatCurrency(stats.lixiTotal)}
🛍️ Sắm Tết: ${formatCurrency(stats.shoppingTotal)}
🎁 Quà biếu: ${formatCurrency(stats.giftTotal)}
🍜 Thực phẩm: ${formatCurrency(stats.foodTotal)}`;

    try {
      await navigator.clipboard.writeText(report);
      toast({
        title: 'Đã sao chép!',
        description:
          'Báo cáo đã được sao chép vào bộ nhớ tạm. Bạn có thể gửi cho vợ/chồng ngay!',
      });
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể sao chép vào bộ nhớ tạm',
        variant: 'destructive',
      });
    }
  };

  const progress = calculateProgress();
  const isOverBudget = stats.totalSpent > event.budget;

  // Falling blossoms animation
  const Blossom = ({ delay }: { delay: number }) => (
    <motion.div
      className='absolute text-4xl'
      initial={{ x: Math.random() * window.innerWidth, y: -50, rotate: 0 }}
      animate={{
        y: window.innerHeight + 50,
        x: Math.random() * window.innerWidth,
        rotate: 360,
      }}
      transition={{
        duration: 8 + Math.random() * 4,
        delay,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      🌸
    </motion.div>
  );

  return (
    <div className='min-h-screen relative overflow-hidden bg-gradient-to-br from-red-50 via-yellow-50 to-orange-50'>
      {/* Falling blossoms */}
      {[...Array(15)].map((_, i) => (
        <Blossom key={i} delay={i * 0.5} />
      ))}

      <div className='relative z-10 container mx-auto p-4 md:p-6 space-y-6'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='text-center space-y-4'
        >
          <h1 className='text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-600 to-yellow-600 bg-clip-text text-transparent'>
            🧧 {event.name} 🧧
          </h1>
          <p className='text-muted-foreground'>Theo dõi chi tiêu Tết thông minh</p>
        </motion.div>

        {/* Budget Overview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className='border-red-200 shadow-lg bg-gradient-to-br from-white to-red-50'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-red-700'>
                <TrendingUp className='h-5 w-5' />
                Tổng Quan Ngân Sách
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='text-center p-4 bg-yellow-100 rounded-lg'>
                  <p className='text-sm text-muted-foreground'>Dự toán</p>
                  <p className='text-2xl font-bold text-yellow-700'>
                    {formatCurrency(stats.totalEstimated)}
                  </p>
                </div>
                <div className='text-center p-4 bg-red-100 rounded-lg'>
                  <p className='text-sm text-muted-foreground'>Đã chi</p>
                  <p className='text-2xl font-bold text-red-700'>
                    {formatCurrency(stats.totalSpent)}
                  </p>
                </div>
                <div
                  className={`text-center p-4 rounded-lg ${
                    isOverBudget ? 'bg-rose-100' : 'bg-green-100'
                  }`}
                >
                  <p className='text-sm text-muted-foreground'>
                    {isOverBudget ? 'Vượt' : 'Còn lại'}
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      isOverBudget ? 'text-rose-700' : 'text-green-700'
                    }`}
                  >
                    {formatCurrency(Math.abs(stats.balance))}
                  </p>
                </div>
              </div>

              <div className='space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span>Ngân sách: {formatCurrency(event.budget)}</span>
                  <span
                    className={isOverBudget ? 'text-rose-600' : 'text-green-600'}
                  >
                    {progress.toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={progress}
                  className={`h-3 ${
                    isOverBudget ? '[&>div]:bg-rose-500' : '[&>div]:bg-green-500'
                  }`}
                />
              </div>

              <Button
                onClick={handleZaloReport}
                className='w-full bg-gradient-to-r from-red-600 to-yellow-600 hover:from-red-700 hover:to-yellow-700'
                size='lg'
              >
                <Copy className='mr-2 h-4 w-4' />
                📱 Tổng kết Tết - Gửi Zalo
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'
        >
          {[
            {
              icon: '🧧',
              label: 'Lì xì',
              amount: stats.lixiTotal,
              color: 'from-red-500 to-rose-500',
              Icon: Sparkles,
            },
            {
              icon: '🛍️',
              label: 'Sắm đồ Tết',
              amount: stats.shoppingTotal,
              color: 'from-yellow-500 to-orange-500',
              Icon: ShoppingCart,
            },
            {
              icon: '🎁',
              label: 'Quà biếu',
              amount: stats.giftTotal,
              color: 'from-pink-500 to-purple-500',
              Icon: Gift,
            },
            {
              icon: '🍜',
              label: 'Thực phẩm Tết',
              amount: stats.foodTotal,
              color: 'from-green-500 to-teal-500',
              Icon: UtensilsCrossed,
            },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              whileHover={{ scale: 1.05 }}
            >
              <Card className='border-2 hover:shadow-xl transition-shadow'>
                <CardContent className='pt-6'>
                  <div className='flex items-center justify-between mb-3'>
                    <span className='text-3xl'>{item.icon}</span>
                    <item.Icon
                      className={`h-6 w-6 bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}
                    />
                  </div>
                  <h3 className='font-semibold text-sm text-muted-foreground mb-2'>
                    {item.label}
                  </h3>
                  <p
                    className={`text-2xl font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}
                  >
                    {formatCurrency(item.amount)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className='grid grid-cols-1 lg:grid-cols-2 gap-6'
        >
          {/* Estimation Manager */}
          <EstimationManager
            eventId={eventId}
            estimations={event.eventEstimations || []}
            onUpdate={refreshData}
          />

          {/* Lì xì List */}
          <LixiList eventId={eventId} />
        </motion.div>

        {/* All Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className='border-yellow-200 shadow-lg'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-yellow-700'>
                <DollarSign className='h-5 w-5' />
                Tất Cả Giao Dịch
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {stats.transactions.slice(0, 15).map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.03 }}
                    className='flex items-center justify-between p-3 bg-gradient-to-r from-white to-yellow-50 rounded-lg border border-yellow-100 hover:border-yellow-300 transition-colors'
                  >
                    <div className='flex items-center gap-3'>
                      <span className='text-2xl'>
                        {transaction.category?.icon || '💰'}
                      </span>
                      <div>
                        <p className='font-medium'>{transaction.description}</p>
                        <p className='text-xs text-muted-foreground'>
                          {new Date(transaction.date).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        transaction.type === 'EXPENSE' ? 'destructive' : 'default'
                      }
                      className='text-base'
                    >
                      {transaction.type === 'EXPENSE' ? '-' : '+'}
                      {formatCurrency(Number(transaction.amount))}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Decorative Icons */}
        <div className='fixed bottom-10 right-10 text-6xl animate-bounce opacity-50'>
          🏮
        </div>
        <div className='fixed top-20 right-20 text-5xl animate-pulse opacity-50'>
          🧨
        </div>
      </div>
    </div>
  );
}
