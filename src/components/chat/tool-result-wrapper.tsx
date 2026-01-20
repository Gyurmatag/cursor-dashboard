import { memo } from 'react';
import { SparklesIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolResultWrapperProps {
  toolName: string;
  children: React.ReactNode;
  className?: string;
}

export const ToolResultWrapper = memo(function ToolResultWrapper({ 
  toolName, 
  children, 
  className 
}: ToolResultWrapperProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <SparklesIcon className="w-4 h-4" />
        <span>Generated {toolName} results</span>
      </div>
      {children}
    </div>
  );
});
