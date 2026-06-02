import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const revenueService = fs.readFileSync(path.join(root, "services/revenue.service.ts"), "utf8");
const validations = fs.readFileSync(path.join(root, "lib/validations.ts"), "utf8");

const createPaymentMatch = revenueService.match(/static async createPayment[\s\S]*?\n  static async findInvoicesByProject/);
const createPayment = createPaymentMatch?.[0] || "";
const failures: string[] = [];

if (!validations.includes("requestId: z.string().uuid")) {
  failures.push("createPaymentSchema chưa bắt buộc requestId/idempotency key.");
}

if (!createPayment.includes("findUnique({ where: { requestId } })")) {
  failures.push("createPayment chưa kiểm tra idempotency bằng requestId.");
}

if (!createPayment.includes("FOR UPDATE")) {
  failures.push("createPayment chưa khóa invoice trong transaction để chống race condition.");
}

if (!createPayment.includes('status: { in: ["DRAFT", "ACTIVE"] }')) {
  failures.push("createPayment chưa reserve allocation DRAFT khi tính remaining.");
}

if (createPayment.includes("tx.revenue.create")) {
  failures.push("Payment DRAFT vẫn sinh Revenue trong createPayment.");
}

if (!createPayment.includes("Prisma.TransactionIsolationLevel.Serializable")) {
  failures.push("createPayment chưa chạy transaction với isolation Serializable.");
}

if (failures.length) {
  console.error("FAIL verify-payment-idempotency-overpay");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS verify-payment-idempotency-overpay: requestId bắt buộc, reserve DRAFT/ACTIVE, không tạo Revenue từ DRAFT.");
