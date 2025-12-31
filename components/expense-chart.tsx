'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Category } from '@prisma/client';
import { formatCurrency } from '@/lib/utils';

interface CategoryData {
  category: Category;
  amount: number;
  count: number;
  percentage: string;
}

interface ExpenseChartProps {
  data: CategoryData[];
  total: number;
}

const CATEGORY_LABELS: Record<Category, string> = {
  FOOD: 'Food & Dining',
  TRANSPORT: 'Transport',
  UTILITIES: 'Utilities',
  HEALTHCARE: 'Healthcare',
  EDUCATION: 'Education',
  ENTERTAINMENT: 'Entertainment',
  SHOPPING: 'Shopping',
  SALARY: 'Salary',
  INVESTMENT: 'Investment',
  OTHER: 'Other',
};

const COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
];

export default function ExpenseChart({ data, total }: ExpenseChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expense Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center text-muted-foreground py-12'>
            <p>No expense data available</p>
            <p className='text-sm mt-2'>Add some expenses to see the breakdown</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort by amount descending
  const sortedData = [...data].sort((a, b) => b.amount - a.amount);

  // Prepare chart data
  const chartData = sortedData.map((item) => ({
    name: CATEGORY_LABELS[item.category],
    value: item.amount,
    percentage: item.percentage,
    count: item.count,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className='bg-white p-3 rounded-lg shadow-lg border'>
          <p className='font-semibold'>{data.name}</p>
          <p className='text-sm text-muted-foreground'>
            {formatCurrency(data.value)}
          </p>
          <p className='text-sm text-muted-foreground'>
            {data.percentage}% of total
          </p>
          <p className='text-xs text-muted-foreground mt-1'>
            {data.count} transaction{data.count !== 1 ? 's' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Breakdown by Category</CardTitle>
        <p className='text-sm text-muted-foreground'>
          Total: {formatCurrency(total)}
        </p>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Pie Chart */}
          <div className='h-[300px]'>
            <ResponsiveContainer width='100%' height='100%'>
              <PieChart>
                <Pie
                  data={chartData}
                  cx='50%'
                  cy='50%'
                  labelLine={false}
                  label={({ percentage }) => `${percentage}%`}
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
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend with Details */}
          <div className='space-y-3'>
            <h3 className='font-semibold text-sm text-muted-foreground mb-3'>
              Category Details
            </h3>
            {sortedData.map((item, index) => (
              <div
                key={item.category}
                className='flex items-center justify-between p-2 rounded-md hover:bg-accent/50 transition-colors'
              >
                <div className='flex items-center gap-3'>
                  <div
                    className='w-4 h-4 rounded-full'
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div>
                    <p className='text-sm font-medium'>
                      {CATEGORY_LABELS[item.category]}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {item.count} transaction{item.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className='text-right'>
                  <p className='text-sm font-semibold'>
                    {formatCurrency(item.amount)}
                  </p>
                  <p className='text-xs text-muted-foreground'>{item.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
