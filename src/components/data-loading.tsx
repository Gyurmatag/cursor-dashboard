import { LoaderIcon } from 'lucide-react';

interface DataLoadingProps {
  message?: string;
}

export function DataLoading({ message = 'Loading data...' }: DataLoadingProps) {
  return (
    <div className="flex items-center justify-center p-12 rounded-md border">
      <div className="flex flex-col items-center gap-3">
        <LoaderIcon className="size-6 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
