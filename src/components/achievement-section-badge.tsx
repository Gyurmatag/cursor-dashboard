import { Badge } from '@/components/ui/badge';
import { GlobeIcon, LockIcon, CheckCircle2Icon } from 'lucide-react';

type AccessLevel = 'public' | 'private-locked' | 'private-unlocked';

interface AchievementSectionBadgeProps {
  accessLevel: AccessLevel;
  className?: string;
}

const badgeConfig = {
  public: {
    icon: GlobeIcon,
    text: 'Public - No sign-in required',
    variant: 'secondary' as const,
    className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  },
  'private-locked': {
    icon: LockIcon,
    text: 'Private - Sign in required',
    variant: 'outline' as const,
    className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
  },
  'private-unlocked': {
    icon: CheckCircle2Icon,
    text: 'Your Personal Progress',
    variant: 'secondary' as const,
    className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  },
};

export function AchievementSectionBadge({ accessLevel, className }: AchievementSectionBadgeProps) {
  const config = badgeConfig[accessLevel];
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={`${config.className} ${className ?? ''} flex items-center gap-1.5 w-fit px-3 py-1.5 text-sm`}
      role="status"
      aria-label={`Access level: ${config.text}`}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      <span>{config.text}</span>
    </Badge>
  );
}
