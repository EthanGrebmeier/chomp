import { format } from 'date-fns';

/**
 * Parses a meal plan date (`yyyy-MM-dd`, optionally with a time part) as a
 * local calendar date. `new Date('yyyy-MM-dd')` would parse it as UTC and
 * shift the day for anyone west of Greenwich.
 */
export const parseMealPlanDate = (dateStr: string): Date => {
  const [datePart] = dateStr.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/** Short display form of a meal plan date, e.g. "Sep 7". */
export const formatMealPlanDate = (dateStr: string): string => {
  const date = parseMealPlanDate(dateStr);
  return Number.isNaN(date.getTime()) ? 'Date' : format(date, 'MMM d');
};
