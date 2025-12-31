'use client';

import { useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserPlus, Loader2, Home } from 'lucide-react';

type TabType = 'create' | 'join';

export default function RegisterPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('create');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [inviteCode, setInviteCode] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      action: activeTab,
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      ...(activeTab === 'create'
        ? { familyName: formData.get('familyName') as string }
        : { inviteCode: formData.get('inviteCode') as string }),
    };

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Registration failed');
        return;
      }

      setSuccess(result.message);
      if (result.inviteCode) {
        setInviteCode(result.inviteCode);
      }

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
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
          <CardTitle className='text-2xl text-center'>
            Quản Lý Chi Tiêu Gia Đình
          </CardTitle>
          <CardDescription className='text-center'>
            Tạo gia đình mới hoặc tham gia gia đình hiện có
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              setActiveTab(value as TabType);
              setError('');
              setSuccess('');
            }}
            className='w-full'
          >
            <TabsList className='grid w-full grid-cols-2 mb-6'>
              <TabsTrigger value='create'>
                <Users className='w-4 h-4 mr-2' />
                Tạo Gia Đình
              </TabsTrigger>
              <TabsTrigger value='join'>
                <UserPlus className='w-4 h-4 mr-2' />
                Tham Gia Gia Đình
              </TabsTrigger>
            </TabsList>

            {/* CREATE FAMILY TAB */}
            <TabsContent value='create'>
              <form onSubmit={handleSubmit} className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='create-name'>Tên Của Bạn</Label>
                  <Input
                    id='create-name'
                    name='name'
                    placeholder='Nguyễn Văn A'
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='create-email'>Email</Label>
                  <Input
                    id='create-email'
                    name='email'
                    type='email'
                    placeholder='nguyen@example.com'
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='create-password'>Mật Khẩu</Label>
                  <Input
                    id='create-password'
                    name='password'
                    type='password'
                    placeholder='••••••••'
                    required
                    minLength={6}
                    disabled={isLoading}
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='familyName'>Tên Gia Đình</Label>
                  <Input
                    id='familyName'
                    name='familyName'
                    placeholder='Gia Đình Nguyễn'
                    required
                    disabled={isLoading}
                  />
                  <p className='text-xs text-muted-foreground'>
                    Tên này sẽ hiển thị cho tất cả thành viên gia đình
                  </p>
                </div>

                {error && (
                  <div className='bg-destructive/10 text-destructive text-sm p-3 rounded-md'>
                    {error}
                  </div>
                )}

                {success && (
                  <div className='bg-green-50 text-green-700 text-sm p-3 rounded-md space-y-2'>
                    <p>{success}</p>
                    {inviteCode && (
                      <div className='bg-white p-2 rounded border border-green-200'>
                        <p className='font-semibold text-xs mb-1'>
                          Chia sẻ mã mời này với thành viên gia đình:
                        </p>
                        <code className='text-primary font-mono text-sm'>
                          {inviteCode}
                        </code>
                      </div>
                    )}
                  </div>
                )}

                <Button type='submit' className='w-full' disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Đang tạo...
                    </>
                  ) : (
                    'Tạo Gia Đình & Đăng Ký'
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* JOIN FAMILY TAB */}
            <TabsContent value='join'>
              <form onSubmit={handleSubmit} className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='join-name'>Tên Của Bạn</Label>
                  <Input
                    id='join-name'
                    name='name'
                    placeholder='Trần Thị B'
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='join-email'>Email</Label>
                  <Input
                    id='join-email'
                    name='email'
                    type='email'
                    placeholder='tran@example.com'
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='join-password'>Mật Khẩu</Label>
                  <Input
                    id='join-password'
                    name='password'
                    type='password'
                    placeholder='••••••••'
                    required
                    minLength={6}
                    disabled={isLoading}
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='inviteCode'>Mã Mời Gia Đình</Label>
                  <Input
                    id='inviteCode'
                    name='inviteCode'
                    placeholder='Nhập mã mời từ quản trị viên gia đình'
                    required
                    disabled={isLoading}
                  />
                  <p className='text-xs text-muted-foreground'>
                    Hỏi quản trị viên gia đình để lấy mã mời
                  </p>
                </div>

                {error && (
                  <div className='bg-destructive/10 text-destructive text-sm p-3 rounded-md'>
                    {error}
                  </div>
                )}

                {success && (
                  <div className='bg-green-50 text-green-700 text-sm p-3 rounded-md'>
                    {success}
                  </div>
                )}

                <Button type='submit' className='w-full' disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Đang tham gia...
                    </>
                  ) : (
                    'Tham Gia Gia Đình & Đăng Ký'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className='flex justify-center'>
          <p className='text-sm text-muted-foreground'>
            Đã có tài khoản?{' '}
            <Link href='/login' className='text-primary hover:underline font-medium'>
              Đăng nhập
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
