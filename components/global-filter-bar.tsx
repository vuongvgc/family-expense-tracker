'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { X, Calendar, Filter } from 'lucide-react';
import { TimePeriod, TIME_PERIOD_LABELS, buildFilterQuery } from '@/lib/filters';

interface Category {
  id: string;
  name: string;
  icon: string;
  type: string;
}

export default function GlobalFilterBar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // Initialize state from URL
  const [period, setPeriod] = useState<TimePeriod>(
    (searchParams.get('period') as TimePeriod) || 'this-month'
  );
  const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') || '');
  const [customStart, setCustomStart] = useState(
    searchParams.get('customStart') || ''
  );
  const [customEnd, setCustomEnd] = useState(searchParams.get('customEnd') || '');
  const [showCustomRange, setShowCustomRange] = useState(period === 'custom');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Update URL when filters change
  const updateURL = (updates: {
    period?: TimePeriod;
    categoryId?: string;
    customStart?: string;
    customEnd?: string;
  }) => {
    const newPeriod = updates.period ?? period;
    const newCategoryId = updates.categoryId ?? categoryId;
    const newCustomStart = updates.customStart ?? customStart;
    const newCustomEnd = updates.customEnd ?? customEnd;

    const query = buildFilterQuery({
      period: newPeriod,
      categoryId: newCategoryId || undefined,
      customStart: newPeriod === 'custom' ? newCustomStart || undefined : undefined,
      customEnd: newPeriod === 'custom' ? newCustomEnd || undefined : undefined,
    });

    router.replace(`${pathname}?${query}`, { scroll: false });
  };

  const handlePeriodChange = (newPeriod: TimePeriod) => {
    setPeriod(newPeriod);
    setShowCustomRange(newPeriod === 'custom');

    if (newPeriod !== 'custom') {
      setCustomStart('');
      setCustomEnd('');
      updateURL({ period: newPeriod, customStart: '', customEnd: '' });
    } else {
      updateURL({ period: newPeriod });
    }
  };

  const handleCategoryChange = (newCategoryId: string) => {
    setCategoryId(newCategoryId);
    updateURL({ categoryId: newCategoryId });
  };

  const handleCustomDateChange = () => {
    if (customStart && customEnd) {
      updateURL({ customStart, customEnd });
    }
  };

  const handleReset = () => {
    setPeriod('this-month');
    setCategoryId('');
    setCustomStart('');
    setCustomEnd('');
    setShowCustomRange(false);
    router.replace(pathname, { scroll: false });
  };

  const hasActiveFilters = period !== 'this-month' || categoryId !== '';

  return (
    <Card className='border-l-0 border-r-0 border-t-0 rounded-none'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
        <div className='flex flex-col gap-4'>
          <div className='flex items-center gap-2'>
            <Filter className='h-4 w-4 text-muted-foreground' />
            <span className='text-sm font-medium text-muted-foreground'>
              Filters
            </span>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {/* Time Period Filter */}
            <div className='space-y-2'>
              <Label htmlFor='period' className='text-xs'>
                Time Period
              </Label>
              <select
                id='period'
                value={period}
                onChange={(e) => handlePeriodChange(e.target.value as TimePeriod)}
                className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
              >
                {Object.entries(TIME_PERIOD_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className='space-y-2'>
              <Label htmlFor='category' className='text-xs'>
                Category
              </Label>
              <select
                id='category'
                value={categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                disabled={isLoadingCategories}
                className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
              >
                <option value=''>All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Button */}
            <div className='space-y-2'>
              <Label className='text-xs opacity-0'>Actions</Label>
              <Button
                variant='outline'
                onClick={handleReset}
                disabled={!hasActiveFilters}
                className='w-full'
              >
                <X className='h-4 w-4 mr-2' />
                Reset Filters
              </Button>
            </div>
          </div>

          {/* Custom Date Range */}
          {showCustomRange && (
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t'>
              <div className='space-y-2'>
                <Label htmlFor='customStart' className='text-xs'>
                  From Date
                </Label>
                <Input
                  id='customStart'
                  type='date'
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  onBlur={handleCustomDateChange}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='customEnd' className='text-xs'>
                  To Date
                </Label>
                <Input
                  id='customEnd'
                  type='date'
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  onBlur={handleCustomDateChange}
                  min={customStart}
                />
              </div>

              <div className='space-y-2'>
                <Label className='text-xs opacity-0'>Apply</Label>
                <Button
                  onClick={handleCustomDateChange}
                  disabled={!customStart || !customEnd}
                  className='w-full'
                >
                  <Calendar className='h-4 w-4 mr-2' />
                  Apply
                </Button>
              </div>
            </div>
          )}

          {/* Active Filter Summary */}
          {hasActiveFilters && (
            <div className='text-xs text-muted-foreground flex items-center gap-2'>
              <span>Active filters:</span>
              <span className='font-medium'>{TIME_PERIOD_LABELS[period]}</span>
              {categoryId && (
                <>
                  <span>•</span>
                  <span className='font-medium'>
                    {categories.find((c) => c.id === categoryId)?.icon}{' '}
                    {categories.find((c) => c.id === categoryId)?.name}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
