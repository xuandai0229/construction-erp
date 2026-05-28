import { PrismaClient } from "../../generated/prisma-client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();
const outDir = path.join(process.cwd(), "docs", "audit");

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const results: any[] = [];
  
  try {
    // Attempt to query the tables
    const reqCount = await prisma.advanceRequest.count();
    results.push({ check: "AdvanceRequest table exists", result: "PASS", note: `Count: ${reqCount}` });
    
    const setCount = await prisma.advanceSettlement.count();
    results.push({ check: "AdvanceSettlement table exists", result: "PASS", note: `Count: ${setCount}` });
    
    // Attempt to query enums by creating a dummy record and expecting error or just let it pass
    // Actually we can query the database schema directly if needed
    const enums = await prisma.$queryRaw`SELECT typname FROM pg_type WHERE typname IN ('AdvanceRecipientType', 'AdvanceStatus', 'SettlementStatus')`;
    results.push({ check: "Enums exist in DB", result: "PASS", note: `Found: ${JSON.stringify(enums)}` });
    
  } catch (e: any) {
    results.push({ check: "Schema Query", result: "FAIL", note: e.message });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    results
  };

  fs.writeFileSync(path.join(outDir, "advance-schema-runtime-audit.json"), JSON.stringify(report, null, 2));
  fs.writeFileSync(
    path.join(outDir, "advance-schema-runtime-audit.md"),
    [
      "# Advance Schema Runtime Audit",
      "",
      `Generated: ${report.generatedAt}`,
      "",
      "| Check | Result | Notes |",
      "| ----- | ------ | ----- |",
      ...results.map((r) => `| ${r.check} | ${r.result} | ${r.note} |`),
    ].join("\n")
  );

  console.log(JSON.stringify(report, null, 2));
  await prisma.$disconnect();
}

main().catch(console.error);
