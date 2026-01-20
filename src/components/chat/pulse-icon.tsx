import { memo } from 'react';
import { cn } from '@/lib/utils';

interface PulseIconProps {
  className?: string;
  animated?: boolean;
}

export const PulseIcon = memo(function PulseIcon({ 
  className, 
  animated = false 
}: PulseIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('w-6 h-6', className)}
      aria-label="Pulse"
    >
      <defs>
        <linearGradient id="pulse-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
          <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="1" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      
      {/* Pulse waveform path */}
      <path
        d="M2 12 L6 12 L8 8 L10 16 L12 12 L14 14 L16 10 L18 12 L22 12"
        stroke="url(#pulse-gradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        className={animated ? 'animate-pulse-wave' : ''}
      />
      
      {/* Glowing dots at key points */}
      <circle cx="8" cy="8" r="1.5" fill="hsl(var(--primary))" opacity="0.8" />
      <circle cx="10" cy="16" r="1.5" fill="hsl(var(--primary))" opacity="0.8" />
      <circle cx="14" cy="14" r="1.5" fill="hsl(var(--primary))" opacity="0.8" />
      <circle cx="16" cy="10" r="1.5" fill="hsl(var(--primary))" opacity="0.8" />
    </svg>
  );
});
