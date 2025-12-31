'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { TransactionType } from '@prisma/client';
import { z } from 'zod';

// Validation schemas
const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name is too long'),
  type: z.nativeEnum(TransactionType),
  icon: z.string().min(1, 'Icon is required').max(10, 'Icon is too long'),
});

/**
 * Get all categories for the current user's family
 */
export async function getCategories(type?: TransactionType) {
  try {
    const session = await auth();

    if (!session?.user?.familyGroupId) {
      return { error: 'Unauthorized' };
    }

    const where: any = {
      familyGroupId: session.user.familyGroupId,
    };

    if (type) {
      where.type = type;
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    return { categories };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { error: 'Failed to fetch categories' };
  }
}

/**
 * Create a new category
 */
export async function createCategory(formData: FormData) {
  try {
    const session = await auth();

    if (!session?.user?.familyGroupId) {
      return { error: 'Unauthorized' };
    }

    const data = {
      name: formData.get('name') as string,
      type: formData.get('type') as TransactionType,
      icon: formData.get('icon') as string,
    };

    // Validate input
    const validatedData = categorySchema.parse(data);

    // Check if category name already exists for this family
    const existingCategory = await prisma.category.findFirst({
      where: {
        familyGroupId: session.user.familyGroupId,
        name: validatedData.name,
        type: validatedData.type,
      },
    });

    if (existingCategory) {
      return { error: 'A category with this name already exists' };
    }

    // Create category
    const category = await prisma.category.create({
      data: {
        ...validatedData,
        familyGroupId: session.user.familyGroupId,
      },
    });

    revalidatePath('/dashboard/categories');
    revalidatePath('/dashboard');

    return { success: true, category };
  } catch (error) {
    console.error('Error creating category:', error);

    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }

    return { error: 'Failed to create category' };
  }
}

/**
 * Update an existing category
 */
export async function updateCategory(categoryId: string, formData: FormData) {
  try {
    const session = await auth();

    if (!session?.user?.familyGroupId) {
      return { error: 'Unauthorized' };
    }

    const data = {
      name: formData.get('name') as string,
      type: formData.get('type') as TransactionType,
      icon: formData.get('icon') as string,
    };

    // Validate input
    const validatedData = categorySchema.parse(data);

    // Verify category belongs to user's family
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { familyGroupId: true },
    });

    if (!category || category.familyGroupId !== session.user.familyGroupId) {
      return { error: 'Category not found' };
    }

    // Check if new name conflicts with existing category
    const existingCategory = await prisma.category.findFirst({
      where: {
        familyGroupId: session.user.familyGroupId,
        name: validatedData.name,
        type: validatedData.type,
        id: { not: categoryId },
      },
    });

    if (existingCategory) {
      return { error: 'A category with this name already exists' };
    }

    // Update category
    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: validatedData,
    });

    revalidatePath('/dashboard/categories');
    revalidatePath('/dashboard');

    return { success: true, category: updatedCategory };
  } catch (error) {
    console.error('Error updating category:', error);

    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }

    return { error: 'Failed to update category' };
  }
}

/**
 * Delete a category
 * Prevents deletion if the category has associated transactions
 */
export async function deleteCategory(categoryId: string) {
  try {
    const session = await auth();

    if (!session?.user?.familyGroupId) {
      return { error: 'Unauthorized' };
    }

    // Verify category belongs to user's family and check transaction count
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    if (!category || category.familyGroupId !== session.user.familyGroupId) {
      return { error: 'Category not found' };
    }

    // Prevent deletion if category has transactions
    if (category._count.transactions > 0) {
      return {
        error: `Cannot delete category. It has ${category._count.transactions} associated transaction(s).`,
      };
    }

    // Delete category
    await prisma.category.delete({
      where: { id: categoryId },
    });

    revalidatePath('/dashboard/categories');
    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    console.error('Error deleting category:', error);
    return { error: 'Failed to delete category' };
  }
}
