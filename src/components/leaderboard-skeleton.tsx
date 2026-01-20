import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

export function LeaderboardTableSkeleton() {
  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[70px]">Rank</TableHead>
            <TableHead className="min-w-[180px]">User</TableHead>
            <TableHead>Activity Score</TableHead>
            <TableHead className="text-right">Accepted Lines</TableHead>
            <TableHead className="text-right">Chat</TableHead>
            <TableHead className="text-right">Composer</TableHead>
            <TableHead className="text-right">Agent</TableHead>
            <TableHead className="text-right">Tab Accepts</TableHead>
            <TableHead className="text-right">Accept Rate</TableHead>
            <TableHead className="text-right">Active Days</TableHead>
            <TableHead className="min-w-[140px]">Most Used Model</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(10)].map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-6 w-8" />
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-5 w-14 ml-auto" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-5 w-12 ml-auto" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-5 w-12 ml-auto" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-5 w-12 ml-auto" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-5 w-14 ml-auto" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-5 w-12 ml-auto" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-5 w-10 ml-auto" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-20" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
