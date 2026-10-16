import { beforeEach, describe, expect, it, vi } from 'vitest';

const m=vi.hoisted(()=>({actor:vi.fn(),tenants:vi.fn(),cursor:vi.fn(),entries:vi.fn(),verify:vi.fn()}));
vi.mock('@/lib/v2-auth',()=>({getActor:m.actor}));
vi.mock('@/lib/admin/managed-hotel-tenants',()=>({managedHotelTenants:m.tenants}));
vi.mock('@/lib/audit/tamper-proof',()=>({verifyTenantAuditRecords:m.verify}));
vi.mock('@/lib/prisma',()=>({prisma:{auditLog:{findFirst:m.cursor,findMany:m.entries}}}));
import { GET } from '@/app/api/v2/audit/route';

describe('platform admin audit review',()=>{
 beforeEach(()=>{vi.resetAllMocks();m.actor.mockResolvedValue({id:'admin',tenantId:'platform',platformRole:'ADMIN'});m.tenants.mockResolvedValue([{id:'hotel-a',name:'Hotel A'}]);m.cursor.mockResolvedValue({id:'cursor'});m.entries.mockResolvedValue([]);m.verify.mockResolvedValue({valid:true,totalEntries:2});});
 it('lists a managed hotel organization audit trail only when it is selected explicitly',async()=>{const response=await GET(new Request('https://x/api/v2/audit?tenantId=hotel-a&verify=true'));expect(response.status).toBe(200);expect(m.entries).toHaveBeenCalledWith(expect.objectContaining({where:expect.objectContaining({tenantId:'hotel-a'})}));expect(m.verify).toHaveBeenCalledWith('hotel-a');expect(await response.json()).toMatchObject({tenantId:'hotel-a',tenants:[{id:'hotel-a'}]});});
 it('does not allow another tenant audit trail',async()=>{const response=await GET(new Request('https://x/api/v2/audit?tenantId=hotel-b'));expect(response.status).toBe(404);expect(m.entries).not.toHaveBeenCalled();});
 it('keeps the default view scoped to the administrator platform tenant',async()=>{const response=await GET(new Request('https://x/api/v2/audit'));expect(response.status).toBe(200);expect(m.entries).toHaveBeenCalledWith(expect.objectContaining({where:expect.objectContaining({tenantId:'platform'})}));});
 it('includes the immutable change payload needed to review a receipt event',async()=>{m.entries.mockResolvedValue([{id:'receipt-audit',entityName:'GOODS_RECEIPT_NOTE',changes:{grnNumber:'GRN-1',evidenceRecordIds:['evidence-1']}}]);const response=await GET(new Request('https://x/api/v2/audit?tenantId=hotel-a'));expect(await response.json()).toMatchObject({entries:[{entityName:'GOODS_RECEIPT_NOTE',changes:{grnNumber:'GRN-1',evidenceRecordIds:['evidence-1']}}]});});
});
