import { AgentConfig, AgentCapability, MarketGap, CompetitorProfile } from "./types";

export const AGENTS: Record<string, AgentConfig> = {
  "fintech-architect": {
    id: "fintech-architect",
    name: "Fintech Architect",
    role: "Embedded Finance & Credit Systems",
    avatar: "🏦",
    color: "#10b981",
    systemPrompt:
      "You are a fintech architect specializing in embedded finance, factoring, and B2B credit. Your expertise: supplier factoring, occupancy-linked credit, dynamic credit scoring, BNPL for B2B, Islamic finance compliance, CB Egypt integration. You evaluate every feature through the lens of capital efficiency and liquidity injection.",
    capabilities: [
      "fintech_design",
      "pricing_strategy",
      "risk_assessment",
      "business_modeling",
    ],
  },
  "security-expert": {
    id: "security-expert",
    name: "Security Expert",
    role: "Auth, RBAC & Compliance",
    avatar: "🔒",
    color: "#ef4444",
    systemPrompt:
      "You are a cybersecurity and compliance expert. Your expertise: RBAC design, OAuth2/OIDC, encryption at rest and in transit, ETA e-invoicing compliance, GDPR/privacy, SOC2, penetration testing. You ensure every feature is secure by design and audit-ready.",
    capabilities: [
      "compliance_review",
      "risk_assessment",
      "ux_audit",
      "integration_architecture",
    ],
  },
  "integration-lead": {
    id: "integration-lead",
    name: "Integration Lead",
    role: "APIs, ERP & ETA Connectors",
    avatar: "🔌",
    color: "#3b82f6",
    systemPrompt:
      "You are an integration architect. Your expertise: REST/GraphQL API design, ERP connectors (Oracle, SAP, Opera), ETA e-invoicing API, payment gateway integration, webhook systems, EDI, middleware patterns. You ensure the platform connects seamlessly with the hospitality ecosystem.",
    capabilities: [
      "integration_architecture",
      "data_analysis",
      "compliance_review",
      "business_modeling",
    ],
  },
  "business-strategist": {
    id: "business-strategist",
    name: "Business Strategist",
    role: "Market Positioning & Monetization",
    avatar: "📊",
    color: "#f59e0b",
    systemPrompt:
      "You are a business strategist for B2B marketplaces. Your expertise: platform economics, network effects, monetization streams, pricing psychology, TAM/SAM/SOM analysis, competitive moats, M&A evaluation, Egyptian market dynamics. You identify where money is left on the table.",
    capabilities: [
      "business_modeling",
      "pricing_strategy",
      "market_research",
      "competitor_analysis",
      "gap_analysis",
    ],
  },
  "seo-strategist": {
    id: "seo-strategist",
    name: "SEO Strategist",
    role: "Organic Growth & Content",
    avatar: "🔍",
    color: "#8b5cf6",
    systemPrompt:
      "You are an SEO and growth strategist. Your expertise: technical SEO, content strategy, local search (Egypt Arabic + English), backlink acquisition, schema markup, Core Web Vitals, conversion rate optimization. You ensure the platform is discoverable by every hotel GM searching for procurement solutions.",
    capabilities: ["seo_audit", "market_research", "data_analysis", "ux_audit"],
  },
  "ux-designer": {
    id: "ux-designer",
    name: "UX Designer",
    role: "Experience & Interface Design",
    avatar: "🎨",
    color: "#ec4899",
    systemPrompt:
      "You are a UX designer for B2B SaaS. Your expertise: design systems, accessibility (WCAG), mobile-first workflows, Arabic RTL interfaces, information architecture, usability testing, micro-interactions. You ensure every screen reduces cognitive load and accelerates task completion.",
    capabilities: ["ux_audit", "data_analysis", "integration_architecture", "feature_ideation"],
  },
  "data-harvester": {
    id: "data-harvester",
    name: "Data Harvester",
    role: "Intelligence & Market Signals",
    avatar: "🌐",
    color: "#06b6d4",
    systemPrompt:
      "You are a market intelligence analyst. Your expertise: web scraping, competitor monitoring, pricing intelligence, funding news tracking, patent analysis, social listening, trend detection. You continuously scan the market for signals that matter to HotelsVendors.",
    capabilities: [
      "market_research",
      "competitor_analysis",
      "data_analysis",
      "gap_analysis",
      "feature_ideation",
    ],
  },
  auditor: {
    id: "auditor",
    name: "The Auditor",
    role: "Quality Assurance & Governance",
    avatar: "🛡️",
    color: "#6366f1",
    systemPrompt:
      "You are The Auditor. Your expertise: code review, architecture governance, decision logging, technical debt assessment, performance benchmarking, security auditing, compliance validation. You challenge every assumption and ensure quality gates are met before any feature ships.",
    capabilities: [
      "risk_assessment",
      "compliance_review",
      "data_analysis",
      "integration_architecture",
      "business_modeling",
    ],
  },
};

export function getAgent(id: string): AgentConfig | undefined {
  return AGENTS[id];
}

export function getAgentsForCapability(capability: AgentCapability): AgentConfig[] {
  return Object.values(AGENTS).filter((a) => a.capabilities.includes(capability));
}

/**
 * Pre-built orchestration workflows.
 */
export const WORKFLOWS = {
  market_research_sprint: {
    objective: "Map the Egyptian hospitality procurement competitive landscape and identify market gaps",
    workflow: "sequential" as const,
    tasks: [
      { agent: "data-harvester", type: "MARKET_RESEARCH", title: "Competitor Discovery" },
      { agent: "business-strategist", type: "COMPETITOR_ANALYSIS", title: "Competitive Positioning" },
      { agent: "business-strategist", type: "GAP_ANALYSIS", title: "Market Gap Analysis" },
      { agent: "fintech-architect", type: "FINTECH_DESIGN", title: "Financial Services Gap" },
      { agent: "auditor", type: "RISK_ASSESSMENT", title: "Risk & Opportunity Validation" },
    ],
  },
  feature_ideation_sprint: {
    objective: "Generate intelligent SaaS features that exploit identified market gaps",
    workflow: "parallel" as const,
    tasks: [
      { agent: "fintech-architect", type: "FEATURE_IDEA", title: "Fintech Features" },
      { agent: "integration-lead", type: "FEATURE_IDEA", title: "Integration Features" },
      { agent: "ux-designer", type: "FEATURE_IDEA", title: "UX/AI Features" },
      { agent: "security-expert", type: "FEATURE_IDEA", title: "Compliance Features" },
      { agent: "business-strategist", type: "FEATURE_IDEA", title: "Business Model Features" },
    ],
  },
  platform_audit: {
    objective: "Run a full platform health check across all dimensions",
    workflow: "parallel" as const,
    tasks: [
      { agent: "security-expert", type: "COMPLIANCE_REVIEW", title: "Security Audit" },
      { agent: "auditor", type: "RISK_ASSESSMENT", title: "Architecture Review" },
      { agent: "ux-designer", type: "UX_AUDIT", title: "UX Review" },
      { agent: "seo-strategist", type: "SEO_AUDIT", title: "SEO Audit" },
      { agent: "fintech-architect", type: "RISK_ASSESSMENT", title: "Financial Risk Review" },
    ],
  },
};

/**
 * Static market gap analysis based on real competitive intelligence.
 * These are the gaps our platform is designed to exploit.
 */
export const INITIAL_MARKET_GAPS: MarketGap[] = [
  {
    id: "gap-001",
    title: "No ETA E-Invoicing Native Integration",
    description:
      "Egypt's Tax Authority mandates UUID + digital signature on every B2B invoice. No hospitality procurement platform in Egypt has built-in ETA submission, dead-letter queues, or reconciliation.",
    severity: "critical",
    affectedActors: ["HOTEL", "SUPPLIER", "PLATFORM"],
    competitorBlindSpot: "FutureLog (global, no Egypt ETA); MaxAB-Wasoko (FMCG, no invoicing compliance)",
    revenueOpportunity: "Compliance-as-a-Service: 0.3% per invoice; mandatory adoption creates lock-in",
    proposedSolution: "Native ETA API with SHA-256 signing, UUID generation, validation sandbox, and dead-letter queue for rejected invoices.",
  },
  {
    id: "gap-002",
    title: "Horizontal B2B Players Ignore Hospitality Vertical",
    description:
      "MaxAB-Wasoko serves 450K+ retailers but treats hotels as 'just another retailer.' No support for: perishable F&B, FF&E lifecycle, amenity specs, linen par levels, or seasonal coastal demand.",
    severity: "critical",
    affectedActors: ["HOTEL", "SUPPLIER"],
    competitorBlindSpot: "MaxAB-Wasoko (horizontal FMCG); Fatura (wholesale connect)",
    revenueOpportunity: "Vertical SaaS premium: 2.5% vs 1.5% horizontal take rate; higher LTV via specialized features",
    proposedSolution:
      "Category-specific catalogs (F&B, Linens, Chemicals, FF&E) with hotel-native attributes: par levels, shelf life, temperature requirements, star-rating compatibility.",
  },
  {
    id: "gap-003",
    title: "Missing Multi-Property Governance & Authority Matrix",
    description:
      "Hotel chains need PO approval workflows by property, role, category, and value threshold. Existing platforms have single-level approval or none. No competitor supports matrix rules + audit trails.",
    severity: "high",
    affectedActors: ["HOTEL", "PLATFORM"],
    competitorBlindSpot: "FutureLog (basic approvals); BirchStreet (chain-centric but US-only); Fourth (F&B only)",
    revenueOpportunity: "Enterprise tier at EGP 15K+/month per chain; 90-day implementation contracts",
    proposedSolution:
      "Visual Authority Matrix configurator: Role × Value Range × Category × Supplier Tier = Action. Automatic routing, escalation, and immutable audit logs.",
  },
  {
    id: "gap-004",
    title: "No Embedded Factoring for Supplier Liquidity",
    description:
      "Suppliers in Egypt face 60-120 day payment terms. MaxAB-Wasoko offers merchant credit (BNPL for buyers) but no supplier factoring. Hotels want credit; suppliers want cash now.",
    severity: "critical",
    affectedActors: ["SUPPLIER", "FACTOR", "PLATFORM"],
    competitorBlindSpot: "MaxAB-Wasoko (buyer-side BNPL only); No Egyptian hospitality factoring platform exists",
    revenueOpportunity: "Factoring spread: 2-4% per transaction; EGP 2.1B+ addressable GMV in hospitality supply",
    proposedSolution:
      "Occupancy-linked factoring: Factor pays supplier within 24hrs at 2.5% fee. Repayment tied to hotel's confirmed bookings + credit history. Risk engine uses booking data + ETA invoice history.",
  },
  {
    id: "gap-005",
    title: "No Coastal Logistics Optimization",
    description:
      "Egypt's North Coast hotels operate seasonally (May-Sept) with massive demand spikes. No platform optimizes shared logistics for seasonal clusters, creating 40% empty truck miles.",
    severity: "high",
    affectedActors: ["HOTEL", "SUPPLIER", "LOGISTICS"],
    competitorBlindSpot: "MaxAB-Wasoko (last-mile for small shops); No hospitality coastal logistics player",
    revenueOpportunity: "Shark-Breaker shared logistics: 30% cost reduction = EGP 180K savings per coastal property/year",
    proposedSolution:
      "Cluster-based delivery: Hotels within 5km radius share truck capacity. Dynamic routing by order density, temperature requirements, and delivery windows.",
  },
  {
    id: "gap-006",
    title: "No Demand Forecasting or AI-Powered Procurement",
    description:
      "Hotels overstock by 25% on average to avoid stockouts. No competitor offers occupancy-linked demand forecasting, automatic reorder points, or AI-suggested purchase orders.",
    severity: "high",
    affectedActors: ["HOTEL", "SUPPLIER"],
    competitorBlindSpot: "FutureLog (reporting only); Fourth (basic analytics); MaxAB (no forecasting)",
    revenueOpportunity: "Found Money: 15-property chain saves ~$780K/year via daily ordering + forecast accuracy",
    proposedSolution:
      "AI Demand Engine: Ingests occupancy data, events, seasonality, and historical consumption. Auto-generates PO suggestions with 95% confidence intervals. Reduces working capital by 20%.",
  },
  {
    id: "gap-007",
    title: "Fixed-Price Catalogs vs Auction/Bidding Models",
    description:
      "FutureLog and Avendra use RFQ/bidding which creates price pressure and relationship friction. Hotels prefer negotiated fixed-price catalogs with trusted suppliers for predictable budgeting.",
    severity: "medium",
    affectedActors: ["HOTEL", "SUPPLIER"],
    competitorBlindSpot: "FutureLog (RFQ/bidding); Avendra (GPO negotiated, not per-hotel)",
    revenueOpportunity: "Catalog subscription: EGP 3K/month per supplier; volume commitment guarantees",
    proposedSolution:
      "Private Fixed-Price Catalogs: Each hotel negotiates its own prices per supplier. Annual renewals with volume tiers. No bidding, no surprises.",
  },
  {
    id: "gap-008",
    title: "No Supplier Certification & Quality Scoring",
    description:
      "Hotels lack visibility into supplier certifications (ISO, HACCP, OEKO-TEX). No platform offers dynamic quality scoring, inspection reports, or certification expiry alerts.",
    severity: "medium",
    affectedActors: ["HOTEL", "SUPPLIER"],
    competitorBlindSpot: "Avendra (manual vetting); BirchStreet (chain-approved only); No dynamic scoring",
    revenueOpportunity: "Trust premium: Certified suppliers get 15% more orders; audit fees EGP 5K per inspection",
    proposedSolution:
      "Supplier Trust Score: Composite of certifications, on-time delivery %, quality complaints, ETA compliance, and hotel ratings. Auto-alerts for expiring certs.",
  },
];

/**
 * Initial competitor profiles from web research.
 */
export const INITIAL_COMPETITORS: CompetitorProfile[] = [
  {
    name: "MaxAB-Wasoko",
    type: "SCALEUP",
    vertical: "Horizontal FMCG",
    model: "Marketplace + Fintech",
    strengths: [
      "450K+ merchant network across 5 African markets",
      "$230M+ raised from Tiger Global, Silver Lake",
      "99% repayment rate on $20M+ merchant credit",
      "Recently acquired Fatura (626 wholesalers, 16 cities)",
      "Fintech license in Egypt; pivoting to financial services",
      "Same-day delivery infrastructure",
    ],
    weaknesses: [
      "Horizontal focus — treats hotels as generic retailers",
      "No hospitality-specific features (par levels, shelf life, FF&E)",
      "No ETA e-invoicing compliance",
      "Low-margin FMCG (2-5%); profitability concerns",
      "Closed Uganda/Zambia ops; leadership turnover",
      "No multi-property governance or approval workflows",
      "Buyer-side BNPL only; no supplier factoring",
    ],
    features: [
      "Mobile ordering app",
      "Same-day delivery",
      "Merchant credit / BNPL",
      "AI pricing & demand prediction",
      "Private-label products (10% of sales)",
      "Digital payments & top-ups",
    ],
    scale: {
      merchants: 450000,
      suppliers: 0,
      cities: "16+ in Egypt",
      countries: "5 (EG, KE, MA, RW, TZ)",
    },
    funding: "$230M+ raised",
    status: "ACTIVE",
  },
  {
    name: "FutureLog",
    type: "ENTERPRISE",
    vertical: "Hospitality P2P",
    model: "SaaS Subscription",
    strengths: [
      "Purpose-built for hospitality since 1999",
      "Full procure-to-pay: purchasing, inventory, invoicing",
      "Barcode scanning, recipe management, CAPEX tracking",
      "Strong in Europe, Middle East, Asia-Pacific",
      "5K+ users, cloud-native, mobile apps",
      "AI-powered invoice processing & LLM features",
    ],
    weaknesses: [
      "No Egypt-specific presence or ETA integration",
      "SaaS subscription model excludes SME hotels",
      "RFQ/bidding model creates price pressure",
      "No embedded finance or factoring",
      "No coastal logistics optimization",
      "Limited to properties with existing procurement maturity",
    ],
    features: [
      "eTender / eRFQ",
      "Inventory management with barcode scanning",
      "Recipe management & POS integration",
      "Contract management",
      "Business Intelligence reporting",
      "Mobile approvals & offline mode",
      "AI invoice processing",
    ],
    scale: {
      merchants: 0,
      suppliers: 0,
      cities: "Global",
      countries: "20+",
    },
    funding: "Privately held (Swiss)",
    status: "ACTIVE",
  },
  {
    name: "Fatura",
    type: "STARTUP",
    vertical: "Horizontal B2B Marketplace",
    model: "Asset-light Marketplace",
    strengths: [
      "Asset-light: no owned warehouses or fleets",
      "60,000 retailer network in Egypt",
      "626 wholesalers across 16 cities",
      "Embedded lending infrastructure via Tanmeyah",
      "Recently acquired by MaxAB-Wasoko (strategic value)",
    ],
    weaknesses: [
      "Acquired — no longer independent",
      "No hospitality verticalization",
      "No ETA compliance features",
      "Limited to wholesale connections",
      "No logistics coordination",
    ],
    features: [
      "B2B marketplace connecting retailers & wholesalers",
      "Embedded lending",
      "Multi-city coverage",
    ],
    scale: {
      merchants: 60000,
      suppliers: 626,
      cities: "16",
      countries: "Egypt",
    },
    funding: "Acquired by MaxAB-Wasoko (EFG Finance stake)",
    status: "ACQUIRED",
  },
  {
    name: "Fourth (formerly Fourth Hospitality)",
    type: "ENTERPRISE",
    vertical: "Hospitality F&B Procurement",
    model: "SaaS Subscription",
    strengths: [
      "5M+ purchase orders annually",
      "1,200+ locations across 52 countries",
      "Real-time pricing in digitized catalogs",
      "Strong F&B operational focus",
      "AP automation & inventory control",
    ],
    weaknesses: [
      "Heavily F&B focused — limited for FF&E, linens, amenities",
      "No Egypt market presence",
      "No ETA or local tax compliance",
      "No embedded finance",
      "Enterprise pricing excludes independents",
    ],
    features: [
      "Digitized supplier catalogs",
      "Real-time pricing updates",
      "PO & AP automation",
      "Inventory control",
      "Recipe management",
    ],
    scale: {
      merchants: 1200,
      suppliers: 0,
      cities: "Global",
      countries: "52",
    },
    funding: "Enterprise (part of larger group)",
    status: "ACTIVE",
  },
  {
    name: "BirchStreet Systems",
    type: "ENTERPRISE",
    vertical: "Integrated Procurement Suite",
    model: "Enterprise Licensing",
    strengths: [
      "Processes billions in hospitality procurement",
      "Integrated procurement + AP + inventory + recipe",
      "Direct PO processing with approved vendors",
      "Used by major hotel chains globally",
      "Spend analytics & reporting",
    ],
    weaknesses: [
      "North America centric; limited Egypt presence",
      "Requires existing chain relationships to get listed",
      "No discovery platform for new suppliers",
      "Enterprise implementation is heavy and expensive",
      "No fintech or factoring services",
      "No ETA compliance",
    ],
    features: [
      "Electronic catalog & PO processing",
      "AP automation",
      "Inventory control",
      "Recipe management",
      "Spend analytics",
    ],
    scale: {
      merchants: 0,
      suppliers: 0,
      cities: "North America + expanding",
      countries: "10+",
    },
    funding: "Private equity backed",
    status: "ACTIVE",
  },
  {
    name: "Capiter",
    type: "STARTUP",
    vertical: "Horizontal B2B E-commerce",
    model: "Marketplace",
    strengths: [
      "Egypt-focused B2B e-commerce",
      "Formerly well-funded ($33M raised)",
      "Served retailers and SMEs",
    ],
    weaknesses: [
      "SHUT DOWN in 2023 — failed to achieve unit economics",
      "No hospitality specialization",
      "Asset-heavy model burned cash too fast",
    ],
    features: ["B2B ordering", "Delivery"],
    scale: {
      merchants: 0,
      suppliers: 0,
      cities: "Cairo",
      countries: "Egypt",
    },
    funding: "$33M raised, shut down 2023",
    status: "SHUT_DOWN",
  },
  {
    name: "Amazon Business",
    type: "ENTERPRISE",
    vertical: "General B2B Marketplace",
    model: "Marketplace (8-15% referral)",
    strengths: [
      "5M+ business customers globally",
      "FBA fulfillment infrastructure",
      "Business Prime & net payment terms",
      "Massive product selection",
    ],
    weaknesses: [
      "No hospitality-specific features or workflows",
      "High competition = margin compression",
      "Amazon controls customer relationship",
      "No ETA compliance for Egypt",
      "No multi-property governance",
      "No embedded finance for hospitality",
    ],
    features: [
      "Bulk pricing",
      "Business Prime",
      "Tax-exempt purchasing",
      "Purchase approval workflows",
      "FBA fulfillment",
    ],
    scale: {
      merchants: 5000000,
      suppliers: 0,
      cities: "Global",
      countries: "10+",
    },
    funding: "Amazon (public company)",
    status: "ACTIVE",
  },
];
