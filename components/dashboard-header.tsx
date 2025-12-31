'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Home, LogOut, Users } from 'lucide-react';

interface DashboardHeaderProps {
  userName: string;
  familyGroupId: string;
  role: string;
}

export default function DashboardHeader({
  userName,
  familyGroupId,
  role,
}: DashboardHeaderProps) {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <header className='bg-white border-b border-gray-200'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-16'>
          <div className='flex items-center gap-3'>
            <div className='bg-primary/10 p-2 rounded-lg'>
              <Home className='h-6 w-6 text-primary' />
            </div>
            <div>
              <h1 className='text-xl font-bold text-gray-900'>
                Family Expense Tracker
              </h1>
              <p className='text-xs text-muted-foreground'>
                {role === 'ADMIN' ? 'Admin' : 'Member'}
              </p>
            </div>
          </div>

          <div className='flex items-center gap-4'>
            <div className='hidden sm:flex items-center gap-2 text-sm text-muted-foreground'>
              <Users className='h-4 w-4' />
              <span>{userName}</span>
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={handleSignOut}
              className='flex items-center gap-2'
            >
              <LogOut className='h-4 w-4' />
              <span className='hidden sm:inline'>Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
