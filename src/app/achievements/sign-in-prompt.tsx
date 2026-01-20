'use client';

import { useState } from 'react';
import { signIn } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { LogInIcon, Loader2Icon, TrophyIcon, SparklesIcon } from 'lucide-react';

interface SignInPromptProps {
  variant?: 'inline' | 'fullpage';
  achievementCount?: number;
}

/**
 * Prompt displayed when user is not authenticated on the achievements page
 * Supports both inline (compact) and fullpage variants
 */
export function SignInPrompt({ variant = 'fullpage', achievementCount }: SignInPromptProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn.social({
        provider: 'google',
        callbackURL: '/achievements',
      });
    } catch (error) {
      console.error('Sign in error:', error);
      setIsLoading(false);
    }
  };

  if (variant === 'inline') {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-muted-foreground/30 rounded-lg bg-muted/30">
        <div className="rounded-full bg-background p-4 mb-4 border shadow-sm">
          <TrophyIcon className="size-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Unlock Your Personal Achievements</h3>
        <p className="text-muted-foreground max-w-sm mb-1 text-sm">
          Sign in to track your individual progress and unlock {achievementCount || '21'} personal achievements
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-5">
          <SparklesIcon className="size-3.5" />
          <span>Track streaks, productivity milestones, and more</span>
        </div>
        <Button
          size="default"
          onClick={handleSignIn}
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <LogInIcon className="size-4" />
          )}
          Sign in with Google
        </Button>
        <p className="text-xs text-muted-foreground mt-3">
          Only @shiwaforce.com email addresses are allowed
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-muted p-6 mb-6">
        <TrophyIcon className="size-12 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-semibold mb-2">Sign in to view your achievements</h2>
      <p className="text-muted-foreground max-w-md mb-6">
        Sign in with your @shiwaforce.com email to see your personal achievements 
        and track your Cursor AI mastery progress.
      </p>
      <Button
        size="lg"
        onClick={handleSignIn}
        disabled={isLoading}
        className="gap-2"
      >
        {isLoading ? (
          <Loader2Icon className="size-5 animate-spin" />
        ) : (
          <LogInIcon className="size-5" />
        )}
        Sign in with Google
      </Button>
      <p className="text-xs text-muted-foreground mt-4">
        Only @shiwaforce.com email addresses are allowed
      </p>
    </div>
  );
}
