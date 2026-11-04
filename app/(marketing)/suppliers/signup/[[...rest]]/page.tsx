import {ActorSignup} from '@/components/v2/actor-signup';
import { publicPageMetadata } from '@/lib/seo';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
export const metadata = { ...publicPageMetadata('Vendor workspace registration', 'Create a HOTELSVENDORS vendor workspace to manage your business profile and respond to eligible hotel sourcing requests.', '/suppliers/signup'), robots: { index: false, follow: true } };
export default async function Signup(){
  const { userId } = await auth();
  if (userId) redirect('/auth/continue');
  return <ActorSignup role="SUPPLIER"/>;
}
