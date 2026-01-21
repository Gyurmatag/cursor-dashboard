'use client';

import { usePrivacy } from '@/components/privacy-provider';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

/**
 * Toggle button for privacy mode (blur names)
 * Displays an eye icon and stores preference in localStorage
 */
export function PrivacyToggle() {
  const { isBlurred, toggleBlur } = usePrivacy();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleBlur}
            aria-label={isBlurred ? 'Show names' : 'Hide names'}
            className="h-10 w-10"
          >
            {isBlurred ? (
              <EyeOffIcon className="size-5" />
            ) : (
              <EyeIcon className="size-5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isBlurred ? 'Show names' : 'Hide names for privacy'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
