import { ReconciliationService } from "./reconciliation.service";
import * as csvParse from "csv-parse/sync";

export type SupportedBank = "VIETCOMBANK" | "TECHCOMBANK" | "BIDV";

export class BankStatementAdapter {
  /**
   * Parses a raw CSV bank statement into the standard format required by the Reconciliation engine.
   */
  static parseStatement(bank: SupportedBank, rawCsvData: string) {
    const records = csvParse.parse(rawCsvData, { columns: true, skip_empty_lines: true });

    switch (bank) {
      case "VIETCOMBANK":
        return this.parseVCB(records);
      case "TECHCOMBANK":
        return this.parseTCB(records);
      case "BIDV":
        return this.parseBIDV(records);
      default:
        throw new Error(`Unsupported bank format: ${bank}`);
    }
  }

  private static parseVCB(records: any[]) {
    // VCB typically has: 'Date', 'Reference No', 'Debit', 'Credit', 'Description'
    return records
      .filter((row: any) => parseFloat(row["Debit"] || "0") > 0) // We reconcile outward payments (Debits from our bank account)
      .map((row: any) => ({
        ref: row["Reference No"],
        amount: parseFloat(row["Debit"]),
        date: new Date(row["Date"]).toISOString(),
        description: row["Description"],
      }));
  }

  private static parseTCB(records: any[]) {
    // TCB mapping logic
    return records
      .filter((row: any) => parseFloat(row["Amount"] || "0") < 0) // TCB uses negative amounts for outflows
      .map((row: any) => ({
        ref: row["Transaction ID"],
        amount: Math.abs(parseFloat(row["Amount"])),
        date: new Date(row["Posting Date"]).toISOString(),
        description: row["Narrative"],
      }));
  }

  private static parseBIDV(records: any[]) {
    // BIDV mapping logic
    return records
      .filter((row: any) => parseFloat(row["Withdrawal"] || "0") > 0)
      .map((row: any) => ({
        ref: row["Trace Number"],
        amount: parseFloat(row["Withdrawal"]),
        date: new Date(row["Txn Date"]).toISOString(),
        description: row["Remarks"],
      }));
  }

  /**
   * Orchestrates the import and reconciliation workflow.
   */
  static async importAndReconcile(params: {
    projectId: string;
    period: string;
    bank: SupportedBank;
    rawCsvData: string;
  }) {
    // 1. Parse CSV to standard array
    const standardizedItems = this.parseStatement(params.bank, params.rawCsvData);

    // 2. Pass to the reconciliation engine
    const reconResult = await ReconciliationService.runBankReconciliation(
      params.projectId,
      params.period,
      standardizedItems
    );

    return reconResult;
  }
}
