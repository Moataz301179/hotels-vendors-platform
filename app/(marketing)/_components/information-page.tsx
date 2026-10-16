import Link from "next/link";

type InformationPageProps = {
  eyebrow: string;
  title: string;
  body: string;
  primaryHref?: string;
  primaryLabel?: string;
};

export function InformationPage({ eyebrow, title, body, primaryHref = "/register", primaryLabel = "Join the network" }: InformationPageProps) {
  return (
    <main className="hv-public-page">
      <section className="hv-public-hero"><div className="shell hv-public-hero-inner"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{body}</p><div className="hv-public-actions"><Link className="btn btn-blue" href={primaryHref}>{primaryLabel}</Link><Link className="hv-public-text-link" href="/solutions">Explore the network →</Link></div></div></section>
      <section className="hv-public-section"><div className="shell"><h2>Evidence before action.</h2><p>HOTELSVENDORS keeps organization records, supplier claims and workflow decisions inside authenticated workspaces. If a capability is not connected or verified, it is shown as unavailable rather than presented as a completed transaction.</p><Link className="hv-public-text-link" href="/security-overview">Review access boundaries →</Link></div></section>
    </main>
  );
}
