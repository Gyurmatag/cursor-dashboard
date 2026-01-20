'use client';

import { useState } from 'react';
import { signIn } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { LogInIcon, Loader2Icon, UserIcon, SparklesIcon } from 'lucide-react';

/**
 * Sign-in prompt for the profile page
 * Displayed when user is not authenticated
 */
export function SignInPrompt() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn.social({
        provider: 'google',
        callbackURL: '/me',
      });
    } catch (error) {
      console.error('Sign in error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-gradient-to-br from-primary/10 to-primary/5 p-6 mb-6 border">
        <UserIcon className="size-12 text-primary" />
      </div>
      <h2 className="text-2xl font-semibold mb-2">Sign in to view your profile</h2>
      <p className="text-muted-foreground max-w-md mb-2">
        Sign in with your @shiwaforce.com email to access your personal Cursor dashboard 
        with detailed statistics, achievements, and activity insights.
      </p>
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <SparklesIcon className="size-4" />
        <span>Track your AI coding journey</span>
      </div>
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
