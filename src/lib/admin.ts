import { getSession } from '@/lib/auth-server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { eq } from 'drizzle-orm';
import { createDb } from '@/db';
import * as schema from '@/db/schema';
import { isAdminEmail } from '@/lib/admin-emails';

export { ADMIN_EMAIL, ADMIN_EMAILS, isAdminEmail } from '@/lib/admin-emails';

/**
 * Returns true if the current session is a hard-coded admin email or has role 'admin' (from DB).
 * Use for admin page and admin-only server actions.
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  if (!session?.user?.id) return false;
  if (isAdminEmail(session.user.email)) return true;
  try {
    const { env } = await getCloudflareContext();
    const db = createDb(env.DB);
    const rows = await db
      .select({ role: schema.user.role })
      .from(schema.user)
      .where(eq(schema.user.id, session.user.id))
      .limit(1);
    return rows[0]?.role === 'admin';
  } catch {
    return false;
  }
}
