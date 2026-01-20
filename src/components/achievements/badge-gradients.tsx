import type { AchievementTier } from '@/lib/achievements';

// Tier gradient configurations
export const TIER_GRADIENTS = {
  bronze: {
    primary: ['#CD7F32', '#8B4513', '#CD7F32'],
    ring: ['#B87333', '#6B4423'],
    glow: 'rgba(205, 127, 50, 0.4)',
    iconColor: '#8B4513',
  },
  silver: {
    primary: ['#E8E8E8', '#A8A8A8', '#C0C0C0', '#E8E8E8'],
    ring: ['#C0C0C0', '#808080'],
    glow: 'rgba(192, 192, 192, 0.5)',
    iconColor: '#6B7280',
  },
  gold: {
    primary: ['#FFD700', '#FFA500', '#FFD700', '#FFEC8B'],
    ring: ['#FFD700', '#B8860B'],
    glow: 'rgba(255, 215, 0, 0.6)',
    iconColor: '#B8860B',
  },
  legendary: {
    primary: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A1', '#DDA0DD', '#FF6B6B'],
    ring: ['#FFD700', '#FF69B4', '#00CED1', '#FFD700'],
    glow: 'rgba(255, 215, 0, 0.8)',
    iconColor: '#7C3AED',
  },
} as const;

interface BadgeGradientsProps {
  tier: AchievementTier;
  isUnlocked: boolean;
  id: string;
}

export function BadgeGradients({ tier, isUnlocked, id }: BadgeGradientsProps) {
  const colors = TIER_GRADIENTS[tier];

  if (!isUnlocked) {
    // Grayscale gradient for locked badges
    return (
      <>
        <linearGradient id={`${id}-bg`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4B5563" />
          <stop offset="50%" stopColor="#374151" />
          <stop offset="100%" stopColor="#4B5563" />
        </linearGradient>
        <linearGradient id={`${id}-ring`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6B7280" />
          <stop offset="100%" stopColor="#4B5563" />
        </linearGradient>
      </>
    );
  }

  // Special animated gradient for legendary tier
  if (tier === 'legendary') {
    return (
      <>
        <linearGradient id={`${id}-bg`} x1="0%" y1="0%" x2="100%" y2="100%">
          {colors.primary.map((color, i) => (
            <stop
              key={i}
              offset={`${(i / (colors.primary.length - 1)) * 100}%`}
              stopColor={color}
            >
              <animate
                attributeName="stop-color"
                values={`${color};${colors.primary[(i + 1) % colors.primary.length]};${color}`}
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
          ))}
        </linearGradient>
        <linearGradient id={`${id}-ring`} x1="0%" y1="0%" x2="100%" y2="100%">
          {colors.ring.map((color, i) => (
            <stop
              key={i}
              offset={`${(i / (colors.ring.length - 1)) * 100}%`}
              stopColor={color}
            >
              <animate
                attributeName="stop-color"
                values={`${color};${colors.ring[(i + 1) % colors.ring.length]};${color}`}
                dur="2s"
                repeatCount="indefinite"
              />
            </stop>
          ))}
        </linearGradient>
        <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feFlood floodColor={colors.glow} result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </>
    );
  }

  // Standard gradient for other tiers
  return (
    <>
      <linearGradient id={`${id}-bg`} x1="0%" y1="0%" x2="100%" y2="100%">
        {colors.primary.map((color, i) => (
          <stop
            key={i}
            offset={`${(i / (colors.primary.length - 1)) * 100}%`}
            stopColor={color}
          />
        ))}
      </linearGradient>
      <linearGradient id={`${id}-ring`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={colors.ring[0]} />
        <stop offset="100%" stopColor={colors.ring[1]} />
      </linearGradient>
      {(tier === 'gold' || tier === 'silver') && (
        <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={tier === 'gold' ? 2 : 1} result="blur" />
          <feFlood floodColor={colors.glow} result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      )}
    </>
  );
}
