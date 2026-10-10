import { beforeEach, describe, expect, it, vi } from 'vitest';

const m=vi.hoisted(()=>({actor:vi.fn(),hotel:vi.fn(),product:vi.fn(),baseline:vi.fn(),baselineCreate:vi.fn(),rfqCreate:vi.fn(),audit:vi.fn(),transaction:vi.fn()}));
vi.mock('@/lib/v2-auth',()=>({getActor:m.actor}));
vi.mock('@/lib/audit/tamper-proof',()=>({appendAuditEntry:m.audit}));
vi.mock('@/lib/prisma',()=>({prisma:{hotel:{findFirst:m.hotel},product:{findFirst:m.product},contractRateBaseline:{findFirst:m.baseline,create:m.baselineCreate,findMany:vi.fn()},rfqRequest:{create:m.rfqCreate},$transaction:m.transaction}}));
import { POST as createBaseline } from '@/app/api/v2/contract-baselines/route';
import { POST as createRfq } from '@/app/api/v2/rfq/route';

const actor={id:'buyer',tenantId:'tenant',platformRole:'HOTEL',role:'GM'};
const request=(url:string,body:unknown)=>new Request(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
describe('pre-spend route boundaries',()=>{
 beforeEach(()=>{vi.resetAllMocks();m.actor.mockResolvedValue(actor);m.hotel.mockResolvedValue({id:'hotel'});m.product.mockResolvedValue({id:'product',supplierId:'supplier'});m.baseline.mockResolvedValue({id:'baseline',productId:'product',supplierId:'supplier'});m.baselineCreate.mockResolvedValue({id:'baseline',unitPrice:100,rateQuantity:2,deliveryFee:10,taxAmount:5});m.rfqCreate.mockResolvedValue({id:'rfq'});m.audit.mockResolvedValue('audit');m.transaction.mockImplementation((fn:Function)=>fn({contractRateBaseline:{create:m.baselineCreate},rfqRequest:{create:m.rfqCreate}}));});
 it('rejects malformed baseline terms before database access',async()=>{const response=await createBaseline(request('https://x/api/v2/contract-baselines',{productId:'product',rateQuantity:0,unitPrice:10,sourceReference:'ok',validFrom:'2026-10-10'}));expect(response.status).toBe(400);expect(m.product).not.toHaveBeenCalled();});
 it('keeps baseline creation tenant-bound and audit-classified',async()=>{const response=await createBaseline(request('https://x/api/v2/contract-baselines',{productId:'product',rateQuantity:2,unitPrice:100,deliveryFee:10,taxAmount:5,sourceReference:'signed schedule',validFrom:'2026-10-10'}));expect(response.status).toBe(201);expect(m.baselineCreate.mock.calls[0][0].data).toMatchObject({tenantId:'tenant',hotelId:'hotel',supplierId:'supplier'});expect(m.audit.mock.calls[0][0]).toMatchObject({entityName:'CONTRACT_RATE_BASELINE',tenantId:'tenant'});});
 it('rejects a baseline that is unavailable to the authenticated hotel',async()=>{m.baseline.mockResolvedValue(null);const response=await createRfq(request('https://x/api/v2/rfq',{contractBaselineId:'foreign',quantity:2}));expect(response.status).toBe(404);expect(m.rfqCreate).not.toHaveBeenCalled();});
 it('rejects a product that conflicts with the baseline',async()=>{const response=await createRfq(request('https://x/api/v2/rfq',{contractBaselineId:'baseline',productId:'different',quantity:2}));expect(response.status).toBe(409);expect(m.rfqCreate).not.toHaveBeenCalled();});
 it('stores the active baseline reference on the RFQ',async()=>{const response=await createRfq(request('https://x/api/v2/rfq',{contractBaselineId:'baseline',quantity:2}));expect(response.status).toBe(201);expect(m.rfqCreate.mock.calls[0][0].data).toMatchObject({tenantId:'tenant',contractBaselineId:'baseline',productId:'product',supplierId:'supplier'});});
});
