import MarketplaceClient from "./marketplace-client";

/** Public discovery page; authenticated actions are gated at the action/API boundary. */
export default function MarketplacePage() {
  return <MarketplaceClient />;
}
