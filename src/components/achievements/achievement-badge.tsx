'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';
import type { Achievement, AchievementTier, BadgeShape } from '@/lib/achievements';
import { BadgeGradients } from './badge-gradients';
import { BadgeBackground, BadgeRing } from './badge-shapes';
import { BadgeIcon } from './badge-icon';
import { ShineEffect, ParticleEffect, GlowEffect } from './badge-effects';

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

interface AchievementBadgeProps {
  achievement: Achievement;
  isUnlocked: boolean;
  progress?: number;
  size?: keyof typeof SIZE_CLASSES;
  showAnimation?: boolean;
  className?: string;
}

export function AchievementBadge({
  achievement,
  isUnlocked,
  progress = 0,
  size = 'md',
  showAnimation = false,
  className,
}: AchievementBadgeProps) {
  const id = useId();
  const tier = achievement.tier;
  const shape = achievement.shape;
  const hasGlow = tier !== 'bronze' && isUnlocked;
  const isLegendary = tier === 'legendary' && isUnlocked;

  return (
    <div
      className={cn(
        'relative',
        SIZE_CLASSES[size],
        showAnimation && isUnlocked && 'animate-badge-unlock',
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
          <BadgeGradients tier={tier} isUnlocked={isUnlocked} id={id} />
        </defs>

        {/* Glow effect (behind main badge) */}
        {hasGlow && <GlowEffect tier={tier} shape={shape} />}

        {/* Main badge background */}
        <BadgeBackground
          shape={shape}
          gradientId={`${id}-bg`}
          isUnlocked={isUnlocked}
          filterId={hasGlow ? `${id}-glow` : undefined}
        />

        {/* Badge ring/border */}
        <BadgeRing
          shape={shape}
          gradientId={`${id}-ring`}
          isUnlocked={isUnlocked}
          progress={progress}
        />

        {/* Center icon */}
        <BadgeIcon
          icon={achievement.icon}
          isUnlocked={isUnlocked}
          tier={tier}
          size={ICON_SIZES[size]}
        />

        {/* Shine effect (on top) */}
        {isUnlocked && <ShineEffect shape={shape} />}

        {/* Particle effects for legendary */}
        {isLegendary && <ParticleEffect tier={tier} />}
      </svg>

      {/* Progress percentage for locked badges */}
      {!isUnlocked && progress > 0 && size !== 'sm' && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-background border rounded-full px-2 py-0.5 text-xs font-mono text-muted-foreground">
          {Math.round(progress)}%
        </div>
      )}
    </div>
  );
}

// Helper function to get tier color for text/accents
export function getTierColor(tier: AchievementTier): string {
  switch (tier) {
    case 'bronze':
      return 'text-amber-700';
    case 'silver':
      return 'text-gray-400';
    case 'gold':
      return 'text-yellow-500';
    case 'legendary':
      return 'text-violet-500';
    default:
      return 'text-muted-foreground';
  }
}

// Helper function to get tier background for cards
export function getTierBgClass(tier: AchievementTier, isUnlocked: boolean): string {
  if (!isUnlocked) {
    return 'bg-muted/30';
  }

  switch (tier) {
    case 'bronze':
      return 'bg-gradient-to-br from-amber-900/10 to-amber-800/5';
    case 'silver':
      return 'bg-gradient-to-br from-gray-300/10 to-gray-400/5';
    case 'gold':
      return 'bg-gradient-to-br from-yellow-500/10 to-amber-500/5';
    case 'legendary':
      return 'bg-gradient-to-br from-violet-500/10 via-pink-500/5 to-cyan-500/10';
    default:
      return 'bg-muted/30';
  }
}
