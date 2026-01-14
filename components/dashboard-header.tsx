'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Wallet,
  LogOut,
  Settings,
  LayoutDashboard,
  FolderKanban,
  BarChart3,
  CreditCard,
  Menu,
  User,
  ChevronDown,
  Users,
  TrendingUp,
  List,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface DashboardHeaderProps {
  userName: string;
  familyGroupId: string;
  familyGroupName: string;
  role: string;
}

const mainNavItems = [
  {
    href: '/dashboard',
    label: 'Tổng Quan',
    icon: LayoutDashboard,
  },
  {
    href: '/dashboard/transactions',
    label: 'Giao Dịch',
    icon: List,
  },
  {
    href: '/dashboard/analytics',
    label: 'Phân Tích',
    icon: BarChart3,
  },
  {
    href: '/dashboard/budget',
    label: 'Ngân Sách',
    icon: Wallet,
  },
  {
    href: '/dashboard/debts',
    label: 'Khoản Nợ',
    icon: CreditCard,
  },
  {
    href: '/dashboard/assets',
    label: 'Tài Sản',
    icon: TrendingUp,
  },
  {
    href: '/dashboard/events',
    label: 'Sự Kiện',
    icon: Calendar,
  },
];

const userMenuItems = [
  {
    href: '/dashboard/settings',
    label: 'Cài Đặt Hồ Sơ',
    icon: Settings,
  },
  {
    href: '/dashboard/categories',
    label: 'Quản Lý Danh Mục',
    icon: FolderKanban,
  },
];

export default function DashboardHeader({
  userName,
  familyGroupId,
  familyGroupName,
  role,
}: DashboardHeaderProps) {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className='sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-16'>
          {/* Left: Logo */}
          <Link href='/dashboard' className='flex items-center gap-3'>
            <div className='bg-primary/10 p-2 rounded-lg'>
              <Wallet className='h-5 w-5 text-primary' />
            </div>
            <div>
              <h1 className='text-lg font-bold text-gray-900'>{familyGroupName}</h1>
              {role === 'ADMIN' && (
                <span className='hidden lg:inline text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-medium'>
                  Admin
                </span>
              )}
            </div>
          </Link>

          {/* Center: Desktop Navigation */}
          <nav className='hidden md:flex items-center gap-1'>
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-gray-100'
                  )}
                >
                  <Icon className='h-4 w-4' />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: User Menu + Mobile Menu */}
          <div className='flex items-center gap-2'>
            {/* User Dropdown Menu (Desktop) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  className='hidden md:flex items-center gap-2 h-9'
                >
                  <Avatar className='h-7 w-7'>
                    <AvatarFallback className='text-xs bg-primary/10 text-primary'>
                      {getInitials(userName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className='text-sm font-medium'>{userName}</span>
                  <ChevronDown className='h-4 w-4 text-muted-foreground' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-56'>
                <DropdownMenuLabel>
                  <div className='flex flex-col space-y-1'>
                    <p className='text-sm font-medium'>{userName}</p>
                    <p className='text-xs text-muted-foreground flex items-center gap-1'>
                      <Users className='h-3 w-3' />
                      {role === 'ADMIN' ? 'Quản Trị Viên' : 'Thành Viên'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link
                        href={item.href}
                        className='flex items-center gap-2 cursor-pointer'
                      >
                        <Icon className='h-4 w-4' />
                        <span>{item.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className='flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600'
                >
                  <LogOut className='h-4 w-4' />
                  <span>Đăng Xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Sheet */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant='ghost' size='icon' className='md:hidden'>
                  <Menu className='h-5 w-5' />
                </Button>
              </SheetTrigger>
              <SheetContent side='right' className='w-[280px]'>
                <SheetHeader>
                  <SheetTitle>Thực Đơn</SheetTitle>
                </SheetHeader>
                <div className='flex flex-col gap-4 mt-8'>
                  {/* User Info */}
                  <div className='flex items-center gap-3 pb-4 border-b'>
                    <Avatar className='h-10 w-10'>
                      <AvatarFallback className='bg-primary/10 text-primary'>
                        {getInitials(userName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className='flex flex-col'>
                      <span className='text-sm font-medium'>{userName}</span>
                      <span className='text-xs text-muted-foreground'>
                        {role === 'ADMIN' ? 'Quản Trị Viên' : 'Thành Viên'}
                      </span>
                    </div>
                  </div>

                  {/* Main Navigation Links */}
                  <nav className='flex flex-col gap-1'>
                    {mainNavItems.map((item) => {
                      const isActive = pathname === item.href;
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setSheetOpen(false)}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors',
                            isActive
                              ? 'bg-primary/10 text-primary'
                              : 'text-muted-foreground hover:text-foreground hover:bg-gray-100'
                          )}
                        >
                          <Icon className='h-4 w-4' />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </nav>

                  {/* Settings Section */}
                  <div className='border-t pt-4'>
                    <p className='text-xs font-medium text-muted-foreground uppercase mb-2 px-3'>
                      Cài Đặt
                    </p>
                    <nav className='flex flex-col gap-1'>
                      {userMenuItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSheetOpen(false)}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors',
                              isActive
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:text-foreground hover:bg-gray-100'
                            )}
                          >
                            <Icon className='h-4 w-4' />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </nav>
                  </div>

                  {/* Sign Out */}
                  <Button
                    variant='outline'
                    onClick={handleSignOut}
                    className='flex items-center gap-2 mt-4 text-red-600 hover:text-red-600 border-red-200 hover:bg-red-50'
                  >
                    <LogOut className='h-4 w-4' />
                    <span>Đăng Xuất</span>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
