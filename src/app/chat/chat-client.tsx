'use client';

import { useState, useCallback, useEffect, memo, useMemo } from 'react';
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
} from 'lucide-react';
import { PulseIcon } from '@/components/chat/pulse-icon';
import { ToolResultErrorBoundary } from '@/components/chat/error-boundary';
import { ToolResultRenderer } from '@/components/chat';
import { Response } from '@/components/ai-elements/response';
import type { SuggestedPromptCardProps, MessageBubbleProps, ToolResultPart } from '@/components/chat/types';
import { SUGGESTED_PROMPTS, COPY_FEEDBACK_TIMEOUT } from '@/components/chat/constants';
import { useChatStream } from '@/components/chat/hooks/use-chat-stream';
import { useAutoScroll } from '@/components/chat/hooks/use-auto-scroll';
import { useTextareaResize } from '@/components/chat/hooks/use-textarea-resize';

/**
 * Typing indicator component
 */
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

/**
 * Suggested prompt card component
 */
const SuggestedPromptCard = memo<SuggestedPromptCardProps>(({ icon: Icon, label, prompt, onClick }) => (
  <button
    onClick={() => onClick(prompt)}
    className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-left"
    type="button"
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

/**
 * Message bubble component
 */
const MessageBubble = memo<MessageBubbleProps>(({ message }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const hasToolInvocations = message.parts.some(p => p.type === 'tool-result');

  // Memoize text content extraction
  const textContent = useMemo(
    () =>
      message.parts
        .filter(p => p.type === 'text')
        .map(p => (p.type === 'text' ? p.text : ''))
        .join(''),
    [message.parts]
  );

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), COPY_FEEDBACK_TIMEOUT);
  }, [textContent]);

  return (
    <div className={cn('flex gap-3 group', isUser ? 'justify-end' : 'justify-start')}>
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
              isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
            )}
          >
            {message.parts.map((part, index) => {
              if (part.type === 'text') {
                return isUser ? (
                  <p key={index} className="whitespace-pre-wrap break-words">
                    {part.text}
                  </p>
                ) : (
                  <Response key={index}>{part.text}</Response>
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
                type="button"
              >
                {copied ? <CheckIcon className="w-3 h-3" /> : <CopyIcon className="w-3 h-3" />}
              </button>
            )}
          </div>
        )}

        {/* Tool results */}
        {message.parts.map((part, index) => {
          if (part.type === 'tool-result') {
            const toolPart = part as unknown as ToolResultPart;
            const { toolName, result } = toolPart;

            return (
              <ToolResultErrorBoundary
                key={index}
                fallback={
                  <Card className="p-4 border-destructive/50">
                    <div className="flex items-center gap-2 text-sm text-destructive mb-2">
                      <SparklesIcon className="w-4 h-4" />
                      <span>Error displaying {toolName} result</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {result && typeof result === 'object' ? (
                        <pre className="text-xs overflow-auto max-h-96 bg-muted p-2 rounded">
                          {JSON.stringify(result, null, 2)}
                        </pre>
                      ) : (
                        <p>Unable to display result. Please try asking your question differently.</p>
                      )}
                    </div>
                  </Card>
                }
              >
                <ToolResultRenderer toolName={toolName} result={result} />
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

/**
 * Main chat client component
 */
export function ChatClient() {
  const [input, setInput] = useState('');

  // Custom hooks
  const { messages, isStreaming, error, sendMessage, stop } = useChatStream();
  const { messagesContainerRef, messagesEndRef, setShouldAutoScroll, handleScroll } =
    useAutoScroll({ messagesLength: messages.length, isStreaming });
  const textareaRef = useTextareaResize(input);

  // Auto-focus input after response completes
  useEffect(() => {
    if (!isStreaming && messages.length > 0 && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isStreaming, messages.length, textareaRef]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = input.trim();
      if (trimmed && !isStreaming) {
        sendMessage(trimmed);
        setInput('');
        setShouldAutoScroll(true);
      }
    },
    [input, isStreaming, sendMessage, setShouldAutoScroll]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const trimmed = input.trim();
        if (trimmed && !isStreaming) {
          sendMessage(trimmed);
          setInput('');
          setShouldAutoScroll(true);
        }
      }
    },
    [input, isStreaming, sendMessage, setShouldAutoScroll]
  );

  const handleSuggestedPromptClick = useCallback(
    (prompt: string) => {
      if (!isStreaming) {
        sendMessage(prompt);
        setShouldAutoScroll(true);
      }
    },
    [isStreaming, sendMessage, setShouldAutoScroll]
  );

  const isReady = !isStreaming;

  return (
    <div className="container mx-auto max-w-6xl p-6 h-[calc(100vh-4rem)] flex flex-col">
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
          <form onSubmit={handleSubmit} className="flex gap-3 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isStreaming
                  ? 'Pulse is responding...'
                  : 'Ask about team metrics, users, or achievements... (Enter to send, Shift+Enter for new line)'
              }
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
