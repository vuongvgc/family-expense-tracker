'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/ui/money-input';
import { Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EventEstimation {
  id: string;
  itemName: string;
  estimatedAmount: number;
}

interface EstimationManagerProps {
  eventId: string;
  estimations: EventEstimation[];
  onUpdate: () => void;
}

export default function EstimationManager({
  eventId,
  estimations: initialEstimations,
  onUpdate,
}: EstimationManagerProps) {
  const [estimations, setEstimations] =
    useState<EventEstimation[]>(initialEstimations);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    itemName: '',
    estimatedAmount: 0,
  });

  const handleAdd = async () => {
    if (!formData.itemName || formData.estimatedAmount <= 0) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập đầy đủ thông tin',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/event-estimations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          ...formData,
        }),
      });

      if (!response.ok) throw new Error();

      const { estimation } = await response.json();
      setEstimations([...estimations, estimation]);
      setFormData({ itemName: '', estimatedAmount: 0 });
      setIsAdding(false);
      onUpdate();

      toast({
        title: 'Thành công!',
        description: 'Đã thêm dự toán',
      });
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể thêm dự toán',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/event-estimations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error();

      setEstimations(estimations.filter((e) => e.id !== id));
      onUpdate();

      toast({
        title: 'Thành công!',
        description: 'Đã xóa dự toán',
      });
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa dự toán',
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const totalEstimated = estimations.reduce(
    (sum, est) => sum + Number(est.estimatedAmount),
    0
  );

  return (
    <Card className='border-orange-200 shadow-lg'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2 text-orange-700'>
            📋 Dự Toán Chi Tiết
          </CardTitle>
          <Button size='sm' variant='outline' onClick={() => setIsAdding(!isAdding)}>
            {isAdding ? (
              <>
                <X className='mr-2 h-4 w-4' />
                Hủy
              </>
            ) : (
              <>
                <Plus className='mr-2 h-4 w-4' />
                Thêm
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Add Form */}
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='p-4 bg-orange-50 rounded-lg space-y-3 border border-orange-200'
          >
            <div className='space-y-2'>
              <Label>Tên Khoản Chi</Label>
              <Input
                placeholder='Ví dụ: Mua giò chả, Lì xì anh Hai'
                value={formData.itemName}
                onChange={(e) =>
                  setFormData({ ...formData, itemName: e.target.value })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>Số Tiền Dự Kiến (VND)</Label>
              <MoneyInput
                value={formData.estimatedAmount}
                onValueChange={(value) =>
                  setFormData({ ...formData, estimatedAmount: value })
                }
              />
            </div>
            <Button onClick={handleAdd} className='w-full'>
              <Check className='mr-2 h-4 w-4' />
              Thêm Dự Toán
            </Button>
          </motion.div>
        )}

        {/* Estimations List */}
        <div className='space-y-2'>
          {estimations.length === 0 ? (
            <p className='text-center text-muted-foreground py-8'>
              Chưa có dự toán nào. Hãy thêm dự toán để lập kế hoạch chi tiêu!
            </p>
          ) : (
            <>
              {estimations.map((estimation, index) => (
                <motion.div
                  key={estimation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className='flex items-center justify-between p-3 bg-gradient-to-r from-white to-orange-50 rounded-lg border border-orange-100 hover:border-orange-300 transition-colors'
                >
                  <div className='flex-1'>
                    <p className='font-medium'>{estimation.itemName}</p>
                    <p className='text-sm text-orange-600 font-semibold'>
                      {formatCurrency(Number(estimation.estimatedAmount))}
                    </p>
                  </div>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => handleDelete(estimation.id)}
                    className='text-red-600 hover:text-red-700 hover:bg-red-50'
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </motion.div>
              ))}

              {/* Total */}
              <div className='pt-4 border-t border-orange-200 mt-4'>
                <div className='flex items-center justify-between p-3 bg-gradient-to-r from-orange-100 to-yellow-100 rounded-lg'>
                  <span className='font-bold text-orange-900'>Tổng Dự Toán:</span>
                  <span className='text-xl font-bold text-orange-700'>
                    {formatCurrency(totalEstimated)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
