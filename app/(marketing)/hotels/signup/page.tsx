import {ActorSignup} from '@/components/v2/actor-signup';
import { publicPageMetadata } from '@/lib/seo';
export const metadata = { ...publicPageMetadata('Hotel workspace registration', 'Create a HotelsVendors hotel workspace to bring your organization’s purchasing activity together.', '/hotels/signup'), robots: { index: false, follow: true } };
export default function Signup(){return <ActorSignup role="HOTEL"/>}
