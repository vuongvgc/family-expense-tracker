import { PrismaClient, EventType, TransactionType } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script to create default Tết (Lunar New Year) categories
 * Run with: pnpm tsx scripts/seed-tet-categories.ts
 */

const tetCategories = [
  {
    name: 'Lì xì',
    icon: '🧧',
    type: TransactionType.EXPENSE,
    eventType: EventType.TET,
  },
  {
    name: 'Sắm đồ Tết',
    icon: '🛍️',
    type: TransactionType.EXPENSE,
    eventType: EventType.TET,
  },
  {
    name: 'Quà biếu',
    icon: '🎁',
    type: TransactionType.EXPENSE,
    eventType: EventType.TET,
  },
  {
    name: 'Thực phẩm Tết',
    icon: '🍜',
    type: TransactionType.EXPENSE,
    eventType: EventType.TET,
  },
  {
    name: 'Trang trí Tết',
    icon: '🏮',
    type: TransactionType.EXPENSE,
    eventType: EventType.TET,
  },
  {
    name: 'Đồ thờ cúng',
    icon: '🙏',
    type: TransactionType.EXPENSE,
    eventType: EventType.TET,
  },
];

const travelCategories = [
  {
    name: 'Vé máy bay',
    icon: '✈️',
    type: TransactionType.EXPENSE,
    eventType: EventType.TRAVEL,
  },
  {
    name: 'Khách sạn',
    icon: '🏨',
    type: TransactionType.EXPENSE,
    eventType: EventType.TRAVEL,
  },
  {
    name: 'Ăn uống du lịch',
    icon: '🍽️',
    type: TransactionType.EXPENSE,
    eventType: EventType.TRAVEL,
  },
  {
    name: 'Vé tham quan',
    icon: '🎫',
    type: TransactionType.EXPENSE,
    eventType: EventType.TRAVEL,
  },
  {
    name: 'Mua sắm du lịch',
    icon: '🛒',
    type: TransactionType.EXPENSE,
    eventType: EventType.TRAVEL,
  },
];

async function seedEventCategories() {
  try {
    console.log('🌱 Seeding event-specific categories...\n');

    // Get all family groups
    const familyGroups = await prisma.familyGroup.findMany();

    if (familyGroups.length === 0) {
      console.log('⚠️  No family groups found. Create a family group first.');
      return;
    }

    for (const familyGroup of familyGroups) {
      console.log(`📦 Processing family group: ${familyGroup.name}`);

      // Seed Tết categories
      for (const category of tetCategories) {
        const existing = await prisma.category.findFirst({
          where: {
            familyGroupId: familyGroup.id,
            name: category.name,
            eventType: category.eventType,
          },
        });

        if (!existing) {
          await prisma.category.create({
            data: {
              ...category,
              familyGroupId: familyGroup.id,
            },
          });
          console.log(`  ✅ Created: ${category.icon} ${category.name}`);
        } else {
          console.log(
            `  ⏭️  Skipped: ${category.icon} ${category.name} (already exists)`
          );
        }
      }

      // Seed Travel categories
      for (const category of travelCategories) {
        const existing = await prisma.category.findFirst({
          where: {
            familyGroupId: familyGroup.id,
            name: category.name,
            eventType: category.eventType,
          },
        });

        if (!existing) {
          await prisma.category.create({
            data: {
              ...category,
              familyGroupId: familyGroup.id,
            },
          });
          console.log(`  ✅ Created: ${category.icon} ${category.name}`);
        } else {
          console.log(
            `  ⏭️  Skipped: ${category.icon} ${category.name} (already exists)`
          );
        }
      }

      console.log('');
    }

    console.log('✨ Seeding completed successfully!\n');
    console.log('📝 Summary:');
    console.log(`   - ${tetCategories.length} Tết categories`);
    console.log(`   - ${travelCategories.length} Travel categories`);
    console.log(
      `   - Total: ${
        tetCategories.length + travelCategories.length
      } event-specific categories\n`
    );
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedEventCategories();
