/**
 * ETA Tax Code Registry
 * Hotels Vendors Compliance Layer
 *
 * Egyptian Tax Authority standard tax type codes (T1–T12)
 * with hospitality-specific active flags and bilingual labels.
 */

export { EtaTaxType } from "./types";
import type { EtaTaxType } from "./types";

export interface TaxCodeEntry {
  code: string;
  labelEn: string;
  labelAr: string;
  subType: string;
  defaultRate: number;
  activeForHospitality: boolean;
}

export const TAX_CODE_REGISTRY: Record<string, TaxCodeEntry> = {
  T1: { code: "T1", labelEn: "Value Added Tax", labelAr: "ضريبه القيمه المضافه", subType: "V009", defaultRate: 14, activeForHospitality: true },
  T2: { code: "T2", labelEn: "Reduced VAT Rate", labelAr: "ضريبه القيمه المضافه المخفضه", subType: "V002", defaultRate: 0, activeForHospitality: false },
  T3: { code: "T3", labelEn: "Zero Rate VAT", labelAr: "ضريبه القيمه المضافه صفر", subType: "V001", defaultRate: 0, activeForHospitality: false },
  T4: { code: "T4", labelEn: "Withholding Tax", labelAr: "الخصم تحت حساب الضريبه", subType: "W003", defaultRate: 5, activeForHospitality: true },
  T5: { code: "T5", labelEn: "Stamp Tax", labelAr: "ضريبه الدمغه", subType: "S001", defaultRate: 0, activeForHospitality: false },
  T6: { code: "T6", labelEn: "Real Estate Tax", labelAr: "ضريبه العقارات", subType: "R001", defaultRate: 0, activeForHospitality: false },
  T7: { code: "T7", labelEn: "Customs Duty", labelAr: "رسوم الجمارك", subType: "C001", defaultRate: 0, activeForHospitality: false },
  T8: { code: "T8", labelEn: "Excise Tax", labelAr: "ضريبه الاستهلاك", subType: "E001", defaultRate: 0, activeForHospitality: false },
  T9: { code: "T9", labelEn: "Revenue Stamp", labelAr: "دمغه ايراديه", subType: "RS01", defaultRate: 0, activeForHospitality: false },
  T10: { code: "T10", labelEn: "Entertainment Tax", labelAr: "ضريبه الترفيه", subType: "ET01", defaultRate: 0, activeForHospitality: false },
  T11: { code: "T11", labelEn: "Resource Development", labelAr: "ضريبه تطوير الموارد", subType: "RD01", defaultRate: 0, activeForHospitality: false },
  T12: { code: "T12", labelEn: "Other Tax", labelAr: "ضريبه اخرى", subType: "OT01", defaultRate: 0, activeForHospitality: false },
};

export const HOSPITALITY_TAX_CODES = Object.values(TAX_CODE_REGISTRY).filter(
  (tc) => tc.activeForHospitality
);

export function getTaxCode(code: string): TaxCodeEntry {
  const entry = TAX_CODE_REGISTRY[code];
  if (!entry) throw new Error(`Unknown tax code: ${code}`);
  return entry;
}

export function getVatTaxCode(): TaxCodeEntry {
  return getTaxCode("T1");
}

export function getWithholdingTaxCode(): TaxCodeEntry {
  return getTaxCode("T4");
}

export function buildTaxableItem(
  taxType: string,
  amount: number,
  rate?: number
): { taxType: string; amount: number; subType: string; rate: number } {
  const code = TAX_CODE_REGISTRY[taxType];
  if (!code) throw new Error(`Unknown tax type: ${taxType}`);
  return {
    taxType,
    amount,
    subType: code.subType,
    rate: rate ?? code.defaultRate,
  };
}

export function buildTaxTotal(
  taxType: string,
  amount: number
): { taxType: string; amount: number } {
  return { taxType, amount };
}

export function isValidTaxType(code: string): boolean {
  return code in TAX_CODE_REGISTRY;
}

export function getTaxLabel(code: string, locale: "en" | "ar" = "en"): string {
  const entry = TAX_CODE_REGISTRY[code];
  if (!entry) throw new Error(`Unknown tax code: ${code}`);
  return locale === "ar" ? entry.labelAr : entry.labelEn;
}
