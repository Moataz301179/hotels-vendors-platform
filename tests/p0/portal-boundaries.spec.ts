import {beforeEach,describe,expect,it,vi} from 'vitest';
const m=vi.hoisted(()=>({actor:vi.fn(),requests:vi.fn(),companies:vi.fn(),shipments:vi.fn()}));
vi.mock('@/lib/v2-auth',()=>({getActor:m.actor}));
vi.mock('@/lib/prisma',()=>({prisma:{factoringRequest:{findMany:m.requests},factoringCompany:{findMany:m.companies},shipment:{findMany:m.shipments}}}));
vi.mock('@/lib/audit/tamper-proof',()=>({appendAuditEntry:vi.fn()}));
import {GET as funding} from '@/app/api/v2/funding/route';
import {GET as shipments} from '@/app/api/v2/shipments/route';
import {GET as funders} from '@/app/api/v2/funders/route';
describe('portal data boundaries',()=>{
 beforeEach(()=>{vi.resetAllMocks();m.requests.mockResolvedValue([]);m.companies.mockResolvedValue([]);m.shipments.mockResolvedValue([])});
 it('rejects unauthenticated funding and carrier reads',async()=>{m.actor.mockResolvedValue(null);expect((await funding()).status).toBe(401);expect((await shipments()).status).toBe(401);expect(m.requests).not.toHaveBeenCalled();expect(m.shipments).not.toHaveBeenCalled()});
 it('rejects a carrier reading funding before querying records',async()=>{m.actor.mockResolvedValue({platformRole:'SHIPPING',tenantId:'own'});expect((await funding()).status).toBe(403);expect(m.requests).not.toHaveBeenCalled()});
 it('rejects hotel access to carrier records before querying',async()=>{m.actor.mockResolvedValue({platformRole:'HOTEL',tenantId:'own'});expect((await shipments()).status).toBe(403);expect(m.shipments).not.toHaveBeenCalled()});
 it('scopes supplier funding reads to the stored tenant',async()=>{m.actor.mockResolvedValue({platformRole:'SUPPLIER',tenantId:'own'});expect((await funding()).status).toBe(200);expect(m.requests.mock.calls[0][0].where).toEqual({tenantId:'own',deletedAt:null});expect(m.companies.mock.calls[0][0].where.tenantId).toBe('own')});
 it('scopes even admin carrier reads to the stored tenant',async()=>{m.actor.mockResolvedValue({platformRole:'ADMIN',tenantId:'own'});expect((await shipments()).status).toBe(200);expect(m.shipments.mock.calls[0][0].where.tenantId).toBe('own')});
 it('reports live connection absence without fabricated eligibility',async()=>{m.actor.mockResolvedValue({platformRole:'HOTEL',tenantId:'own'});const r=await funders();expect(await r.json()).toMatchObject({connections:[],dataSharingEnabled:false});expect(r.headers.get('Cache-Control')).toBe('private, no-store')});
});
