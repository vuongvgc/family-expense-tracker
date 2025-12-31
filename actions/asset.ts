'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { AssetType } from '@prisma/client';
import { revalidatePath } from 'next/cache';

/**
 * Get all assets for the current user's family group
 */
export async function getAssets() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { familyGroupId: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const assets = await prisma.asset.findMany({
      where: {
        familyGroupId: user.familyGroupId,
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });

    // Convert Decimal to number for client components
    const serializedAssets = assets.map((asset) => ({
      ...asset,
      amount: Number(asset.amount),
    }));

    return {
      success: true,
      assets: serializedAssets,
    };
  } catch (error) {
    console.error('Error fetching assets:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch assets',
      assets: [],
    };
  }
}

/**
 * Add a new asset
 */
export async function addAsset(name: string, amount: number, type: AssetType) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { familyGroupId: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Validation
    if (!name || name.trim().length === 0) {
      throw new Error('Asset name is required');
    }

    if (amount < 0) {
      throw new Error('Amount must be positive');
    }

    const asset = await prisma.asset.create({
      data: {
        name: name.trim(),
        amount,
        type,
        familyGroupId: user.familyGroupId,
      },
    });

    revalidatePath('/dashboard/assets');

    return {
      success: true,
      message: 'Asset added successfully',
      asset: {
        ...asset,
        amount: Number(asset.amount),
      },
    };
  } catch (error) {
    console.error('Error adding asset:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add asset',
    };
  }
}

/**
 * Update the value of an existing asset
 */
export async function updateAssetValue(id: string, newAmount: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { familyGroupId: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Validation
    if (newAmount < 0) {
      throw new Error('Amount must be positive');
    }

    // Verify the asset belongs to the user's family group
    const existingAsset = await prisma.asset.findFirst({
      where: {
        id,
        familyGroupId: user.familyGroupId,
      },
    });

    if (!existingAsset) {
      throw new Error('Asset not found');
    }

    const asset = await prisma.asset.update({
      where: { id },
      data: { amount: newAmount },
    });

    revalidatePath('/dashboard/assets');

    return {
      success: true,
      message: 'Asset value updated successfully',
      asset: {
        ...asset,
        amount: Number(asset.amount),
      },
    };
  } catch (error) {
    console.error('Error updating asset:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update asset value',
    };
  }
}

/**
 * Delete an asset
 */
export async function deleteAsset(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { familyGroupId: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify the asset belongs to the user's family group
    const existingAsset = await prisma.asset.findFirst({
      where: {
        id,
        familyGroupId: user.familyGroupId,
      },
    });

    if (!existingAsset) {
      throw new Error('Asset not found');
    }

    await prisma.asset.delete({
      where: { id },
    });

    revalidatePath('/dashboard/assets');

    return {
      success: true,
      message: 'Asset deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting asset:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete asset',
    };
  }
}

/**
 * Get net worth summary
 * Calculates: Total Assets - Total Debts = Net Worth
 */
export async function getNetWorthSummary() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { familyGroupId: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get total assets
    const assets = await prisma.asset.findMany({
      where: {
        familyGroupId: user.familyGroupId,
      },
      select: {
        amount: true,
      },
    });

    const totalAssets = assets.reduce((sum, asset) => sum + Number(asset.amount), 0);

    // Get total outstanding debts
    const debts = await prisma.debt.findMany({
      where: {
        familyGroupId: user.familyGroupId,
        status: 'ACTIVE',
      },
      select: {
        remainingAmount: true,
      },
    });

    const totalDebts = debts.reduce(
      (sum, debt) => sum + Number(debt.remainingAmount),
      0
    );

    const netWorth = totalAssets - totalDebts;

    return {
      success: true,
      summary: {
        totalAssets,
        totalDebts,
        netWorth,
        assetsCount: assets.length,
        debtsCount: debts.length,
      },
    };
  } catch (error) {
    console.error('Error calculating net worth:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to calculate net worth',
      summary: {
        totalAssets: 0,
        totalDebts: 0,
        netWorth: 0,
        assetsCount: 0,
        debtsCount: 0,
      },
    };
  }
}
