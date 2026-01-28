import { useState, useRef, useCallback } from 'react';
import type { UIMessage } from 'ai';
import type { StreamEvent } from '../types';
import { API_ENDPOINTS } from '../constants';

interface UseChatStreamOptions {
  onError?: (error: Error) => void;
}

/**
 * Custom hook for managing chat stream state and API calls
 * Handles streaming responses from the chat API
 */
export function useChatStream({ onError }: UseChatStreamOptions = {}) {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Send a message and handle streaming response
   */
  const sendMessage = useCallback(async (text: string) => {
    const userMessage: UIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      parts: [{ type: 'text', text }],
    };

    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);
    setError(null);

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(API_ENDPOINTS.CHAT, {
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
      const messageIndex = messages.length + 1;
      const toolCallMap = new Map<string, string>();

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
            const event: StreamEvent = JSON.parse(data);

            // Handle text delta
            if (event.type === 'text-delta') {
              const textPart = aiMessage.parts.find(p => p.type === 'text') as { type: 'text'; text: string } | undefined;
              if (textPart) {
                textPart.text += event.delta || '';
              } else {
                aiMessage.parts.push({ type: 'text', text: event.delta || '' });
              }

              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[messageIndex] = { ...aiMessage };
                return newMessages;
              });
            }

            // Track tool call ID to tool name mapping
            if (event.type === 'tool-input-available' && event.toolCallId && event.toolName) {
              toolCallMap.set(event.toolCallId, event.toolName);
            }

            // Handle tool output
            if (event.type === 'tool-output-available' && event.toolCallId) {
              const toolName = toolCallMap.get(event.toolCallId) || 'unknown';
              const toolResultPart = {
                type: 'tool-result' as const,
                toolCallId: event.toolCallId,
                toolName: toolName,
                result: event.output,
              };
              aiMessage.parts.push(toolResultPart as never);

              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[messageIndex] = { ...aiMessage };
                return newMessages;
              });
            }

            // Handle tool errors
            if (event.type === 'tool-output-error' || event.type === 'error') {
              const errorText = `❌ Error: ${event.errorText || event.error || 'An error occurred while fetching data'}`;
              const existingTextPart = aiMessage.parts.find(p => p.type === 'text') as { type: 'text'; text: string } | undefined;

              if (existingTextPart) {
                existingTextPart.text += '\n\n' + errorText;
              } else {
                aiMessage.parts.push({ type: 'text', text: errorText });
              }

              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[messageIndex] = { ...aiMessage };
                return newMessages;
              });
            }

            // Finish event is handled after the read loop (fallback text when tools but no text)
          } catch (e) {
            console.error('[Stream parse]', e);
          }
        }
      }

      // Fallback when stream ends with tool results but no text (e.g. no 'finish' event or model didn't respond).
      const hasText = aiMessage.parts.some(p => p.type === 'text' && (p as { text?: string }).text?.trim());
      const hasTools = aiMessage.parts.some(p => p.type === 'tool-result');
      if (!hasText && hasTools) {
        aiMessage.parts.unshift({ type: 'text', text: "Here's the data you requested:" });
      } else if (!hasText && !hasTools) {
        aiMessage.parts.push({
          type: 'text',
          text: "I couldn't generate a response. Please try rephrasing your question or ask something else.",
        });
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
        onError?.(err);
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [messages, onError]);

  /**
   * Stop the current streaming response
   */
  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  }, []);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    stop,
  };
}
