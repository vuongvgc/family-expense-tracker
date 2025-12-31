import { startOfMonth, endOfMonth } from 'date-fns';
import {
  getTransactions,
  getFilteredTransactionsSummary,
} from '@/actions/transaction';
import { getCategories } from '@/actions/category';
import TransactionsClient from '@/components/transactions/transactions-client';

export default async function TransactionsPage() {
  const now = new Date();
  const fromDate = startOfMonth(now);
  const toDate = endOfMonth(now);

  const [transactionsResult, summaryResult, categoriesResult] = await Promise.all([
    getTransactions({ fromDate, toDate, page: 1, pageSize: 50 }),
    getFilteredTransactionsSummary({ fromDate, toDate }),
    getCategories(),
  ]);

  if (!transactionsResult.success || !summaryResult.success || categoriesResult.error) {
    return (
      <div className='p-8'>
        <div className='text-center'>
          <p className='text-red-600'>Failed to load transactions</p>
        </div>
      </div>
    );
  }

  return (
    <TransactionsClient
      initialTransactions={transactionsResult.transactions}
      initialSummary={summaryResult.summary}
      initialPagination={transactionsResult.pagination}
      categories={categoriesResult.categories || []}
    />
  );
}
