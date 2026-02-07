import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import { isAdmin } from '@/lib/admin';
import { getAdminUsers, getTeams } from '@/lib/actions';
import { AdminUserTeamSelect } from '@/components/admin-user-team-select';
import { AdminTeamsSection } from '@/components/admin-teams-section';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect('/');

  if (!(await isAdmin())) redirect('/');

  const [users, teams] = await Promise.all([getAdminUsers(), getTeams()]);
  if (users === null) redirect('/');

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <h1 className="text-2xl font-bold">Admin</h1>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="w-[180px]">Assign team</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id ?? user.email}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.teamName ?? '—'}</TableCell>
                  <TableCell>
                    <AdminUserTeamSelect
                      userId={user.id}
                      email={user.email}
                      currentTeamId={user.teamId}
                      teams={teams}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <AdminTeamsSection teams={teams} />
        </CardContent>
      </Card>
    </div>
  );
}
