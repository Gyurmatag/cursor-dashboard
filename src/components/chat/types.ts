import type { UIMessage } from 'ai';
import type { LeaderboardResult, AchievementResult, UserProfileResult, TeamStatsResult } from '@/types/chat';

/**
 * Tool result part type with proper typing
 */
export interface ToolResultPart {
  type: 'tool-result';
  toolCallId: string;
  toolName: string;
  result: LeaderboardResult | AchievementResult | UserProfileResult | TeamStatsResult | unknown;
}

/**
 * Text part type
 */
export interface TextPart {
  type: 'text';
  text: string;
}

/**
 * Message part union type
 */
export type MessagePart = TextPart | ToolResultPart;

/**
 * Extended UI Message with typed parts
 */
export interface TypedUIMessage extends Omit<UIMessage, 'parts'> {
  parts: MessagePart[];
}

/**
 * Suggested prompt type
 */
export interface SuggestedPrompt {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  prompt: string;
}

/**
 * Message bubble props
 */
export interface MessageBubbleProps {
  message: UIMessage;
}

/**
 * Suggested prompt card props
 */
export interface SuggestedPromptCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  prompt: string;
  onClick: (prompt: string) => void;
}

/**
 * Stream event types
 */
export type StreamEventType = 
  | 'text-start'
  | 'text-delta' 
  | 'tool-input-available'
  | 'tool-output-available'
  | 'tool-output-error'
  | 'error'
  | 'finish';

export interface StreamEvent {
  type: StreamEventType;
  delta?: string;
  toolCallId?: string;
  toolName?: string;
  output?: unknown;
  errorText?: string;
  error?: string;
}
