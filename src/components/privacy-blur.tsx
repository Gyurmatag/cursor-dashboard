'use client';

import { memo } from 'react';
import { usePrivacy } from '@/components/privacy-provider';
import { cn } from '@/lib/utils';

interface PrivacyBlurProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrapper component that blurs its children when privacy mode is enabled
 * Memoized to prevent unnecessary re-renders
 */
export const PrivacyBlur = memo(function PrivacyBlur({ children, className }: PrivacyBlurProps) {
  const { isBlurred } = usePrivacy();

  return (
    <span
      className={cn(
        isBlurred && 'blur-sm select-none transition-all duration-200',
        className
      )}
    >
      {children}
    </span>
  );
});
