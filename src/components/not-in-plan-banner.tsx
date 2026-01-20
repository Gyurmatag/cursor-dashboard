import { AlertCircleIcon } from 'lucide-react';

/**
 * Banner displayed when authenticated user is not found in Cursor Business plan data
 * Instructs them to contact admin while allowing access to team stats
 */
export function NotInPlanBanner() {
  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertCircleIcon className="size-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-medium text-amber-900 dark:text-amber-100">
            Not found in Cursor Business plan
          </h3>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
            Your account is not yet part of the company&apos;s Cursor Business plan. 
            Please contact your administrator to be added. In the meantime, you 
            can browse the Team Achievements and other stats.
          </p>
        </div>
      </div>
    </div>
  );
}
