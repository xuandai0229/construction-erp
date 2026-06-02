import fs from "node:fs";
import path from "node:path";
import { prisma } from "../../lib/prisma";

export const reconciliationDir = path.join(process.cwd(), "docs", "reconciliation");
export const auditDir = path.join(process.cwd(), "docs", "audit");

export function mappingPathFromEnv(envName: string, defaultFilename: string) {
  const configured = process.env[envName] || process.env.RECONCILIATION_MAPPING_PATH;
  return configured ? path.resolve(process.cwd(), configured) : path.join(reconciliationDir, defaultFilename);
}

export function ensureDirs() {
  fs.mkdirSync(reconciliationDir, { recursive: true });
  fs.mkdirSync(auditDir, { recursive: true });
}

export function csvEscape(value: unknown) {
  if (value === null || value === undefined) return "";
  const text = value instanceof Date ? value.toISOString() : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function writeCsv(filePath: string, headers: string[], rows: Record<string, unknown>[]) {
  ensureDirs();
  const lines = [
    headers.map(csvEscape).join(","),
    ...rows.map(row => headers.map(header => csvEscape(row[header])).join(",")),
  ];
  fs.writeFileSync(filePath, `\uFEFF${lines.join("\r\n")}\r\n`, "utf8");
}

export function readCsv(filePath: string) {
  const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];
    const next = raw[i + 1];
    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell.replace(/\r$/, ""));
      if (row.some(value => value.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    if (row.some(value => value.trim() !== "")) rows.push(row);
  }

  const [headers, ...dataRows] = rows;
  if (!headers) return [];
  return dataRows.map(values => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])));
}

export function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), relativePath), "utf8")) as T;
}

export function writeAuditJson(filename: string, data: unknown) {
  ensureDirs();
  fs.writeFileSync(path.join(auditDir, filename), JSON.stringify(data, null, 2), "utf8");
}

export async function journalAmounts(journalEntryId: string) {
  const lines = await prisma.transactionLine.findMany({
    where: { journalEntryId, deletedAt: null },
    include: { account: { select: { code: true, name: true } } },
  });
  return {
    amountDebit: lines.filter(line => line.type === "DEBIT").reduce((sum, line) => sum + Number(line.amount), 0),
    amountCredit: lines.filter(line => line.type === "CREDIT").reduce((sum, line) => sum + Number(line.amount), 0),
    accounts: lines.map(line => `${line.type}:${line.account.code}:${Number(line.amount)}`).join("; "),
  };
}

export { prisma };
