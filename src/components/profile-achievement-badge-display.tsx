'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';
import type { AchievementTier, BadgeShape } from '@/lib/achievements';
import { BadgeGradients } from './achievements/badge-gradients';
import { BadgeBackground, BadgeRing } from './achievements/badge-shapes';
import { BadgeIcon } from './achievements/badge-icon';
import { ShineEffect, GlowEffect } from './achievements/badge-effects';

const SIZE_CLASSES = {
  sm: 'w-12 h-12',
  md: 'w-20 h-20',
  lg: 'w-28 h-28',
  xl: 'w-40 h-40',
} as const;

const ICON_SIZES = {
  sm: 20,
  md: 32,
  lg: 44,
  xl: 60,
} as const;

interface AchievementBadgeDisplayProps {
  tier: AchievementTier;
  shape: BadgeShape;
  icon: string;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}

/**
 * Simplified achievement badge for profile page
 * Only displays unlocked achievements without functions
 */
export function AchievementBadgeDisplay({
  tier,
  shape,
  icon,
  size = 'lg',
  className,
}: AchievementBadgeDisplayProps) {
  const id = useId();
  const hasGlow = tier !== 'bronze';
  const isLegendary = tier === 'legendary';

  return (
    <div
      className={cn(
        'relative',
        SIZE_CLASSES[size],
        isLegendary && 'animate-glow-pulse',
        className
      )}
      style={
        isLegendary
          ? ({ '--glow-color': 'rgba(255, 215, 0, 0.6)' } as React.CSSProperties)
          : undefined
      }
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <BadgeGradients tier={tier} isUnlocked={true} id={id} />
        </defs>

        {/* Glow effect (behind main badge) */}
        {hasGlow && <GlowEffect tier={tier} shape={shape} />}

        {/* Main badge background */}
        <BadgeBackground
          shape={shape}
          gradientId={`${id}-bg`}
          isUnlocked={true}
          filterId={hasGlow ? `${id}-glow` : undefined}
        />

        {/* Badge ring/border */}
        <BadgeRing
          shape={shape}
          gradientId={`${id}-ring`}
          isUnlocked={true}
          progress={100}
        />

        {/* Center icon */}
        <BadgeIcon
          icon={icon}
          isUnlocked={true}
          tier={tier}
          size={ICON_SIZES[size]}
        />

        {/* Shine effect (on top) */}
        <ShineEffect shape={shape} />
      </svg>
    </div>
  );
}
