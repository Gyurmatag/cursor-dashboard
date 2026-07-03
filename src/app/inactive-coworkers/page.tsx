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
import { SendReminderButton } from '@/components/seat-churn/send-reminder-button';
import { SendAllRemindersButton } from '@/components/seat-churn/send-all-reminders-button';
import { SendTestReminderButton } from '@/components/seat-churn/send-test-reminder-button';

export const dynamic = 'force-dynamic';

export default async function InactiveCoworkersPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect('/');

  if (!(await isAdmin())) redirect('/');

  const summary = await getInactiveCoworkersSummary();

  const periodLabel = `${format(summary.periodStartMs, 'PP')} – ${format(summary.periodEndMs, 'PP')}`;
  const inactiveEmails = summary.inactive.map((row) => row.email);
  const lowUsageEmails = summary.lowUsage.map((row) => row.email);

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Seat churn review</h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-3xl">
            Two lists from Cursor <strong>daily usage</strong> over the last {summary.periodDays} days ({periodLabel}):
            people with <strong>no</strong> active usage days, and people with <strong>low</strong> usage (between 1 and{' '}
            {summary.lowUsageMaxActiveDays} active days). Use these to notify before canceling seats.{' '}
            <strong>Unpaid Admin</strong> seats (role <code className="text-xs">free-owner</code>) are omitted.
          </p>
        </div>
        <SendTestReminderButton />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1.5">
            <CardTitle>Inactive (zero active days)</CardTitle>
            <CardDescription>
              {summary.totalTeamMembersConsidered} billable seats considered ·{' '}
              <span className="font-medium text-foreground">{summary.inactive.length}</span> with no active usage in period
            </CardDescription>
          </div>
          <SendAllRemindersButton emails={inactiveEmails} variant="inactive" />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Active days</TableHead>
                <TableHead>Last active day</TableHead>
                <TableHead>Usage data</TableHead>
                <TableHead>Reminder</TableHead>
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
                      {row.hadUsageRowsInPeriod ? (
                        <Badge variant="secondary">Rows (all idle)</Badge>
                      ) : (
                        <Badge variant="outline">No rows</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <SendReminderButton email={row.email} variant="inactive" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1.5">
            <CardTitle>Low usage ({summary.lowUsageMaxActiveDays} active days or fewer)</CardTitle>
            <CardDescription>
              Has some activity but only{' '}
              <strong>
                1–{summary.lowUsageMaxActiveDays}
              </strong>{' '}
              days with <code className="text-xs">isActive</code> in the period — candidates to review before canceling.
              Activity score uses the same weights as the leaderboard (sum over the window).
            </CardDescription>
          </div>
          <SendAllRemindersButton emails={lowUsageEmails} variant="low-usage" />
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Active days</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="text-right">Acc. lines</TableHead>
                <TableHead className="text-right">AI reqs</TableHead>
                <TableHead className="text-right">Tab accepts</TableHead>
                <TableHead>Last active day</TableHead>
                <TableHead>Reminder</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.lowUsage.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                    No one had between 1 and {summary.lowUsageMaxActiveDays} active days in this period.
                  </TableCell>
                </TableRow>
              ) : (
                summary.lowUsage.map((row) => {
                  const aiReqs = row.chatRequests + row.composerRequests + row.agentRequests;
                  return (
                    <TableRow key={row.email}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell className="text-right">{row.activeDaysInPeriod}</TableCell>
                      <TableCell className="text-right">{Math.round(row.activityScore).toLocaleString()}</TableCell>
                      <TableCell className="text-right">{row.acceptedLinesAdded.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{aiReqs.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{row.totalTabsAccepted.toLocaleString()}</TableCell>
                      <TableCell>{row.lastActiveDay ?? '—'}</TableCell>
                      <TableCell>
                        <SendReminderButton email={row.email} variant="low-usage" />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
