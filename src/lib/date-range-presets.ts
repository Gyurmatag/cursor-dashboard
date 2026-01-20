/**
 * Date range preset calculations
 * Centralized logic for calculating date ranges based on presets
 */

import { 
  startOfDay, 
  endOfDay, 
  subDays, 
  startOfMonth, 
  subMonths, 
  startOfYear, 
  startOfQuarter 
} from 'date-fns';
import type { DateRange, PresetKey } from '@/types/cursor';
import type { DateRange as DayPickerDateRange } from 'react-day-picker';
import { 
  getStartOfDaysAgo, 
  getEndOfDay, 
  capDateRangeToMax, 
  formatDateRangeDisplay,
  MAX_DATE_RANGE_DAYS,
  calculateDaysBetween,
  ACCOUNT_INCEPTION_DATE 
} from './date-utils';

// Type for preset configuration
interface PresetConfig {
  label: string;
  calculate: (now: Date, endDate: number) => { startDate: number; label: string };
}

/**
 * Helper to create simple day-based presets
 */
function createDayBasedPreset(days: number, label: string): PresetConfig['calculate'] {
  return (now: Date) => ({
    startDate: getStartOfDaysAgo(days - 1, now),
    label,
  });
}

/**
 * Helper to create period presets with max day capping
 */
function createCappedPeriodPreset(
  getStart: (now: Date) => number,
  baseLabel: string
): PresetConfig['calculate'] {
  return (now: Date, endDate: number) => {
    const startTimestamp = getStart(now);
    const days = calculateDaysBetween(startTimestamp, endDate);
    
    if (days > MAX_DATE_RANGE_DAYS) {
      return {
        startDate: getStartOfDaysAgo(MAX_DATE_RANGE_DAYS - 1, now),
        label: `${baseLabel} (limited to ${MAX_DATE_RANGE_DAYS} days)`,
      };
    }
    
    return {
      startDate: startTimestamp,
      label: baseLabel,
    };
  };
}

// Preset configuration map
export const DATE_PRESET_CONFIG: Record<Exclude<PresetKey, 'custom'>, PresetConfig> = {
  today: {
    label: 'Today',
    calculate: (now) => ({
      startDate: startOfDay(now).getTime(),
      label: 'Today',
    }),
  },
  yesterday: {
    label: 'Yesterday',
    calculate: (now) => {
      const yesterdayDate = subDays(now, 1);
      return {
        startDate: startOfDay(yesterdayDate).getTime(),
        label: 'Yesterday',
      };
    },
  },
  '7days': {
    label: 'Last 7 days',
    calculate: createDayBasedPreset(7, 'Last 7 days'),
  },
  '14days': {
    label: 'Last 14 days',
    calculate: createDayBasedPreset(14, 'Last 14 days'),
  },
  '30days': {
    label: 'Last 30 days',
    calculate: createDayBasedPreset(30, 'Last 30 days'),
  },
  '60days': {
    label: 'Last 60 days',
    calculate: createDayBasedPreset(60, 'Last 60 days'),
  },
  '90days': {
    label: 'Last 90 days',
    calculate: createDayBasedPreset(90, 'Last 90 days'),
  },
  mtd: {
    label: 'Month to date',
    calculate: createCappedPeriodPreset(
      (now) => startOfMonth(now).getTime(),
      'Month to date'
    ),
  },
  lastMonth: {
    label: 'Last month',
    calculate: createCappedPeriodPreset(
      (now) => startOfMonth(subMonths(now, 1)).getTime(),
      'Last month'
    ),
  },
  qtd: {
    label: 'Quarter to date',
    calculate: createCappedPeriodPreset(
      (now) => startOfQuarter(now).getTime(),
      'Quarter to date'
    ),
  },
  ytd: {
    label: 'Year to date',
    calculate: createCappedPeriodPreset(
      (now) => startOfYear(now).getTime(),
      'Year to date'
    ),
  },
};

/**
 * Calculate date range for a given preset
 */
export function calculatePresetDateRange(
  preset: Exclude<PresetKey, 'custom'>,
  now = new Date()
): DateRange {
  // For yesterday, end date should be end of yesterday, not today
  const endDate = preset === 'yesterday' ? endOfDay(subDays(now, 1)).getTime() : getEndOfDay(now);
  const config = DATE_PRESET_CONFIG[preset];
  
  if (!config) {
    // Fallback to 30 days
    return {
      startDate: getStartOfDaysAgo(29, now),
      endDate,
      label: 'Unknown',
    };
  }
  
  const { startDate, label } = config.calculate(now, endDate);
  
  return { startDate, endDate, label };
}

/**
 * Calculate custom date range with validation
 */
export function calculateCustomDateRange(
  customRange: DayPickerDateRange,
  now = new Date()
): DateRange {
  const endDate = getEndOfDay(now);
  
  if (!customRange?.from) {
    // Fallback to 30 days
    return {
      startDate: getStartOfDaysAgo(29, now),
      endDate,
      label: 'Custom range',
    };
  }
  
  let startDate = startOfDay(customRange.from).getTime();
  const end = customRange.to ? endOfDay(customRange.to).getTime() : endDate;
  
  // Cap at max days if exceeded
  startDate = capDateRangeToMax(startDate, end, MAX_DATE_RANGE_DAYS, customRange.to || now);
  
  const label = formatDateRangeDisplay(startDate, customRange.to || now);
  
  return { startDate, endDate: end, label };
}

/**
 * Main function to calculate date range based on preset or custom range
 */
export function calculateDateRange(
  preset: PresetKey,
  customRange?: DayPickerDateRange
): DateRange {
  if (preset === 'custom' && customRange) {
    return calculateCustomDateRange(customRange);
  }
  
  if (preset === 'custom') {
    // Custom selected but no range provided - fallback
    return calculatePresetDateRange('30days');
  }
  
  return calculatePresetDateRange(preset);
}
