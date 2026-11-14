import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const command = process.argv[2];
const args = process.argv.slice(3);
if (!command) throw new Error('Usage: node scripts/with-hv-public-env.mjs <command> [...args]');

const visualReview = process.env.EXPO_PUBLIC_HOVIN_VISUAL_REVIEW === '1';

let publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
if (!publishableKey) {
  const rootEnvPath = resolve(process.cwd(), '..', '.env.local');
  if (existsSync(rootEnvPath)) {
    const rootEnv = readFileSync(rootEnvPath, 'utf8');
    const match = rootEnv.match(/^NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=(.+)$/m);
    publishableKey = match?.[1]?.trim().replace(/^['"]|['"]$/g, '');
  }
}

if (!publishableKey?.startsWith('pk_')) {
  if (visualReview) {
    // Watermarked gallery path — Clerk is not required for EXPO_PUBLIC_HOVIN_VISUAL_REVIEW=1.
    publishableKey = undefined;
  } else {
    throw new Error(
      'A Clerk publishable key is required. Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your shell, or NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY in ../.env.local (file may be missing). For the watermarked gallery without Clerk, set EXPO_PUBLIC_HOVIN_VISUAL_REVIEW=1. See docs/hovin-simulator-runbook.md.',
    );
  }
}

const env = { ...process.env };
if (publishableKey) env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY = publishableKey;

const result = spawnSync(command, args, {
  env,
  stdio: 'inherit',
});
process.exit(result.status ?? 1);
