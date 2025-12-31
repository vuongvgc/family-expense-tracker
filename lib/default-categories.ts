import { TransactionType } from '@prisma/client';

export interface DefaultCategory {
  name: string;
  type: TransactionType;
  icon: string;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  // Expense Categories
  { name: 'Food & Dining', type: 'EXPENSE', icon: '🍔' },
  { name: 'Transport', type: 'EXPENSE', icon: '🚗' },
  { name: 'Utilities', type: 'EXPENSE', icon: '💡' },
  { name: 'Healthcare', type: 'EXPENSE', icon: '🏥' },
  { name: 'Education', type: 'EXPENSE', icon: '📚' },
  { name: 'Entertainment', type: 'EXPENSE', icon: '🎬' },
  { name: 'Shopping', type: 'EXPENSE', icon: '🛍️' },
  { name: 'Bills', type: 'EXPENSE', icon: '📄' },
  { name: 'Other Expense', type: 'EXPENSE', icon: '💸' },

  // Income Categories
  { name: 'Salary', type: 'INCOME', icon: '💰' },
  { name: 'Investment', type: 'INCOME', icon: '📈' },
  { name: 'Business', type: 'INCOME', icon: '💼' },
  { name: 'Gift', type: 'INCOME', icon: '🎁' },
  { name: 'Other Income', type: 'INCOME', icon: '💵' },
];
