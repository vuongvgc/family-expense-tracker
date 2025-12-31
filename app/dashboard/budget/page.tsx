import { getBudgetData } from '@/actions/budget-actions';
import { BudgetManagement } from '@/components/budget/budget-management';

interface BudgetPageProps {
  searchParams: Promise<{
    month?: string;
    year?: string;
  }>;
}

export default async function BudgetPage({ searchParams }: BudgetPageProps) {
  const params = await searchParams;

  // Get current date for defaults
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Parse URL params or use defaults
  const month = params.month ? parseInt(params.month) : currentMonth;
  const year = params.year ? parseInt(params.year) : currentYear;

  // Fetch budget data
  const data = await getBudgetData(month, year);

  return (
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
      <div className='space-y-6'>
        {/* Header */}
        <div>
          <h2 className='text-3xl font-bold text-gray-900'>Budget Management</h2>
          <p className='text-muted-foreground mt-1'>
            Plan your monthly spending and track progress in real-time
          </p>
        </div>

        {/* Budget Management Component */}
        <BudgetManagement initialData={data} />
      </div>
    </div>
  );
}
