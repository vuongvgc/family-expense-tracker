import { getComparativeMonthlyData } from '@/actions/analytics';
import { ComparativeReport } from '@/components/analytics/comparative-report';

interface AnalyticsPageProps {
  searchParams: Promise<{
    tM?: string;
    tY?: string;
    rM?: string;
    rY?: string;
  }>;
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const params = await searchParams;

  // Get current date for defaults
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Calculate last month for reference default
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  // Parse URL params or use defaults
  const targetMonth = params.tM ? parseInt(params.tM) : currentMonth;
  const targetYear = params.tY ? parseInt(params.tY) : currentYear;
  const refMonth = params.rM ? parseInt(params.rM) : lastMonth;
  const refYear = params.rY ? parseInt(params.rY) : lastMonthYear;

  // Fetch comparative data
  const data = await getComparativeMonthlyData(
    targetMonth,
    targetYear,
    refMonth,
    refYear
  );

  return (
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
      <div className='space-y-6'>
        {/* Header */}
        <div>
          <h2 className='text-3xl font-bold text-gray-900'>Financial Analytics</h2>
          <p className='text-muted-foreground mt-1'>
            Compare your expenses across different periods
          </p>
        </div>

        {/* Comparative Report */}
        <ComparativeReport initialData={data} />
      </div>
    </div>
  );
}
