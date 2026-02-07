'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateUserTeamAdmin } from '@/lib/actions';
import type { TeamOption } from '@/lib/actions';

interface AdminUserTeamSelectProps {
  userId: string | null;
  email: string;
  currentTeamId: string | null;
  teams: TeamOption[];
}

export function AdminUserTeamSelect({ userId, email, currentTeamId, teams }: AdminUserTeamSelectProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const value = currentTeamId ?? '__none__';

  const handleChange = async (newValue: string) => {
    const teamId = newValue === '__none__' || !newValue ? null : newValue;
    setPending(true);
    try {
      const result = await updateUserTeamAdmin(userId, userId ? null : email, teamId);
      if (!result.ok) throw new Error(result.error);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setPending(false);
    }
  };

  return (
    <Select value={value} onValueChange={handleChange} disabled={pending}>
      <SelectTrigger className="min-w-[160px] w-fit">
        <SelectValue placeholder="Select team" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">
          <span className="text-muted-foreground">No team</span>
        </SelectItem>
        {teams.map((team) => (
          <SelectItem key={team.id} value={team.id}>
            {team.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
