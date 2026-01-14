'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface LixiTransaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  createdBy: {
    name: string;
  };
}

export default function LixiList({ eventId }: { eventId: string }) {
  const [transactions, setTransactions] = useState<LixiTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLixiTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/lixi`);
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Failed to fetch lixi transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLixiTransactions();
  }, [eventId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const totalLixi = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <Card className='border-red-200 shadow-lg bg-gradient-to-br from-white to-red-50'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2 text-red-700'>
            🧧 Danh Sách Lì Xì
          </CardTitle>
          <Button
            size='sm'
            variant='outline'
            onClick={fetchLixiTransactions}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <p className='text-sm text-muted-foreground'>
          Theo dõi đã mừng tuổi cho những ai
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className='text-center py-8 text-muted-foreground'>Đang tải...</p>
        ) : transactions.length === 0 ? (
          <p className='text-center py-8 text-muted-foreground'>
            Chưa có khoản lì xì nào được ghi nhận
          </p>
        ) : (
          <div className='space-y-3'>
            {transactions.map((transaction, index) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className='flex items-center justify-between p-3 bg-white rounded-lg border border-red-100 hover:border-red-300 transition-colors'
              >
                <div className='flex items-center gap-3'>
                  <span className='text-3xl'>🧧</span>
                  <div>
                    <p className='font-medium'>{transaction.description}</p>
                    <p className='text-xs text-muted-foreground'>
                      {new Date(transaction.date).toLocaleDateString('vi-VN')} •{' '}
                      {transaction.createdBy.name}
                    </p>
                  </div>
                </div>
                <Badge className='bg-red-600 text-base'>
                  {formatCurrency(Number(transaction.amount))}
                </Badge>
              </motion.div>
            ))}

            <div className='pt-4 border-t border-red-200 mt-4'>
              <div className='flex items-center justify-between p-3 bg-gradient-to-r from-red-100 to-rose-100 rounded-lg'>
                <span className='font-bold text-red-900'>Tổng Lì Xì:</span>
                <span className='text-xl font-bold text-red-700'>
                  {formatCurrency(totalLixi)}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
