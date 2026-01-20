'use client';

import { useState } from 'react';
import { signIn } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { LogInIcon, Loader2Icon, TrophyIcon } from 'lucide-react';

/**
 * Prompt displayed when user is not authenticated on the achievements page
 */
export function SignInPrompt() {
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
