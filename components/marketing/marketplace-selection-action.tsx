'use client';

import { SignInButton, useAuth } from '@clerk/nextjs';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

type MarketplaceSelectionActionProps = {
  itemId?: string;
  category?: string | null;
  subcategory?: string | null;
  query?: string;
  className?: string;
  label?: string;
};

function selectionTarget({ itemId, category, subcategory, query }: MarketplaceSelectionActionProps) {
  const search = new URLSearchParams();
  if (itemId) search.set('catalogReference', itemId);
  if (category) search.set('category', category);
  if (subcategory) search.set('subcategory', subcategory);
  if (query) search.set('q', query);
  const serialized = search.toString();
  return `/workspace/marketplace${itemId ? '/basket' : ''}${serialized ? `?${serialized}` : ''}`;
}

/**
 * Keeps the selected catalogue context in the post-auth destination. Signed-out
 * users get Clerk's modal instead of a generic login redirect; no Vendor or
 * commercial data is stored client-side.
 */
export function MarketplaceSelectionAction(props: MarketplaceSelectionActionProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const target = selectionTarget(props);
  const label = props.label ?? 'Add to requirement';
  const content = <><span>{label}</span><ArrowRight size={17} aria-hidden="true" /></>;

  if (isLoaded && isSignedIn) return <Link className={props.className} href={target}>{content}</Link>;

  return <SignInButton
    mode="modal"
    forceRedirectUrl={target}
    signUpForceRedirectUrl={target}
  ><button type="button" className={props.className}>{content}</button></SignInButton>;
}
