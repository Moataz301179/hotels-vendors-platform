import {beforeEach,describe,expect,it,vi} from 'vitest';
const m=vi.hoisted(()=>({auth:vi.fn(),current:vi.fn(),user:vi.fn(),transaction:vi.fn()}));vi.mock('@clerk/nextjs/server',()=>({auth:m.auth,currentUser:m.current}));vi.mock('@/lib/prisma',()=>({prisma:{user:{findUnique:m.user},$transaction:m.transaction}}));
import {getActor} from '@/lib/v2-auth';
describe('verified identity binding',()=>{
 beforeEach(()=>{vi.resetAllMocks();m.auth.mockResolvedValue({userId:'clerk-user'});m.user.mockResolvedValue({id:'u',platformRole:'SUPPLIER',tenantId:'own',status:'ACTIVE',deletedAt:null})});
 it('rejects an unverified primary email before reading database authorization',async()=>{m.current.mockResolvedValue({primaryEmailAddressId:'primary',emailAddresses:[{id:'primary',emailAddress:'admin@example.com',verification:{status:'unverified'}}]});expect(await getActor()).toBeNull();expect(m.user).not.toHaveBeenCalled()});
 it('uses verified primary email rather than the first address or browser role',async()=>{m.current.mockResolvedValue({primaryEmailAddressId:'primary',unsafeMetadata:{platformRole:'ADMIN'},emailAddresses:[{id:'secondary',emailAddress:'admin@example.com',verification:{status:'verified'}},{id:'primary',emailAddress:'Supplier@Example.com',verification:{status:'verified'}}]});expect(await getActor()).toMatchObject({platformRole:'SUPPLIER',tenantId:'own'});expect(m.user).toHaveBeenCalledWith({where:{email:'supplier@example.com'}});expect(m.transaction).not.toHaveBeenCalled()});
 it('rejects suspended database users',async()=>{m.current.mockResolvedValue({primaryEmailAddressId:'primary',emailAddresses:[{id:'primary',emailAddress:'a@example.com',verification:{status:'verified'}}]});m.user.mockResolvedValue({status:'SUSPENDED'});expect(await getActor()).toBeNull()});
});
