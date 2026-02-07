import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/d1';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import * as authSchema from '@/db/auth-schema';

// Allowed email domain for authentication
const ALLOWED_DOMAIN = 'shiwaforce.com';
// Must match ADMIN_EMAIL in @/lib/admin (used only in user.create hook to set role)
const ADMIN_EMAIL = 'gyorgy.varga@shiwaforce.com';

/**
 * Creates a Better Auth instance with the D1 database
 * This function must be called at request time to access the D1 binding
 */
export async function createAuth() {
  const { env } = await getCloudflareContext();
  const db = drizzle(env.DB, { schema: authSchema });

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema: {
        user: authSchema.user,
        session: authSchema.session,
        account: authSchema.account,
        verification: authSchema.verification,
      },
    }),
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
    secret: process.env.BETTER_AUTH_SECRET,
    socialProviders: {
      google: {
        clientId: '855755626983-6vs6in7l1asf3uskgmed6e1untqmdrrg.apps.googleusercontent.com',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            // Validate email domain before creating user
            const email = user.email?.toLowerCase();
            if (!email) {
              throw new Error('Email is required');
            }

            const domain = email.split('@')[1];
            if (domain !== ALLOWED_DOMAIN) {
              throw new Error(`Only @${ALLOWED_DOMAIN} email addresses are allowed to sign in`);
            }

            const role = email === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user';
            // Do not set teamId from user_team_override on first sign-in; leave team unchanged (user chooses on profile or admin assigns later).
            return { data: { ...user, role } };
          },
        },
      },
    },
  });
}
