'use client';

import { useTransition } from 'react';
import { FlaskConical, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { sendSeatChurnTestReminder } from '@/lib/email-actions';

export function SendTestReminderButton() {
  const [isPending, startTransition] = useTransition();

  const handleSend = () => {
    startTransition(async () => {
      try {
        await sendSeatChurnTestReminder();
        toast.success('Test reminder sent to gyorgy.varga@shiwaforce.com');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to send test reminder');
      }
    });
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleSend}
      disabled={isPending}
      className="gap-1.5"
    >
      {isPending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <FlaskConical className="size-3.5" />
      )}
      Test send to gyorgy.varga@shiwaforce.com
    </Button>
  );
}
