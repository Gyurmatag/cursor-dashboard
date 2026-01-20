'use client';

import { createAuthClient } from 'better-auth/react';

/**
 * Better Auth client for frontend use
 * Provides hooks and methods for authentication
 */
export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.BETTER_AUTH_URL || 'http://localhost:3000',
});

// Export commonly used methods and hooks
export const { signIn, signOut, useSession } = authClient;
