'use client';

import {
  Footprints,
  Calendar,
  CalendarDays,
  Crown,
  Code,
  Rocket,
  Trophy,
  Bot,
  BotMessageSquare,
  Sparkles,
  MessageCircle,
  MessagesSquare,
  Keyboard,
  Zap,
  FileCode,
  Files,
  Flame,
  Timer,
  Bug,
  CircleDot,
  Users,
  Building,
  Castle,
  UsersRound,
  MessageSquare,
  Music4,
  TrendingUp,
  CheckCircle2,
  Lock,
  type LucideIcon,
} from 'lucide-react';
import { TIER_GRADIENTS } from './badge-gradients';
import type { AchievementTier } from '@/lib/achievements';

// Map icon names to Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  Footprints,
  Calendar,
  CalendarDays,
  Crown,
  Code,
  Rocket,
  Trophy,
  Bot,
  BotMessageSquare,
  Sparkles,
  MessageCircle,
  MessagesSquare,
  Keyboard,
  Zap,
  FileCode,
  Files,
  Flame,
  Timer,
  Bug,
  CircleDot,
  Users,
  Building,
  Castle,
  UsersRound,
  MessageSquare,
  Music4,
  TrendingUp,
  CheckCircle2,
};

interface BadgeIconProps {
  icon: string;
  isUnlocked: boolean;
  tier: AchievementTier;
  size?: number;
}

export function BadgeIcon({ icon, isUnlocked, tier, size = 32 }: BadgeIconProps) {
  const IconComponent = ICON_MAP[icon];

  if (!IconComponent) {
    console.warn(`Icon "${icon}" not found in ICON_MAP`);
    return null;
  }

  const iconColor = isUnlocked ? TIER_GRADIENTS[tier].iconColor : '#6B7280';

  return (
    <foreignObject x={50 - size / 2} y={50 - size / 2} width={size} height={size}>
      <div className="flex items-center justify-center w-full h-full">
        {isUnlocked ? (
          <IconComponent
            size={size * 0.8}
            color={iconColor}
            strokeWidth={2}
            className="drop-shadow-sm"
          />
        ) : (
          <div className="relative">
            <IconComponent
              size={size * 0.7}
              color="#4B5563"
              strokeWidth={2}
              className="opacity-40"
            />
            <Lock
              size={size * 0.4}
              color="#6B7280"
              strokeWidth={2.5}
              className="absolute -bottom-1 -right-1"
            />
          </div>
        )}
      </div>
    </foreignObject>
  );
}
