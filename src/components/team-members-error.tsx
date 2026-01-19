'use client';

export function TeamMembersError({ error }: { error: Error }) {
  return (
    <div className="flex items-center justify-center p-8 rounded-md border border-destructive/50">
      <div className="text-center space-y-2">
        <p className="text-destructive font-medium">Error loading team members</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    </div>
  );
}
