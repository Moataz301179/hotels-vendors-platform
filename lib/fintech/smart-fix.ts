import {rejectNativeFunding} from "./external-only";
export interface SmartFix {
  type: "deposit" | "high_risk_factoring" | "split_payment" | "auto_limit_extension";
  description: string;
  amount?: number;
  newLimit?: number;
  terms?: string;
}

export function generateSmartFix(_hotelId:string,_orderValue:number,_currentCreditUsed:number,_currentCreditTotal:number,_riskScore:number):SmartFix[]{return rejectNativeFunding()}
