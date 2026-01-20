import { memo, useState, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';
import type { UserComparisonTableProps } from '@/types/chat';
import { cn } from '@/lib/utils';

type SortKey = 'name' | 'totalActivityScore' | 'acceptedLinesAdded' | 'chatRequests' | 'composerRequests' | 'agentRequests';

export const UserComparisonTable = memo(function UserComparisonTable({ users, metrics }: UserComparisonTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('totalActivityScore');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = useCallback((key: SortKey) => {
    setSortDirection(curr => 
      sortKey === key ? (curr === 'asc' ? 'desc' : 'asc') : 'desc'
    );
    setSortKey(key);
  }, [sortKey]);

  // Memoize sorted users to avoid expensive sort on every render
  const sortedUsers = useMemo(() => 
    [...users].sort((a, b) => {
      if (sortKey === 'name') {
        return sortDirection === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      
      const aVal = Number(a[sortKey] || 0);
      const bVal = Number(b[sortKey] || 0);
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }),
    [users, sortKey, sortDirection]
  );

  if (users.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-center">No users to compare</p>
      </Card>
    );
  }

  // Column configuration
  const columns = [
    { key: 'name' as const, label: 'User', sortable: true },
    { key: 'totalActivityScore' as const, label: 'Activity Score', sortable: true },
    { key: 'acceptedLinesAdded' as const, label: 'Lines Added', sortable: true },
    { key: 'chatRequests' as const, label: 'Chat', sortable: true },
    { key: 'composerRequests' as const, label: 'Composer', sortable: true },
    { key: 'agentRequests' as const, label: 'Agent', sortable: true },
  ].filter(col => metrics.includes(col.key));

  return (
    <Card className="p-6 overflow-x-auto">
      <h3 className="font-semibold text-lg mb-4">User Comparison</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-left text-sm font-medium text-muted-foreground',
                    col.sortable && 'cursor-pointer hover:text-foreground transition-colors select-none'
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-2">
                    <span>{col.label}</span>
                    {col.sortable && sortKey === col.key && (
                      sortDirection === 'asc' ? (
                        <ArrowUpIcon className="w-3 h-3" />
                      ) : (
                        <ArrowDownIcon className="w-3 h-3" />
                      )
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map((user, index) => (
              <tr
                key={user.email}
                className={cn(
                  'border-b transition-colors hover:bg-muted/50',
                  index === 0 && 'bg-primary/5'
                )}
              >
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 text-sm">
                    {col.key === 'name' ? (
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    ) : (
                      <span className="font-mono">
                        {(user[col.key] || 0).toLocaleString()}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
        Comparing {sortedUsers.length} users
      </div>
    </Card>
  );
});
