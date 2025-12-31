import { getAssets, getNetWorthSummary } from '@/actions/asset';
import AssetManagement from '@/components/assets/asset-management';

export default async function AssetsPage() {
  const [assetsResult, summaryResult] = await Promise.all([
    getAssets(),
    getNetWorthSummary(),
  ]);

  if (!assetsResult.success) {
    return (
      <div className='p-8'>
        <h1 className='text-2xl font-bold mb-4'>Asset Management</h1>
        <p className='text-red-600'>Error loading assets: {assetsResult.error}</p>
      </div>
    );
  }

  if (!summaryResult.success) {
    return (
      <div className='p-8'>
        <h1 className='text-2xl font-bold mb-4'>Asset Management</h1>
        <p className='text-red-600'>
          Error loading net worth summary: {summaryResult.error}
        </p>
      </div>
    );
  }

  return (
    <div className='p-8'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold mb-2'>Asset Management</h1>
        <p className='text-muted-foreground'>
          Track your wealth and calculate your net worth
        </p>
      </div>
      <AssetManagement
        initialAssets={assetsResult.assets}
        initialSummary={summaryResult.summary}
      />
    </div>
  );
}
