import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { UsersIcon } from 'lucide-react';

/**
 * Shown on the dashboard when the logged-in user has no team assigned.
 * Prompts them to choose or add a team with a link to their profile.
 */
export function NoTeamAlert() {
  return (
    <Alert className="rounded-xl border-primary/30 bg-primary/5 flex flex-col gap-2 [&>svg]:relative [&>svg]:left-0 [&>svg]:translate-y-0">
      <div className="flex items-start gap-3">
        <UsersIcon className="size-5 shrink-0 mt-0.5" />
        <div className="space-y-2 flex-1 min-w-0">
          <AlertTitle className="!mb-0">Choose a team</AlertTitle>
          <AlertDescription className="!mt-0">
            You&apos;re not part of a team yet. Choose or add a team on your profile to get the most
            out of the dashboard and leaderboard.
          </AlertDescription>
          <div className="pt-2">
            <Button asChild variant="default" size="sm">
              <Link href="/me" prefetch={true}>
                Go to Profile
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Alert>
  );
}
