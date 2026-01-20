import { createAuth } from '@/lib/auth';

/**
 * Catch-all route handler for Better Auth
 * Handles all authentication endpoints including:
 * - /api/auth/signin/google
 * - /api/auth/callback/google
 * - /api/auth/signout
 * - /api/auth/session
 * etc.
 */
async function handler(request: Request) {
  const auth = await createAuth();
  return auth.handler(request);
}

export const GET = handler;
export const POST = handler;
