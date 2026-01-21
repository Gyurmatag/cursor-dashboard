import { useRef, useEffect } from 'react';
import { TEXTAREA_MAX_HEIGHT } from '../constants';

/**
 * Custom hook for auto-resizing textarea based on content
 */
export function useTextareaResize(value: string) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        TEXTAREA_MAX_HEIGHT
      )}px`;
    }
  }, [value]);

  return textareaRef;
}
