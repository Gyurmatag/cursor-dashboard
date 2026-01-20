import type { BadgeShape } from '@/lib/achievements';

// SVG path definitions for different badge shapes
export const BADGE_PATHS: Record<BadgeShape, string> = {
  // Hexagon for productivity achievements
  hexagon: 'M50 5 L93 27.5 L93 72.5 L50 95 L7 72.5 L7 27.5 Z',

  // Circle for streak achievements
  circle: 'M50 5 A45 45 0 1 1 49.99 5 Z',

  // Shield for team achievements
  shield: 'M50 5 L90 20 L90 55 Q90 80 50 95 Q10 80 10 55 L10 20 Z',

  // Star for special achievements
  star: 'M50 5 L58 35 L90 35 L65 55 L75 90 L50 70 L25 90 L35 55 L10 35 L42 35 Z',

  // Diamond for rare achievements
  diamond: 'M50 5 L90 50 L50 95 L10 50 Z',
};

interface BadgeShapeProps {
  shape: BadgeShape;
  gradientId: string;
  isUnlocked: boolean;
  filterId?: string;
}

export function BadgeBackground({
  shape,
  gradientId,
  isUnlocked,
  filterId,
}: BadgeShapeProps) {
  return (
    <path
      d={BADGE_PATHS[shape]}
      fill={`url(#${gradientId})`}
      filter={filterId && isUnlocked ? `url(#${filterId})` : undefined}
      opacity={isUnlocked ? 1 : 0.3}
    />
  );
}

interface BadgeRingProps {
  shape: BadgeShape;
  gradientId: string;
  isUnlocked: boolean;
  progress?: number;
}

export function BadgeRing({
  shape,
  gradientId,
  isUnlocked,
  progress = 0,
}: BadgeRingProps) {
  // For circles, we can show a progress ring
  if (shape === 'circle' && !isUnlocked && progress > 0) {
    const circumference = 2 * Math.PI * 42; // radius of 42
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <g>
        {/* Background ring */}
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="#374151"
          strokeWidth="4"
          strokeDasharray="4 4"
        />
        {/* Progress ring */}
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 50 50)"
          className="transition-all duration-500"
        />
      </g>
    );
  }

  // For other shapes or unlocked badges, show decorative ring
  return (
    <path
      d={BADGE_PATHS[shape]}
      fill="none"
      stroke={`url(#${gradientId})`}
      strokeWidth={isUnlocked ? 3 : 2}
      strokeDasharray={isUnlocked ? undefined : '6 4'}
      opacity={isUnlocked ? 1 : 0.5}
      transform="scale(0.92) translate(4, 4)"
    />
  );
}
