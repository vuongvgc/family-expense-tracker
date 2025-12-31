'use client';

import { useState } from 'react';
import { AssetType } from '@prisma/client';
import { addAsset, updateAssetValue, deleteAsset } from '@/actions/asset';

// Define Asset type with number instead of Decimal
type Asset = {
  id: string;
  name: string;
  amount: number;
  type: AssetType;
  createdAt: Date;
  updatedAt: Date;
  familyGroupId: string;
};
import { Button } from '@/components/ui/button';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Wallet,
  Building2,
  TrendingUp,
  Home,
  Bitcoin,
  Coins,
  Package,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  TrendingDown,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { AnimatedCard } from '@/components/ui/animated-card';
import { AnimatedNumber } from '@/components/ui/animated-number';

interface AssetManagementProps {
  initialAssets: Asset[];
  initialSummary: {
    totalAssets: number;
    totalDebts: number;
    netWorth: number;
    assetsCount: number;
    debtsCount: number;
  };
}

const ASSET_TYPE_CONFIG = {
  CASH: {
    label: 'Tiền Mặt',
    icon: Wallet,
    color: '#10b981', // green
  },
  BANK: {
    label: 'Tài Khoản Ngân Hàng',
    icon: Building2,
    color: '#3b82f6', // blue
  },
  INVESTMENT: {
    label: 'Đầu Tư',
    icon: TrendingUp,
    color: '#8b5cf6', // purple
  },
  REAL_ESTATE: {
    label: 'Bất Động Sản',
    icon: Home,
    color: '#f59e0b', // amber
  },
  CRYPTO: {
    label: 'Tiền Điện Tử',
    icon: Bitcoin,
    color: '#f97316', // orange
  },
  GOLD: {
    label: 'Vàng',
    icon: Coins,
    color: '#eab308', // yellow
  },
  OTHER: {
    label: 'Khác',
    icon: Package,
    color: '#6b7280', // gray
  },
};

const COLORS = [
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#f59e0b',
  '#f97316',
  '#eab308',
  '#6b7280',
];

export default function AssetManagement({
  initialAssets,
  initialSummary,
}: AssetManagementProps) {
  const { toast } = useToast();
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [summary, setSummary] = useState(initialSummary);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deleteConfirmAsset, setDeleteConfirmAsset] = useState<Asset | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for adding new asset
  const [newAsset, setNewAsset] = useState({
    name: '',
    amount: '',
    type: 'BANK' as AssetType,
  });

  // Form state for editing asset
  const [editAmount, setEditAmount] = useState('');

  const handleAddAsset = async () => {
    if (!newAsset.name || !newAsset.amount) {
      toast({
        title: 'Lỗi Xác Thực',
        description: 'Vui lòng điền đầy đủ thông tin',
        variant: 'destructive',
      });
      return;
    }

    const amount = parseFloat(newAsset.amount);
    if (isNaN(amount) || amount < 0) {
      toast({
        title: 'Lỗi Xác Thực',
        description: 'Vui lòng nhập số tiền hợp lệ',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    const result = await addAsset(newAsset.name, amount, newAsset.type);
    setIsSubmitting(false);

    if (result.success && result.asset) {
      setAssets([...assets, result.asset]);
      setSummary({
        ...summary,
        totalAssets: summary.totalAssets + amount,
        netWorth: summary.netWorth + amount,
        assetsCount: summary.assetsCount + 1,
      });
      setIsAddDialogOpen(false);
      setNewAsset({ name: '', amount: '', type: 'BANK' });
      toast({
        title: 'Thành Công',
        description: 'Thêm tài sản thành công',
      });
    } else {
      toast({
        title: 'Lỗi',
        description: result.error || 'Không thể thêm tài sản',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateAsset = async () => {
    if (!editingAsset) return;

    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount < 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    const result = await updateAssetValue(editingAsset.id, amount);
    setIsSubmitting(false);

    if (result.success && result.asset) {
      const oldAmount = editingAsset.amount;
      const difference = amount - oldAmount;

      setAssets(assets.map((a) => (a.id === editingAsset.id ? result.asset! : a)));
      setSummary({
        ...summary,
        totalAssets: summary.totalAssets + difference,
        netWorth: summary.netWorth + difference,
      });
      setEditingAsset(null);
      toast({
        title: 'Thành Công',
        description: 'Cập nhật giá trị tài sản thành công',
      });
    } else {
      toast({
        title: 'Lỗi',
        description: result.error || 'Không thể cập nhật tài sản',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAsset = async () => {
    if (!deleteConfirmAsset) return;

    setIsSubmitting(true);
    const result = await deleteAsset(deleteConfirmAsset.id);
    setIsSubmitting(false);

    if (result.success) {
      const deletedAmount = deleteConfirmAsset.amount;
      setAssets(assets.filter((a) => a.id !== deleteConfirmAsset.id));
      setSummary({
        ...summary,
        totalAssets: summary.totalAssets - deletedAmount,
        netWorth: summary.netWorth - deletedAmount,
        assetsCount: summary.assetsCount - 1,
      });
      setDeleteConfirmAsset(null);
      toast({
        title: 'Thành Công',
        description: 'Xóa tài sản thành công',
      });
    } else {
      toast({
        title: 'Lỗi',
        description: result.error || 'Không thể xóa tài sản',
        variant: 'destructive',
      });
    }
  };

  // Group assets by type
  const assetsByType = assets.reduce((acc, asset) => {
    if (!acc[asset.type]) {
      acc[asset.type] = [];
    }
    acc[asset.type].push(asset);
    return acc;
  }, {} as Record<AssetType, Asset[]>);

  // Prepare chart data
  const chartData = Object.entries(assetsByType).map(([type, items]) => {
    const total = items.reduce((sum, item) => sum + item.amount, 0);
    return {
      name: ASSET_TYPE_CONFIG[type as AssetType].label,
      value: total,
      count: items.length,
    };
  });

  return (
    <div className='space-y-6'>
      {/* Net Worth Header */}
      <div className='grid gap-4 md:grid-cols-3'>
        <AnimatedCard
          delay={0}
          className='md:col-span-1 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20'
        >
          <CardHeader className='pb-3'>
            <CardDescription>Tài Sản Ròng</CardDescription>
            <CardTitle className='text-3xl font-bold text-primary'>
              <AnimatedNumber value={summary.netWorth} />
            </CardTitle>
          </CardHeader>
          <CardContent className='text-sm text-muted-foreground'>
            {summary.netWorth >= 0 ? (
              <p className='flex items-center gap-1 text-green-600'>
                <TrendingUp className='h-4 w-4' />
                Tài sản ròng dương
              </p>
            ) : (
              <p className='flex items-center gap-1 text-red-600'>
                <TrendingDown className='h-4 w-4' />
                Tài sản ròng âm
              </p>
            )}
          </CardContent>
        </AnimatedCard>

        <AnimatedCard delay={0.1}>
          <CardHeader className='pb-3'>
            <CardDescription>Tổng Tài Sản</CardDescription>
            <CardTitle className='text-2xl text-green-600'>
              +<AnimatedNumber value={summary.totalAssets} />
            </CardTitle>
          </CardHeader>
          <CardContent className='text-sm text-muted-foreground'>
            {summary.assetsCount} tài sản
          </CardContent>
        </AnimatedCard>

        <AnimatedCard delay={0.2}>
          <CardHeader className='pb-3'>
            <CardDescription>Tổng Khoản Nợ</CardDescription>
            <CardTitle className='text-2xl text-red-600'>
              -<AnimatedNumber value={summary.totalDebts} />
            </CardTitle>
          </CardHeader>
          <CardContent className='text-sm text-muted-foreground'>
            {summary.debtsCount} khoản nợ
          </CardContent>
        </AnimatedCard>
      </div>

      {/* Asset Allocation Chart */}
      {assets.length > 0 && (
        <AnimatedCard delay={0.3}>
          <CardHeader>
            <CardTitle>Phân Bổ Tài Sản</CardTitle>
            <CardDescription>Phân bố tài sản của bạn theo loại</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx='50%'
                  cy='50%'
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill='#8884d8'
                  dataKey='value'
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </AnimatedCard>
      )}

      {/* Assets List */}
      <AnimatedCard delay={0.4}>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Tài Sản Của Bạn</CardTitle>
              <CardDescription>Quản lý và theo dõi danh mục tài sản</CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className='h-4 w-4 mr-2' />
                  Thêm Tài Sản
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Thêm Tài Sản Mới</DialogTitle>
                  <DialogDescription>
                    Thêm tài sản mới để theo dõi tài sản của bạn
                  </DialogDescription>
                </DialogHeader>
                <div className='space-y-4'>
                  <div>
                    <Label htmlFor='asset-name'>Asset Name</Label>
                    <Input
                      id='asset-name'
                      placeholder='e.g., Main Savings Account'
                      value={newAsset.name}
                      onChange={(e) =>
                        setNewAsset({ ...newAsset, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor='asset-amount'>Amount (VND)</Label>
                    <Input
                      id='asset-amount'
                      type='number'
                      placeholder='0'
                      value={newAsset.amount}
                      onChange={(e) =>
                        setNewAsset({ ...newAsset, amount: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor='asset-type'>Type</Label>
                    <Select
                      value={newAsset.type}
                      onValueChange={(value: AssetType) =>
                        setNewAsset({ ...newAsset, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ASSET_TYPE_CONFIG).map(([type, config]) => (
                          <SelectItem key={type} value={type}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant='outline'
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddAsset} disabled={isSubmitting}>
                    Add Asset
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <div className='text-center py-12'>
              <Wallet className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
              <p className='text-muted-foreground mb-4'>
                No assets tracked yet. Start by adding your first asset.
              </p>
            </div>
          ) : (
            <div className='space-y-6'>
              {Object.entries(assetsByType).map(([type, items]) => {
                const config = ASSET_TYPE_CONFIG[type as AssetType];
                const Icon = config.icon;
                const total = items.reduce((sum, item) => sum + item.amount, 0);

                return (
                  <div key={type} className='space-y-3'>
                    <div className='flex items-center gap-2'>
                      <div
                        className='p-2 rounded-lg'
                        style={{ backgroundColor: `${config.color}20` }}
                      >
                        <Icon className='h-5 w-5' style={{ color: config.color }} />
                      </div>
                      <div className='flex-1'>
                        <h3 className='font-semibold'>{config.label}</h3>
                        <p className='text-sm text-muted-foreground'>
                          {items.length} item{items.length !== 1 ? 's' : ''} •{' '}
                          {formatCurrency(total)}
                        </p>
                      </div>
                    </div>
                    <div className='ml-11 space-y-2'>
                      {items.map((asset) => (
                        <div
                          key={asset.id}
                          className='flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors'
                        >
                          <div>
                            <p className='font-medium'>{asset.name}</p>
                            <p className='text-sm text-muted-foreground'>
                              {formatCurrency(asset.amount)}
                            </p>
                          </div>
                          <div className='flex items-center gap-2'>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => {
                                setEditingAsset(asset);
                                setEditAmount(asset.amount.toString());
                              }}
                            >
                              <Edit className='h-4 w-4' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => setDeleteConfirmAsset(asset)}
                            >
                              <Trash2 className='h-4 w-4 text-red-600' />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </AnimatedCard>

      {/* Edit Asset Dialog */}
      <Dialog
        open={!!editingAsset}
        onOpenChange={(open) => !open && setEditingAsset(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Asset Value</DialogTitle>
            <DialogDescription>
              Update the current value of {editingAsset?.name}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label htmlFor='edit-amount'>New Amount (VND)</Label>
              <Input
                id='edit-amount'
                type='number'
                placeholder='0'
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setEditingAsset(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAsset} disabled={isSubmitting}>
              Update Value
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteConfirmAsset}
        onOpenChange={(open) => !open && setDeleteConfirmAsset(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirmAsset?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAsset}
              className='bg-red-600 hover:bg-red-700'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
