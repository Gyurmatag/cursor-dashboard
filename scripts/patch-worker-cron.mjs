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
  
  // Cloudflare expects scheduled() on the default export object (see .agents/skills/cloudflare/references/cron-triggers)
  // Skip only if it's already the Cloudflare-aligned version (controller, ctx.waitUntil)
  if (/\},\s*\n\s*async scheduled\(controller/.test(workerContent)) {
    console.log('[Patch] scheduled(controller) already on default export, skipping');
    process.exit(0);
  }

  // Per Cloudflare Scheduled Handler API: first param is controller (ScheduledController), use ctx.waitUntil for async work
  const scheduledMethod = `
    async scheduled(controller, env, ctx) {
        console.log('[Cron Trigger] Scheduled event fired:', controller.cron, new Date(controller.scheduledTime));
        const cronSecret = env.CRON_SECRET;
        if (!cronSecret) {
            console.error('[Cron Trigger] CRON_SECRET not configured');
            controller.noRetry();
            return;
        }
        const domain = env.WORKER_DOMAIN || 'cursor-dashboard.cfi-ops.workers.dev';
        const url = \`https://\${domain}/api/cron/sync\`;
        console.log('[Cron Trigger] Calling sync endpoint:', url);
        ctx.waitUntil(
            fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': \`Bearer \${cronSecret}\`,
                    'X-Cron-Trigger': 'cloudflare',
                },
            })
                .then(async (response) => {
                    const result = await response.json();
                    if (response.ok) {
                        console.log('[Cron Trigger] Sync completed successfully:', result);
                    } else {
                        console.error('[Cron Trigger] Sync failed:', response.status, result);
                    }
                })
                .catch((error) => {
                    console.error('[Cron Trigger] Error during scheduled sync:', error);
                })
        );
    }
`;

  // Case 1: Already has old scheduled(event, ...) on default export → replace with Cloudflare-aligned version
  const oldScheduledBlock = /    async scheduled\(event, env, ctx\)\s*\{[\s\S]*?\n    }\s*\n\s*};/;
  if (oldScheduledBlock.test(workerContent)) {
    workerContent = workerContent.replace(
      oldScheduledBlock,
      '\n    ' + scheduledMethod.trimStart() + '\n};'
    );
  } else {
    // Case 2: Fresh build, only fetch → add scheduled at end of default export
    const defaultExportEnd = /\s+\},\s*\n+\};/;
    if (!defaultExportEnd.test(workerContent)) {
      throw new Error('Could not find default export end (  },\\n};) in worker');
    }
    workerContent = workerContent.replace(
      defaultExportEnd,
      `\n    },${scheduledMethod}\n};`
    );
  }

  // Remove any old named "export async function scheduled" block (from previous patch style)
  workerContent = workerContent.replace(
    /\n\n\/\*\*[\s\S]*?export async function scheduled\([^)]*\)[\s\S]*\n\}\s*\n?/,
    '\n'
  );
  
  // Write back to the file
  writeFileSync(workerPath, workerContent, 'utf-8');
  
  console.log('[Patch] Successfully added scheduled() export to worker');
  console.log('[Patch] Worker file:', workerPath);
} catch (error) {
  console.error('[Patch] Failed to patch worker:', error.message);
  process.exit(1);
}
