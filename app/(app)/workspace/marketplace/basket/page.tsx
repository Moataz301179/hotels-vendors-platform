import { requireActorRole } from '@/lib/v2-auth';
import { RequirementBasket } from '@/components/procurement/requirement-basket';

export default async function RequirementBasketPage() {
  await requireActorRole(['HOTEL', 'ADMIN']);
  return <RequirementBasket />;
}
