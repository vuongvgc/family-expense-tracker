'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { updateProfile, removeMember, leaveFamily } from '@/actions/settings';
import { Copy, Trash2, Loader2, LogOut } from 'lucide-react';
import { UserRole } from '@prisma/client';

interface Member {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  image: string | null;
}

interface SettingsPageClientProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    image: string | null;
  };
  familyGroup: {
    id: string;
    name: string;
    inviteCode: string;
    members: Member[];
  };
}

export default function SettingsPageClient({
  user,
  familyGroup,
}: SettingsPageClientProps) {
  const [name, setName] = useState(user.name);
  const [isPending, startTransition] = useTransition();
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const { toast } = useToast();

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    startTransition(async () => {
      const formData = new FormData(e.currentTarget);
      const result = await updateProfile(formData);

      if (result?.error) {
        toast({
          title: 'Lỗi',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Thành Công',
          description: 'Cập nhật hồ sơ thành công',
        });
      }
    });
  };

  const handleCopyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(familyGroup.inviteCode);
      toast({
        title: 'Đã Sao Chép!',
        description: 'Mã mời đã được sao chép vào clipboard',
      });
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể sao chép mã mời',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    setRemovingMemberId(memberId);

    startTransition(async () => {
      const result = await removeMember(memberId);

      if (result?.error) {
        toast({
          title: 'Lỗi',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Thành Công',
          description: 'Xóa thành viên thành công',
        });
      }

      setRemovingMemberId(null);
    });
  };

  const handleLeaveFamily = async () => {
    startTransition(async () => {
      const result = await leaveFamily();

      if (result?.error) {
        toast({
          title: 'Lỗi',
          description: result.error,
          variant: 'destructive',
        });
      }
      // If successful, the action will redirect to login
    });
  };

  const isAdmin = user.role === UserRole.ADMIN;

  return (
    <div className='container mx-auto p-6 max-w-5xl space-y-6'>
      {/* Personal Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Hồ Sơ Của Tôi</CardTitle>
          <CardDescription>
            Quản lý thông tin cá nhân và tùy chọn của bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className='space-y-6'>
            {/* Avatar Display */}
            <div className='flex items-center gap-4'>
              <Avatar className='h-20 w-20'>
                <AvatarImage src={user.image || undefined} alt={user.name} />
                <AvatarFallback className='text-lg'>
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className='text-sm font-medium'>{user.name}</p>
                <p className='text-sm text-muted-foreground'>{user.email}</p>
                <p className='text-xs text-muted-foreground mt-1'>
                  Vai trò:{' '}
                  {user.role === UserRole.ADMIN ? 'Quản Trị Viên' : 'Thành Viên'}
                </p>
              </div>
            </div>

            {/* Display Name Input */}
            <div className='space-y-2'>
              <Label htmlFor='name'>Tên Hiển Thị</Label>
              <Input
                id='name'
                name='name'
                type='text'
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='Nhập tên của bạn'
                required
                maxLength={100}
              />
            </div>

            {/* Email Input (Read-only) */}
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                value={user.email}
                disabled
                className='bg-muted'
              />
              <p className='text-xs text-muted-foreground'>
                Email không thể thay đổi
              </p>
            </div>

            {/* Save Button */}
            <Button type='submit' disabled={isPending || name === user.name}>
              {isPending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Đang lưu...
                </>
              ) : (
                'Lưu Thay Đổi'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Family Management Card */}
      <Card>
        <CardHeader>
          <CardTitle>Nhóm Gia Đình: {familyGroup.name}</CardTitle>
          <CardDescription>
            Quản lý thành viên gia đình và mời thành viên mới
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Invite Code Section */}
          <div className='space-y-2'>
            <Label>Mã Mời</Label>
            <div className='flex items-center gap-2'>
              <div className='flex-1 p-3 bg-muted rounded-md font-mono text-sm'>
                {familyGroup.inviteCode}
              </div>
              <Button
                type='button'
                variant='outline'
                size='icon'
                onClick={handleCopyInviteCode}
                title='Sao chép mã mời'
              >
                <Copy className='h-4 w-4' />
              </Button>
            </div>
            <p className='text-xs text-muted-foreground'>
              Chia sẻ mã này với các thành viên gia đình để mời họ
            </p>
          </div>

          {/* Members List */}
          <div className='space-y-2'>
            <Label>Thành Viên Gia Đình ({familyGroup.members.length})</Label>
            <div className='border rounded-md'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thành Viên</TableHead>
                    <TableHead>Vai Trò</TableHead>
                    {isAdmin && (
                      <TableHead className='text-right'>Thao Tác</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {familyGroup.members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className='flex items-center gap-3'>
                          <Avatar className='h-8 w-8'>
                            <AvatarImage
                              src={member.image || undefined}
                              alt={member.name}
                            />
                            <AvatarFallback className='text-xs'>
                              {getInitials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className='text-sm font-medium'>
                              {member.name}
                              {member.id === user.id && (
                                <span className='text-muted-foreground ml-1'>
                                  (Bạn)
                                </span>
                              )}
                            </p>
                            <p className='text-xs text-muted-foreground'>
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            member.role === UserRole.ADMIN
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {member.role === UserRole.ADMIN
                            ? 'Quản Trị Viên'
                            : 'Thành Viên'}
                        </span>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className='text-right'>
                          {member.id !== user.id && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  disabled={removingMemberId === member.id}
                                >
                                  {removingMemberId === member.id ? (
                                    <Loader2 className='h-4 w-4 animate-spin' />
                                  ) : (
                                    <Trash2 className='h-4 w-4 text-destructive' />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Xóa Thành Viên?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Bạn có chắc chắn muốn xóa{' '}
                                    <strong>{member.name}</strong> khỏi gia đình
                                    không? Thao tác này không thể hoàn tác.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRemoveMember(member.id)}
                                    className='bg-destructive hover:bg-destructive/90'
                                  >
                                    Xóa
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Leave Family Button */}
          <div className='pt-4 border-t'>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant='destructive' disabled={isPending}>
                  <LogOut className='mr-2 h-4 w-4' />
                  Rời Gia Đình
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Rời Khỏi Nhóm Gia Đình?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn có chắc chắn muốn rời khỏi gia đình này không? Bạn sẽ cần mã
                    mời mới để tham gia lại. Nếu bạn là thành viên cuối cùng, nhóm
                    gia đình sẽ bị xóa vĩnh viễn.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleLeaveFamily}
                    className='bg-destructive hover:bg-destructive/90'
                  >
                    {isPending ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Đang rời...
                      </>
                    ) : (
                      'Rời Gia Đình'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
