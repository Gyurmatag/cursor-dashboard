'use client';

import { useState } from 'react';
import { signIn } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { LogInIcon, Loader2Icon, SparklesIcon, TrendingUpIcon, UsersIcon } from 'lucide-react';
import { PulseIcon } from '@/components/chat/pulse-icon';

/**
 * Prompt displayed when user is not authenticated on the chat page
 * Similar to the achievements sign-in prompt but tailored for Pulse chat
 */
export function ChatSignInPrompt() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn.social({
        provider: 'google',
        callbackURL: '/chat',
      });
    } catch (error) {
      console.error('Sign in error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-muted-foreground/30 rounded-lg bg-muted/30">
      <div className="rounded-full bg-background p-6 mb-6 border shadow-sm">
        <PulseIcon className="size-12 text-primary" animated />
      </div>
      
      <h2 className="text-2xl font-semibold mb-3">Unlock Pulse Chat</h2>
      
      <p className="text-muted-foreground max-w-md mb-6">
        Sign in with your @shiwaforce.com email to chat with Pulse AI and get instant insights 
        about your team&apos;s productivity, achievements, and metrics.
      </p>

      {/* Features list */}
      <div className="grid gap-3 max-w-md mb-8 text-left">
        <div className="flex items-center gap-3 text-sm">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <TrendingUpIcon className="size-4 text-primary" />
          </div>
          <span className="text-muted-foreground">Ask about team productivity metrics</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <UsersIcon className="size-4 text-primary" />
          </div>
          <span className="text-muted-foreground">Compare user statistics and leaderboards</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <SparklesIcon className="size-4 text-primary" />
          </div>
          <span className="text-muted-foreground">Explore team and personal achievements</span>
        </div>
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
