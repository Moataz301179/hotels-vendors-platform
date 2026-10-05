import {ActorSignup} from '@/components/v2/actor-signup';
import { publicPageMetadata } from '@/lib/seo';
export const metadata = { ...publicPageMetadata('Supplier workspace registration', 'Create a HotelsVendors supplier workspace to manage your business profile and respond to eligible hotel sourcing requests.', '/suppliers/signup'), robots: { index: false, follow: true } };
export default function Signup(){return <ActorSignup role="SUPPLIER"/>}
