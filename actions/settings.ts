'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

// Validation schema for profile update
const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
});

/**
 * Update the current user's profile name
 */
export async function updateProfile(formData: FormData) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    const name = formData.get('name') as string;

    // Validate input
    const validatedData = profileSchema.parse({ name });

    // Update user profile
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: validatedData.name },
    });

    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    console.error('Error updating profile:', error);

    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }

    return { error: 'Failed to update profile' };
  }
}

/**
 * Remove a member from the family group (Admin only)
 */
export async function removeMember(memberId: string) {
  try {
    const session = await auth();

    if (!session?.user?.familyGroupId) {
      return { error: 'Unauthorized' };
    }

    // Verify current user is an admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, familyGroupId: true },
    });

    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      return { error: 'Only admins can remove members' };
    }

    // Verify the member belongs to the same family
    const memberToRemove = await prisma.user.findUnique({
      where: { id: memberId },
      select: { familyGroupId: true, id: true },
    });

    if (
      !memberToRemove ||
      memberToRemove.familyGroupId !== session.user.familyGroupId
    ) {
      return { error: 'Member not found in your family' };
    }

    // Prevent admin from removing themselves (use leave family instead)
    if (memberId === session.user.id) {
      return { error: 'Use "Leave Family" to remove yourself' };
    }

    // Remove the member from the family
    await prisma.user.delete({
      where: { id: memberId },
    });

    revalidatePath('/dashboard/settings');

    return { success: true };
  } catch (error) {
    console.error('Error removing member:', error);
    return { error: 'Failed to remove member' };
  }
}

/**
 * Remove current user from their family group
 * If the family becomes empty, delete the family group
 */
export async function leaveFamily() {
  try {
    const session = await auth();

    if (!session?.user?.id || !session?.user?.familyGroupId) {
      return { error: 'Unauthorized' };
    }

    const familyGroupId = session.user.familyGroupId;

    // Delete the user
    await prisma.user.delete({
      where: { id: session.user.id },
    });

    // Check if the family group still has members
    const remainingMembers = await prisma.user.count({
      where: { familyGroupId },
    });

    // If no members remain, delete the family group
    if (remainingMembers === 0) {
      await prisma.familyGroup.delete({
        where: { id: familyGroupId },
      });
    }

    // Redirect to login page after leaving
    redirect('/login');
  } catch (error) {
    console.error('Error leaving family:', error);
    return { error: 'Failed to leave family' };
  }
}
