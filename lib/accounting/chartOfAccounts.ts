import { AccountType } from "@prisma/client";

/**
 * Standard Chart of Accounts (COA) for the ERP system.
 */
export const CHART_OF_ACCOUNTS = [
  // ASSETS (1000s)
  { code: "1010", name: "Tiền mặt (Cash)", type: AccountType.ASSET },
  { code: "1020", name: "Tiền gửi ngân hàng (Bank)", type: AccountType.ASSET },
  { code: "1310", name: "Phải thu khách hàng (Accounts Receivable)", type: AccountType.ASSET },
  
  // LIABILITIES (2000s)
  { code: "3310", name: "Phải trả người bán (Accounts Payable)", type: AccountType.LIABILITY },
  
  // EQUITY (3000s)
  { code: "4110", name: "Vốn chủ sở hữu (Equity)", type: AccountType.EQUITY },
  
  // INCOME (4000s)
  { code: "5110", name: "Doanh thu bán hàng và cung cấp dịch vụ (Revenue)", type: AccountType.INCOME },
  
  // EXPENSES (6000s)
  { code: "6210", name: "Chi phí nguyên vật liệu trực tiếp (Materials)", type: AccountType.EXPENSE },
  { code: "6220", name: "Chi phí nhân công trực tiếp (Labor)", type: AccountType.EXPENSE },
  { code: "6230", name: "Chi phí sử dụng máy thi công (Machine)", type: AccountType.EXPENSE },
  { code: "6270", name: "Chi phí sản xuất chung (Overhead)", type: AccountType.EXPENSE },
];

export async function seedChartOfAccounts(tx: any) {
  for (const account of CHART_OF_ACCOUNTS) {
    await tx.ledgerAccount.upsert({
      where: { code: account.code },
      update: { name: account.name, type: account.type },
      create: account,
    });
  }
}
