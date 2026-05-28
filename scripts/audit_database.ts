import { PrismaClient } from "../generated/prisma-client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== BẮT ĐẦU TRUY VẤN KIỂM TOÁN DATABASE THỰC TẾ ===");
  
  // A. KIỂM TOÁN HỆ THỐNG TÀI KHOẢN
  console.log("\n--- PHẦN A: KIỂM TOÁN HỆ THỐNG TÀI KHOẢN ---");
  const accounts = await prisma.ledgerAccount.findMany({
    include: {
      parent: true
    },
    orderBy: {
      code: "asc"
    }
  });

  console.log(`Tổng số tài khoản trong DB: ${accounts.length}`);
  
  const requiredCodes = [
    "111", "1111", "1112",
    "112", "1121", "1122",
    "131", "141", "152", "154",
    "211", "214", "331", "333",
    "334", "338", "411", "511",
    "515", "621", "622", "623",
    "627", "632", "635", "642",
    "711", "811", "821", "911"
  ];

  console.log("Kiểm tra sự tồn tại và cha-con của các tài khoản yêu cầu:");
  const accMap = new Map(accounts.map(a => [a.code, a]));
  
  let missing = [];
  let relationsIssue = [];

  for (const code of requiredCodes) {
    const acc = accMap.get(code);
    if (!acc) {
      missing.push(code);
      console.log(`❌ THIẾU TÀI KHOẢN: ${code}`);
      continue;
    }

    // Kiểm tra parent
    let parentExpected = null;
    if (code.length > 3) {
      parentExpected = code.slice(0, 3);
    }

    if (parentExpected) {
      const parentAcc = accMap.get(parentExpected);
      if (!parentAcc) {
        relationsIssue.push(`${code} -> expected parent ${parentExpected} missing`);
        console.log(`❌ SAI QUAN HỆ: Tài khoản ${code} yêu cầu cha là ${parentExpected} nhưng cha không tồn tại.`);
      } else if (!acc.parentId) {
        relationsIssue.push(`${code} -> parentId is null but expected ${parentExpected}`);
        console.log(`❌ SAI QUAN HỆ: Tài khoản ${code} chưa thiết lập parentId.`);
      } else if (acc.parentId !== parentAcc.id) {
        relationsIssue.push(`${code} -> parentId (${acc.parentId}) does not match parent id of ${parentExpected} (${parentAcc.id})`);
        console.log(`❌ SAI QUAN HỆ: Tài khoản ${code} có parentId không khớp với tài khoản cha ${parentExpected}.`);
      } else {
        console.log(`✅ TÀI KHOẢN: ${code} - ${acc.name} (Cha: ${parentExpected} - ${parentAcc.name})`);
      }
    } else {
      console.log(`✅ TÀI KHOẢN CẤP 1: ${code} - ${acc.name} (parentId: ${acc.parentId || "NULL"})`);
    }
  }

  console.log(`\nTổng hợp: Thiếu ${missing.length} tài khoản. Sai quan hệ: ${relationsIssue.length} tài khoản.`);

  // B. KIỂM TOÁN CHỨNG TỪ & HẠCH TOÁN THỰC TẾ
  console.log("\n--- PHẦN B: KIỂM TOÁN CHỨNG TỪ THỰC TẾ TRONG DATABASE ---");
  const vouchers = await prisma.journalEntry.findMany({
    include: {
      lines: {
        include: {
          account: true
        }
      }
    }
  });

  console.log(`Tổng số chứng từ (JournalEntry) trong DB: ${vouchers.length}`);
  for (const v of vouchers) {
    console.log(`\n[Chứng từ] ID: ${v.id} | Số CT: ${v.reference || "KHÔNG CÓ"} | Trạng thái: ${v.status} | Đã ghi sổ: ${v.isPosted} | Ngày: ${v.date.toISOString().split('T')[0]}`);
    console.log(`Mô tả: ${v.description}`);
    let sumDebit = 0;
    let sumCredit = 0;
    for (const l of v.lines) {
      console.log(`  - TK ${l.account.code} (${l.type}): ${l.amount.toString()} VND | ${l.description}`);
      if (l.type === "DEBIT") sumDebit += parseFloat(l.amount.toString());
      else sumCredit += parseFloat(l.amount.toString());
    }
    console.log(`  => Tổng Nợ: ${sumDebit} VND | Tổng Có: ${sumCredit} VND | Cân đối: ${sumDebit === sumCredit ? "CÂN ĐỐI" : "LỆCH!"}`);
  }

  // C. KIỂM TOÁN DÒNG TIỀN & LÃI LỖ CÔNG TRÌNH DỮ LIỆU
  console.log("\n--- PHẦN C: DỮ LIỆU TẠM ỨNG & THANH TOÁN operational ---");
  const payments = await prisma.payment.findMany({});
  console.log(`Tổng số operational payments: ${payments.length}`);
  for (const p of payments) {
    console.log(`- Payment ID: ${p.id} | Số tiền: ${p.amount.toString()} VND | Ngày: ${p.date.toISOString().split('T')[0]} | Mô tả: ${p.description}`);
  }

  const invoices = await prisma.invoice.findMany({});
  console.log(`Tổng số operational invoices: ${invoices.length}`);
  for (const i of invoices) {
    console.log(`- Invoice ID: ${i.id} | Số hóa đơn: ${i.invoiceNumber} | Số tiền: ${i.amount.toString()} VND | Ngày: ${i.issuedDate.toISOString().split('T')[0]} | Trạng thái: ${i.status}`);
  }
}

main()
  .catch(e => {
    console.error("Lỗi:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
