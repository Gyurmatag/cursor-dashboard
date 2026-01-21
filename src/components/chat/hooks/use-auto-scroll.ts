import { useRef, useEffect, useCallback, useState } from 'react';
import { AUTO_SCROLL_THRESHOLD, SCROLL_DELAY } from '../constants';

interface UseAutoScrollOptions {
  messagesLength: number;
  isStreaming?: boolean;
}

/**
 * Custom hook for managing auto-scroll behavior in chat
 * Handles smart scrolling based on user position and content changes
 * Always scrolls during AI responses to ensure visibility
 */
export function useAutoScroll({ messagesLength, isStreaming = false }: UseAutoScrollOptions) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  /**
   * Scroll to bottom with optional force parameter
   * Force scrolling during AI responses to ensure user sees the reply
   */
  const scrollToBottom = useCallback((force = false) => {
    if (!messagesContainerRef.current) return;

    const container = messagesContainerRef.current;
    const isNearBottom = 
      container.scrollHeight - container.scrollTop - container.clientHeight < AUTO_SCROLL_THRESHOLD;

    // Always scroll if:
    // 1. Force is enabled (during AI responses)
    // 2. User is near bottom and auto-scroll is enabled
    // 3. First message
    if (force || (shouldAutoScroll && isNearBottom) || messagesLength === 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messagesLength, shouldAutoScroll]);

  /**
   * Track if user manually scrolled away from bottom
   */
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;

    const container = messagesContainerRef.current;
    const isNearBottom = 
      container.scrollHeight - container.scrollTop - container.clientHeight < AUTO_SCROLL_THRESHOLD;
    
    setShouldAutoScroll(isNearBottom);
  }, []);

  /**
   * Scroll when messages change
   * Force scroll during streaming to ensure AI responses are visible
   */
  useEffect(() => {
    const forceScroll = isStreaming;
    scrollToBottom(forceScroll);

    // Also scroll after a short delay to handle dynamically rendered components
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      scrollToBottom(forceScroll);
    }, SCROLL_DELAY);

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [scrollToBottom, isStreaming]);

  /**
   * Observe content height changes for dynamic UI components
   * Force scroll during streaming to handle expanding content
   */
  useEffect(() => {
    if (!messagesContainerRef.current) return;
    if (!shouldAutoScroll && !isStreaming) return;

    const resizeObserver = new ResizeObserver(() => {
      scrollToBottom(isStreaming);
    });

    const container = messagesContainerRef.current;
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [scrollToBottom, shouldAutoScroll, isStreaming]);

  return {
    messagesContainerRef,
    messagesEndRef,
    shouldAutoScroll,
    setShouldAutoScroll,
    handleScroll,
  };
}
