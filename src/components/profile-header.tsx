'use client';

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { UserIcon } from 'lucide-react';

interface ProfileHeaderProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
}

/**
 * Profile page header component
 * Displays user avatar, name, and email in a prominent card
 */
export function ProfileHeader({ user }: ProfileHeaderProps) {
  return (
    <Card className="bg-gradient-to-br from-primary/5 via-background to-background border-primary/10">
      <div className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Large Avatar */}
          <Avatar size="lg" className="size-24 ring-4 ring-background shadow-xl">
            {user.image ? (
              <AvatarImage src={user.image} alt={user.name} />
            ) : (
              <AvatarFallback className="text-2xl">
                <UserIcon className="size-12" />
              </AvatarFallback>
            )}
          </Avatar>

          {/* User Info */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{user.name}</h1>
            <p className="text-muted-foreground text-lg">{user.email}</p>
            <div className="pt-2">
              <p className="text-sm text-muted-foreground">
                Cursor Dashboard Member
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
