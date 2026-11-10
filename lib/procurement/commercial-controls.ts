export type CommercialHandoff = {
  role: string;
  action: string;
  href: string;
  control: string;
};

/**
 * The commercial path is a sequence of separate authorities.
 * A hotel list is not an order. A 48-hour supplier payment is not a hotel checkout
 * and is not a payment this platform can make.
 */
export const commercialHandoffs: CommercialHandoff[] = [
  { role: "Hotel", action: "Select quantities", href: "/marketplace", control: "The list stores a specification and a quantity. It has no price, vendor, or payment." },
  { role: "Hotel", action: "Send sealed requests", href: "/workspace/marketplace/basket", control: "Each line becomes its own request. Vendors do not see each other or the hotel’s other demand." },
  { role: "Vendor", action: "Answer an allocated request", href: "/suppliers", control: "A vendor can respond only to a request allocated to that vendor." },
  { role: "Administrator", action: "Record the payment guarantee", href: "/admin", control: "An independent administrator records the guarantee. The hotel cannot certify its own payment." },
  { role: "Hotel approver", action: "Approve the order", href: "/orders?view=approval", control: "Approval stays closed until that guarantee exists. A department user cannot approve." },
  { role: "Assigned vendor", action: "Confirm and dispatch", href: "/orders", control: "Only the assigned vendor can confirm. Dispatch stays closed without the guarantee." },
  { role: "Receiving clerk", action: "Record the receipt", href: "/orders?view=receiving", control: "The receipt records what arrived. It does not create a payment." },
  { role: "Vendor", action: "Request a 48-hour funder payment", href: "/funding", control: "A funder may pay the vendor after delivery, an accepted receipt, a payment guarantee, and an ETA-accepted signed invoice. The hotel’s own payment term does not change." },
  { role: "Funder", action: "Decide and settle", href: "/funding/evidence", control: "The funder approves, disburses, and settles. HotelsVendors records the report and does not move the money." },
];

export function supplierEarlyPaymentAllowed(order: { status: string; paymentGuaranteed: boolean; receiptAccepted: boolean; invoiceAccepted: boolean }): boolean {
  return order.status === "DELIVERED" && order.paymentGuaranteed && order.receiptAccepted && order.invoiceAccepted;
}
