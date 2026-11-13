import Link from "next/link";
import { ArrowRight, MapPinned, PackageCheck, ScanLine, ShieldCheck, Truck } from "lucide-react";
import { EGYPT_PROVIDERS } from "@/lib/logistics/providers";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata(
  "Carrier Logistics Workspace for Hotel Deliveries",
  "Verified transport partners use HotelsVendors to accept assigned movements, record shipment status, and refer HOVIN delivery codes. Live third-party booking APIs are not connected yet.",
  "/solutions/carriers",
);

const builtToday = [
  {
    icon: ShieldCheck,
    title: "Assigned work only",
    body: "Hotels allocate verified carrier profiles to orders. Partners accept or decline on the carrier portal—there is no open marketplace of unsolicited jobs.",
  },
  {
    icon: Truck,
    title: "Shipment plans and handoffs",
    body: "After acceptance, carriers create a controlled route draft and advance HotelsVendors shipment states: planned, picked up, in transit, delivered—with evidence URLs on delivery.",
  },
  {
    icon: ScanLine,
    title: "HOVIN delivery codes",
    body: "Once a movement is accepted, HOVIN can surface the delivery confirmation code for the dock. Accept and decline stay on the web portal; the phone path does not place orders.",
  },
  {
    icon: PackageCheck,
    title: "Receiving stays with the hotel",
    body: "Goods receipt and payment authority remain hotel responsibilities. Carrier status updates feed the same commercial record without exposing another organization's private terms.",
  },
];

const notConnected = [
  "Live booking against Bosta, Aramex, Mylerz, or other courier APIs",
  "Independent telematics or courier-native proof-of-delivery feeds",
  "Self-serve public carrier signup without HotelsVendors partner review",
];

export default function CarrierSolutionPage() {
  return (
    <main className="hv-public-page">
      <section className="hv-public-hero">
        <div className="shell">
          <div className="eyebrow">Logistics</div>
          <h1>Delivery that stays on the same purchase record.</h1>
          <p>
            HotelsVendors gives verified carriers a focused workspace for hotel-authorized movements—
            accept the assignment, record the handoff, and share a delivery code with the receiving team.
            Live courier booking networks are prepared in the product registry, not yet switched on.
          </p>
          <div className="hv-public-actions">
            <Link className="btn btn-blue" href="/carriers/portal">
              Open carrier portal <ArrowRight size={16} />
            </Link>
            <Link className="hv-public-text-link" href="/contact">
              Partner enquiry
            </Link>
          </div>
        </div>
      </section>

      <section className="hv-public-section">
        <div className="shell">
          <div className="hv-public-section-head">
            <div>
              <h2>
                Built today.
                <br />
                <em>Inside HotelsVendors.</em>
              </h2>
            </div>
            <p>
              These capabilities are live in the carrier portal and HOVIN referral path. They are
              HotelsVendors-controlled workflows—not a substitute for a courier&apos;s own operations console.
            </p>
          </div>
          <div className="hv-solution-ledger">
            {builtToday.map(({ icon: Icon, title, body }) => (
              <article className="hv-solution-row" key={title}>
                <span className="hv-public-actor-icon" aria-hidden="true">
                  <Icon size={18} />
                </span>
                <div className="hv-solution-main">
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
                <span className="hv-solution-result">Available now</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="hv-public-alt-section">
        <div className="shell">
          <div className="hv-public-section-head">
            <div>
              <h2>
                Tracking truth.
                <br />
                <em>What the system records.</em>
              </h2>
            </div>
            <p>
              Status lives on the HotelsVendors shipment record for the assigned movement. It is not a
              live GPS feed from an external carrier network until an adapter is provisioned and verified.
            </p>
          </div>
          <div className="hv-platform-principles">
            <div>
              <span>01</span>
              <strong>Internal lifecycle</strong>
              <p>Planned → picked up → in transit → delivered, with optional evidence links on delivery.</p>
            </div>
            <div>
              <span>02</span>
              <strong>HOVIN code handoff</strong>
              <p>Delivery confirmation codes appear for movements already accepted on the carrier portal.</p>
            </div>
            <div>
              <span>03</span>
              <strong>Hotel goods receipt</strong>
              <p>Receiving operators record acceptance against the order; carriers do not close commercial payment.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="hv-public-section">
        <div className="shell">
          <div className="hv-public-section-head">
            <div>
              <h2>
                Egypt logistics registry.
                <br />
                <em>Ready for integration—not live yet.</em>
              </h2>
            </div>
            <p>
              The product keeps a local-first provider registry so verified partners can connect API keys
              when HotelsVendors turns those adapters on. Naming a courier here does not mean a live booking
              session exists today.
            </p>
          </div>
          <div className="hv-solution-ledger">
            {EGYPT_PROVIDERS.map((provider) => (
              <article className="hv-solution-row" key={provider.id}>
                <span className="hv-public-actor-icon" aria-hidden="true">
                  <MapPinned size={18} />
                </span>
                <div className="hv-solution-main">
                  <h3>{provider.name}</h3>
                  <p>
                    {provider.type.replace("_", " ")} · {provider.coverage.join(", ")} ·{" "}
                    {provider.deliveryTypes.join(" / ")}
                  </p>
                </div>
                <span className="hv-solution-result">Adapter planned</span>
              </article>
            ))}
          </div>
          <div className="hv-solutions-note" style={{ marginTop: 36 }}>
            <h2>Not connected yet</h2>
            <ul style={{ margin: "0 0 24px", paddingLeft: 18, color: "var(--muted)", lineHeight: 1.8 }}>
              {notConnected.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link className="hv-public-text-link" href="/security-overview">
              Understand access boundaries <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="hv-public-close">
        <div className="shell">
          <div>
            <h2>Become a verified logistics partner.</h2>
            <p>
              Carrier organizations are onboarded through HotelsVendors partner review. Once verified, hotels
              can assign you to movements that belong on their purchase record.
            </p>
          </div>
          <Link className="btn btn-blue" href="/contact">
            Request partner review <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}
