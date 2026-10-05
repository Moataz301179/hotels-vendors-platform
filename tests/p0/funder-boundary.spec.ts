import {describe,expect,it} from 'vitest';
import {authorizeFunderRead,credentialMatches,FunderRegistry,hashSnapshot,issueGrantCredential,SharingGrant} from '@/lib/funders/gateway';
import {rejectNativeFunding,requireLiveFunderConfiguration} from '@/lib/fintech/external-only';
import {assessRisk,generateSmartFixes} from '@/lib/fintech/risk-engine';
import {calculateHotelCreditScore} from '@/lib/fintech/scoring/hotel-score-engine';
import {processFactoringRequest} from '@/lib/workers/fra-factoring.worker';
const grant:SharingGrant={id:'grant',tenantId:'hotel-tenant',connectionId:'institution',clientId:'client',resourceIds:['order'],scopes:['purchases:read'],expiresAt:new Date('2026-10-06'),revokedAt:null};
const read={clientId:'client',connectionId:'institution',tenantId:'hotel-tenant',resourceId:'order',scope:'purchases:read' as const,now:new Date('2026-10-05')};
describe('external-only funder primitives',()=>{
 it('never executes a native lending or payout operation',()=>{expect(()=>rejectNativeFunding()).toThrow('EXTERNAL_FUNDER_REQUIRED');expect(()=>requireLiveFunderConfiguration(false,false)).toThrow('FUNDER_UNAVAILABLE');expect(()=>requireLiveFunderConfiguration(true,true)).toThrow('FUNDER_UNAVAILABLE')});
 it('blocks legacy scoring and payout entry points before any data access',async()=>{await expect(assessRisk('hotel','tenant')).rejects.toThrow('EXTERNAL_FUNDER_REQUIRED');await expect(generateSmartFixes('order','hotel',100,'tenant')).rejects.toThrow('EXTERNAL_FUNDER_REQUIRED');expect(()=>calculateHotelCreditScore({} as never,{} as never,{} as never,{} as never)).toThrow('EXTERNAL_FUNDER_REQUIRED');await expect(processFactoringRequest({} as never)).rejects.toThrow('EXTERNAL_FUNDER_REQUIRED')});
 it('produces distinct UUID references and cryptographic credentials, storing only hashes',()=>{const a=issueGrantCredential(),b=issueGrantCredential();expect(a.id).not.toBe(b.id);expect(a.credential).not.toBe(b.credential);expect(a.credentialHash).not.toContain(a.credential);expect(credentialMatches(a.credential,a.credentialHash)).toBe(true);expect(credentialMatches(b.credential,a.credentialHash)).toBe(false)});
 it('permits the exact authorized read',()=>{expect(()=>authorizeFunderRead(grant,read)).not.toThrow()});
 it.each(['clientId','connectionId','tenantId','resourceId'] as const)('rejects altered %s even with a known UUID',field=>{expect(()=>authorizeFunderRead(grant,{...read,[field]:'foreign'})).toThrow('GRANT_ACCESS_DENIED')});
 it('rejects missing category scope, expiry and revocation',()=>{expect(()=>authorizeFunderRead(grant,{...read,scope:'ledger:read'})).toThrow();expect(()=>authorizeFunderRead(grant,{...read,now:new Date('2026-10-06')})).toThrow();expect(()=>authorizeFunderRead({...grant,revokedAt:new Date()},read)).toThrow()});
 it('binds snapshot integrity to tenant, grant and event contents',()=>{const snapshot={tenantId:'own',grantId:'grant',schemaVersion:1,cutoff:'2026-10-05',events:[{status:'RECEIVED',id:'o'}]};const hash=hashSnapshot(snapshot);expect(hashSnapshot({...snapshot,events:[{id:'o',status:'RECEIVED'}]})).toBe(hash);expect(hashSnapshot({...snapshot,tenantId:'foreign'})).not.toBe(hash);expect(hashSnapshot({...snapshot,grantId:'other'})).not.toBe(hash);expect(hashSnapshot({...snapshot,events:[]})).not.toBe(hash)});
 it('does not register mock or unavailable funders as connected',()=>{const registry=new FunderRegistry();expect(registry.connected()).toEqual([]);expect(()=>registry.get('unknown')).toThrow('FUNDER_UNAVAILABLE')});
});
