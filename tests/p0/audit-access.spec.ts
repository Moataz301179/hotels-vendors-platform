import {beforeEach,describe,expect,it,vi} from 'vitest';
const m=vi.hoisted(()=>({actor:vi.fn(),entries:vi.fn(),cursor:vi.fn(),verify:vi.fn()}));
vi.mock('@/lib/v2-auth',()=>({getActor:m.actor}));vi.mock('@/lib/prisma',()=>({prisma:{auditLog:{findMany:m.entries,findFirst:m.cursor}}}));vi.mock('@/lib/audit/tamper-proof',()=>({verifyTenantAuditRecords:m.verify}));
import {GET} from '@/app/api/v2/audit/route';
const request=(query='')=>new Request('https://hotelsvendors.com/api/v2/audit'+query);
describe('organization audit access',()=>{
 beforeEach(()=>{vi.resetAllMocks();m.actor.mockResolvedValue({tenantId:'own',platformRole:'ADMIN'});m.entries.mockResolvedValue([]);m.verify.mockResolvedValue({valid:true,totalEntries:0})});
 it('requires a signed-in administrator',async()=>{m.actor.mockResolvedValue(null);expect((await GET(request())).status).toBe(401);m.actor.mockResolvedValue({tenantId:'own',platformRole:'HOTEL'});expect((await GET(request())).status).toBe(403);expect(m.entries).not.toHaveBeenCalled()});
 it('never accepts tenant scope from the browser',async()=>{expect((await GET(request('?tenantId=victim&q=order'))).status).toBe(200);expect(m.entries.mock.calls[0][0].where).toMatchObject({tenantId:'own'});expect(m.verify).not.toHaveBeenCalled()});
 it('rejects another tenant cursor before querying records',async()=>{m.cursor.mockResolvedValue(null);expect((await GET(request('?cursor=foreign'))).status).toBe(400);expect(m.cursor.mock.calls[0][0].where).toEqual({id:'foreign',tenantId:'own'});expect(m.entries).not.toHaveBeenCalled()});
 it('verifies only the authenticated organization and disables shared caching',async()=>{const r=await GET(request('?verify=true'));expect(m.verify).toHaveBeenCalledWith('own');expect(r.headers.get('Cache-Control')).toBe('private, no-store')});
 it('bounds pages and exposes a cursor without returning the extra record',async()=>{m.entries.mockResolvedValue(Array.from({length:51},(_,i)=>({id:String(i)})));const r=await (await GET(request())).json();expect(r.entries).toHaveLength(50);expect(r.nextCursor).toBe('49')});
});
