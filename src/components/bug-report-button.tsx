'use client';

import * as React from 'react';
import { Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Slack channel URL configuration
const SLACK_CHANNEL_URL = 'https://shiwaforce.slack.com/archives/D03R2P5N7QT';

// Hoist static template function outside component (React best practice)
const createBugReportTemplate = (pageUrl: string): string => {
  return `🐛 Bug Report

Page: ${pageUrl}
Problem: [Describe the issue you encountered]`;
};

export function BugReportButton() {
  const [mounted, setMounted] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // Avoid hydration mismatch by only rendering on client
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleBugReport = React.useCallback(() => {
    // Capture current page URL
    const currentUrl = window.location.href;
    
    // Create bug report template
    const template = createBugReportTemplate(currentUrl);
    
    // Copy template to clipboard
    navigator.clipboard.writeText(template).then(() => {
      // Show copied feedback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch((err) => {
      console.error('Failed to copy bug report template:', err);
    });
    
    // Open Slack channel in new tab
    window.open(SLACK_CHANNEL_URL, '_blank', 'noopener,noreferrer');
  }, []);

  // Don't render during SSR to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Floating bug report button */}
      <Button
        onClick={handleBugReport}
        size="icon"
        variant="outline"
        className={cn(
          'fixed bottom-6 right-6 z-40 size-12 rounded-full shadow-lg',
          'bg-background/80 backdrop-blur-sm',
          'hover:bg-background hover:shadow-xl',
          'transition-all duration-200',
          'md:bottom-8 md:right-8',
          'border-2',
          copied && 'bg-green-500/10 border-green-500'
        )}
        aria-label="Report a bug"
        title="Report a bug"
      >
        <Bug className={cn(
          'size-5 transition-colors',
          copied ? 'text-green-500' : 'text-foreground'
        )} />
      </Button>

      {/* Toast notification for copied feedback */}
      {copied && (
        <div
          className={cn(
            'fixed bottom-24 right-6 z-50',
            'bg-green-500 text-white',
            'px-4 py-2 rounded-lg shadow-lg',
            'text-sm font-medium',
            'animate-in slide-in-from-bottom-2 fade-in-0',
            'md:bottom-26 md:right-8'
          )}
          role="status"
          aria-live="polite"
        >
          Template copied! Paste in Slack
        </div>
      )}
    </>
  );
}
