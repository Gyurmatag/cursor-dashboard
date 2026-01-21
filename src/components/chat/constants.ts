import {
  TrophyIcon,
  SparklesIcon,
  BarChartIcon,
  UsersIcon,
} from 'lucide-react';
import type { SuggestedPrompt } from './types';

/**
 * Suggested prompts for initial chat interface
 */
export const SUGGESTED_PROMPTS: readonly SuggestedPrompt[] = [
  { 
    icon: TrophyIcon, 
    label: 'Top 3 AI Users', 
    prompt: 'Show me the top 3 AI users this week' 
  },
  { 
    icon: SparklesIcon, 
    label: 'Achievement Overview', 
    prompt: 'What legendary achievements does our team have?' 
  },
  { 
    icon: BarChartIcon, 
    label: 'Team Stats', 
    prompt: "What's our team's total productivity score this month?" 
  },
  { 
    icon: UsersIcon, 
    label: 'User Comparison', 
    prompt: 'Compare the top 5 users by agent requests' 
  },
] as const;

/**
 * Auto-scroll threshold in pixels
 */
export const AUTO_SCROLL_THRESHOLD = 150;

/**
 * Textarea max height in pixels
 */
export const TEXTAREA_MAX_HEIGHT = 200;

/**
 * Copy feedback timeout in milliseconds
 */
export const COPY_FEEDBACK_TIMEOUT = 2000;

/**
 * Scroll delay for dynamic content in milliseconds
 */
export const SCROLL_DELAY = 100;

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  CHAT: '/api/chat',
} as const;
