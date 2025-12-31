import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import SettingsPageClient from './settings-client';

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Fetch current user with family group and members
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      familyGroup: {
        include: {
          members: {
            orderBy: [{ role: 'asc' }, { name: 'asc' }],
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              image: true,
            },
          },
        },
      },
    },
  });

  if (!user || !user.familyGroup) {
    redirect('/login');
  }

  return (
    <SettingsPageClient
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
      }}
      familyGroup={{
        id: user.familyGroup.id,
        name: user.familyGroup.name,
        inviteCode: user.familyGroup.inviteCode,
        members: user.familyGroup.members,
      }}
    />
  );
}
