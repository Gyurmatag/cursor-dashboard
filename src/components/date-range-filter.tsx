'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CalendarIcon, XIcon } from 'lucide-react';
import type { DateRange, PresetKey } from '@/types/cursor';
import type { DateRange as DayPickerDateRange } from 'react-day-picker';
import { 
  calculateDateRange
} from '@/lib/date-range-presets';
import { 
  doesRangeExceedMax, 
  MAX_DATE_RANGE_DAYS,
  DATE_FORMAT 
} from '@/lib/date-utils';

// Type for preset button configuration
interface PresetButton {
  key: PresetKey;
  label: string;
}

// Hoist preset groups for grid layout - memoized at module level
const PRESET_GROUPS: PresetButton[][] = [
  [
    { key: '7days', label: '7 days' },
    { key: '14days', label: '14 days' },
    { key: '30days', label: '30 days' },
    { key: '60days', label: '60 days' },
  ],
  [
    { key: '90days', label: '90 days' },
    { key: 'mtd', label: 'MTD' },
    { key: 'ytd', label: 'YTD' },
    { key: 'qtd', label: 'QTD' },
  ],
  [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
  ],
] as const;

interface DateRangeFilterProps {
  onRangeChange: (range: DateRange) => void;
  defaultPreset?: PresetKey;
}

export function DateRangeFilter({ 
  onRangeChange, 
  defaultPreset = '30days' 
}: DateRangeFilterProps) {
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>(defaultPreset);
  const [customDateRange, setCustomDateRange] = useState<DayPickerDateRange | undefined>();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Initialize with default preset
  useEffect(() => {
    const range = calculateDateRange(defaultPreset);
    onRangeChange(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Use useCallback to memoize handler and prevent unnecessary child re-renders
  const handlePresetChange = useCallback((preset: PresetKey) => {
    setSelectedPreset(preset);
    const range = calculateDateRange(preset, customDateRange);
    onRangeChange(range);
  }, [onRangeChange, customDateRange]);

  // Handle custom date range selection
  const handleCustomDateSelect = useCallback((range: DayPickerDateRange | undefined) => {
    setCustomDateRange(range);
    
    if (range?.from) {
      setSelectedPreset('custom');
      const dateRange = calculateDateRange('custom', range);
      onRangeChange(dateRange);
      
      // Auto-close when both start and end dates are selected (Airbnb-style)
      if (range.to) {
        setIsPopoverOpen(false);
      }
    }
  }, [onRangeChange]);

  // Clear custom range
  const handleClearCustom = useCallback(() => {
    setCustomDateRange(undefined);
    setSelectedPreset('30days');
    const range = calculateDateRange('30days');
    onRangeChange(range);
  }, [onRangeChange]);

  // Calculate if custom range exceeds limit for display
  const customRangeExceedsLimit = useMemo(() => {
    if (customDateRange?.from && customDateRange?.to) {
      return doesRangeExceedMax(
        customDateRange.from.getTime(),
        customDateRange.to.getTime(),
        MAX_DATE_RANGE_DAYS
      );
    }
    return false;
  }, [customDateRange]);

  // Format custom range for display
  const customRangeDisplay = useMemo(() => {
    if (customDateRange?.from) {
      const from = format(customDateRange.from, DATE_FORMAT);
      const to = customDateRange.to ? format(customDateRange.to, DATE_FORMAT) : 'Select end date';
      return `${from} - ${to}`;
    }
    return 'Select custom date range...';
  }, [customDateRange]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Label className="text-base font-semibold">Time Period</Label>
        <p className="text-xs text-muted-foreground mt-1">
          Select a preset or choose a custom date range (up to {MAX_DATE_RANGE_DAYS} days)
        </p>
      </div>

      {/* Preset Quick Select Buttons */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Quick Select</Label>
        <div className="space-y-2">
          {PRESET_GROUPS.map((group, groupIndex) => (
            <div key={groupIndex} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {group.map((preset) => (
                <Button
                  key={preset.key}
                  variant={selectedPreset === preset.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePresetChange(preset.key)}
                  className="w-full text-xs"
                  aria-label={`Select ${preset.label}`}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Custom Date Range Picker */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Custom Range</Label>
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen} modal={false}>
          <PopoverTrigger asChild>
            <Button
              variant={selectedPreset === 'custom' ? 'default' : 'outline'}
              className="w-full justify-start text-left font-normal"
              size="sm"
              aria-label="Open custom date range picker"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedPreset === 'custom' && customDateRange?.from
                ? customRangeDisplay
                : 'Select custom date range...'}
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-auto p-0" 
            align="start"
          >
            <div className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-sm mb-1">Select Date Range</h4>
                  <p className="text-xs text-muted-foreground">
                    Click start date, then end date (up to {MAX_DATE_RANGE_DAYS} days)
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPopoverOpen(false)}
                  className="h-8 w-8 p-0"
                  aria-label="Close date picker"
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
              <Calendar
                mode="range"
                selected={customDateRange}
                onSelect={handleCustomDateSelect}
                numberOfMonths={1}
                defaultMonth={customDateRange?.from}
                disabled={(date) => date > new Date()}
                className="sm:hidden"
              />
              <Calendar
                mode="range"
                selected={customDateRange}
                onSelect={handleCustomDateSelect}
                numberOfMonths={2}
                defaultMonth={customDateRange?.from}
                disabled={(date) => date > new Date()}
                className="hidden sm:block"
              />
              {customDateRange?.from && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">
                      {customRangeDisplay}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearCustom}
                      className="h-7 text-xs"
                      aria-label="Clear custom date range"
                    >
                      <XIcon className="mr-1 h-3 w-3" />
                      Clear
                    </Button>
                  </div>
                  {customRangeExceedsLimit && (
                    <div 
                      className="text-xs text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded p-2"
                      role="alert"
                    >
                      Range exceeds {MAX_DATE_RANGE_DAYS} days. Start date will be adjusted to last {MAX_DATE_RANGE_DAYS} days of selection.
                    </div>
                  )}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
