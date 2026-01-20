'use client';

import { useState, useCallback } from 'react';
import { MenuIcon } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { NavLinks } from '@/components/nav-links';

/**
 * Mobile navigation component with hamburger menu
 * Uses Sheet component for slide-out drawer
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);

  // Memoize close handler to prevent unnecessary re-renders in NavLinks
  const handleNavigate = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          aria-label="Open navigation menu"
        >
          <MenuIcon className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px]">
        <SheetHeader className="text-left">
          <SheetTitle className="text-xl font-bold">Navigation</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <NavLinks variant="mobile" onNavigate={handleNavigate} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
