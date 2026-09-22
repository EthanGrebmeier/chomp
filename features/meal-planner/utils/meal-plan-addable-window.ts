import { differenceInCalendarDays, startOfDay } from 'date-fns';

/**
 * Meals dated more than this many days before today are considered stale and are
 * disregarded when adding meals to a grocery list. They still render in the meal
 * plan, but never count toward the "unadded" total or appear in the add-to-list
 * flow.
 */
export const MEAL_PLAN_ADDABLE_PAST_DAYS = 5;

type DatedEntry = {
  date: string;
};

const parseMealPlanDate = (dateString: string): Date | null => {
  const [datePart] = dateString.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  if (!year || !month || !day) {
    return null;
  }
  return new Date(year, month - 1, day);
};

/**
 * Whether a meal plan entry is recent enough to be added to a grocery list.
 * Anything more than `MEAL_PLAN_ADDABLE_PAST_DAYS` days old is disregarded.
 * Entries with unparseable dates fail open so they remain addable.
 */
export const isMealPlanEntryAddable = (
  dateString: string,
  referenceDate: Date = new Date()
): boolean => {
  const entryDate = parseMealPlanDate(dateString);
  if (!entryDate) {
    return true;
  }
  const daysOld = differenceInCalendarDays(
    startOfDay(referenceDate),
    entryDate
  );
  return daysOld <= MEAL_PLAN_ADDABLE_PAST_DAYS;
};

/**
 * Filters a list of dated meal plan entries down to those still addable.
 */
export const filterAddableMealPlanEntries = <T extends DatedEntry>(
  entries: readonly T[],
  referenceDate: Date = new Date()
): T[] =>
  entries.filter(entry => isMealPlanEntryAddable(entry.date, referenceDate));
