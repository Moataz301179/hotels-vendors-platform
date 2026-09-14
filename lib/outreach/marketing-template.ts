/**
 * HotelsVendors marketing email (English) — sells the HotelsVendors service with
 * an attached working-capital credit line via Oliv, referral CHV000.
 *
 * HONESTY (NO-FAKE-DATA): only markets what the product genuinely does —
 * procurement SaaS, "buy now, pay in 48h" / 48-hour invoice funding via the Oliv
 * financing partner, referral CHV000 bakery-in. It does NOT invent revenue,
 * onboardings, or guarantees. The CTA routes through the real attribution link.
 */

export const HV_CTA = "https://www.hotelsvendors.com/api/v1/oliv/click?source=marketing-edge&ref=CHV000";

export function hvMarketingSubject(): string {
  return "Procurement that pays your invoices back in 48 hours";
}

export function hvMarketingHtml(company: string, num: number): string {
  const cta = `https://www.hotelsvendors.com/api/v1/oliv/click?source=marketing-edge&sourceId=${num}&ref=CHV000`;
  const green = "#314B43";
  const gold = "#8a6d3b";
  const dark = "#111827";
  return `
  <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: ${dark};">
    <h2 style="color: ${green}; margin: 0 0 4px;">${company}</h2>
    <p style="margin: 0 0 16px; font-size: 12px; color: ${gold}; font-weight: 600;">HotelsVendors × Financing Partner (Oliv)</p>
    <p>Hello ${company} team,</p>
    <p>You already know the strain of unpaid invoices — cash sits in your debtors&#8217; books while you carry supplier costs. <strong>HotelsVendors</strong> is procurement software with an embedded answer: buy the way you buy today, and let the platform&#8217;s financing partner convert your <strong>ETA-verified e-invoices into cash within 48 hours</strong>.</p>
    <ul style="font-size: 14px; line-height: 1.7;">
      <li>Same working-capital credit assessment on your invoices</li>
      <li>Funded in 48 hours through our financing partner</li>
      <li>Non-recourse, ETA-verified, no integration needed to start</li>
    </ul>
    <p style="font-size: 14px;">Open your financing line through the HotelsVendors portal (referral <strong>CHV000</strong>):</p>
    <a href="${cta}" style="display: inline-block; padding: 12px 26px; background: ${green}; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 12px 0;">Connect your working-capital credit line</a>
    <p style="font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 12px;">Sent by HotelsVendors · referral <strong>CHV000</strong> · If this isn&#8217;t relevant, we apologise — reply &#8220;unsubscribe&#8221; and we&#8217;ll remove you.</p>
  </div>`;
}

export function hvMarketingText(company: string, num: number): string {
  const cta = `https://www.hotelsvendors.com/api/v1/oliv/click?source=marketing-edge&sourceId=${num}&ref=CHV000`;
  return `Hello ${company} team,

You already know the strain of unpaid invoices — cash sits in your debtors' books while you carry supplier costs.

HotelsVendors is procurement software with an embedded answer: buy the way you buy today, and let the platform's financing partner convert your ETA-verified e-invoices into cash within 48 hours.

• Same working-capital credit assessment on your invoices
• Funded in 48 hours through our financing partner
• Non-recourse, ETA-verified, no integration needed to start

Open your financing line through the HotelsVendors portal (referral CHV000):
${cta}

Sent by HotelsVendors · referral CHV000 · reply "unsubscribe" to opt out.`;
}