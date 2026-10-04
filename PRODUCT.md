# HotelsVendors — Product Truth

> Context was reconstructed from the owner's standing product brief and the current repository because the owner explicitly asked to proceed without another discovery round. Treat inferred details as provisional; do not invent proof, customer stories, metrics, pricing, or integrations.

## Product
HotelsVendors (HV) is an end-to-end hospitality business network in Egypt. It connects Hotels, Suppliers, Carriers, and Funders and gives those participants a shared commercial environment for procurement and business activity.

## Audience and jobs
- **Hotels:** procure reliably, compare offers, control spend, discover savings, and understand cash-flow pressure.
- **Suppliers:** reach relevant hotel demand, respond to real procurement needs, and identify commercial opportunities.
- **Carriers:** participate in the supply and delivery network through controlled partner onboarding.
- **Funders:** independently assess opportunities they choose to receive and decide whether to finance them.
- **Administrators:** govern access, verification, integrity, privacy, and network health.

## Differentiating mechanism
The Virtual Ghost / Virtual Shadow is HV's central intelligence layer. It observes legitimate, permissioned network and procurement signals to surface potential money leaks, savings, anomalies, commercial matches, and cash-flow/funding signals. Each finding should distinguish observed facts from estimates or inferences, explain its evidence, and propose an actionable next step. A signal is not a guaranteed outcome.

## Core user journey
Network activity and verified business identity → evidence-backed Ghost finding or opportunity → participant reviews and acts → result is measured where data permits. Keep potential, quoted, negotiated, and realized savings distinct.

## Trust and financial boundaries
- HV is not a lender and does not underwrite, approve, price, contract, or disburse financing. External funders make those decisions.
- Hotels and Suppliers may self-register. Carriers and Funders require controlled partner onboarding/verification.
- Tenant isolation, role/scope authorization, auditability, data provenance, and explicit consent for sharing sensitive data are non-negotiable.
- Never represent demo/test/synthetic data as real business activity or fabricate customer proof.
- A business UUID is an identity/correlation key, not a credit score, ETA invoice UUID, or user ID.

## Platform and delivery constraints
- Existing web application; preserve its working procurement/business flows, authentication, API contracts, data model, and access boundaries during visual redesign.
- Existing intended stack includes Clerk, Neon/Postgres, Prisma, UUID business identity, tenant-aware RBAC, and append-only/tamper-evident audit records. Verify implementation before asserting that any control works.
- Revenue may come from legitimate subscriptions, service fees, marketplace commissions, and external-funder referrals where already supported; do not invent pricing or imply HV provides financing.

## Confirmed brand/design commitments
- HotelsVendors must feel like a premium, credible commercial network and a money-saving intelligence product—not a generic AI/SaaS marketing template or a prototype marketplace.
- The Virtual Ghost must be a clear, distinctive visual signature, grounded in actual product behavior rather than decorative AI imagery.
- Direction previously requested: restrained, high-quality, warm off-white/light neutral surfaces, disciplined blue accents, charcoal sticky header with white logo, solid black footer, correct uncropped logo proportions, and real high-quality visual assets.
- Avoid long, empty hero/card stacks, magazine-style navigation, generic gradient/card kits, low-quality placeholders, and excessive scrolling.
- Visual inspiration mentioned by the owner: dealray.hatchable.site. Use it as quality/reference context, not as permission to copy its brand or assets.

## Success criteria
A first-time hotel or supplier can understand what HV does, why the Virtual Ghost matters, and what action to take. The public experience looks coherent and premium; role-based product workspaces remain operational and understandable; responsive behavior, accessibility, loading/empty/error states, and visual assets meet production standards.
