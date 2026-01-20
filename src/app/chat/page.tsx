'use client';

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
import { LeaderboardCard, AchievementDisplay, UserProfileCard } from '@/components/chat';
import { ToolResultErrorBoundary } from '@/components/chat/error-boundary';
import { Response } from '@/components/ai-elements/response';
import type { UIMessage } from 'ai';
import type { LeaderboardResult, AchievementResult, UserProfileResult } from '@/types/chat';

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
        {message.parts.some(p => p.type === 'text' && p.text !== '[Data retrieved]') && (
          <div
            className={cn(
              'rounded-2xl px-4 py-3 relative',
              isUser
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            )}
          >
            {message.parts.map((part, index) => {
              if (part.type === 'text' && part.text !== '[Data retrieved]') {
                return isUser ? (
                  <p key={index} className="whitespace-pre-wrap break-words">
                    {part.text}
                  </p>
                ) : (
                  <Response key={index}>
                    {part.text}
                  </Response>
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

                  if (toolName === 'getUserProfile' && result && typeof result === 'object' && 'user' in result) {
                    return <UserProfileCard data={result as UserProfileResult} />;
                  }

                  // Fallback for other tools
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
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  
  // Smart auto-scroll
  useEffect(() => {
    if (!messagesContainerRef.current || !shouldAutoScroll) return;
    
    const container = messagesContainerRef.current;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    
    if (isNearBottom || messages.length === 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, shouldAutoScroll]);
  
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

  const sendMessage = useCallback(async (text: string) => {
    const userMessage: UIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      parts: [{ type: 'text', text }],
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);
    setError(null);
    
    // Create abort controller
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
        signal: abortControllerRef.current.signal,
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      const aiMessage: UIMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        parts: [],
      };
      
      // Add AI message placeholder immediately
      setMessages(prev => [...prev, aiMessage]);
      const messageIndex = messages.length + 1; // Position of AI message in current state
      const toolCallMap = new Map<string, string>(); // toolCallId -> toolName
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const event = JSON.parse(data);
            
            if (event.type === 'text-start' || event.type === 'text-delta') {
              if (event.type === 'text-delta') {
                const textPart = aiMessage.parts.find(p => p.type === 'text') as { type: 'text'; text: string } | undefined;
                if (textPart) {
                  textPart.text += event.delta;
                } else {
                  aiMessage.parts.push({ type: 'text', text: event.delta });
                }
                
                // Update messages array
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[messageIndex] = { ...aiMessage };
                  return newMessages;
                });
              }
            }
            
            if (event.type === 'tool-input-available') {
              // Track tool call ID to tool name mapping
              toolCallMap.set(event.toolCallId, event.toolName);
            }
            
            if (event.type === 'tool-output-available') {
              const toolName = toolCallMap.get(event.toolCallId) || 'unknown';
              const toolResultPart = {
                type: 'tool-result' as const,
                toolCallId: event.toolCallId,
                toolName: toolName,
                result: event.output,
              };
              aiMessage.parts.push(toolResultPart as never);
              
              // Update messages array
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[messageIndex] = { ...aiMessage };
                return newMessages;
              });
            }

            if (event.type === 'tool-output-error') {
              // Add error as text message
              const errorText = `❌ Error: ${event.errorText}`;
              const existingTextPart = aiMessage.parts.find(p => p.type === 'text') as { type: 'text'; text: string } | undefined;
              
              if (existingTextPart) {
                existingTextPart.text += '\n' + errorText;
              } else {
                aiMessage.parts.push({ type: 'text', text: errorText });
              }
              
              // Update messages array
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[messageIndex] = { ...aiMessage };
                return newMessages;
              });
            }
            
            if (event.type === 'finish') {
              // If assistant message has no text but has tool results, add a placeholder text
              // This prevents empty messages from being filtered out by the API
              const hasText = aiMessage.parts.some(p => p.type === 'text' && p.text?.trim());
              const hasTools = aiMessage.parts.some(p => p.type === 'tool-result');
              
              if (!hasText && hasTools) {
                aiMessage.parts.unshift({ type: 'text', text: '[Data retrieved]' });
              }
            }
          } catch (e) {
            console.error('[Stream parse]', e);
          }
        }
      }
      
      // Final update to ensure message is saved
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages[messageIndex]) {
          newMessages[messageIndex] = aiMessage;
        } else {
          newMessages.push(aiMessage);
        }
        return newMessages;
      });
      
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('[Send error]', err);
        setError(err);
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [messages]);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  }, []);

  const onSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed && !isStreaming) {
      sendMessage(trimmed);
      setInput('');
      setShouldAutoScroll(true);
    }
  }, [input, isStreaming, sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const trimmed = input.trim();
      if (trimmed && !isStreaming) {
        sendMessage(trimmed);
        setInput('');
        setShouldAutoScroll(true);
      }
    }
  }, [input, isStreaming, sendMessage]);

  const handleSuggestedPromptClick = useCallback((prompt: string) => {
    if (!isStreaming) {
      sendMessage(prompt);
      setShouldAutoScroll(true);
    }
  }, [isStreaming, sendMessage]);

  const isReady = !isStreaming;

  return (
    <div className="container mx-auto max-w-6xl p-6 h-[calc(100vh-4rem)] flex flex-col">
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
