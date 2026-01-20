/**
 * Cloudflare KV-based sync metadata manager
 * 
 * This module handles all sync metadata operations using Cloudflare KV
 * for fast, globally distributed access and distributed locking.
 */

// ============================================================================
// Types
// ============================================================================

export interface SyncMetadata {
  lastSyncAt: string | null; // ISO 8601 timestamp
  lastSyncDate: string | null; // YYYY-MM-DD format
  syncStatus: 'idle' | 'running' | 'error';
  errorMessage: string | null;
  lastSyncResult?: {
    processed: number;
    newAchievements: {
      individual: string[];
      team: string[];
    };
  };
}

export interface SyncLock {
  acquiredAt: number; // Unix timestamp
  expiresAt: number; // Unix timestamp
}

// ============================================================================
// Constants
// ============================================================================

const KV_KEY_METADATA = 'sync:metadata';
const KV_KEY_LOCK = 'sync:lock';
const LOCK_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const MIN_SYNC_INTERVAL_MS = 50 * 60 * 1000; // 50 minutes

// ============================================================================
// Sync Metadata Operations
// ============================================================================

/**
 * Get sync metadata from KV
 */
export async function getSyncMetadata(
  kv: KVNamespace
): Promise<SyncMetadata | null> {
  try {
    const data = await kv.get<SyncMetadata>(KV_KEY_METADATA, 'json');
    return data;
  } catch (error) {
    console.error('Failed to get sync metadata from KV:', error);
    return null;
  }
}

/**
 * Update sync metadata in KV
 */
export async function updateSyncMetadata(
  kv: KVNamespace,
  metadata: Partial<SyncMetadata>
): Promise<void> {
  try {
    // Get existing metadata
    const existing = await getSyncMetadata(kv);
    
    // Merge with new data
    const updated: SyncMetadata = {
      lastSyncAt: metadata.lastSyncAt ?? existing?.lastSyncAt ?? null,
      lastSyncDate: metadata.lastSyncDate ?? existing?.lastSyncDate ?? null,
      syncStatus: metadata.syncStatus ?? existing?.syncStatus ?? 'idle',
      errorMessage: metadata.errorMessage ?? existing?.errorMessage ?? null,
      lastSyncResult: metadata.lastSyncResult ?? existing?.lastSyncResult,
    };

    // Write to KV
    await kv.put(KV_KEY_METADATA, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to update sync metadata in KV:', error);
    throw error;
  }
}

/**
 * Initialize sync metadata with default values
 */
export async function initializeSyncMetadata(kv: KVNamespace): Promise<void> {
  const existing = await getSyncMetadata(kv);
  if (!existing) {
    await updateSyncMetadata(kv, {
      lastSyncAt: null,
      lastSyncDate: null,
      syncStatus: 'idle',
      errorMessage: null,
    });
  }
}

// ============================================================================
// Distributed Lock Operations
// ============================================================================

/**
 * Try to acquire a distributed sync lock
 * Returns true if lock was acquired, false if already held by another process
 */
export async function acquireSyncLock(kv: KVNamespace): Promise<boolean> {
  try {
    // Check if lock already exists
    const existingLock = await kv.get<SyncLock>(KV_KEY_LOCK, 'json');
    
    if (existingLock) {
      // Check if lock has expired
      const now = Date.now();
      if (existingLock.expiresAt > now) {
        // Lock is still valid, cannot acquire
        return false;
      }
      // Lock has expired, we can acquire it
    }

    // Acquire the lock
    const now = Date.now();
    const lock: SyncLock = {
      acquiredAt: now,
      expiresAt: now + LOCK_DURATION_MS,
    };

    // Write lock to KV with expiration
    await kv.put(KV_KEY_LOCK, JSON.stringify(lock), {
      expirationTtl: Math.ceil(LOCK_DURATION_MS / 1000),
    });

    return true;
  } catch (error) {
    console.error('Failed to acquire sync lock:', error);
    return false;
  }
}

/**
 * Release the sync lock
 */
export async function releaseSyncLock(kv: KVNamespace): Promise<void> {
  try {
    await kv.delete(KV_KEY_LOCK);
  } catch (error) {
    console.error('Failed to release sync lock:', error);
    // Don't throw - lock will expire anyway
  }
}

/**
 * Check if a sync lock is currently held
 */
export async function isSyncLocked(kv: KVNamespace): Promise<boolean> {
  try {
    const lock = await kv.get<SyncLock>(KV_KEY_LOCK, 'json');
    if (!lock) return false;

    const now = Date.now();
    return lock.expiresAt > now;
  } catch (error) {
    console.error('Failed to check sync lock:', error);
    return false;
  }
}

// ============================================================================
// Sync Status Checks
// ============================================================================

/**
 * Check if enough time has passed since last sync
 */
export async function canRunSync(kv: KVNamespace): Promise<{
  canRun: boolean;
  reason?: string;
}> {
  try {
    // Check if lock is held
    const locked = await isSyncLocked(kv);
    if (locked) {
      return {
        canRun: false,
        reason: 'A sync is already in progress',
      };
    }

    // Check if enough time has passed since last sync
    const metadata = await getSyncMetadata(kv);
    if (metadata?.lastSyncAt) {
      const lastSyncTime = new Date(metadata.lastSyncAt).getTime();
      const now = Date.now();
      const timeSinceLastSync = now - lastSyncTime;

      if (timeSinceLastSync < MIN_SYNC_INTERVAL_MS) {
        const waitTimeSeconds = Math.ceil(
          (MIN_SYNC_INTERVAL_MS - timeSinceLastSync) / 1000
        );
        return {
          canRun: false,
          reason: `Rate limited. Try again in ${waitTimeSeconds}s`,
        };
      }
    }

    return { canRun: true };
  } catch (error) {
    console.error('Failed to check if sync can run:', error);
    return {
      canRun: false,
      reason: 'Failed to check sync status',
    };
  }
}

/**
 * Get current sync status
 */
export async function getSyncStatus(kv: KVNamespace): Promise<{
  status: 'idle' | 'running' | 'error';
  lastSyncAt: string | null;
  lastSyncDate: string | null;
  errorMessage: string | null;
  isLocked: boolean;
}> {
  const metadata = await getSyncMetadata(kv);
  const locked = await isSyncLocked(kv);

  return {
    status: metadata?.syncStatus ?? 'idle',
    lastSyncAt: metadata?.lastSyncAt ?? null,
    lastSyncDate: metadata?.lastSyncDate ?? null,
    errorMessage: metadata?.errorMessage ?? null,
    isLocked: locked,
  };
}
