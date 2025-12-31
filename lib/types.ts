/**
 * Shared type for transaction filtering where clauses
 * Used in both transactions and analytics API routes
 */
export type TransactionFilterWhereClause = {
  familyGroupId: string;
  date?: { gte: Date; lte: Date };
  categoryId?: string;
};
