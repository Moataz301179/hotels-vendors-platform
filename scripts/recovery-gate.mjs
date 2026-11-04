import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const manifest = JSON.parse(readFileSync('docs/recovery/pending-tasks.json', 'utf8'));
const allowed = new Set(['pending', 'in_progress', 'blocked', 'verified']);
const allowedReleaseScopes = new Set(['web', 'mobile']);
const allowedReleaseClasses = new Set(['mandatory', 'future', 'external']);
const ids = new Set();
for (const task of manifest.tasks) {
  if (!task.id || ids.has(task.id) || !allowed.has(task.state)) throw Error(`Invalid recovery task: ${task.id}`);
  ids.add(task.id);
  if (task.releaseScope && !allowedReleaseScopes.has(task.releaseScope)) throw Error(`Invalid release scope for recovery task: ${task.id}`);
  if (task.releaseClass && !allowedReleaseClasses.has(task.releaseClass)) throw Error(`Invalid release class for recovery task: ${task.id}`);
  if (task.state === 'verified' && !task.evidence) throw Error(`Missing verification evidence: ${task.id}`);
}
const open = manifest.tasks.filter(task => task.state !== 'verified');
const webPredeployOpen = open.filter(task => task.id !== 'P0-DEPLOY' && (task.releaseClass ?? 'mandatory') === 'mandatory');
const report = {
  timestamp: new Date().toISOString(),
  total: manifest.tasks.length,
  verified: manifest.tasks.length - open.length,
  open: open.map(({id,title,state,releaseScope,releaseClass}) => ({id,title,state,...(releaseScope ? {releaseScope} : {}),releaseClass:releaseClass ?? 'mandatory'})),
  webPredeployOpen: webPredeployOpen.map(({id,title,state}) => ({id,title,state})),
  webPredeployReady: webPredeployOpen.length === 0,
  deploymentReady: open.length === 0
};
mkdirSync('recovery-reports', {recursive:true});
writeFileSync('recovery-reports/latest.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
if (process.argv.includes('--require-predeploy-ready') && webPredeployOpen.length) process.exitCode = 1;
if (process.argv.includes('--require-ready') && open.length) process.exitCode = 1;

