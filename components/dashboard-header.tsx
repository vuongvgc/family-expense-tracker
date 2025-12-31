'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  Home,
  LogOut,
  Users,
  Settings,
  LayoutDashboard,
  FolderKanban,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  userName: string;
  familyGroupId: string;
  role: string;
}

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/dashboard/analytics',
    label: 'Analytics',
    icon: BarChart3,
  },
  {
    href: '/dashboard/categories',
    label: 'Categories',
    icon: FolderKanban,
  },
  {
    href: '/dashboard/settings',
    label: 'Settings',
    icon: Settings,
  },
];

export default function DashboardHeader({
  userName,
  familyGroupId,
  role,
}: DashboardHeaderProps) {
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <header className='bg-white border-b border-gray-200'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-16'>
          {/* Left: Logo + Navigation */}
          <div className='flex items-center gap-8'>
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

            {/* Navigation */}
            <nav className='hidden md:flex items-center gap-1'>
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-gray-100'
                    )}
                  >
                    <Icon className='h-4 w-4' />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: User info + Sign out */}
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
