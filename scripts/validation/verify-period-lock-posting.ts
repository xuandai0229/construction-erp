import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const postingEngine = fs.readFileSync(path.join(root, "lib/accounting/postingEngine.ts"), "utf8");

const failures: string[] = [];

if (postingEngine.includes("assertPeriodNotLocked(new Date())")) {
  failures.push("PostingEngine vẫn còn kiểm tra khóa kỳ bằng ngày hiện tại.");
}

if (!postingEngine.includes("accountingDate: Date | string")) {
  failures.push("createDoubleEntry chưa bắt buộc accountingDate/documentDate.");
}

if (!postingEngine.includes("date: accountingDate")) {
  failures.push("JournalEntry chưa ghi nhận date theo accountingDate.");
}

if (!postingEngine.includes("Không thể ghi sổ chứng từ vì kỳ kế toán của ngày chứng từ đã bị khóa.")) {
  failures.push("Thiếu thông báo tiếng Việt khi post vào kỳ khóa.");
}

if (!postingEngine.includes("Không thể hủy ghi sổ chứng từ thuộc kỳ đã khóa.")) {
  failures.push("Thiếu chính sách chặn reverse chứng từ thuộc kỳ khóa.");
}

if (failures.length) {
  console.error("FAIL verify-period-lock-posting");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS verify-period-lock-posting: PostingEngine dùng ngày chứng từ/accountingDate và chặn kỳ khóa.");
