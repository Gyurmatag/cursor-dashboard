'use client';

import { useState, useCallback } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { DateRange } from '@/types/cursor';

const DATE_PRESETS = {
  '7days': { days: 7, label: 'Last 7 days' },
  '30days': { days: 30, label: 'Last 30 days' },
  '90days': { days: 90, label: 'Last 90 days' },
  'ytd': { label: 'Year to date' },
  'custom': { label: 'Custom range' },
} as const;

type PresetKey = keyof typeof DATE_PRESETS;

// Hoist static helper function outside component to avoid recreation
function calculateDateRange(preset: PresetKey): DateRange {
  const now = new Date();
  const endDate = now.getTime();
  let startDate: number;
  let label: string;

  switch (preset) {
    case '7days':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
      label = DATE_PRESETS['7days'].label;
      break;
    case '30days':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).getTime();
      label = DATE_PRESETS['30days'].label;
      break;
    case '90days':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).getTime();
      label = DATE_PRESETS['90days'].label;
      break;
    case 'ytd':
      startDate = new Date(now.getFullYear(), 0, 1).getTime();
      label = DATE_PRESETS.ytd.label;
      break;
    case 'custom':
    default:
      // Default to 30 days for custom (user would normally specify)
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).getTime();
      label = 'Custom range';
      break;
  }

  return { startDate, endDate, label };
}

interface DateRangeFilterProps {
  onRangeChange: (range: DateRange) => void;
  defaultPreset?: PresetKey;
}

export function DateRangeFilter({ 
  onRangeChange, 
  defaultPreset = '30days' 
}: DateRangeFilterProps) {
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>(defaultPreset);

  // Use useCallback to memoize handler and prevent unnecessary child re-renders
  const handlePresetChange = useCallback((value: PresetKey) => {
    setSelectedPreset(value);
    const range = calculateDateRange(value);
    onRangeChange(range);
  }, [onRangeChange]);

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="date-range-select">Time Period</Label>
      <Select 
        value={selectedPreset} 
        onValueChange={handlePresetChange}
      >
        <SelectTrigger id="date-range-select" className="w-[200px]">
          <SelectValue placeholder="Select time period" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7days">{DATE_PRESETS['7days'].label}</SelectItem>
          <SelectItem value="30days">{DATE_PRESETS['30days'].label}</SelectItem>
          <SelectItem value="90days">{DATE_PRESETS['90days'].label}</SelectItem>
          <SelectItem value="ytd">{DATE_PRESETS.ytd.label}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
