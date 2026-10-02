'use client';
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#232831' }}>
      <div>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 22, textAlign: 'center', marginBottom: 20 }}>HotelsVendors</div>
        <SignIn forceRedirectUrl="/dashboard" />
      </div>
    </main>
  );
}
