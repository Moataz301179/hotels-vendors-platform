import {beforeEach,describe,expect,it,vi} from 'vitest';
const m=vi.hoisted(()=>({order:vi.fn(),rules:vi.fn(),invoice:vi.fn()}));
vi.mock('@/lib/prisma',()=>({prisma:{order:{findFirst:m.order},authorityRule:{findMany:m.rules},invoice:{findFirst:m.invoice}}}));
import {evaluateV2Authority} from '@/lib/auth/v2-authority';
const rule={id:'policy',hotelId:null,minValue:null,maxValue:null,hotelTier:null,hotelRiskTier:null,supplierTier:null,category:null,requesterRole:null,requiresDualSignOff:false,requiresEtaValidation:false,action:'APPROVE'};
describe('persisted authority policy',()=>{
 beforeEach(()=>{vi.resetAllMocks();m.order.mockResolvedValue({id:'o',hotelId:'h',total:200,paymentGuaranteed:true,hotel:{tier:'CORE',riskTier:'LOW'},supplier:{tier:'CORE'},requester:{role:'CLERK'},items:[]});m.rules.mockResolvedValue([rule]);});
 it('does not approve missing authority configuration',async()=>{m.rules.mockResolvedValue([]);expect((await evaluateV2Authority('o',{tenantId:'own',role:'GM'})).allowed).toBe(false)});
 it('uses the authenticated tenant and persisted approver role',async()=>{expect((await evaluateV2Authority('o',{tenantId:'own',role:'GM'})).allowed).toBe(true);expect(m.order.mock.calls[0][0].where).toEqual({id:'o',tenantId:'own',deletedAt:null});expect(m.rules.mock.calls[0][0].where).toMatchObject({role:'GM',OR:[{tenantId:'own'},{tenantId:null}]})});
 it('cannot bypass a payment guarantee',async()=>{m.order.mockResolvedValue({paymentGuaranteed:false});expect((await evaluateV2Authority('o',{tenantId:'own',role:'GM'})).allowed).toBe(false);expect(m.rules).not.toHaveBeenCalled()});
 it('honors limits and additional sign-offs',async()=>{for(const blocked of [{...rule,maxValue:100},{...rule,requiresDualSignOff:true},{...rule,action:'REQUIRE_OWNER'},{...rule,requesterRole:'OWNER'}]){m.rules.mockResolvedValue([blocked]);expect((await evaluateV2Authority('o',{tenantId:'own',role:'GM'})).allowed).toBe(false)}});
});
