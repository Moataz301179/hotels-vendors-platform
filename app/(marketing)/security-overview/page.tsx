import Link from 'next/link';
import { publicPageMetadata } from '@/lib/seo';

export const metadata = publicPageMetadata(
  'Security, Tenant Access and Audit Controls',
  'Learn how HotelsVendors scopes organization access, enforces role checks and supports review of audit records. No security certification is claimed.',
  '/security-overview',
);
export default function SecurityOverview(){return <main className="hv-public-page"><section className="hv-public-hero"><div className="shell"><h1>Clear access boundaries.</h1><p>One network, separate organization workspaces. Public discovery does not grant access to purchasing records or institutional data.</p></div></section><section className="hv-public-section"><div className="shell"><h2>Identity and authorization</h2><p>Clerk authenticates sessions. The server resolves an active database user using the verified primary email, then checks the persisted role, tenant and record relationship. Navigation visibility is not authorization.</p><h2>Audit and sharing</h2><p>Administrators can review their organization’s audit records. External institutional access must be explicitly scoped, expiring and revocable. HotelsVendors does not run credit scoring or make lending decisions.</p><h2>Operational verification</h2><p>These controls are not a security certification. Production identity configuration, encryption, backup recovery and institution connections require operational verification.</p><Link className="hv-public-text-link" href="/security">View your workspace permissions →</Link></div></section></main>}
