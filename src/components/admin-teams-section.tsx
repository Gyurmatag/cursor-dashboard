'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createTeam } from '@/lib/actions';
import type { TeamOption } from '@/lib/actions';

interface AdminTeamsSectionProps {
  teams: TeamOption[];
}

export function AdminTeamsSection({ teams }: AdminTeamsSectionProps) {
  const router = useRouter();
  const [newTeamName, setNewTeamName] = useState('');
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newTeamName.trim();
    if (!name || pending) return;
    setPending(true);
    try {
      const result = await createTeam(name);
      if ('error' in result) throw new Error(result.error);
      setNewTeamName('');
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Teams</h2>
      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
        {teams.length === 0 ? (
          <li>No teams yet.</li>
        ) : (
          teams.map((t) => (
            <li key={t.id}>
              {t.name}
            </li>
          ))
        )}
      </ul>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="New team name"
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
          className="max-w-xs"
          disabled={pending}
        />
        <Button type="submit" size="sm" disabled={pending || !newTeamName.trim()}>
          Add team
        </Button>
      </form>
    </section>
  );
}
