'use client';

import { useSearchParams } from 'next/navigation';
import { AlertCircleIcon, XIcon } from 'lucide-react';
import { useState, useEffect } from 'react';

/**
 * Displays authentication errors from URL query parameters
 * Shows when domain validation fails (non-shiwaforce.com email)
 */
export function AuthError() {
  const searchParams = useSearchParams();
  const [isVisible, setIsVisible] = useState(false);
  const error = searchParams.get('error');

  useEffect(() => {
    if (error) {
      setIsVisible(true);
    }
  }, [error]);

  if (!error || !isVisible) {
    return null;
  }

  // Map error codes to user-friendly messages
  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'domain_not_allowed':
      case 'user_create_failed':
        return 'Only @shiwaforce.com email addresses are allowed to sign in. Please use your company email.';
      case 'access_denied':
        return 'Access was denied. Please try again with a @shiwaforce.com email address.';
      case 'oauth_error':
        return 'An error occurred during sign in. Please try again.';
      default:
        if (errorCode.includes('shiwaforce')) {
          return 'Only @shiwaforce.com email addresses are allowed to sign in.';
        }
        return `Authentication error: ${errorCode}`;
    }
  };

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
      <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <AlertCircleIcon className="size-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-medium text-red-900 dark:text-red-100">
              Sign in failed
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              {getErrorMessage(error)}
            </p>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200"
          >
            <XIcon className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
