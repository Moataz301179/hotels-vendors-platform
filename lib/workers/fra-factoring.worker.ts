import {rejectNativeFunding} from "@/lib/fintech/external-only";
interface FactoringPayload {
  invoiceId: string;
  supplierId: string;
  hotelId: string;
  amount: number;
  etaUuid: string;
  tenantId: string;
  payoutMethod?: "instapay" | "paymob" | "bank_transfer";
}

export async function processFactoringRequest(_payload:FactoringPayload):Promise<never>{return rejectNativeFunding()}
