import { getDebts } from '@/actions/debt';
import { DebtManagement } from '@/components/debts/debt-management';

export default async function DebtsPage() {
  const { summary, debts } = await getDebts();

  return (
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
      <DebtManagement initialSummary={summary} initialDebts={debts} />
    </div>
  );
}
