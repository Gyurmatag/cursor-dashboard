'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboardIcon, TableIcon, TrophyIcon } from 'lucide-react';

// Hoist static navigation items outside component
const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboardIcon },
  { href: '/leaderboard', label: 'Leaderboard', icon: TableIcon },
  { href: '/achievements', label: 'Achievements', icon: TrophyIcon },
] as const;

/**
 * Client component for navigation links
 * Uses usePathname() to determine active state
 */
export function NavLinks() {
  const pathname = usePathname();

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
}
