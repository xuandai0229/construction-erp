import { round } from "@/lib/math";

export class TaxService {
  /**
   * Calculates VAT based on amount and rate.
   * Returns rounded vatAmount and netAmount.
   */
  static calculateVAT(grossAmount: number, vatRate: number = 10) {
    const vatAmount = round(grossAmount * (vatRate / 100));
    const netAmount = round(grossAmount - vatAmount);
    
    return {
      vatAmount,
      netAmount,
      vatRate
    };
  }

  /**
   * Calculates Gross from Net and VAT.
   */
  static calculateGrossFromNet(netAmount: number, vatRate: number = 10) {
    const grossAmount = round(netAmount / (1 - (vatRate / 100)));
    const vatAmount = round(grossAmount - netAmount);

    return {
      grossAmount,
      vatAmount,
      vatRate
    };
  }
}
