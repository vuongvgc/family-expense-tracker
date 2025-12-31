'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, Home } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Email hoặc mật khẩu không chính xác');
        return;
      }

      if (result?.ok) {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='space-y-1'>
          <div className='flex items-center justify-center mb-2'>
            <div className='bg-primary/10 p-3 rounded-full'>
              <Home className='w-8 h-8 text-primary' />
            </div>
          </div>
          <CardTitle className='text-2xl text-center'>Chào Mừng Trở Lại</CardTitle>
          <CardDescription className='text-center'>
            Đăng nhập vào hệ thống quản lý chi tiêu gia đình
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                name='email'
                type='email'
                placeholder='nguyen@example.com'
                required
                disabled={isLoading}
                autoComplete='email'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='password'>Mật Khẩu</Label>
              <Input
                id='password'
                name='password'
                type='password'
                placeholder='••••••••'
                required
                disabled={isLoading}
                autoComplete='current-password'
              />
            </div>

            {error && (
              <div className='bg-destructive/10 text-destructive text-sm p-3 rounded-md'>
                {error}
              </div>
            )}

            <Button type='submit' className='w-full' disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Đang đăng nhập...
                </>
              ) : (
                'Đăng Nhập'
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className='flex justify-center'>
          <p className='text-sm text-muted-foreground'>
            Chưa có tài khoản?{' '}
            <Link
              href='/register'
              className='text-primary hover:underline font-medium'
            >
              Tạo tài khoản
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
