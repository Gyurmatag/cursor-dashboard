'use client';

import { useTransition } from 'react';
import { Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { sendSeatChurnReminders } from '@/lib/email-actions';
import type { SeatChurnVariant } from '@/emails/seat-churn-reminder';

interface SendReminderButtonProps {
  email: string;
  variant: SeatChurnVariant;
}

export function SendReminderButton({ email, variant }: SendReminderButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleSend = () => {
    startTransition(async () => {
      try {
        const result = await sendSeatChurnReminders({ emails: [email], variant });
        if (result.sent === 1) {
          toast.success(`Reminder sent to ${email}`);
        } else {
          const error = result.failed[0]?.error ?? 'Failed to send';
          toast.error(`Could not send to ${email}: ${error}`);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to send reminder');
      }
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSend}
      disabled={isPending}
      className="gap-1.5"
    >
      {isPending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Mail className="size-3.5" />
      )}
      Send reminder
    </Button>
  );
}
