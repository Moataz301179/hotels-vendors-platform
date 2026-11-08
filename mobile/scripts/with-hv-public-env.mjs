import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const command = process.argv[2];
const args = process.argv.slice(3);
if (!command) throw new Error('Usage: node scripts/with-hv-public-env.mjs <command> [...args]');

let publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
if (!publishableKey) {
  const rootEnv = readFileSync(resolve(process.cwd(), '..', '.env.local'), 'utf8');
  const match = rootEnv.match(/^NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=(.+)$/m);
  publishableKey = match?.[1]?.trim().replace(/^['"]|['"]$/g, '');
}
if (!publishableKey?.startsWith('pk_')) {
  throw new Error('A Clerk publishable key is required. Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY for this command.');
}

const result = spawnSync(command, args, {
  env: { ...process.env, EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: publishableKey },
  stdio: 'inherit',
});
process.exit(result.status ?? 1);
