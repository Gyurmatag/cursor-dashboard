'use client';

import { useEffect, useState } from 'react';
import type { AchievementTier, BadgeShape } from '@/lib/achievements';
import { BADGE_PATHS } from './badge-shapes';

interface ShineEffectProps {
  shape: BadgeShape;
}

export function ShineEffect({ shape }: ShineEffectProps) {
  return (
    <g className="badge-shine">
      <defs>
        <clipPath id="shine-clip">
          <path d={BADGE_PATHS[shape]} />
        </clipPath>
        <linearGradient id="shine-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="40%" stopColor="transparent" />
          <stop offset="45%" stopColor="rgba(255, 255, 255, 0.3)" />
          <stop offset="50%" stopColor="rgba(255, 255, 255, 0.5)" />
          <stop offset="55%" stopColor="rgba(255, 255, 255, 0.3)" />
          <stop offset="60%" stopColor="transparent" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <rect
        x="-50"
        y="0"
        width="200"
        height="100"
        fill="url(#shine-gradient)"
        clipPath="url(#shine-clip)"
        className="animate-shine"
      />
    </g>
  );
}

interface ParticleEffectProps {
  tier: AchievementTier;
}

export function ParticleEffect({ tier }: ParticleEffectProps) {
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number; delay: number; size: number }>
  >([]);

  useEffect(() => {
    // Generate random particles
    const newParticles = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: 30 + Math.random() * 40,
      y: 30 + Math.random() * 40,
      delay: Math.random() * 2,
      size: 2 + Math.random() * 3,
    }));
    setParticles(newParticles);
  }, []);

  if (tier !== 'legendary') return null;

  return (
    <g className="pointer-events-none">
      {particles.map((particle) => (
        <circle
          key={particle.id}
          cx={particle.x}
          cy={particle.y}
          r={particle.size}
          fill="#FFD700"
          opacity="0.8"
          className="animate-particle"
          style={{
            animationDelay: `${particle.delay}s`,
            transformOrigin: `${particle.x}px ${particle.y}px`,
          }}
        >
          <animate
            attributeName="opacity"
            values="0.8;1;0.8"
            dur="2s"
            repeatCount="indefinite"
            begin={`${particle.delay}s`}
          />
          <animate
            attributeName="r"
            values={`${particle.size};${particle.size * 1.5};${particle.size}`}
            dur="2s"
            repeatCount="indefinite"
            begin={`${particle.delay}s`}
          />
        </circle>
      ))}
    </g>
  );
}

interface GlowEffectProps {
  tier: AchievementTier;
  shape: BadgeShape;
}

export function GlowEffect({ tier, shape }: GlowEffectProps) {
  const glowColors: Record<AchievementTier, string> = {
    bronze: 'rgba(205, 127, 50, 0.3)',
    silver: 'rgba(192, 192, 192, 0.3)',
    gold: 'rgba(255, 215, 0, 0.4)',
    legendary: 'rgba(255, 215, 0, 0.5)',
  };

  const glowSize: Record<AchievementTier, number> = {
    bronze: 0,
    silver: 4,
    gold: 6,
    legendary: 10,
  };

  if (tier === 'bronze') return null;

  return (
    <path
      d={BADGE_PATHS[shape]}
      fill="none"
      stroke={glowColors[tier]}
      strokeWidth={glowSize[tier]}
      className={tier === 'legendary' ? 'animate-glow-pulse' : ''}
      style={{
        filter: `blur(${glowSize[tier]}px)`,
      }}
    />
  );
}
