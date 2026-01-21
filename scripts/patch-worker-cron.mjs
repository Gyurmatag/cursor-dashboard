#!/usr/bin/env node
/**
 * Post-build script to add scheduled() export to OpenNext-generated worker
 * 
 * This script patches the .open-next/worker.js file to add cron trigger support
 * Run this after `opennextjs-cloudflare build`
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const workerPath = join(projectRoot, '.open-next', 'worker.js');

console.log('[Patch] Adding scheduled() export to worker...');

try {
  // Read the generated worker file
  let workerContent = readFileSync(workerPath, 'utf-8');
  
  // Check if scheduled() already exists
  if (workerContent.includes('export async function scheduled')) {
    console.log('[Patch] scheduled() export already exists, skipping');
    process.exit(0);
  }
  
  // Add the scheduled export at the end of the file
  const scheduledExport = `

/**
 * Scheduled event handler for cron triggers
 * Added by post-build patch script
 * Triggered by: "0 * * * *" (every hour)
 */
export async function scheduled(event, env, ctx) {
  console.log('[Cron Trigger] Scheduled event fired:', event.cron);
  
  try {
    // Get the cron secret from environment
    const cronSecret = env.CRON_SECRET;
    
    if (!cronSecret) {
      console.error('[Cron Trigger] CRON_SECRET not configured');
      return;
    }
    
    // Determine the worker domain
    const domain = env.WORKER_DOMAIN || 'cursor-dashboard.cfi-ops.workers.dev';
    const url = \`https://\${domain}/api/cron/sync\`;
    
    console.log('[Cron Trigger] Calling sync endpoint:', url);
    
    // Call the sync endpoint with authorization
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': \`Bearer \${cronSecret}\`,
        'X-Cron-Trigger': 'cloudflare',
      },
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('[Cron Trigger] Sync completed successfully:', result);
    } else {
      console.error('[Cron Trigger] Sync failed:', response.status, result);
    }
  } catch (error) {
    console.error('[Cron Trigger] Error during scheduled sync:', error);
    // Don't throw - let the cron continue
  }
}
`;
  
  // Append the scheduled export
  workerContent += scheduledExport;
  
  // Write back to the file
  writeFileSync(workerPath, workerContent, 'utf-8');
  
  console.log('[Patch] Successfully added scheduled() export to worker');
  console.log('[Patch] Worker file:', workerPath);
} catch (error) {
  console.error('[Patch] Failed to patch worker:', error.message);
  process.exit(1);
}
