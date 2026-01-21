'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { signIn, signOut } from '@/lib/auth-client';
import { PrivacyBlur } from '@/components/privacy-blur';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
        <span className="hidden sm:inline">Sign in with Google</span>
        <span className="sm:hidden">Sign in</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-transparent hover:border-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all cursor-pointer bg-muted"
          aria-label="Open user menu"
          type="button"
        >
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name}
              width={40}
              height={40}
              className="h-full w-full object-cover rounded-full"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-primary/10 rounded-full">
              <UserIcon className="h-5 w-5 text-primary" />
            </div>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              <PrivacyBlur>{user.name}</PrivacyBlur>
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              <PrivacyBlur>{user.email}</PrivacyBlur>
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/me" className="cursor-pointer">
            <UserIcon className="mr-2 size-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={isLoading}
          variant="destructive"
          className="cursor-pointer"
        >
          {isLoading ? (
            <Loader2Icon className="mr-2 size-4 animate-spin" />
          ) : (
            <LogOutIcon className="mr-2 size-4" />
          )}
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
