'use client';

import { AlertCircleIcon } from 'lucide-react';

interface DataErrorProps {
  error: Error;
  title?: string;
}

export function DataError({ error, title = 'Error loading data' }: DataErrorProps) {
  return (
    <div className="flex items-center justify-center p-8 rounded-md border border-destructive/50 bg-destructive/5">
      <div className="flex flex-col items-center gap-3 text-center max-w-md">
        <AlertCircleIcon className="size-8 text-destructive" />
        <div className="space-y-2">
          <p className="text-destructive font-medium text-lg">{title}</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    </div>
  );
}
