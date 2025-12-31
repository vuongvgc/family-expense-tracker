'use client';

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

interface IncomeExpenseChartProps {
  data: Array<{
    month: string;
    year: number;
    income: number;
    expenses: number;
  }>;
}

export default function IncomeExpenseChart({ data }: IncomeExpenseChartProps) {
  return (
    <ResponsiveContainer width='100%' height={350}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray='3 3' />
        <XAxis
          dataKey='month'
          tick={{ fontSize: 12 }}
          tickFormatter={(value, index) => {
            const item = data[index];
            return item ? `${value} '${item.year.toString().slice(2)}` : value;
          }}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickFormatter={(value) =>
            value >= 1000000
              ? `${(value / 1000000).toFixed(1)}M`
              : value >= 1000
              ? `${(value / 1000).toFixed(0)}K`
              : value
          }
        />
        <Tooltip
          formatter={(value: number) => formatCurrency(value)}
          labelFormatter={(label, payload) => {
            if (payload && payload[0]) {
              const data = payload[0].payload;
              return `${data.month} ${data.year}`;
            }
            return label;
          }}
        />
        <Legend />
        <Bar dataKey='income' fill='#10b981' name='Income' />
        <Bar dataKey='expenses' fill='#ef4444' name='Expenses' />
      </BarChart>
    </ResponsiveContainer>
  );
}
