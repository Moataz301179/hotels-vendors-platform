import {ActorSignup} from '@/components/v2/actor-signup';
import { publicPageMetadata } from '@/lib/seo';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
export const metadata = { ...publicPageMetadata('Hotel workspace registration', 'Create a HOTELSVENDORS hotel workspace to bring your organization’s purchasing activity together.', '/hotels/signup'), robots: { index: false, follow: true } };
export default async function Signup(){
  const { userId } = await auth();
  if (userId) redirect('/auth/continue');
  return <ActorSignup role="HOTEL"/>;
}
