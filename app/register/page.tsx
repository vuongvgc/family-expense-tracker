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
            Family Expense Tracker
          </CardTitle>
          <CardDescription className='text-center'>
            Create a new family account or join an existing one
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} className='w-full'>
            <TabsList className='grid w-full grid-cols-2 mb-6'>
              <TabsTrigger
                active={activeTab === 'create'}
                onClick={() => {
                  setActiveTab('create');
                  setError('');
                  setSuccess('');
                }}
              >
                <Users className='w-4 h-4 mr-2' />
                Create Family
              </TabsTrigger>
              <TabsTrigger
                active={activeTab === 'join'}
                onClick={() => {
                  setActiveTab('join');
                  setError('');
                  setSuccess('');
                }}
              >
                <UserPlus className='w-4 h-4 mr-2' />
                Join Family
              </TabsTrigger>
            </TabsList>

            {/* CREATE FAMILY TAB */}
            <TabsContent
              value='create'
              className={activeTab === 'create' ? '' : 'hidden'}
            >
              <form onSubmit={handleSubmit} className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='create-name'>Your Name</Label>
                  <Input
                    id='create-name'
                    name='name'
                    placeholder='John Doe'
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
                    placeholder='john@example.com'
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='create-password'>Password</Label>
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
                  <Label htmlFor='familyName'>Family Name</Label>
                  <Input
                    id='familyName'
                    name='familyName'
                    placeholder='The Doe Family'
                    required
                    disabled={isLoading}
                  />
                  <p className='text-xs text-muted-foreground'>
                    This will be visible to all family members
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
                          Share this invite code with family members:
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
                      Creating...
                    </>
                  ) : (
                    'Create Family & Register'
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* JOIN FAMILY TAB */}
            <TabsContent
              value='join'
              className={activeTab === 'join' ? '' : 'hidden'}
            >
              <form onSubmit={handleSubmit} className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='join-name'>Your Name</Label>
                  <Input
                    id='join-name'
                    name='name'
                    placeholder='Jane Doe'
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
                    placeholder='jane@example.com'
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='join-password'>Password</Label>
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
                  <Label htmlFor='inviteCode'>Family Invite Code</Label>
                  <Input
                    id='inviteCode'
                    name='inviteCode'
                    placeholder='Enter the code from your family admin'
                    required
                    disabled={isLoading}
                  />
                  <p className='text-xs text-muted-foreground'>
                    Ask your family admin for the invite code
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
                      Joining...
                    </>
                  ) : (
                    'Join Family & Register'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className='flex justify-center'>
          <p className='text-sm text-muted-foreground'>
            Already have an account?{' '}
            <Link href='/login' className='text-primary hover:underline font-medium'>
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
