/**
 * Org admin email allowlist — no imports from auth to avoid circular deps
 * (auth.ts uses this on user.create; admin.ts / nav use isAdminEmail).
 */
export const ADMIN_EMAILS = [
  'gyorgy.varga@shiwaforce.com',
  'gabor.madi@shiwaforce.com',
] as const;

const ADMIN_EMAIL_SET = new Set(ADMIN_EMAILS.map((e) => e.toLowerCase()));

/** First entry; kept for backwards compatibility. */
export const ADMIN_EMAIL: (typeof ADMIN_EMAILS)[number] = ADMIN_EMAILS[0];

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAIL_SET.has(email.toLowerCase());
}
