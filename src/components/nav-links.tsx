'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboardIcon, TableIcon, TrophyIcon, ActivityIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Hoist static navigation items outside component
const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboardIcon },
  { href: '/leaderboard', label: 'Leaderboard', icon: TableIcon },
  { href: '/achievements', label: 'Achievements', icon: TrophyIcon },
  { href: '/chat', label: 'Pulse', icon: ActivityIcon },
] as const;

interface NavLinksProps {
  variant?: 'desktop' | 'mobile';
  onNavigate?: () => void;
}

/**
 * Client component for navigation links
 * Uses usePathname() to determine active state
 * Supports both desktop and mobile variants
 * Memoized to prevent unnecessary re-renders
 */
export const NavLinks = React.memo(function NavLinks({ variant = 'desktop', onNavigate }: NavLinksProps) {
  const pathname = usePathname();

  if (variant === 'mobile') {
    return (
      <nav className="flex flex-col space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Button
              key={item.href}
              variant={isActive ? 'default' : 'ghost'}
              className="w-full justify-start gap-3 h-12 text-base"
              asChild
            >
              <Link
                href={item.href}
                prefetch={true}
                onClick={onNavigate}
              >
                <Icon className="size-5" />
                <span>{item.label}</span>
              </Link>
            </Button>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="flex items-center space-x-8 text-sm font-medium">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            className={cn(
              'flex items-center gap-2 transition-colors hover:text-foreground/80',
              isActive ? 'text-foreground' : 'text-foreground/60'
            )}
          >
            <Icon className="size-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
});
