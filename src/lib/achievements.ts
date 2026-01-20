import type { UserStats, TeamStats } from '@/db/schema';

// ============================================================================
// Types
// ============================================================================

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'legendary';

export type AchievementCategory =
  | 'getting-started'
  | 'streaks'
  | 'productivity'
  | 'agent-mode'
  | 'chat'
  | 'tab-completions'
  | 'composer'
  | 'daily'
  | 'quality'
  | 'versatility'
  | 'milestones'
  | 'collaboration'
  | 'adoption';

export type BadgeShape = 'hexagon' | 'circle' | 'shield' | 'star' | 'diamond';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  type: 'individual' | 'team';
  tier: AchievementTier;
  threshold: number;
  shape: BadgeShape;
  checkFn: (stats: UserStats | TeamStats) => boolean;
  progressFn: (stats: UserStats | TeamStats) => number;
}

// ============================================================================
// Category Colors
// ============================================================================

export const CATEGORY_COLORS: Record<AchievementCategory, string> = {
  'getting-started': 'emerald',
  'streaks': 'amber',
  'productivity': 'blue',
  'agent-mode': 'violet',
  'chat': 'cyan',
  'tab-completions': 'yellow',
  'composer': 'pink',
  'daily': 'orange',
  'quality': 'teal',
  'versatility': 'indigo',
  'milestones': 'yellow',
  'collaboration': 'sky',
  'adoption': 'lime',
};

export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  'getting-started': 'Getting Started',
  'streaks': 'Streaks',
  'productivity': 'Productivity',
  'agent-mode': 'Agent Mode',
  'chat': 'Chat',
  'tab-completions': 'Tab Completions',
  'composer': 'Composer',
  'daily': 'Daily Challenges',
  'quality': 'Quality',
  'versatility': 'Versatility',
  'milestones': 'Team Milestones',
  'collaboration': 'Collaboration',
  'adoption': 'Adoption',
};

// ============================================================================
// Individual Achievements (21)
// ============================================================================

export const INDIVIDUAL_ACHIEVEMENTS: Achievement[] = [
  // Getting Started
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Complete your first active day with Cursor',
    icon: 'Footprints',
    category: 'getting-started',
    type: 'individual',
    tier: 'bronze',
    threshold: 1,
    shape: 'circle',
    checkFn: (stats) => (stats as UserStats).totalActiveDays >= 1,
    progressFn: (stats) => Math.min((stats as UserStats).totalActiveDays / 1 * 100, 100),
  },

  // Streaks
  {
    id: 'week-warrior',
    name: 'Week Warrior',
    description: 'Stay active for 7 consecutive days',
    icon: 'Calendar',
    category: 'streaks',
    type: 'individual',
    tier: 'silver',
    threshold: 7,
    shape: 'circle',
    checkFn: (stats) => (stats as UserStats).maxConsecutiveDays >= 7,
    progressFn: (stats) => Math.min((stats as UserStats).maxConsecutiveDays / 7 * 100, 100),
  },
  {
    id: 'fortnight-fighter',
    name: 'Fortnight Fighter',
    description: 'Stay active for 14 consecutive days',
    icon: 'CalendarDays',
    category: 'streaks',
    type: 'individual',
    tier: 'silver',
    threshold: 14,
    shape: 'circle',
    checkFn: (stats) => (stats as UserStats).maxConsecutiveDays >= 14,
    progressFn: (stats) => Math.min((stats as UserStats).maxConsecutiveDays / 14 * 100, 100),
  },
  {
    id: 'monthly-master',
    name: 'Monthly Master',
    description: 'Stay active for 30 consecutive days',
    icon: 'Crown',
    category: 'streaks',
    type: 'individual',
    tier: 'gold',
    threshold: 30,
    shape: 'circle',
    checkFn: (stats) => (stats as UserStats).maxConsecutiveDays >= 30,
    progressFn: (stats) => Math.min((stats as UserStats).maxConsecutiveDays / 30 * 100, 100),
  },

  // Productivity
  {
    id: 'code-generator',
    name: 'Code Generator',
    description: 'Generate 1,000 lines of AI-assisted code',
    icon: 'Code',
    category: 'productivity',
    type: 'individual',
    tier: 'silver',
    threshold: 1000,
    shape: 'hexagon',
    checkFn: (stats) => (stats as UserStats).totalLinesAdded >= 1000,
    progressFn: (stats) => Math.min((stats as UserStats).totalLinesAdded / 1000 * 100, 100),
  },
  {
    id: 'prolific-coder',
    name: 'Prolific Coder',
    description: 'Generate 10,000 lines of AI-assisted code',
    icon: 'Rocket',
    category: 'productivity',
    type: 'individual',
    tier: 'gold',
    threshold: 10000,
    shape: 'hexagon',
    checkFn: (stats) => (stats as UserStats).totalLinesAdded >= 10000,
    progressFn: (stats) => Math.min((stats as UserStats).totalLinesAdded / 10000 * 100, 100),
  },
  {
    id: 'code-legend',
    name: 'Code Legend',
    description: 'Generate 50,000 lines of AI-assisted code',
    icon: 'Trophy',
    category: 'productivity',
    type: 'individual',
    tier: 'legendary',
    threshold: 50000,
    shape: 'star',
    checkFn: (stats) => (stats as UserStats).totalLinesAdded >= 50000,
    progressFn: (stats) => Math.min((stats as UserStats).totalLinesAdded / 50000 * 100, 100),
  },

  // Agent Mode
  {
    id: 'agent-apprentice',
    name: 'Agent Apprentice',
    description: 'Make 10 agent requests',
    icon: 'Bot',
    category: 'agent-mode',
    type: 'individual',
    tier: 'bronze',
    threshold: 10,
    shape: 'hexagon',
    checkFn: (stats) => (stats as UserStats).totalAgentRequests >= 10,
    progressFn: (stats) => Math.min((stats as UserStats).totalAgentRequests / 10 * 100, 100),
  },
  {
    id: 'agent-master',
    name: 'Agent Master',
    description: 'Make 100 agent requests',
    icon: 'BotMessageSquare',
    category: 'agent-mode',
    type: 'individual',
    tier: 'gold',
    threshold: 100,
    shape: 'hexagon',
    checkFn: (stats) => (stats as UserStats).totalAgentRequests >= 100,
    progressFn: (stats) => Math.min((stats as UserStats).totalAgentRequests / 100 * 100, 100),
  },
  {
    id: 'agent-legend',
    name: 'Agent Legend',
    description: 'Make 500 agent requests',
    icon: 'Sparkles',
    category: 'agent-mode',
    type: 'individual',
    tier: 'legendary',
    threshold: 500,
    shape: 'star',
    checkFn: (stats) => (stats as UserStats).totalAgentRequests >= 500,
    progressFn: (stats) => Math.min((stats as UserStats).totalAgentRequests / 500 * 100, 100),
  },

  // Chat
  {
    id: 'chat-starter',
    name: 'Chat Starter',
    description: 'Start 10 chat conversations',
    icon: 'MessageCircle',
    category: 'chat',
    type: 'individual',
    tier: 'bronze',
    threshold: 10,
    shape: 'circle',
    checkFn: (stats) => (stats as UserStats).totalChatRequests >= 10,
    progressFn: (stats) => Math.min((stats as UserStats).totalChatRequests / 10 * 100, 100),
  },
  {
    id: 'conversationalist',
    name: 'Conversationalist',
    description: 'Have 100 chat conversations',
    icon: 'MessagesSquare',
    category: 'chat',
    type: 'individual',
    tier: 'silver',
    threshold: 100,
    shape: 'circle',
    checkFn: (stats) => (stats as UserStats).totalChatRequests >= 100,
    progressFn: (stats) => Math.min((stats as UserStats).totalChatRequests / 100 * 100, 100),
  },

  // Tab Completions
  {
    id: 'tab-tapper',
    name: 'Tab Tapper',
    description: 'Accept 100 tab completions',
    icon: 'Keyboard',
    category: 'tab-completions',
    type: 'individual',
    tier: 'bronze',
    threshold: 100,
    shape: 'hexagon',
    checkFn: (stats) => (stats as UserStats).totalTabAccepts >= 100,
    progressFn: (stats) => Math.min((stats as UserStats).totalTabAccepts / 100 * 100, 100),
  },
  {
    id: 'tab-master',
    name: 'Tab Master',
    description: 'Accept 1,000 tab completions',
    icon: 'Zap',
    category: 'tab-completions',
    type: 'individual',
    tier: 'silver',
    threshold: 1000,
    shape: 'hexagon',
    checkFn: (stats) => (stats as UserStats).totalTabAccepts >= 1000,
    progressFn: (stats) => Math.min((stats as UserStats).totalTabAccepts / 1000 * 100, 100),
  },

  // Composer
  {
    id: 'composer-beginner',
    name: 'Composer Beginner',
    description: 'Use composer 10 times',
    icon: 'FileCode',
    category: 'composer',
    type: 'individual',
    tier: 'bronze',
    threshold: 10,
    shape: 'hexagon',
    checkFn: (stats) => (stats as UserStats).totalComposerRequests >= 10,
    progressFn: (stats) => Math.min((stats as UserStats).totalComposerRequests / 10 * 100, 100),
  },
  {
    id: 'composer-virtuoso',
    name: 'Composer Virtuoso',
    description: 'Use composer 100 times',
    icon: 'Files',
    category: 'composer',
    type: 'individual',
    tier: 'gold',
    threshold: 100,
    shape: 'hexagon',
    checkFn: (stats) => (stats as UserStats).totalComposerRequests >= 100,
    progressFn: (stats) => Math.min((stats as UserStats).totalComposerRequests / 100 * 100, 100),
  },

  // Daily Challenges
  {
    id: 'productive-day',
    name: 'Productive Day',
    description: 'Generate 500+ lines in a single day',
    icon: 'Flame',
    category: 'daily',
    type: 'individual',
    tier: 'silver',
    threshold: 500,
    shape: 'diamond',
    checkFn: (stats) => (stats as UserStats).bestSingleDayLines >= 500,
    progressFn: (stats) => Math.min((stats as UserStats).bestSingleDayLines / 500 * 100, 100),
  },
  {
    id: 'super-productive',
    name: 'Super Productive',
    description: 'Generate 1,000+ lines in a single day',
    icon: 'Zap',
    category: 'daily',
    type: 'individual',
    tier: 'gold',
    threshold: 1000,
    shape: 'diamond',
    checkFn: (stats) => (stats as UserStats).bestSingleDayLines >= 1000,
    progressFn: (stats) => Math.min((stats as UserStats).bestSingleDayLines / 1000 * 100, 100),
  },
  {
    id: 'agent-marathon',
    name: 'Agent Marathon',
    description: 'Make 50+ agent requests in a single day',
    icon: 'Timer',
    category: 'daily',
    type: 'individual',
    tier: 'gold',
    threshold: 50,
    shape: 'diamond',
    checkFn: (stats) => (stats as UserStats).bestSingleDayAgent >= 50,
    progressFn: (stats) => Math.min((stats as UserStats).bestSingleDayAgent / 50 * 100, 100),
  },

  // Quality
  {
    id: 'bug-hunter',
    name: 'Bug Hunter',
    description: 'Use BugBot 10 times for code review',
    icon: 'Bug',
    category: 'quality',
    type: 'individual',
    tier: 'silver',
    threshold: 10,
    shape: 'hexagon',
    checkFn: (stats) => (stats as UserStats).totalBugbotUsages >= 10,
    progressFn: (stats) => Math.min((stats as UserStats).totalBugbotUsages / 10 * 100, 100),
  },

  // Versatility - This one needs special handling with daily snapshot data
  {
    id: 'all-rounder',
    name: 'All-Rounder',
    description: 'Use Chat, Composer, and Agent in one day',
    icon: 'CircleDot',
    category: 'versatility',
    type: 'individual',
    tier: 'silver',
    threshold: 1,
    shape: 'star',
    // This check needs to be done at the daily snapshot level during sync
    checkFn: () => false, // Placeholder - checked during sync
    progressFn: () => 0, // Placeholder - calculated during sync
  },
];

// ============================================================================
// Team Achievements (10)
// ============================================================================

export const TEAM_ACHIEVEMENTS: Achievement[] = [
  // Milestones
  {
    id: 'team-first-blood',
    name: 'First Blood',
    description: 'Team generates first 1,000 lines together',
    icon: 'Users',
    category: 'milestones',
    type: 'team',
    tier: 'bronze',
    threshold: 1000,
    shape: 'shield',
    checkFn: (stats) => (stats as TeamStats).totalTeamLines >= 1000,
    progressFn: (stats) => Math.min((stats as TeamStats).totalTeamLines / 1000 * 100, 100),
  },
  {
    id: 'team-powerhouse',
    name: 'Powerhouse',
    description: 'Team generates 100,000 lines together',
    icon: 'Building',
    category: 'milestones',
    type: 'team',
    tier: 'gold',
    threshold: 100000,
    shape: 'shield',
    checkFn: (stats) => (stats as TeamStats).totalTeamLines >= 100000,
    progressFn: (stats) => Math.min((stats as TeamStats).totalTeamLines / 100000 * 100, 100),
  },
  {
    id: 'team-million-club',
    name: 'Million Club',
    description: 'Team generates 1,000,000 lines together',
    icon: 'Castle',
    category: 'milestones',
    type: 'team',
    tier: 'legendary',
    threshold: 1000000,
    shape: 'star',
    checkFn: (stats) => (stats as TeamStats).totalTeamLines >= 1000000,
    progressFn: (stats) => Math.min((stats as TeamStats).totalTeamLines / 1000000 * 100, 100),
  },

  // Collaboration
  {
    id: 'full-squad',
    name: 'Full Squad',
    description: 'All team members active in one day',
    icon: 'UsersRound',
    category: 'collaboration',
    type: 'team',
    tier: 'gold',
    threshold: 1,
    shape: 'shield',
    // This check needs special handling during sync
    checkFn: () => false, // Placeholder
    progressFn: () => 0, // Placeholder
  },
  {
    id: 'streak-squad',
    name: 'Streak Squad',
    description: '5+ members maintain 7-day streaks',
    icon: 'Flame',
    category: 'collaboration',
    type: 'team',
    tier: 'gold',
    threshold: 5,
    shape: 'shield',
    checkFn: (stats) => (stats as TeamStats).membersWithStreaks >= 5,
    progressFn: (stats) => Math.min((stats as TeamStats).membersWithStreaks / 5 * 100, 100),
  },

  // Agent Mode
  {
    id: 'agent-army',
    name: 'Agent Army',
    description: 'Team makes 1,000 agent requests combined',
    icon: 'BotMessageSquare',
    category: 'agent-mode',
    type: 'team',
    tier: 'silver',
    threshold: 1000,
    shape: 'shield',
    checkFn: (stats) => (stats as TeamStats).totalTeamAgentRequests >= 1000,
    progressFn: (stats) => Math.min((stats as TeamStats).totalTeamAgentRequests / 1000 * 100, 100),
  },

  // Chat
  {
    id: 'chat-champions',
    name: 'Chat Champions',
    description: 'Team has 5,000 chat conversations',
    icon: 'MessageSquare',
    category: 'chat',
    type: 'team',
    tier: 'silver',
    threshold: 5000,
    shape: 'shield',
    checkFn: (stats) => (stats as TeamStats).totalTeamChatRequests >= 5000,
    progressFn: (stats) => Math.min((stats as TeamStats).totalTeamChatRequests / 5000 * 100, 100),
  },

  // Composer
  {
    id: 'composer-collective',
    name: 'Composer Collective',
    description: 'Team uses composer 1,000 times',
    icon: 'Music4',
    category: 'composer',
    type: 'team',
    tier: 'silver',
    threshold: 1000,
    shape: 'shield',
    checkFn: (stats) => (stats as TeamStats).totalTeamComposerRequests >= 1000,
    progressFn: (stats) => Math.min((stats as TeamStats).totalTeamComposerRequests / 1000 * 100, 100),
  },

  // Daily
  {
    id: 'record-breakers',
    name: 'Record Breakers',
    description: 'Team generates 10,000+ lines in one day',
    icon: 'TrendingUp',
    category: 'daily',
    type: 'team',
    tier: 'gold',
    threshold: 10000,
    shape: 'diamond',
    checkFn: (stats) => (stats as TeamStats).bestTeamDayLines >= 10000,
    progressFn: (stats) => Math.min((stats as TeamStats).bestTeamDayLines / 10000 * 100, 100),
  },

  // Adoption
  {
    id: 'adoption-complete',
    name: 'Full Adoption',
    description: 'Every team member has earned First Steps',
    icon: 'CheckCircle2',
    category: 'adoption',
    type: 'team',
    tier: 'legendary',
    threshold: 1,
    shape: 'star',
    // This check needs special handling during sync
    checkFn: () => false, // Placeholder
    progressFn: () => 0, // Placeholder
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

export const ALL_ACHIEVEMENTS = [...INDIVIDUAL_ACHIEVEMENTS, ...TEAM_ACHIEVEMENTS];

export function getAchievementById(id: string): Achievement | undefined {
  return ALL_ACHIEVEMENTS.find((a) => a.id === id);
}

export function getAchievementsByCategory(category: AchievementCategory): Achievement[] {
  return ALL_ACHIEVEMENTS.filter((a) => a.category === category);
}

export function getAchievementsByType(type: 'individual' | 'team'): Achievement[] {
  return type === 'individual' ? INDIVIDUAL_ACHIEVEMENTS : TEAM_ACHIEVEMENTS;
}

export function getAchievementsByTier(tier: AchievementTier): Achievement[] {
  return ALL_ACHIEVEMENTS.filter((a) => a.tier === tier);
}

/**
 * Get the tier for a given threshold
 */
export function getTierForThreshold(threshold: number): AchievementTier {
  if (threshold >= 500) return 'legendary';
  if (threshold >= 30) return 'gold';
  if (threshold >= 7) return 'silver';
  return 'bronze';
}

/**
 * Get individual category groups for display
 */
export function getIndividualCategories(): AchievementCategory[] {
  return [
    'getting-started',
    'streaks',
    'productivity',
    'agent-mode',
    'chat',
    'tab-completions',
    'composer',
    'daily',
    'quality',
    'versatility',
  ];
}

/**
 * Get team category groups for display
 */
export function getTeamCategories(): AchievementCategory[] {
  return [
    'milestones',
    'collaboration',
    'agent-mode',
    'chat',
    'composer',
    'daily',
    'adoption',
  ];
}
