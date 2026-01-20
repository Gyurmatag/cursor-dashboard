'use client';

import { useChat } from '@ai-sdk/react';
import { useRef, useEffect, useState, useCallback, memo, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { 
  SendIcon, 
  UserIcon,
  XIcon,
  CopyIcon,
  CheckIcon,
  SparklesIcon,
  TrophyIcon,
  BarChartIcon,
  UsersIcon,
} from 'lucide-react';
import { PulseIcon } from '@/components/chat/pulse-icon';
import { LeaderboardCard, AchievementDisplay } from '@/components/chat';
import { ToolResultErrorBoundary } from '@/components/chat/error-boundary';
import type { UIMessage } from 'ai';
import type { LeaderboardResult, AchievementResult } from '@/types/chat';

const SUGGESTED_PROMPTS = [
  { icon: TrophyIcon, label: 'Top 3 AI Users', prompt: 'Show me the top 3 AI users this week' },
  { icon: SparklesIcon, label: 'Achievement Overview', prompt: 'What legendary achievements does our team have?' },
  { icon: BarChartIcon, label: 'Team Stats', prompt: "What's our team's total productivity score this month?" },
  { icon: UsersIcon, label: 'User Comparison', prompt: 'Compare the top 5 users by agent requests' },
] as const;

const TypingIndicator = memo(() => (
  <div className="flex gap-3">
    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
      <PulseIcon className="w-4 h-4 text-primary" animated />
    </div>
    <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-2">
      <div className="flex gap-1">
        <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.3s]" />
        <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.15s]" />
        <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce" />
      </div>
      <span className="text-sm text-muted-foreground">Pulse is thinking...</span>
    </div>
  </div>
));
TypingIndicator.displayName = 'TypingIndicator';

const SuggestedPromptCard = memo(({ icon: Icon, label, prompt, onClick }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  prompt: string;
  onClick: (prompt: string) => void;
}) => (
  <button
    onClick={() => onClick(prompt)}
    className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-left"
  >
    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
      <Icon className="w-5 h-5 text-primary" />
    </div>
    <div className="flex-1">
      <p className="font-medium text-sm mb-1">{label}</p>
      <p className="text-xs text-muted-foreground">{prompt}</p>
    </div>
  </button>
));
SuggestedPromptCard.displayName = 'SuggestedPromptCard';

const MessageBubble = memo(({ message }: { message: UIMessage }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const hasToolInvocations = message.parts.some(p => p.type === 'tool-result');
  
  // Memoize text content extraction to avoid recreating callback on every message update
  const textContent = useMemo(() => 
    message.parts
      .filter(p => p.type === 'text')
      .map(p => p.type === 'text' ? p.text : '')
      .join(''),
    [message.parts]
  );
  
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [textContent]);
  
  return (
    <div
      className={cn(
        'flex gap-3 group',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <PulseIcon className="w-4 h-4 text-primary" />
        </div>
      )}
      
      <div className={cn('max-w-[85%] space-y-3', !isUser && hasToolInvocations && 'max-w-[90%]')}>
        {/* Text content */}
        {message.parts.some(p => p.type === 'text') && (
          <div
            className={cn(
              'rounded-2xl px-4 py-3 relative',
              isUser
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            )}
          >
            {message.parts.map((part, index) => {
              if (part.type === 'text') {
                return (
                  <p key={index} className="whitespace-pre-wrap break-words">
                    {part.text}
                  </p>
                );
              }
              return null;
            })}
            
            {/* Copy button */}
            {!isUser && (
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-background/10 rounded"
                title="Copy message"
              >
                {copied ? (
                  <CheckIcon className="w-3 h-3" />
                ) : (
                  <CopyIcon className="w-3 h-3" />
                )}
              </button>
            )}
          </div>
        )}

        {/* Tool results */}
        {message.parts.map((part, index) => {
          if (part.type === 'tool-result') {
            // Type assertion for tool result with toolName and result properties
            const toolPart = part as unknown as { type: 'tool-result'; toolName: string; result: unknown };
            const toolName = toolPart.toolName;
            const result = toolPart.result;

            return (
              <ToolResultErrorBoundary key={index}>
                {(() => {
                  // Render different components based on tool
                  if (toolName === 'getLeaderboard' && result && typeof result === 'object' && 'entries' in result) {
                    return <LeaderboardCard data={result as LeaderboardResult} />;
                  }
                  
                  if (toolName === 'getAchievements' && result && typeof result === 'object' && 'achievements' in result) {
                    return <AchievementDisplay data={result as AchievementResult} />;
                  }

                  // Fallback for other tools or if result doesn't match expected format
                  return (
                    <Card className="p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <SparklesIcon className="w-4 h-4" />
                        <span>{toolName} result</span>
                      </div>
                      <pre className="text-xs overflow-auto max-h-96">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </Card>
                  );
                })()}
              </ToolResultErrorBoundary>
            );
          }
          
          return null;
        })}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
          <UserIcon className="w-4 h-4 text-secondary-foreground" />
        </div>
      )}
    </div>
  );
});
MessageBubble.displayName = 'MessageBubble';

export default function ChatPage() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status, error, stop } = useChat();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Smart auto-scroll with support for dynamic content rendering
  const scrollToBottom = useCallback(() => {
    if (!messagesContainerRef.current || !shouldAutoScroll) return;
    
    const container = messagesContainerRef.current;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    
    if (isNearBottom || messages.length === 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, shouldAutoScroll]);

  // Scroll when messages change
  useEffect(() => {
    scrollToBottom();
    
    // Also scroll after a short delay to handle dynamically rendered components
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      scrollToBottom();
    }, 100);

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [messages, scrollToBottom]);

  // Observe content height changes for dynamic UI components
  useEffect(() => {
    if (!messagesContainerRef.current || !shouldAutoScroll) return;

    const resizeObserver = new ResizeObserver(() => {
      scrollToBottom();
    });

    // Observe the messages container for size changes
    const container = messagesContainerRef.current;
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [scrollToBottom, shouldAutoScroll]);
  
  // Track if user manually scrolled
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    
    const container = messagesContainerRef.current;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    setShouldAutoScroll(isNearBottom);
  }, []);
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const isStreaming = status === 'streaming';
  const isReady = status === 'ready';

  // Auto-focus input after response completes
  useEffect(() => {
    if (!isStreaming && messages.length > 0 && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isStreaming, messages.length]);

  const onSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed && isReady) {
      sendMessage({ text: trimmed });
      setInput('');
      setShouldAutoScroll(true);
    }
  }, [input, isReady, sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const trimmed = input.trim();
      if (trimmed && isReady) {
        sendMessage({ text: trimmed });
        setInput('');
        setShouldAutoScroll(true);
      }
    }
  }, [input, isReady, sendMessage]);

  const handleSuggestedPromptClick = useCallback((prompt: string) => {
    if (isReady) {
      sendMessage({ text: prompt });
      setShouldAutoScroll(true);
    }
  }, [isReady, sendMessage]);

  return (
    <div className="container mx-auto max-w-6xl p-6 h-[calc(100vh-4rem)] flex flex-col gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <PulseIcon className="w-8 h-8 text-primary" animated />
          <h1 className="text-3xl font-bold tracking-tight">Pulse</h1>
        </div>
        <p className="text-muted-foreground">
          Your intelligent assistant for team insights, productivity metrics, and AI usage analytics
        </p>
      </div>

      {/* Chat Container */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        {/* Messages Area */}
        <div 
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="max-w-3xl w-full space-y-6">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <PulseIcon className="w-8 h-8 text-primary" animated />
                  </div>
                  <h2 className="text-xl font-semibold">Start a conversation</h2>
                  <p className="text-muted-foreground">
                    Ask me anything about your team&apos;s AI usage, productivity metrics, 
                    achievements, or get insights from the dashboard data.
                  </p>
                </div>

                {/* Suggested Prompts */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">Try asking:</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {SUGGESTED_PROMPTS.map((suggested) => (
                      <SuggestedPromptCard
                        key={suggested.label}
                        icon={suggested.icon}
                        label={suggested.label}
                        prompt={suggested.prompt}
                        onClick={handleSuggestedPromptClick}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              
              {/* Typing indicator */}
              {isStreaming && <TypingIndicator />}
            </>
          )}
          
          {/* Error display */}
          {error && (
            <div className="flex justify-center">
              <div className="bg-destructive/10 text-destructive rounded-lg px-4 py-2 text-sm">
                Error: {error.message}
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t p-4">
          <form onSubmit={onSubmit} className="flex gap-3 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isStreaming ? "Pulse is responding..." : "Ask about team metrics, users, or achievements... (Enter to send, Shift+Enter for new line)"}
              className="min-h-[44px] max-h-[200px] resize-none"
              disabled={!isReady}
              rows={1}
            />
            {isStreaming ? (
              <Button 
                type="button"
                variant="destructive"
                size="icon"
                onClick={stop}
                className="h-11 w-11 flex-shrink-0"
                title="Stop generation"
              >
                <XIcon className="w-5 h-5" />
              </Button>
            ) : (
              <Button 
                type="submit" 
                size="icon"
                disabled={!input.trim() || !isReady}
                className="h-11 w-11 flex-shrink-0"
              >
                <SendIcon className="w-5 h-5" />
              </Button>
            )}
          </form>
        </div>
      </Card>
    </div>
  );
}
