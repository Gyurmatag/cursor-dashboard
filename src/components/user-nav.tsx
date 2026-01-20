'use client';

import { useState } from 'react';
import { signIn, signOut } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { LogInIcon, LogOutIcon, UserIcon, Loader2Icon } from 'lucide-react';

interface UserNavProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
  } | null;
}

/**
 * Client component for authentication UI
 * Handles sign in/out interactions and displays user info
 */
export function UserNav({ user }: UserNavProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn.social({
        provider: 'google',
        callbackURL: window.location.href,
      });
    } catch (error) {
      console.error('Sign in error:', error);
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.reload();
          },
        },
      });
    } catch (error) {
      console.error('Sign out error:', error);
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <Button
        variant="outline"
        size="sm"
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
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        {user.image ? (
          <img
            src={user.image}
            alt={user.name}
            className="size-8 rounded-full"
          />
        ) : (
          <div className="size-8 rounded-full bg-muted flex items-center justify-center">
            <UserIcon className="size-4 text-muted-foreground" />
          </div>
        )}
        <div className="hidden sm:block">
          <p className="text-sm font-medium leading-none">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        disabled={isLoading}
        className="gap-2"
      >
        {isLoading ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          <LogOutIcon className="size-4" />
        )}
        <span className="hidden sm:inline">Sign out</span>
      </Button>
    </div>
  );
}
