// Migration script to move data from old category enum to new category model
// Run this BEFORE pushing the new schema

import prisma from '../lib/prisma';
import { DEFAULT_CATEGORIES } from '../lib/default-categories';

async function migrateCategories() {
  console.log('Starting category migration...');

  try {
    // Get all families
    const families = await prisma.familyGroup.findMany({
      select: { id: true, name: true },
    });

    console.log(`Found ${families.length} families`);

    for (const family of families) {
      console.log(`\nProcessing family: ${family.name}`);

      // Create categories for this family
      const createdCategories = await prisma.category.createMany({
        data: DEFAULT_CATEGORIES.map((cat) => ({
          name: cat.name,
          type: cat.type,
          icon: cat.icon,
          familyGroupId: family.id,
        })),
        skipDuplicates: true,
      });

      console.log(`  Created ${createdCategories.count} categories`);

      // Get the created categories
      const categories = await prisma.category.findMany({
        where: { familyGroupId: family.id },
      });

      // Create a mapping from old enum values to new category IDs
      const categoryMap: Record<string, string> = {
        FOOD: categories.find((c) => c.name === 'Food & Dining')?.id || '',
        TRANSPORT: categories.find((c) => c.name === 'Transport')?.id || '',
        UTILITIES: categories.find((c) => c.name === 'Utilities')?.id || '',
        HEALTHCARE: categories.find((c) => c.name === 'Healthcare')?.id || '',
        EDUCATION: categories.find((c) => c.name === 'Education')?.id || '',
        ENTERTAINMENT: categories.find((c) => c.name === 'Entertainment')?.id || '',
        SHOPPING: categories.find((c) => c.name === 'Shopping')?.id || '',
        SALARY: categories.find((c) => c.name === 'Salary')?.id || '',
        INVESTMENT: categories.find((c) => c.name === 'Investment')?.id || '',
        OTHER:
          categories.find((c) => c.name === 'Other Expense')?.id ||
          categories.find((c) => c.name === 'Other Income')?.id ||
          '',
      };

      // Get all transactions for this family
      const transactions = await prisma.$queryRaw<
        Array<{ id: string; category: string }>
      >`
        SELECT id, category::text 
        FROM "Transaction" 
        WHERE "familyGroupId" = ${family.id}
      `;

      console.log(`  Found ${transactions.length} transactions to migrate`);

      // Update each transaction with the new categoryId
      let updated = 0;
      for (const transaction of transactions) {
        const newCategoryId = categoryMap[transaction.category];
        if (newCategoryId) {
          await prisma.$executeRaw`
            UPDATE "Transaction" 
            SET "categoryId" = ${newCategoryId}
            WHERE id = ${transaction.id}
          `;
          updated++;
        }
      }

      console.log(`  Updated ${updated} transactions with new categoryId`);
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\nNow you can run: npx prisma db push --accept-data-loss');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateCategories();
