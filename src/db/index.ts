import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from './schema';
import * as authSchema from './auth-schema';

// Combined schema for drizzle
const combinedSchema = { ...schema, ...authSchema };

export type Database = DrizzleD1Database<typeof combinedSchema>;

/**
 * Creates a Drizzle database client for D1
 * @param d1 - The D1Database binding from Cloudflare
 * @returns A typed Drizzle database instance
 */
export function createDb(d1: D1Database): Database {
  return drizzle(d1, { schema: combinedSchema });
}

// Re-export schema and types for convenience
export * from './schema';
export * from './auth-schema';
