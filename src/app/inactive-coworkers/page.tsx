import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { getSession } from '@/lib/auth-server';
import { isAdmin } from '@/lib/admin';
import { getInactiveCoworkersSummary } from '@/lib/cursor-api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function InactiveCoworkersPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect('/');

  if (!(await isAdmin())) redirect('/');

  const summary = await getInactiveCoworkersSummary();

  const periodLabel = `${format(summary.periodStartMs, 'PP')} – ${format(summary.periodEndMs, 'PP')}`;

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inactive coworkers</h1>
        <p className="text-muted-foreground text-sm mt-1 max-w-3xl">
          Team members with <strong>no Cursor usage activity</strong> in the last {summary.periodDays} days (from daily
          usage data). Use this list to notify people before canceling idle seats. Last login comes from audit logs
          (last {summary.loginLookbackDays} days).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>
            Period: {periodLabel} · {summary.totalTeamMembersConsidered} active seats considered ·{' '}
            <span className="font-medium text-foreground">{summary.inactive.length}</span> with zero active usage days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Active days (period)</TableHead>
                <TableHead>Last active day</TableHead>
                <TableHead>Last login (audit)</TableHead>
                <TableHead>Usage data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.inactive.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    Everyone had at least one active usage day in the last {summary.periodDays} days.
                  </TableCell>
                </TableRow>
              ) : (
                summary.inactive.map((row) => (
                  <TableRow key={row.email}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell className="text-right">{row.activeDaysInPeriod}</TableCell>
                    <TableCell>{row.lastActiveDay ?? '—'}</TableCell>
                    <TableCell>
                      {row.lastLoginAt
                        ? format(new Date(row.lastLoginAt), 'PPp')
                        : `No login in last ${summary.loginLookbackDays}d`}
                    </TableCell>
                    <TableCell>
                      {row.hadUsageRowsInPeriod ? (
                        <Badge variant="secondary">Rows (all idle)</Badge>
                      ) : (
                        <Badge variant="outline">No rows</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
