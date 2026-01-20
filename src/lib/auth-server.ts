import { cache } from 'react';
import { headers } from 'next/headers';
import { createAuth } from './auth';

/**
 * Get the current user session (cached per-request)
 * Uses React.cache() to deduplicate session lookups within a single request
 * Multiple components calling getSession() will only hit the database once
 */
export const getSession = cache(async () => {
  try {
    const auth = await createAuth();
    const headersList = await headers();
    return auth.api.getSession({ headers: headersList });
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
});

/**
 * Type for the session user
 */
export type SessionUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
};

/**
 * Type for the full session
 */
export type AuthSession = {
  user: SessionUser;
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
  };
} | null;
