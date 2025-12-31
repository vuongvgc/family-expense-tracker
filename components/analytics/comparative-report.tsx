'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface ComparativeSummary {
  targetTotal: number;
  refTotal: number;
  diff: number;
  percentChange: number;
}

interface ChartDataItem {
  categoryName: string;
  categoryIcon: string;
  targetAmount: number;
  refAmount: number;
}

interface ComparativeReportProps {
  initialData: {
    summary: ComparativeSummary;
    chartData: ChartDataItem[];
  };
}

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const YEARS = Array.from({ length: 8 }, (_, i) => {
  const year = new Date().getFullYear() - 3 + i;
  return { value: year, label: year.toString() };
});

export function ComparativeReport({ initialData }: ComparativeReportProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get current date for defaults
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Calculate last month for reference default
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  // Parse URL params or use defaults
  const [targetMonth, setTargetMonth] = useState(
    parseInt(searchParams.get('tM') || currentMonth.toString())
  );
  const [targetYear, setTargetYear] = useState(
    parseInt(searchParams.get('tY') || currentYear.toString())
  );
  const [refMonth, setRefMonth] = useState(
    parseInt(searchParams.get('rM') || lastMonth.toString())
  );
  const [refYear, setRefYear] = useState(
    parseInt(searchParams.get('rY') || lastMonthYear.toString())
  );

  const [data, setData] = useState(initialData);

  // Update data when initialData changes (after server refetch)
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('tM', targetMonth.toString());
    params.set('tY', targetYear.toString());
    params.set('rM', refMonth.toString());
    params.set('rY', refYear.toString());

    router.push(`/dashboard/analytics?${params.toString()}`);
    router.refresh();
  }, [targetMonth, targetYear, refMonth, refYear, router]);

  const { summary, chartData } = data;

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className='bg-white p-3 border rounded-lg shadow-lg'>
          <p className='font-medium mb-2'>{payload[0].payload.categoryName}</p>
          <p className='text-sm text-gray-600'>
            Reference: {formatCurrency(payload[0].value)}
          </p>
          <p className='text-sm text-blue-600'>
            Target: {formatCurrency(payload[1].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className='space-y-6'>
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Period Selection</CardTitle>
          <CardDescription>
            Compare expenses between two different months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Target Period */}
            <div className='space-y-4'>
              <h3 className='text-sm font-medium text-blue-600'>
                Target Period (Current)
              </h3>
              <div className='grid grid-cols-2 gap-3'>
                <div className='space-y-2'>
                  <label className='text-xs text-gray-500'>Month</label>
                  <Select
                    value={targetMonth.toString()}
                    onValueChange={(value) => setTargetMonth(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((month) => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <label className='text-xs text-gray-500'>Year</label>
                  <Select
                    value={targetYear.toString()}
                    onValueChange={(value) => setTargetYear(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map((year) => (
                        <SelectItem key={year.value} value={year.value.toString()}>
                          {year.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Reference Period */}
            <div className='space-y-4'>
              <h3 className='text-sm font-medium text-gray-600'>
                Reference Period (Previous)
              </h3>
              <div className='grid grid-cols-2 gap-3'>
                <div className='space-y-2'>
                  <label className='text-xs text-gray-500'>Month</label>
                  <Select
                    value={refMonth.toString()}
                    onValueChange={(value) => setRefMonth(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((month) => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <label className='text-xs text-gray-500'>Year</label>
                  <Select
                    value={refYear.toString()}
                    onValueChange={(value) => setRefYear(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map((year) => (
                        <SelectItem key={year.value} value={year.value.toString()}>
                          {year.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card>
          <CardHeader className='pb-3'>
            <CardDescription>Total Target</CardDescription>
            <CardTitle className='text-2xl text-blue-600'>
              {formatCurrency(summary.targetTotal)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-xs text-muted-foreground'>
              {MONTHS.find((m) => m.value === targetMonth)?.label} {targetYear}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardDescription>Total Reference</CardDescription>
            <CardTitle className='text-2xl text-gray-600'>
              {formatCurrency(summary.refTotal)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-xs text-muted-foreground'>
              {MONTHS.find((m) => m.value === refMonth)?.label} {refYear}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardDescription>Net Difference</CardDescription>
            <CardTitle
              className={`text-2xl flex items-center gap-2 ${
                summary.diff > 0 ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {summary.diff > 0 ? (
                <TrendingUp className='h-5 w-5' />
              ) : summary.diff < 0 ? (
                <TrendingDown className='h-5 w-5' />
              ) : null}
              {formatCurrency(Math.abs(summary.diff))}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-xs font-medium ${
                summary.diff > 0 ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {summary.diff > 0 ? '+' : ''}
              {summary.percentChange.toFixed(1)}% vs reference
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Category Comparison</CardTitle>
          <CardDescription>
            Expense breakdown by category for both periods
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width='100%' height={400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis
                  dataKey='categoryName'
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor='end'
                  height={100}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  dataKey='refAmount'
                  fill='#9ca3af'
                  name='Reference Period'
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey='targetAmount'
                  fill='#2563eb'
                  name='Target Period'
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className='h-[400px] flex items-center justify-center text-muted-foreground'>
              No expense data found for the selected periods
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Table */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Breakdown</CardTitle>
            <CardDescription>
              Category-by-category comparison with differences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b'>
                    <th className='text-left py-3 px-4 font-medium'>Category</th>
                    <th className='text-right py-3 px-4 font-medium'>Reference</th>
                    <th className='text-right py-3 px-4 font-medium'>Target</th>
                    <th className='text-right py-3 px-4 font-medium'>Difference</th>
                    <th className='text-right py-3 px-4 font-medium'>Change</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((item, index) => {
                    const diff = item.targetAmount - item.refAmount;
                    const percentChange =
                      item.refAmount === 0 ? 0 : (diff / item.refAmount) * 100;

                    return (
                      <tr key={index} className='border-b hover:bg-gray-50'>
                        <td className='py-3 px-4'>
                          <div className='flex items-center gap-2'>
                            <span className='text-xl'>{item.categoryIcon}</span>
                            <span>{item.categoryName}</span>
                          </div>
                        </td>
                        <td className='text-right py-3 px-4 text-gray-600'>
                          {formatCurrency(item.refAmount)}
                        </td>
                        <td className='text-right py-3 px-4 text-blue-600 font-medium'>
                          {formatCurrency(item.targetAmount)}
                        </td>
                        <td
                          className={`text-right py-3 px-4 font-medium ${
                            diff > 0
                              ? 'text-red-600'
                              : diff < 0
                              ? 'text-green-600'
                              : ''
                          }`}
                        >
                          {diff > 0 ? '+' : ''}
                          {formatCurrency(diff)}
                        </td>
                        <td
                          className={`text-right py-3 px-4 text-sm ${
                            diff > 0
                              ? 'text-red-600'
                              : diff < 0
                              ? 'text-green-600'
                              : ''
                          }`}
                        >
                          {diff > 0 ? '+' : ''}
                          {percentChange.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
