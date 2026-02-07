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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { setUserTeam, updateUserTeam } from '@/lib/actions';
import type { TeamOption } from '@/lib/actions';
import { PlusIcon } from 'lucide-react';

interface ProfileTeamSelectorProps {
  userId: string;
  currentTeamId: string | null;
  currentTeamName: string | null;
  teams: TeamOption[];
}

export function ProfileTeamSelector({
  userId,
  currentTeamId,
  currentTeamName: _currentTeamName,
  teams,
}: ProfileTeamSelectorProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');

  const handleSelect = async (value: string) => {
    setPending(true);
    try {
      const result =
        value === '__none__' || !value
          ? await updateUserTeam(userId, null)
          : await setUserTeam(userId, value);
      if (!result.ok) throw new Error(result.error);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setPending(false);
    }
  };

  const handleCreateTeam = async () => {
    const name = newTeamName.trim();
    if (!name) return;
    setPending(true);
    try {
      const result = await setUserTeam(userId, name);
      if (!result.ok) throw new Error(result.error);
      setNewTeamName('');
      setAddOpen(false);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setPending(false);
    }
  };

  if (teams.length === 0 && !currentTeamId) return null;

  const selectValue = currentTeamId ?? '__none__';

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-muted-foreground font-normal">Team</Label>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={selectValue}
          onValueChange={handleSelect}
          disabled={pending}
        >
          <SelectTrigger className="min-w-[180px] w-fit">
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
        <Popover open={addOpen} onOpenChange={setAddOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={pending}
            >
              <PlusIcon className="size-4" />
              Add team
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="start">
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium">Create and join a team</p>
              <Input
                placeholder="Team name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateTeam();
                  }
                }}
                disabled={pending}
              />
              <Button
                type="button"
                size="sm"
                onClick={handleCreateTeam}
                disabled={pending || !newTeamName.trim()}
              >
                Create and join
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
