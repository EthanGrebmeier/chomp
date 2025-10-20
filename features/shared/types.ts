import { itemTable } from '../../db/schema';

export type Item = typeof itemTable.$inferSelect;
export type ItemInsert = typeof itemTable.$inferInsert;

export type QuantityUnit = 'each' | 'kg' | 'g' | 'l' | 'ml' | 'lb';
