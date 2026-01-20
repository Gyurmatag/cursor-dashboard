'use client';

import { Component, type ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { AlertCircleIcon } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ToolResultErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Tool result error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="p-4 border-destructive/20 bg-destructive/5">
          <div className="flex items-start gap-3">
            <AlertCircleIcon className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-destructive">Failed to render result</p>
              <p className="text-xs text-muted-foreground mt-1">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
            </div>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}
