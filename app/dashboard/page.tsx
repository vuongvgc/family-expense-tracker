'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import TransactionForm from '@/components/transaction-form';
import TransactionList from '@/components/transaction-list';
import BalanceSummary from '@/components/balance-summary';
import ExpenseChart from '@/components/expense-chart';
import { TransactionType } from '@prisma/client';
import { buildFilterQuery } from '@/lib/filters';

interface Transaction {
  id: string;
  amount: number;
  description: string;
  type: TransactionType;
  categoryId: string | null;
  date: string;
  createdBy: {
    id: string;
    name: string;
  };
  category?: {
    id: string;
    name: string;
    icon: string;
  };
}

interface CategoryData {
  category: string;
  icon: string;
  categoryId: string | null;
  amount: number;
  count: number;
  percentage: string;
}

interface AnalyticsData {
  expenses: {
    byCategory: CategoryData[];
    total: number;
  };
  income: {
    byCategory: CategoryData[];
    total: number;
  };
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(
    null
  );
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const session = await response.json();
      if (session?.user?.id) {
        setCurrentUserId(session.user.id);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Build filter query from current searchParams
        const filterQuery = buildFilterQuery(searchParams);

        // Fetch transactions and analytics in parallel
        const [transactionsRes, analyticsRes] = await Promise.all([
          fetch(`/api/transactions?${filterQuery}`),
          fetch(`/api/analytics?${filterQuery}`),
        ]);

        const transactionsData = await transactionsRes.json();
        const analyticsData = await analyticsRes.json();

        setTransactions(transactionsData.transactions || []);
        setAnalytics(analyticsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    fetchCurrentUser();
  }, [searchParams, refreshTrigger]);

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingTransaction(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const handleAddNew = () => {
    setEditingTransaction(null);
    setShowForm(true);
  };

  return (
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
      <div className='space-y-6'>
        {/* Header with Add Button */}
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-3xl font-bold text-gray-900'>Dashboard</h2>
            <p className='text-muted-foreground mt-1'>
              Track your family's income and expenses
            </p>
          </div>
          <Button onClick={handleAddNew} disabled={showForm}>
            <Plus className='h-4 w-4 mr-2' />
            Add Transaction
          </Button>
        </div>

        {/* Balance Summary Cards */}
        <BalanceSummary transactions={transactions} />

        {/* Expense Chart */}
        {analytics && (
          <ExpenseChart
            data={analytics.expenses.byCategory}
            total={analytics.expenses.total}
          />
        )}

        {/* Transaction Form */}
        {showForm && (
          <TransactionForm
            transaction={editingTransaction}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setShowForm(false);
              setEditingTransaction(null);
            }}
          />
        )}

        {/* Transaction List */}
        {isLoading ? (
          <div className='flex items-center justify-center py-12'>
            <Loader2 className='h-8 w-8 animate-spin text-primary' />
          </div>
        ) : (
          <TransactionList
            transactions={transactions}
            onEdit={handleEdit}
            onDelete={handleDelete}
            currentUserId={currentUserId}
          />
        )}
      </div>
    </div>
  );
}
