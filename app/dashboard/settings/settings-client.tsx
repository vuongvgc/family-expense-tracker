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
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Profile updated successfully',
        });
      }
    });
  };

  const handleCopyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(familyGroup.inviteCode);
      toast({
        title: 'Copied!',
        description: 'Invite code copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy invite code',
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
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Member removed successfully',
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
          title: 'Error',
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
          <CardTitle>My Profile</CardTitle>
          <CardDescription>
            Manage your personal information and preferences
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
                  Role: {user.role === UserRole.ADMIN ? 'Admin' : 'Member'}
                </p>
              </div>
            </div>

            {/* Display Name Input */}
            <div className='space-y-2'>
              <Label htmlFor='name'>Display Name</Label>
              <Input
                id='name'
                name='name'
                type='text'
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='Enter your name'
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
                Email cannot be changed
              </p>
            </div>

            {/* Save Button */}
            <Button type='submit' disabled={isPending || name === user.name}>
              {isPending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Family Management Card */}
      <Card>
        <CardHeader>
          <CardTitle>Family Group: {familyGroup.name}</CardTitle>
          <CardDescription>
            Manage your family members and invite new ones
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Invite Code Section */}
          <div className='space-y-2'>
            <Label>Invite Code</Label>
            <div className='flex items-center gap-2'>
              <div className='flex-1 p-3 bg-muted rounded-md font-mono text-sm'>
                {familyGroup.inviteCode}
              </div>
              <Button
                type='button'
                variant='outline'
                size='icon'
                onClick={handleCopyInviteCode}
                title='Copy invite code'
              >
                <Copy className='h-4 w-4' />
              </Button>
            </div>
            <p className='text-xs text-muted-foreground'>
              Share this code with family members to invite them
            </p>
          </div>

          {/* Members List */}
          <div className='space-y-2'>
            <Label>Family Members ({familyGroup.members.length})</Label>
            <div className='border rounded-md'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    {isAdmin && <TableHead className='text-right'>Action</TableHead>}
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
                                  (You)
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
                          {member.role === UserRole.ADMIN ? 'Admin' : 'Member'}
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
                                  <AlertDialogTitle>Remove Member?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove{' '}
                                    <strong>{member.name}</strong> from the family?
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRemoveMember(member.id)}
                                    className='bg-destructive hover:bg-destructive/90'
                                  >
                                    Remove
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
                  Leave Family
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Leave Family Group?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to leave this family? You will need a new
                    invite code to rejoin. If you are the last member, the family
                    group will be deleted permanently.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleLeaveFamily}
                    className='bg-destructive hover:bg-destructive/90'
                  >
                    {isPending ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Leaving...
                      </>
                    ) : (
                      'Leave Family'
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
