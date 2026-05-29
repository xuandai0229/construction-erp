import fs from "fs";
import path from "path";
import { numberToVietnameseWords } from "../../lib/utils/numberToWords";

console.log("======================================================");
console.log("     RUNNING SPRINT 2.5: EXPORT & PRINT GUARDS       ");
console.log("======================================================");

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passCount++;
  } else {
    console.error(`  ✗ ${message}`);
    failCount++;
  }
}

// 1. Check Core Print Components Exist
console.log("\n[CHECK 1] Kiem tra su hien dien cua bo Component in an A4...");
const printDir = path.join(process.cwd(), "app", "components", "accounting");
assert(fs.existsSync(path.join(printDir, "PrintLayout.tsx")), "PrintLayout.tsx ton tai.");
assert(fs.existsSync(path.join(printDir, "AccountingDocumentHeader.tsx")), "AccountingDocumentHeader.tsx ton tai.");
assert(fs.existsSync(path.join(printDir, "SignatureBlock.tsx")), "SignatureBlock.tsx ton tai.");
assert(fs.existsSync(path.join(printDir, "MoneyTextLine.tsx")), "MoneyTextLine.tsx ton tai.");

// 2. Check Vietnamese Number-to-Words Translation Utility
console.log("\n[CHECK 2] Kiem tra thuat toan dich tien VND thanh chu...");
assert(
  numberToVietnameseWords(0) === "Không đồng chẵn.",
  "Dich 0 VND -> 'Không đồng chẵn.'"
);
assert(
  numberToVietnameseWords(1000000) === "Một triệu đồng chẵn.",
  "Dich 1,000,000 VND -> 'Một triệu đồng chẵn.'"
);
assert(
  numberToVietnameseWords(1250000).includes("Một triệu hai trăm năm mươi"),
  "Dich 1,250,000 VND chua dung: " + numberToVietnameseWords(1250000)
);
assert(
  numberToVietnameseWords(1000000000) === "Một tỷ đồng chẵn.",
  "Dich 1,000,000,000 VND -> 'Một tỷ đồng chẵn.'"
);

// 3. Check Export API routes exist
console.log("\n[CHECK 3] Kiem tra cac API Endpoint Xuat du lieu (Export)...");
const exportDir = path.join(process.cwd(), "app", "api", "export");
assert(fs.existsSync(path.join(exportDir, "ledger", "route.ts")), "API /api/export/ledger hop le.");
assert(fs.existsSync(path.join(exportDir, "trial-balance", "route.ts")), "API /api/export/trial-balance hop le.");
assert(fs.existsSync(path.join(exportDir, "debt", "route.ts")), "API /api/export/debt hop le.");
assert(fs.existsSync(path.join(exportDir, "outstanding-advances", "route.ts")), "API /api/export/outstanding-advances hop le.");
assert(fs.existsSync(path.join(exportDir, "invoice", "[id]", "route.ts")), "API /api/export/invoice/[id] hop le.");
assert(fs.existsSync(path.join(exportDir, "payment", "[id]", "route.ts")), "API /api/export/payment/[id] hop le.");
assert(fs.existsSync(path.join(exportDir, "advance", "[id]", "route.ts")), "API /api/export/advance/[id] hop le.");

// 4. Check Print friendly pages exist
console.log("\n[CHECK 4] Kiem tra cac trang in an (Print Pages)...");
const printPageDir = path.join(process.cwd(), "app", "print");
assert(fs.existsSync(path.join(printPageDir, "invoice", "[id]", "page.tsx")), "Trang in hoa don / phieu ke toan ton tai.");
assert(fs.existsSync(path.join(printPageDir, "payment", "[id]", "page.tsx")), "Trang in phieu thu / chi ton tai.");
assert(fs.existsSync(path.join(printPageDir, "advance", "[id]", "page.tsx")), "Trang in giay de nghi tam ung ton tai.");
assert(fs.existsSync(path.join(printPageDir, "ledger", "page.tsx")), "Trang in so cai ton tai.");
assert(fs.existsSync(path.join(printPageDir, "debt", "page.tsx")), "Trang in bao cao cong no ton tai.");

console.log("\n======================================================");
console.log(` KET QUA: ${passCount} / ${passCount + failCount} Kich ban dung!`);
console.log("======================================================");

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
