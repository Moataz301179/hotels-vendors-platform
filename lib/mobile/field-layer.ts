export const HOTEL_FIELD_ROLES = ['OWNER', 'REGIONAL_GM', 'GM', 'FINANCIAL_CONTROLLER', 'RECEIVING_CLERK'] as const;

export type MobileSurface = 'phone' | 'web';
export type MobileWorkspace = 'hotel-field' | 'carrier-field' | 'supplier-field' | 'web-only';

export type MobileModule = {
  id: string;
  title: string;
  purpose: string;
  surface: MobileSurface;
};

export type MobilePlan = {
  workspace: MobileWorkspace;
  title: string;
  summary: string;
  deskPath: string;
  modules: MobileModule[];
  withheld: string[];
};

type Actor = { platformRole: string; role: string };

const commercialBoundary = [
  'Supplier identity on a hotel buying surface',
  'Prices, invoices, and funding decisions',
  'Binding offers and stock',
];

function desk(path: string) {
  if (!path.startsWith('/') || path.startsWith('//')) throw new Error('MOBILE_DESK_PATH_INVALID');
  return path;
}

/**
 * Decides what the signed-in account may do on the phone.
 * The phone is a field layer on the same account. It is not a second
 * purchasing, pricing, or funding system.
 */
export function planMobileWorkspace(actor: Actor): MobilePlan {
  if (actor.platformRole === 'HOTEL' && (HOTEL_FIELD_ROLES as readonly string[]).includes(actor.role)) {
    return {
      workspace: 'hotel-field',
      title: 'Hotel field',
      summary: 'This phone records the delivery, a physical count, and an open exception. Sourcing, approval, and payment stay on the hotel desk.',
      deskPath: desk('/orders'),
      modules: [
        { id: 'arrivals', title: 'Arrivals', purpose: 'Open an authorized delivery and record what physically arrived.', surface: 'phone' },
        { id: 'count', title: 'Physical count', purpose: 'Scan a hotel item and submit a counted quantity for a different person to review.', surface: 'phone' },
        { id: 'exceptions', title: 'Exceptions', purpose: 'See a disputed receipt. The phone does not close it.', surface: 'phone' },
        { id: 'approvals', title: 'Approvals', purpose: 'Authority and payment decisions stay on the hotel desk.', surface: 'web' },
        { id: 'sourcing', title: 'Sourcing', purpose: 'Catalog research and quote requests stay on the hotel desk.', surface: 'web' },
      ],
      withheld: commercialBoundary,
    };
  }

  if (actor.platformRole === 'SHIPPING') {
    return {
      workspace: 'carrier-field',
      title: 'Carrier field',
      summary: 'This phone accepts an assigned movement and shows its checkpoint. Rates and proof upload stay on the carrier desk.',
      deskPath: desk('/carrier'),
      modules: [
        { id: 'assignments', title: 'Assignments', purpose: 'Accept or decline a movement assigned to this carrier.', surface: 'phone' },
        { id: 'movements', title: 'Movements', purpose: 'See pickup and delivery checkpoints without prices.', surface: 'phone' },
        { id: 'rates', title: 'Rates and planning', purpose: 'Corridor rates and shipment planning stay on the carrier desk.', surface: 'web' },
      ],
      withheld: ['Hotel prices and invoices', 'Funding status', 'Another carrier’s assignments'],
    };
  }

  if (actor.platformRole === 'SUPPLIER') {
    return {
      workspace: 'supplier-field',
      title: 'Supplier field',
      summary: 'This phone shows fulfillment already assigned to this supplier. Quotes, prices, and catalog changes stay on the supplier desk.',
      deskPath: desk('/suppliers'),
      modules: [
        { id: 'fulfillment', title: 'Fulfillment', purpose: 'See the quantities to prepare. The phone does not change the order.', surface: 'phone' },
        { id: 'quotes', title: 'Quotes and catalog', purpose: 'Commercial responses and catalog evidence stay on the supplier desk.', surface: 'web' },
      ],
      withheld: ['Other suppliers', 'The hotel discovery catalogue', 'Prices'],
    };
  }

  const closed = actor.platformRole === 'FACTORING'
    ? { path: '/funding', title: 'Funding desk', summary: 'A funding decision uses the receipt and the invoice together. That review stays on the funder desk. This phone does not approve money.' }
    : actor.platformRole === 'ADMIN'
      ? { path: '/admin', title: 'Network desk', summary: 'Network control stays on the administrator desk. This phone is not a second control plane.' }
      : actor.platformRole === 'HOTEL'
        ? { path: '/orders', title: 'Hotel desk', summary: 'This account follows requirements and approvals on the hotel desk. Receiving on the phone starts only after a receiving role is assigned.' }
        : { path: '/dashboard', title: 'HotelsVendors desk', summary: 'This account has no field workspace. Continue on the desk that matches the organization.' };

  return {
    workspace: 'web-only',
    title: closed.title,
    summary: closed.summary,
    deskPath: desk(closed.path),
    modules: [{ id: 'desk', title: 'Continue on the desk', purpose: closed.summary, surface: 'web' }],
    withheld: commercialBoundary,
  };
}
