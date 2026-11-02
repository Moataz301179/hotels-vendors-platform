#!/usr/bin/env python3
"""Persistent, fail-closed repair controller. No model credits or production writes required."""
import argparse, datetime, fcntl, json, os, pathlib, subprocess, time
ROOT = pathlib.Path(__file__).resolve().parents[2]
STATE = ROOT / '.agent-runs' / 'repair-controller'
TASKS = [
 ('auth', 'P0-CLERK', 'P0-ROLES', 'P0-LIFECYCLE'),
 ('neon', 'P0-NEON', 'P0-DB'),
 ('lifecycle', 'P0-LIFECYCLE', 'P0-INTEGRATIONS', 'P1-CATALOG'),
 ('release', 'P0-CI', 'P0-PR46-50', 'P0-GROK', 'P0-DEPLOY'),
 ('ux-mobile', 'P0-UX', 'P0-REDESIGN', 'P0-ONBOARDING', 'P1-MOBILE'),
 ('operations', 'P1-OPS', 'P1-LEGACY'),
]
COMMANDS = [
 ('typescript', ['npx','tsc','--noEmit','--pretty','false'], []),
 ('regression', ['npx','vitest','run','tests/p0','--reporter=dot'], []),
 ('integration', ['npm','run','test:integration'], ['DATABASE_URL']),
 ('build', ['npm','run','build'], []),
 ('browser-smoke', ['npx','playwright','test','--project=chromium'], []),
 ('authenticated-e2e', ['npx','playwright','test','--project=chromium-authenticated'], ['HV_AUTH_E2E','HV_AUTH_STATE_DIR']),
 ('release-gate', ['node','scripts/recovery-gate.mjs','--require-predeploy-ready'], []),
]
def cmd(args, timeout=900):
 try:
  p=subprocess.run(args,cwd=ROOT, text=True,capture_output=True,timeout=timeout)
  return {'exit':p.returncode,'tail':(p.stdout+'\n'+p.stderr)[-3000:]}
 except (OSError,subprocess.TimeoutExpired) as exc: return {'exit':-1,'tail':str(exc)}
def cycle():
 manifest=json.loads((ROOT/'docs/recovery/pending-tasks.json').read_text())
 known={t['id']:t for t in manifest['tasks']}
 report={'timestamp':datetime.datetime.now(datetime.timezone.utc).isoformat(),'head':cmd(['git','rev-parse','HEAD'],10)['tail'].strip(),'specialists':{},'checks':{},'deploymentReady':False}
 for role,*ids in TASKS:
  report['specialists'][role]={'tasks':ids,'open':[i for i in ids if known[i]['state']!='verified']}
 for name,command,prerequisites in COMMANDS:
  missing=[key for key in prerequisites if not os.getenv(key)]
  report['checks'][name]=({'status':'blocked','missing':missing} if missing else
   (lambda result: {'status':'passed' if result['exit']==0 else 'failed',**result})(cmd(command)))
 report['deploymentReady']=all(t['state']=='verified' for t in manifest['tasks'] if t['id']!='P0-DEPLOY') and all(c['status']=='passed' for c in report['checks'].values())
 (STATE/'latest.json').write_text(json.dumps(report,indent=2)+'\n')
 with (STATE/'history.jsonl').open('a') as f: f.write(json.dumps({'timestamp':report['timestamp'],'head':report['head'],'checks':{k:v['status'] for k,v in report['checks'].items()},'deploymentReady':report['deploymentReady']})+'\n')
 print(json.dumps({'timestamp':report['timestamp'],'checks':{k:v['status'] for k,v in report['checks'].items()},'deploymentReady':report['deploymentReady'] }),flush=True)
 return report

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--once',action='store_true');ap.add_argument('--interval',type=int,default=900);args=ap.parse_args()
 STATE.mkdir(parents=True,exist_ok=True)
 with (STATE/'controller.lock').open('w') as lock:
  try: fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
  except BlockingIOError: print('Controller already running');return
  while True:
   try: cycle()
   except Exception as exc:
    with (STATE/'errors.log').open('a') as f:f.write(f'{datetime.datetime.now(datetime.timezone.utc).isoformat()} {exc!r}\n')
   if args.once:break
   time.sleep(max(60,args.interval))
if __name__=='__main__': main()
