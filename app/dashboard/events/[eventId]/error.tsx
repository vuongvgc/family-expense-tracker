'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Event page error:', error);
  }, [error]);

  return (
    <div className='container mx-auto p-6'>
      <Card>
        <CardHeader>
          <CardTitle className='text-red-600'>❌ Lỗi tải sự kiện</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-muted-foreground'>
            Không thể tải thông tin sự kiện. Vui lòng thử lại.
          </p>
          <details className='text-sm'>
            <summary className='cursor-pointer font-medium'>Chi tiết lỗi</summary>
            <pre className='mt-2 p-4 bg-muted rounded overflow-auto'>
              {error.message}
            </pre>
          </details>
          <div className='flex gap-4'>
            <Button onClick={reset}>Thử lại</Button>
            <Button
              variant='outline'
              onClick={() => (window.location.href = '/dashboard/events')}
            >
              Quay lại danh sách sự kiện
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
