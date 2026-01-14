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
  Plane,
  Hotel,
  MapPin,
  Camera,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import EstimationManager from './estimation-manager';
import LixiList from './lixi-list';
import { EventType } from '@prisma/client';

interface EventStatistics {
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
  type: EventType;
  budget: number;
  eventEstimations: Array<{
    id: string;
    itemName: string;
    estimatedAmount: number;
  }>;
}

// Theme configurations for different event types
const EVENT_THEMES = {
  TET: {
    emoji: '🧧',
    icon: '🌸',
    title: 'Tổng kết Tết',
    bgGradient: 'from-red-50 via-yellow-50 to-orange-50',
    headerGradient: 'from-red-600 to-yellow-600',
    description: 'Theo dõi chi tiêu Tết thông minh',
    progressColors: {
      low: 'bg-green-500',
      medium: 'bg-yellow-500',
      high: 'bg-red-500',
    },
    categories: [
      { name: 'Lì xì', icon: Gift, key: 'lixiTotal', color: 'text-red-600' },
      {
        name: 'Sắm Tết',
        icon: ShoppingCart,
        key: 'shoppingTotal',
        color: 'text-orange-600',
      },
      { name: 'Quà biếu', icon: Gift, key: 'giftTotal', color: 'text-yellow-600' },
      {
        name: 'Thực phẩm',
        icon: UtensilsCrossed,
        key: 'foodTotal',
        color: 'text-green-600',
      },
    ],
  },
  TRAVEL: {
    emoji: '✈️',
    icon: '🗺️',
    title: 'Tổng kết Du lịch',
    bgGradient: 'from-blue-50 via-cyan-50 to-teal-50',
    headerGradient: 'from-blue-600 to-cyan-600',
    description: 'Quản lý chi tiêu chuyến đi của bạn',
    progressColors: {
      low: 'bg-blue-500',
      medium: 'bg-cyan-500',
      high: 'bg-purple-500',
    },
    categories: [
      {
        name: 'Vé máy bay',
        icon: Plane,
        key: 'flightTotal',
        color: 'text-blue-600',
      },
      { name: 'Khách sạn', icon: Hotel, key: 'hotelTotal', color: 'text-cyan-600' },
      {
        name: 'Ăn uống',
        icon: UtensilsCrossed,
        key: 'foodTotal',
        color: 'text-teal-600',
      },
      {
        name: 'Hoạt động',
        icon: Camera,
        key: 'activityTotal',
        color: 'text-purple-600',
      },
    ],
  },
  OTHER: {
    emoji: '📅',
    icon: '⭐',
    title: 'Tổng kết Sự kiện',
    bgGradient: 'from-gray-50 via-slate-50 to-zinc-50',
    headerGradient: 'from-gray-600 to-slate-600',
    description: 'Theo dõi chi tiêu sự kiện',
    progressColors: {
      low: 'bg-green-500',
      medium: 'bg-yellow-500',
      high: 'bg-red-500',
    },
    categories: [
      {
        name: 'Chi tiêu chính',
        icon: DollarSign,
        key: 'mainTotal',
        color: 'text-gray-600',
      },
      {
        name: 'Phụ phí',
        icon: TrendingUp,
        key: 'extraTotal',
        color: 'text-slate-600',
      },
    ],
  },
};

export default function EventDashboardClient({
  eventId,
  initialEvent,
  initialStats,
}: {
  eventId: string;
  initialEvent: EventDetails;
  initialStats: EventStatistics;
}) {
  const [stats, setStats] = useState<EventStatistics>(initialStats);
  const [event, setEvent] = useState<EventDetails>(initialEvent);
  const { toast } = useToast();

  const theme = EVENT_THEMES[event.type] || EVENT_THEMES.OTHER;

  const refreshData = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`);
      if (response.ok) {
        const data = await response.json();
        setEvent(data.event);

        // Recalculate totalEstimated from updated estimations
        const newTotalEstimated = (data.event.eventEstimations || []).reduce(
          (sum: number, est: any) => sum + Number(est.estimatedAmount),
          0
        );

        setStats((prev) => ({
          ...prev,
          totalEstimated: newTotalEstimated,
        }));
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

  const getCategoryTotal = (categoryKey: string): number => {
    // Map category keys to actual totals from stats
    const categoryMap: Record<string, number> = {
      lixiTotal: stats.lixiTotal,
      shoppingTotal: stats.shoppingTotal,
      giftTotal: stats.giftTotal,
      foodTotal: stats.foodTotal,
      flightTotal: Object.entries(stats.categoryBreakdown)
        .filter(
          ([name]) =>
            name.toLowerCase().includes('máy bay') ||
            name.toLowerCase().includes('vé')
        )
        .reduce((sum, [, amount]) => sum + amount, 0),
      hotelTotal: Object.entries(stats.categoryBreakdown)
        .filter(
          ([name]) =>
            name.toLowerCase().includes('khách sạn') ||
            name.toLowerCase().includes('lưu trú')
        )
        .reduce((sum, [, amount]) => sum + amount, 0),
      activityTotal: Object.entries(stats.categoryBreakdown)
        .filter(
          ([name]) =>
            name.toLowerCase().includes('tham quan') ||
            name.toLowerCase().includes('hoạt động') ||
            name.toLowerCase().includes('vui chơi')
        )
        .reduce((sum, [, amount]) => sum + amount, 0),
      mainTotal: stats.totalSpent * 0.7, // Estimate for OTHER type
      extraTotal: stats.totalSpent * 0.3,
    };
    return categoryMap[categoryKey] || 0;
  };

  const handleShareReport = async () => {
    const balance = event.budget - stats.totalSpent;
    const balanceText =
      balance >= 0
        ? `Còn dư ${formatCurrency(balance)}`
        : `Vượt ngân sách ${formatCurrency(Math.abs(balance))}`;

    const categoryDetails = theme.categories
      .map(
        (cat) =>
          `${cat.icon.name === 'Gift' ? '🎁' : '📊'} ${cat.name}: ${formatCurrency(
            getCategoryTotal(cat.key)
          )}`
      )
      .join('\n');

    const report = `${theme.emoji} ${theme.title} - ${event.name}:
📊 Tổng chi: ${formatCurrency(stats.totalSpent)}
💰 Ngân sách: ${formatCurrency(event.budget)}
${balanceText}

Chi tiết:
${categoryDetails}`;

    try {
      await navigator.clipboard.writeText(report);
      toast({
        title: 'Đã sao chép!',
        description: 'Báo cáo đã được sao chép vào bộ nhớ tạm.',
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

  // Animated icons based on event type
  const AnimatedIcon = ({ delay }: { delay: number }) => (
    <motion.div
      className='absolute text-4xl pointer-events-none'
      initial={{
        x:
          Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
        y: -50,
        rotate: 0,
      }}
      animate={{
        y: (typeof window !== 'undefined' ? window.innerHeight : 800) + 50,
        x:
          Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
        rotate: 360,
      }}
      transition={{
        duration: 8 + Math.random() * 4,
        delay,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      {theme.icon}
    </motion.div>
  );

  const getProgressColor = () => {
    if (progress < 70) return theme.progressColors.low;
    if (progress < 90) return theme.progressColors.medium;
    return theme.progressColors.high;
  };

  return (
    <div
      className={`min-h-screen relative overflow-hidden bg-gradient-to-br ${theme.bgGradient}`}
    >
      {/* Animated background icons */}
      {[...Array(12)].map((_, i) => (
        <AnimatedIcon key={i} delay={i * 0.5} />
      ))}

      <div className='relative z-10 container mx-auto p-4 md:p-6 space-y-6'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='text-center space-y-4'
        >
          <h1
            className={`text-4xl md:text-5xl font-bold bg-gradient-to-r ${theme.headerGradient} bg-clip-text text-transparent`}
          >
            {theme.emoji} {event.name} {theme.emoji}
          </h1>
          <p className='text-muted-foreground'>{theme.description}</p>
        </motion.div>

        {/* Budget Overview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className='backdrop-blur-sm bg-white/80 shadow-xl'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <TrendingUp className='w-6 h-6' />
                Tổng quan ngân sách
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                <div className='text-center p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100'>
                  <p className='text-sm text-muted-foreground mb-1'>Dự toán</p>
                  <p className='text-2xl font-bold text-purple-700'>
                    {formatCurrency(stats.totalEstimated)}
                  </p>
                </div>
                <div className='text-center p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100'>
                  <p className='text-sm text-muted-foreground mb-1'>Ngân sách</p>
                  <p className='text-2xl font-bold text-blue-700'>
                    {formatCurrency(event.budget)}
                  </p>
                </div>
                <div className='text-center p-4 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100'>
                  <p className='text-sm text-muted-foreground mb-1'>Đã chi</p>
                  <p className='text-2xl font-bold text-orange-700'>
                    {formatCurrency(stats.totalSpent)}
                  </p>
                </div>
                <div
                  className={`text-center p-4 rounded-lg ${
                    isOverBudget
                      ? 'bg-gradient-to-br from-red-50 to-red-100'
                      : 'bg-gradient-to-br from-green-50 to-green-100'
                  }`}
                >
                  <p className='text-sm text-muted-foreground mb-1'>Còn lại</p>
                  <p
                    className={`text-2xl font-bold ${
                      isOverBudget ? 'text-red-700' : 'text-green-700'
                    }`}
                  >
                    {formatCurrency(event.budget - stats.totalSpent)}
                  </p>
                </div>
              </div>

              <div className='space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span>Tiến độ chi tiêu</span>
                  <span className='font-semibold'>{progress.toFixed(1)}%</span>
                </div>
                <Progress value={progress} className='h-4' />
                {isOverBudget && (
                  <Badge variant='destructive' className='mt-2'>
                    ⚠️ Vượt ngân sách{' '}
                    {formatCurrency(stats.totalSpent - event.budget)}
                  </Badge>
                )}
              </div>

              <Button
                onClick={handleShareReport}
                className='w-full'
                variant='outline'
              >
                <Copy className='w-4 h-4 mr-2' />
                Sao chép báo cáo chi tiết
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
          {theme.categories.map((category, index) => {
            const Icon = category.icon;
            const amount = getCategoryTotal(category.key);
            return (
              <motion.div
                key={category.key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <Card className='backdrop-blur-sm bg-white/80 hover:shadow-lg transition-all'>
                  <CardContent className='p-6'>
                    <div className='flex items-center gap-3 mb-3'>
                      <div
                        className={`p-3 rounded-full bg-gradient-to-br from-gray-100 to-gray-200`}
                      >
                        <Icon className={`w-6 h-6 ${category.color}`} />
                      </div>
                      <h3 className='font-semibold'>{category.name}</h3>
                    </div>
                    <p className='text-2xl font-bold'>{formatCurrency(amount)}</p>
                    <p className='text-sm text-muted-foreground mt-1'>
                      {((amount / stats.totalSpent) * 100 || 0).toFixed(1)}% tổng chi
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Event-specific components */}
        {event.type === 'TET' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <LixiList eventId={eventId} />
          </motion.div>
        )}

        {/* Estimation Manager */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <EstimationManager
            eventId={eventId}
            eventType={event.type}
            estimations={event.eventEstimations}
            onUpdate={refreshData}
          />
        </motion.div>
      </div>
    </div>
  );
}
