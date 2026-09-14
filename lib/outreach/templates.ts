/**
 * Oliv supplier outreach message bank (EN + Egyptian Arabic).
 *
 * FIRED ONLY through the real Meta WhatsApp send path (lib/notifications/whatsapp.ts)
 * once WHATSAPP_BEARER_TOKEN + WHATSAPP_PHONE_NUMBER_ID are present.
 *
 * NO-FAKE-DATA: these are ready-to-send templates. They claim only what the
 * product actually does (credit-limit assessment, ETA-verified invoice funding,
 * CHV000 referral). They do NOT claim any supplier was approved or onboarded.
 * "{"{name}"}" is the personalization slot filled at send time.
 */
export const OUTREACH_TEMPLATE = {
  // Meta requires an approved template name matching the body below.
  templateName: "hotelsvendors_oliv_credit_application_01",
  ctaUrl: "https://www.hotelsvendors.com/api/v1/oliv/click?source=outreach&ref=CHV000",

  en: {
    header: "*HotelsVendors × Financing*",
    body:
      "Hello {name} 👋\n\n" +
      "If you supply hotels, late payment is the real cost you carry. " +
      "We can assess a credit line for your invoices the same day — up to {" +
      "amount} against ETA-verified invoices, funded in 48h, non-recourse.\n\n" +
      "• Same-day credit-limit assessment\n" +
      "• Invoices paid in 48 hours\n" +
      "• No integration or fees to start\n\n" +
      "Apply in minutes (with your referral CHV000):\n" +
      "{{1}}",
  },

  ar: {
    header: "*HotelsVendors × تمويل*",
    body:
      "أهلاً {name} 👋\n\n" +
      "إذا كنتَ تُورّد للفنادق، فتأخّر السداد هو التكلفة الحقيقية التي تتحمّلها. " +
      "يمكننا تقييم حدّ ائتماني لفواتيرك في نفس اليوم — حتى {" +
      "amount} مقابل فواتير إلكترونية موثّقة من مصلحة الضرائب، يتم صرفها خلال 48 ساعة وبدون رجوع.\n\n" +
      "• تقييم حدّ الائتمان في نفس اليوم\n" +
      "• سداد الفواتير خلال 48 ساعة\n" +
      "• بدون أي تكامل أو رسوم للبدء\n\n" +
      "قدّم الآن في دقائق (باكود الإحالة CHV000):\n" +
      "{{1}}",
  },
} as const;

/** Default body for a given language (excluding the CTA param slot). */
export function outreachBody(lang: "en" | "ar", name: string, amount = "EGP 10,000,000") {
  const t = OUTREACH_TEMPLATE[lang];
  return `${t.header}\n\n${t.body
    .replace("{name}", name)
    .replace("{amount}", amount)
    .replace("{{1}}", OUTREACH_TEMPLATE.ctaUrl)}`;
}