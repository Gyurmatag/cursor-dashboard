import { getSession } from '@/lib/auth-server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { eq } from 'drizzle-orm';
import { createDb } from '@/db';
import * as schema from '@/db/schema';

export const ADMIN_EMAIL = 'gyorgy.varga@shiwaforce.com';

/**
 * Returns true if the current session user has role 'admin' (from DB).
 * Use for admin page and admin-only server actions.
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  if (!session?.user?.id) return false;
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
