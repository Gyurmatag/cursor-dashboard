/**
 * Date utility functions for date range calculations
 * Extracted to avoid repetition and improve maintainability
 */

import { startOfDay, endOfDay, subDays, format } from 'date-fns';

// Constants
export const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;
export const MAX_DATE_RANGE_DAYS = 30;
export const DATE_FORMAT = 'MMM dd, yyyy';

/**
 * Calculate the number of days between two timestamps
 */
export function calculateDaysBetween(startTimestamp: number, endTimestamp: number): number {
  return (endTimestamp - startTimestamp) / MILLISECONDS_PER_DAY;
}

/**
 * Get timestamp for start of day X days ago from now
 * @param daysAgo Number of days to go back (0 = today)
 */
export function getStartOfDaysAgo(daysAgo: number, referenceDate = new Date()): number {
  return startOfDay(subDays(referenceDate, daysAgo)).getTime();
}

/**
 * Get timestamp for end of day for a given date
 */
export function getEndOfDay(date = new Date()): number {
  return endOfDay(date).getTime();
}

/**
 * Cap a date range to not exceed the maximum allowed days
 * Returns the adjusted start date timestamp
 */
export function capDateRangeToMax(
  startTimestamp: number,
  endTimestamp: number,
  maxDays: number,
  referenceDate = new Date()
): number {
  const days = calculateDaysBetween(startTimestamp, endTimestamp);
  
  if (days > maxDays) {
    return getStartOfDaysAgo(maxDays - 1, referenceDate);
  }
  
  return startTimestamp;
}

/**
 * Format a date range for display
 */
export function formatDateRangeDisplay(
  startDate: Date | number,
  endDate: Date | number,
  formatString: string = DATE_FORMAT
): string {
  const start = typeof startDate === 'number' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'number' ? new Date(endDate) : endDate;
  
  return `${format(start, formatString)} - ${format(end, formatString)}`;
}

/**
 * Check if a date range exceeds the maximum allowed days
 */
export function doesRangeExceedMax(
  startTimestamp: number,
  endTimestamp: number,
  maxDays: number
): boolean {
  return calculateDaysBetween(startTimestamp, endTimestamp) > maxDays;
}
