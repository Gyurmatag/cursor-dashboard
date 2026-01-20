import { Suspense } from 'react';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { NavLinks } from '@/components/nav-links';
import { UserNav } from '@/components/user-nav';
import { getSession } from '@/lib/auth-server';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Server component for the navigation header
 * Fetches session and passes minimal user data to client components
 */
export async function NavHeader() {
  const session = await getSession();

  // Only pass the minimal user data needed by UserNav (server-serialization best practice)
  const user = session?.user ? {
    name: session.user.name,
    email: session.user.email,
    image: session.user.image ?? null,
  } : null;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Navigation - Left aligned */}
        <NavLinks />
        
        {/* Right side - User nav and theme switcher */}
        <div className="flex items-center gap-4">
          <Suspense fallback={<Skeleton className="h-8 w-32 rounded" />}>
            <UserNav user={user} />
          </Suspense>
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}
