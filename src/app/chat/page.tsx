'use client';

import { useChat } from '@ai-sdk/react';
import { useRef, useEffect, useState, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { SendIcon, BotIcon, UserIcon, Loader2Icon, StopCircleIcon } from 'lucide-react';
import type { UIMessage } from 'ai';

// Memoized message component to prevent unnecessary re-renders
const MessageBubble = memo(({ message }: { message: UIMessage }) => {
  const isUser = message.role === 'user';
  
  return (
    <div
      className={cn(
        'flex gap-3',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <BotIcon className="w-4 h-4 text-primary" />
        </div>
      )}
      
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3',
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
  const [inputValue, setInputValue] = useState('');
  const { messages, sendMessage, status, error, stop } = useChat({
    api: '/api/chat',
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  
  // Smart auto-scroll: only scroll if user is near bottom
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
  }, [inputValue]);

  const isStreaming = status === 'streaming';
  const isReady = status === 'ready';

  const onSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = inputValue.trim();
    if (trimmedInput && isReady) {
      sendMessage({ text: trimmedInput });
      setInputValue('');
      setShouldAutoScroll(true); // Re-enable auto-scroll on new message
    }
  }, [inputValue, isReady, sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const trimmedInput = inputValue.trim();
      if (trimmedInput && isReady) {
        sendMessage({ text: trimmedInput });
        setInputValue('');
        setShouldAutoScroll(true);
      }
    }
  }, [inputValue, isReady, sendMessage]);

  return (
    <div className="container mx-auto py-8 px-4 h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">AI Chat</h1>
        <p className="text-muted-foreground">
          Chat with AI about your team&apos;s productivity and usage metrics
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
              <div className="text-center space-y-4 max-w-md">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <BotIcon className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">Start a conversation</h2>
                <p className="text-muted-foreground">
                  Ask me anything about your team&apos;s AI usage, productivity metrics, 
                  or get help understanding the dashboard data.
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
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
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isStreaming ? "AI is responding..." : "Type your message... (Enter to send, Shift+Enter for new line)"}
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
                <StopCircleIcon className="w-5 h-5" />
              </Button>
            ) : (
              <Button 
                type="submit" 
                size="icon"
                disabled={!inputValue.trim() || !isReady}
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
