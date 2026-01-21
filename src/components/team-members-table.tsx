import { PrivacyBlur } from '@/components/privacy-blur';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TeamMember {
  name: string;
  email: string;
}

interface TeamMembersTableProps {
  members: TeamMember[];
}

export function TeamMembersTable({ members }: TeamMembersTableProps) {
  // Handle undefined or null members array
  if (!members || members.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 rounded-md border">
        <p className="text-muted-foreground">No team members found</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">
                <PrivacyBlur>{member.name}</PrivacyBlur>
              </TableCell>
              <TableCell>
                <PrivacyBlur>{member.email}</PrivacyBlur>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
