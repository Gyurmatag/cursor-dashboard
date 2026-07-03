const FROM_EMAIL = 'cursor-dashboard@shiwa.io';
const FROM_NAME = 'Shiwa Cursor Dashboard';

type EmailSendPayload = {
  to: string;
  from: { email: string; name: string };
  replyTo: string;
  subject: string;
  html: string;
  text: string;
};

/** Cloudflare Email Sending object API (runtime supports this; generated types are legacy). */
type EmailSendingBinding = {
  send(payload: EmailSendPayload): Promise<{ messageId?: string }>;
};

export async function sendSeatChurnEmailViaBinding(
  env: CloudflareEnv,
  to: string,
  replyTo: string,
  subject: string,
  html: string,
  text: string
): Promise<void> {
  const email = env.EMAIL as unknown as EmailSendingBinding;
  await email.send({
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    replyTo,
    subject,
    html,
    text,
  });
}
