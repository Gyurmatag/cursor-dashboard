'use client';

import { useState, useTransition } from 'react';
import { Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { sendSeatChurnReminders } from '@/lib/email-actions';
import type { SeatChurnVariant } from '@/emails/seat-churn-reminder';

interface SendAllRemindersButtonProps {
  emails: string[];
  variant: SeatChurnVariant;
}

export function SendAllRemindersButton({ emails, variant }: SendAllRemindersButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (emails.length === 0) {
    return null;
  }

  const handleConfirm = () => {
    startTransition(async () => {
      try {
        const result = await sendSeatChurnReminders({ emails, variant });
        setOpen(false);

        if (result.failed.length === 0) {
          toast.success(`Sent ${result.sent} reminder${result.sent === 1 ? '' : 's'}`);
        } else if (result.sent > 0) {
          toast.warning(
            `Sent ${result.sent}, failed ${result.failed.length}: ${result.failed.map((f) => f.email).join(', ')}`
          );
        } else {
          toast.error(`Failed to send all reminders (${result.failed.length} errors)`);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to send reminders');
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="default" size="sm" className="gap-1.5" disabled={isPending}>
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Mail className="size-3.5" />
          )}
          Send reminders to all ({emails.length})
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Send reminders to {emails.length} people?</AlertDialogTitle>
          <AlertDialogDescription>
            Each person will receive a personalized email from cursor-dashboard@shiwa.io reminding
            them to use Cursor. You will be set as the reply-to address.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
            {isPending ? 'Sending…' : 'Send reminders'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
