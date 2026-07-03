'use server';

import { render } from '@react-email/render';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getSession } from '@/lib/auth-server';
import { isAdmin } from '@/lib/admin';
import { getInactiveCoworkersSummary } from '@/lib/cursor-api';
import { sendSeatChurnEmailViaBinding } from '@/lib/send-seat-churn-email';
import {
  SeatChurnReminderEmail,
  type SeatChurnVariant,
} from '@/emails/seat-churn-reminder';
import type { InactiveCoworkerRow, LowUsageCoworkerRow } from '@/types/cursor';

export type SendSeatChurnRemindersInput = {
  emails: string[];
  variant: SeatChurnVariant;
};

export type SendSeatChurnRemindersResult = {
  sent: number;
  failed: { email: string; error: string }[];
};

type RecipientRow = InactiveCoworkerRow | LowUsageCoworkerRow;

function getFirstName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'there';
  return trimmed.split(/\s+/)[0] ?? 'there';
}

function getDashboardUrl(): string {
  return (process.env.BETTER_AUTH_URL || 'http://localhost:3000').replace(/\/$/, '');
}

function getSubject(variant: SeatChurnVariant, firstName: string): string {
  if (variant === 'inactive') {
    return `${firstName}, your Cursor seat is waiting for you`;
  }
  return `${firstName}, a friendly nudge to use Cursor more`;
}

function buildRecipientMap(
  variant: SeatChurnVariant,
  summary: Awaited<ReturnType<typeof getInactiveCoworkersSummary>>
): Map<string, RecipientRow> {
  const rows = variant === 'inactive' ? summary.inactive : summary.lowUsage;
  return new Map(rows.map((row) => [row.email.toLowerCase(), row]));
}

export async function sendSeatChurnReminders(
  input: SendSeatChurnRemindersInput
): Promise<SendSeatChurnRemindersResult> {
  if (!(await isAdmin())) {
    throw new Error('Unauthorized');
  }

  const session = await getSession();
  const adminEmail = session?.user?.email;
  if (!adminEmail) {
    throw new Error('Admin session required');
  }

  const uniqueEmails = [...new Set(input.emails.map((e) => e.trim().toLowerCase()).filter(Boolean))];
  if (uniqueEmails.length === 0) {
    return { sent: 0, failed: [] };
  }

  const summary = await getInactiveCoworkersSummary();
  const recipientMap = buildRecipientMap(input.variant, summary);
  const dashboardUrl = getDashboardUrl();
  const { env } = await getCloudflareContext();

  let sent = 0;
  const failed: { email: string; error: string }[] = [];

  for (const email of uniqueEmails) {
    const row = recipientMap.get(email);
    if (!row) {
      failed.push({ email, error: 'Not in current list' });
      continue;
    }

    const firstName = getFirstName(row.name);
    const emailProps = {
      firstName,
      variant: input.variant,
      periodDays: summary.periodDays,
      activeDaysInPeriod: row.activeDaysInPeriod,
      lastActiveDay: row.lastActiveDay,
      dashboardUrl,
    };

    try {
      const html = await render(SeatChurnReminderEmail(emailProps));
      const text = await render(SeatChurnReminderEmail(emailProps), { plainText: true });
      const subject = getSubject(input.variant, firstName);

      await sendSeatChurnEmailViaBinding(env, row.email, adminEmail, subject, html, text);
      sent += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send';
      failed.push({ email: row.email, error: message });
    }
  }

  return { sent, failed };
}

const TEST_RECIPIENT = 'gyorgy.varga@shiwaforce.com';

export async function sendSeatChurnTestReminder(): Promise<void> {
  if (!(await isAdmin())) {
    throw new Error('Unauthorized');
  }

  const session = await getSession();
  const adminEmail = session?.user?.email;
  if (!adminEmail) {
    throw new Error('Admin session required');
  }

  const summary = await getInactiveCoworkersSummary();
  const dashboardUrl = getDashboardUrl();
  const { env } = await getCloudflareContext();

  const emailProps = {
    firstName: 'György',
    variant: 'inactive' as const,
    periodDays: summary.periodDays,
    activeDaysInPeriod: 0,
    lastActiveDay: null,
    dashboardUrl,
  };

  const html = await render(SeatChurnReminderEmail(emailProps));
  const text = await render(SeatChurnReminderEmail(emailProps), { plainText: true });
  const subject = `[Test] ${getSubject('inactive', emailProps.firstName)}`;

  await sendSeatChurnEmailViaBinding(
    env,
    TEST_RECIPIENT,
    adminEmail,
    subject,
    html,
    text
  );
}
