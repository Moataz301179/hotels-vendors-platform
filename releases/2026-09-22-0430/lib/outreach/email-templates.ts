/**
 * Oliv email outreach (EN + Egyptian Arabic) — real supplier onboarding emails.
 *
 * Sent ONLY through the live Hostinger SMTP path (reem@hotelsvendors.com) via
 * lib/notifications/email.ts. NO-FAKE-DATA: invites claim only what the product
 * actually does (same-day credit assessment, ETA-verified invoice funding in
 * 48h, CHV000 referral). They do NOT claim any supplier was approved/onboarded.
 *
 * The CTA is the REAL attribution + app-router:
 *   /api/v1/oliv/click?source=outreach&sourceId=<num>&ref=CHV000
 * which records the CHV000 referral server-side, then redirects to the correct
 * Oliv destination (Android / iOS / web) with ref=CHV000 embedded.
 */

export const OLIV_CTA_BASE = "https://www.hotelsvendors.com/api/v1/oliv/click?source=outreach&ref=CHV000";
export const OLIV_REFERRAL_CODE = "CHV000";

function ctaFor(num: number): string {
  return `https://www.hotelsvendors.com/api/v1/oliv/click?source=outreach&sourceId=${num}&ref=CHV000`;
}

export function olivEmailSubject(lang: "en" | "ar"): string {
  return lang === "ar"
    ? "تمويل فواتيرك خلال 48 ساعة من HotelsVendors"
    : "Get your invoices funded in 48h with HotelsVendors";
}

export function olivWelcomeHtml(lang: "en" | "ar", company: string, num: number): string {
  const cta = ctaFor(num);
  const brandGreen = "#314B43";
  const gold = "#8a6d3b";
  const dark = "#111827";

  if (lang === "ar") {
    return `
    <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: ${dark}; direction: rtl; text-align: right;">
      <h2 style="color: ${brandGreen}; margin: 0 0 4px;">${company}</h2>
      <p style="margin: 0 0 16px; font-size: 12px; color: ${gold}; font-weight: 600;">تعاون تمويل فواتير الموردين — HotelsVendors × Oliv</p>
      <p>مرحباً فريق ${company}،</p>
      <p>إذا كُنتُمْ تُورّدون للفنادق، فتأخّر السداد هو التكلفة الحقيقية التي تتحمّلونها. يمكننا تقييم حدّ ائتماني لفواتيركم في نفس اليوم، وصرفه خلال <strong>48 ساعة</strong> وبطريقة غير رجعية ضدّ فواتير إلكترونية موثّقة من مصلحة الضرائب (ETA).</p>
      <ul style="font-size: 14px; line-height: 1.7; padding-right: 18px;">
        <li>تقييم حدّ الائتمان في نفس اليوم</li>
        <li>سداد الفواتير خلال 48 ساعة</li>
        <li>لا تكامل ولا رسوم للبدء</li>
      </ul>
      <a href="${cta}" style="display: inline-block; padding: 12px 26px; background: ${brandGreen}; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 16px 0;">قدّم الآن — كود الإحالة CHV000</a>
      <p style="font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 12px;">تم الإرسال من HotelsVendors · كود الإحالة CHV000 · مع تحيات فريق HotelsVendors</p>
    </div>`;
  }

  // English
  return `
  <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: ${dark};">
    <h2 style="color: ${brandGreen}; margin: 0 0 4px;">${company}</h2>
    <p style="margin: 0 0 16px; font-size: 12px; color: ${gold}; font-weight: 600;">Supplier Invoice Financing — HotelsVendors × Oliv</p>
    <p>Hello ${company} team,</p>
    <p>If your business carries unpaid invoices, late payment is the real cost you bear. We can assess a credit line against your invoices the same day and fund it in <strong>48 hours</strong> — non-recourse, backed by ETA-verified e-invoices.</p>
    <ul style="font-size: 14px; line-height: 1.7;">
      <li>Same-day credit-limit assessment</li>
      <li>Invoices paid within 48 hours</li>
      <li>No integration and no fees to start</li>
    </ul>
    <a href="${cta}" style="display: inline-block; padding: 12px 26px; background: ${brandGreen}; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 16px 0;">Apply now — referral code CHV000</a>
    <p style="font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 12px;">Sent by HotelsVendors · referral CHV000 · Best regards, the HotelsVendors team</p>
  </div>`;
}

export function olivWelcomeText(lang: "en" | "ar", company: string, num: number): string {
  const cta = ctaFor(num);
  if (lang === "ar") {
    return `مرحباً فريق ${company}،

إذا كُنتُمْ تُورّدون للفنادق، يمكننا تقييم حدّ ائتماني لفواتيركم في نفس اليوم وصرفه خلال 48 ساعة، غير رجعي، ضدّ فواتير ETA موثّقة.

• تقييم حدّ الائتمان في نفس اليوم
• سداد الفواتير خلال 48 ساعة
• بدون تكامل أو رسوم

قدّم الآن بكود الإحالة CHV000:
${cta}

فريق HotelsVendors`;
  }
  return `Hello ${company} team,

If your business carries unpaid invoices, late payment is the real cost you bear. We can assess a credit line against your invoices the same day and fund it in 48 hours, non-recourse, backed by ETA-verified e-invoices.

• Same-day credit-limit assessment
• Invoices paid within 48 hours
• No integration and no fees to start

Apply now with referral code CHV000:
${cta}

Best regards,
The HotelsVendors team`;
}

/** Force a language OR detect from company/location latin vs arabic presence. */
export function detectLang(name: string): "en" | "ar" {
  return /[\u0600-\u06FF]/.test(name) ? "ar" : "en";
}