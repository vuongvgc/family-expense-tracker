'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import TransactionForm from '@/components/transaction-form';
import TransactionList from '@/components/transaction-list';
import BalanceSummary from '@/components/balance-summary';
import ExpenseChart from '@/components/expense-chart';
import { TransactionType, Category } from '@prisma/client';

interface Transaction {
  id: string;
  amount: number;
  description: string;
  type: TransactionType;
  category: Category;
  date: string;
  createdBy: {
    id: string;
    name: string;
  };
}

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(
    null
  );
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    fetchTransactions();
    fetchAnalytics();
    fetchCurrentUser();
  }, []);

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

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/transactions');
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingTransaction(null);
    fetchTransactions();
    fetchAnalytics();
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
        fetchTransactions();
        fetchAnalytics();
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
