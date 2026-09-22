const taxPatterns: Record<string, RegExp> = {
  EG: /^\d{9,15}$/,
  SA: /^\d{15}$/,
  AE: /^\d{15}$/,
  US: /^\d{2}-\d{7}$/,
  GB: /^\d{9,12}$/,
  DE: /^\d{11}$/,
  FR: /^[A-Z]{2}\d{9}$/,
}

export function validateTaxId(taxId: string, countryCode = "EG"): { valid: boolean; message?: string } {
  if (!taxId || taxId.trim().length === 0) {
    return { valid: false, message: "Tax ID is required" }
  }

  const cleaned = taxId.trim()
  const pattern = taxPatterns[countryCode] || taxPatterns.EG

  if (!pattern.test(cleaned)) {
    if (countryCode === "EG") {
      return { valid: false, message: "Egyptian Tax ID must be 9 to 15 digits" }
    }
    return { valid: false, message: `Invalid Tax ID format for ${countryCode}` }
  }

  return { valid: true }
}

export const TAX_ID_PLACEHOLDER = "Corporate Tax ID"
export const TAX_ID_HELP_TEXT = "9-15 digit Egyptian Tax Identification Number"
