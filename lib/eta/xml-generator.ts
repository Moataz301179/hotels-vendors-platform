/**
 * ETA XML Invoice Generator
 * Hotels Vendors Compliance Layer
 *
 * Generates UBL 2.1 XML invoices compliant with Egyptian Tax Authority
 * (ETA) V2 specification. The XML payload is what gets submitted to
 * the ETA documentsubmissions endpoint.
 *
 * ⚠️  The generated XML is SIMULATED for sandbox/preprod environments.
 *     Real production XML requires a valid PKCS#12 digital signature.
 */

// ── Types ──

interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  issueDate: Date;
  dueDate?: Date | null;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  currency: string;
  description?: string | null;
  descriptionAr?: string | null;
  codeName?: string | null;
  codeNameAr?: string | null;
  order?: {
    orderNumber: string;
    items: Array<{
      quantity: number;
      unitPrice: number;
      total: number;
      product: {
        name: string;
        sku: string;
        unitOfMeasure: string;
        description?: string | null;
      };
    }>;
  } | null;
}

interface PartyRecord {
  name: string;
  taxId: string;
  address?: string | null;
  city: string;
  governorate: string;
  legalName?: string | null;
}

// ── Helpers ──

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function fmtDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function fmtNum(n: number): string {
  return n.toFixed(2);
}

function buildAddressLines(addr: PartyRecord): string {
  const lines: string[] = [];
  if (addr.address) lines.push(esc(addr.address));
  lines.push(esc(addr.city));
  lines.push(esc(addr.governorate));
  lines.push("EG");
  return lines.map((l) => `<cbc:AddressLine><cbc:Line>${l}</cbc:Line></cbc:AddressLine>`).join("\n            ");
}

function buildParty(tag: "SellerSupplierParty" | "AccountingCustomerParty", party: PartyRecord): string {
  const roleTag = tag === "SellerSupplierParty" ? "SellerSupplierParty" : "AccountingCustomerParty";
  return `
        <cac:${roleTag}>
            <cac:Party>
                <cbc:EndpointID schemeID="EG-TIN">${esc(party.taxId)}</cbc:EndpointID>
                <cac:PartyLegalEntity>
                    <cbc:RegistrationName>${esc(party.legalName || party.name)}</cbc:RegistrationName>
                    <cbc:CompanyID schemeID="EG-TIN">${esc(party.taxId)}</cbc:CompanyID>
                    <cac:PostalAddress>
                        ${buildAddressLines(party)}
                    </cac:PostalAddress>
                </cac:PartyLegalEntity>
                <cac:PostalAddress>
                    ${buildAddressLines(party)}
                </cac:PostalAddress>
            </cac:Party>
        </cac:${roleTag}>`;
}

function buildLineItem(
  idx: number,
  item: NonNullable<InvoiceRecord["order"]>["items"][number],
  vatRate: number
): string {
  const taxableAmount = Number(item.total || 0);
  const taxAmount = taxableAmount * (vatRate / 100);

  return `
        <cac:InvoiceLine>
            <cbc:ID>${idx}</cbc:ID>
            <cbc:InvoicedQuantity unitCode="EA">${item.quantity}</cbc:InvoicedQuantity>
            <cbc:LineExtensionAmount currencyID="EGP">${fmtNum(item.total)}</cbc:LineExtensionAmount>
            <cac:Item>
                <cbc:Name>${esc(item.product.name)}</cbc:Name>
                <cbc:Description>${esc(item.product.description || item.product.name)}</cbc:Description>
                <cac:SellersItemIdentification>
                    <cbc:ID>${esc(item.product.sku)}</cbc:ID>
                </cac:SellersItemIdentification>
                <cac:ClassifiedTaxCategory>
                    <cbc:ID>S</cbc:ID>
                    <cbc:Percent>${vatRate}</cbc:Percent>
                    <cac:TaxScheme>
                        <cbc:ID>EG-VAT</cbc:ID>
                    </cac:TaxScheme>
                </cac:ClassifiedTaxCategory>
            </cac:Item>
            <cac:Price>
                <cbc:PriceAmount currencyID="EGP">${fmtNum(item.unitPrice)}</cbc:PriceAmount>
                <cbc:BaseQuantity unitCode="${esc(item.product.unitOfMeasure)}">1</cbc:BaseQuantity>
            </cac:Price>
            <cac:TaxTotal>
                <cbc:TaxAmount currencyID="EGP">${fmtNum(taxAmount)}</cbc:TaxAmount>
                <cac:TaxSubtotal>
                    <cbc:TaxableAmount currencyID="EGP">${fmtNum(taxableAmount)}</cbc:TaxableAmount>
                    <cbc:TaxAmount currencyID="EGP">${fmtNum(taxAmount)}</cbc:TaxAmount>
                    <cac:TaxCategory>
                        <cbc:ID>S</cbc:ID>
                        <cbc:Percent>${vatRate}</cbc:Percent>
                        <cac:TaxScheme>
                            <cbc:ID>EG-VAT</cbc:ID>
                        </cac:TaxScheme>
                    </cac:TaxCategory>
                </cac:TaxSubtotal>
            </cac:TaxTotal>
        </cac:InvoiceLine>`;
}

// ── Main Generator ──

/**
 * Generate ETA-compliant UBL 2.1 XML for invoice submission.
 *
 * @param invoice  — The platform Invoice record (with items via order relation)
 * @param supplier — The seller/supplier party
 * @param hotel    — The buyer/hotel party
 * @returns        — XML string ready for ETA submission
 */
export function generateEtaXml(
  invoice: InvoiceRecord,
  supplier: PartyRecord,
  hotel: PartyRecord
): string {
  const vatRate = invoice.vatRate || 14;
  const lines = invoice.order?.items ?? [];

  const lineItemsXml = lines
    .map((item, i) => buildLineItem(i + 1, item, vatRate))
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:cnmb:io:en:ubl:invoice:xsd:0.1"
         xmlns:cbc="urn:cnmb:io:en:ubl:cbc:xsd:0.1"
         xmlns:cac="urn:cnmb:io:en:ubl:cac:xsd:0.1">
    <cbc:ID>${esc(invoice.invoiceNumber)}</cbc:ID>
    <cbc:IssueDate>${fmtDate(invoice.issueDate)}</cbc:IssueDate>
    ${invoice.dueDate ? `<cbc:DueDate>${fmtDate(invoice.dueDate)}</cbc:DueDate>` : ""}
    <cbc:InvoiceTypeCode>388</cbc:InvoiceTypeCode>
    <cbc:DocumentCurrencyCode>${esc(invoice.currency || "EGP")}</cbc:DocumentCurrencyCode>
    ${invoice.order ? `<cbc:OrderReference><cbc:ID>${esc(invoice.order.orderNumber)}</cbc:ID></cbc:OrderReference>` : ""}
    <cbc:AccountingCost>Procurement</cbc:AccountingCost>

    ${buildParty("SellerSupplierParty", supplier)}
    ${buildParty("AccountingCustomerParty", hotel)}

    <cac:PaymentMeans>
        <cbc:PaymentMeansCode>30</cbc:PaymentMeansCode>
        <cbc:PaymentDueDate>${fmtDate(invoice.dueDate || invoice.issueDate)}</cbc:PaymentDueDate>
        <cbc:InstructionNote>Bank Transfer</cbc:InstructionNote>
    </cac:PaymentMeans>

    <cac:PaymentTerms>
        <cbc:Note>Net 30</cbc:Note>
    </cac:PaymentTerms>

    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="EGP">${fmtNum(invoice.vatAmount)}</cbc:TaxAmount>
        <cac:TaxSubtotal>
            <cbc:TaxableAmount currencyID="EGP">${fmtNum(invoice.subtotal)}</cbc:TaxableAmount>
            <cbc:TaxAmount currencyID="EGP">${fmtNum(invoice.vatAmount)}</cbc:TaxAmount>
            <cac:TaxCategory>
                <cbc:ID>S</cbc:ID>
                <cbc:Percent>${vatRate}</cbc:Percent>
                <cac:TaxScheme>
                    <cbc:ID>EG-VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:TaxCategory>
        </cac:TaxSubtotal>
    </cac:TaxTotal>

    <cac:LegalMonetaryTotal>
        <cbc:LineExtensionAmount currencyID="EGP">${fmtNum(invoice.subtotal)}</cbc:LineExtensionAmount>
        <cbc:TaxExclusiveAmount currencyID="EGP">${fmtNum(invoice.subtotal)}</cbc:TaxExclusiveAmount>
        <cbc:TaxInclusiveAmount currencyID="EGP">${fmtNum(invoice.total)}</cbc:TaxInclusiveAmount>
        <cbc:PayableAmount currencyID="EGP">${fmtNum(invoice.total)}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>

    ${lineItemsXml}
</Invoice>`;
}
