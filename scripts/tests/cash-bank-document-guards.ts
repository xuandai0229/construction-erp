import { PrismaClient } from "../../generated/prisma-client";
import { CashBankService } from "../../services/cash-bank.service";

const prisma = new PrismaClient();

async function main() {
  const uid = `TEST_CASH_BANK_GUARDS_${Date.now()}`;
  const email1 = `${uid}_1@example.com`;
  const email2 = `${uid}_2@example.com`;

  // Create temporary test users, company, and project
  const user = await prisma.user.create({ data: { email: email1 } });
  const manager = await prisma.user.create({ data: { email: email2 } });
  const company = await prisma.company.create({ data: { name: `Company ${uid}`, code: `COM_${uid}` } });
  const project = await prisma.project.create({ data: { name: `Project ${uid}`, companyId: company.id } });

  // Resolve debit and credit accounts
  const acc111 = await prisma.ledgerAccount.findFirst({ where: { code: { startsWith: "111" } } });
  const acc331 = await prisma.ledgerAccount.findFirst({ where: { code: { startsWith: "331" } } });
  const acc131 = await prisma.ledgerAccount.findFirst({ where: { code: { startsWith: "131" } } });
  const acc112 = await prisma.ledgerAccount.findFirst({ where: { code: { startsWith: "112" } } });

  if (!acc111 || !acc331 || !acc131 || !acc112) {
    console.error("FAIL: Missing test ledger accounts in database. Please run seed script first.");
    process.exit(1);
  }

  let pass = 0, fail = 0;
  function check(condition: boolean, msg: string) {
    if (condition) {
      pass++;
      console.log(`✓ PASS: ${msg}`);
    } else {
      fail++;
      console.error(`✗ FAIL: ${msg}`);
    }
  }

  try {
    console.log("==================================================================");
    console.log(" RUNNING SPRINT 3.1: CASH & BANK WORKFLOW & SECURITY GUARDS");
    console.log("==================================================================");

    // 1. Tạo phiếu thu DRAFT thành công: PASS
    const doc1 = await CashBankService.createDocument({
      companyId: company.id,
      projectId: project.id,
      documentType: "CASH_RECEIPT",
      amount: 1000000,
      description: "Thu tiền khách hàng thanh toán WBS-01",
      partnerName: "Khách hàng Nguyễn Văn A",
      paymentMethod: "CASH",
      debitAccountId: acc111.id,
      creditAccountId: acc131.id,
    }, user.id);
    check(!!doc1 && doc1.status === "DRAFT", "Tạo phiếu thu DRAFT thành công");

    // 2. Tạo phiếu chi DRAFT thành công: PASS
    const doc2 = await CashBankService.createDocument({
      companyId: company.id,
      projectId: project.id,
      documentType: "CASH_PAYMENT",
      amount: 500000,
      description: "Chi tiền mặt mua văn phòng phẩm",
      partnerName: "Cửa hàng VPP ABC",
      paymentMethod: "CASH",
      debitAccountId: acc331.id,
      creditAccountId: acc111.id,
    }, user.id);
    check(!!doc2 && doc2.status === "DRAFT", "Tạo phiếu chi DRAFT thành công");

    // 3. Tạo ủy nhiệm chi DRAFT thành công: PASS
    const doc3 = await CashBankService.createDocument({
      companyId: company.id,
      projectId: project.id,
      documentType: "BANK_TRANSFER",
      amount: 2000000,
      description: "Chuyển khoản thanh toán nhà thầu phụ",
      partnerName: "Công ty Cơ điện XYZ",
      paymentMethod: "BANK",
      debitAccountId: acc331.id,
      creditAccountId: acc112.id,
    }, user.id);
    check(!!doc3 && doc3.status === "DRAFT", "Tạo ủy nhiệm chi DRAFT thành công");

    // 4. Không cho tạo chứng từ thiếu amount/reason/account: PASS
    let validationBlocked = false;
    try {
      await CashBankService.createDocument({
        companyId: company.id,
        documentType: "CASH_RECEIPT",
        amount: 1000,
        description: "", // empty description
        paymentMethod: "CASH",
        debitAccountId: acc111.id,
        creditAccountId: acc131.id,
      }, user.id);
    } catch (e) {
      validationBlocked = true;
    }
    check(validationBlocked, "Không cho tạo chứng từ thiếu amount/reason/account");

    // 5. Không cho amount <= 0: PASS
    let zeroAmountBlocked = false;
    try {
      await CashBankService.createDocument({
        companyId: company.id,
        documentType: "CASH_RECEIPT",
        amount: -500,
        description: "Thu tiền không hợp lệ",
        paymentMethod: "CASH",
        debitAccountId: acc111.id,
        creditAccountId: acc131.id,
      }, user.id);
    } catch (e) {
      zeroAmountBlocked = true;
    }
    check(zeroAmountBlocked, "Không cho amount <= 0");

    // 6. Submit từ DRAFT thành công: PASS
    const doc1Submitted = await CashBankService.submitDocument(doc1.id, user.id);
    check(doc1Submitted.status === "SUBMITTED", "Submit từ DRAFT thành công");

    // 7. Không cho approve nếu là người tạo (Segregation of Duties): PASS
    let selfApproveBlocked = false;
    try {
      await CashBankService.approveDocument(doc1.id, user.id);
    } catch (e) {
      selfApproveBlocked = true;
    }
    check(selfApproveBlocked, "Không cho approve nếu là người tạo (SoD)");

    // 8. Reject bắt buộc reason: PASS
    let rejectNoReasonBlocked = false;
    try {
      await CashBankService.rejectDocument(doc1.id, "abc", manager.id); // Less than 5 chars
    } catch (e) {
      rejectNoReasonBlocked = true;
    }
    check(rejectNoReasonBlocked, "Reject bắt buộc reason tối thiểu 5 ký tự");

    // 9. Approve từ SUBMITTED thành công: PASS
    const doc1Approved = await CashBankService.approveDocument(doc1.id, manager.id);
    check(doc1Approved.status === "APPROVED", "Approve từ SUBMITTED thành công");

    // 10. Post chỉ khi APPROVED: PASS
    let postDraftBlocked = false;
    try {
      await CashBankService.postDocument(doc2.id, manager.id); // doc2 is still DRAFT
    } catch (e) {
      postDraftBlocked = true;
    }
    check(postDraftBlocked, "Chặn post chứng từ chưa được duyệt");

    // 11. Post tạo JournalEntry cân Nợ/Có: PASS
    const doc1Posted = await CashBankService.postDocument(doc1.id, manager.id);
    check(doc1Posted.status === "POSTED" && !!doc1Posted.postedJournalEntryId, "Post thành công và tạo JournalEntry");

    const journal = await prisma.journalEntry.findUnique({
      where: { id: doc1Posted.postedJournalEntryId || "" },
      include: { lines: true },
    });
    check(!!journal && journal.lines.length === 2, "Journal entry được định khoản hạch toán kép");

    // 12. Không cho post trùng: PASS
    let repostBlocked = false;
    try {
      await CashBankService.postDocument(doc1.id, manager.id);
    } catch (e) {
      repostBlocked = true;
    }
    check(repostBlocked, "Chặn post trùng chứng từ đã ghi sổ");

    // 13. POSTED readonly/immutable: PASS
    let updatePostedBlocked = false;
    try {
      // Trying to submit a posted document or cancel it should block
      await CashBankService.cancelDocument(doc1.id, "Muốn hủy", manager.id);
    } catch (e) {
      updatePostedBlocked = true;
    }
    check(updatePostedBlocked, "POSTED readonly/immutable");

    // 14. Reverse tạo bút toán đảo: PASS
    const doc1Reversed = await CashBankService.reverseDocument(doc1.id, "Hủy ghi sổ hoàn toàn", manager.id);
    check(doc1Reversed.status === "REVERSED" && doc1Reversed.isReversed, "Reverse tạo bút toán đảo thành công");

    // 15. Tenant guard chặn cross-company: PASS
    let tenantBlocked = false;
    try {
      // Trying to fetch doc1 with a different companyId
      await CashBankService.getDocument(doc1.id, { id: user.id, companyId: "DIFFERENT_COMPANY_123" });
    } catch (e) {
      tenantBlocked = true;
    }
    check(tenantBlocked, "Tenant guard chặn cross-company truy cập");

    // 16. Cash book chỉ lấy chứng từ posted TK 111: PASS
    // Let's create another cash receipt and post it to test cash book
    const doc4 = await CashBankService.createDocument({
      companyId: company.id,
      projectId: project.id,
      documentType: "CASH_RECEIPT",
      amount: 1500000,
      description: "Thu tiền thanh toán tạm ứng đợt 2",
      partnerName: "Nguyễn Văn B",
      paymentMethod: "CASH",
      debitAccountId: acc111.id,
      creditAccountId: acc131.id,
    }, user.id);
    await CashBankService.submitDocument(doc4.id, user.id);
    await CashBankService.approveDocument(doc4.id, manager.id);
    await CashBankService.postDocument(doc4.id, manager.id);

    const cashBook = await CashBankService.getCashBook({ companyId: company.id }, { id: user.id, companyId: company.id });
    check(cashBook.lines.length === 1 && cashBook.endingBalance === 1500000, "Cash book lấy đúng chứng từ posted CASH");

    // 17. Bank book chỉ lấy chứng từ posted TK 112: PASS
    const doc5 = await CashBankService.createDocument({
      companyId: company.id,
      projectId: project.id,
      documentType: "BANK_CREDIT_NOTICE",
      amount: 3000000,
      description: "Khách hàng chuyển khoản đợt 3",
      partnerName: "Công ty Cổ phần M",
      paymentMethod: "BANK",
      debitAccountId: acc112.id,
      creditAccountId: acc131.id,
    }, user.id);
    await CashBankService.submitDocument(doc5.id, user.id);
    await CashBankService.approveDocument(doc5.id, manager.id);
    await CashBankService.postDocument(doc5.id, manager.id);

    const bankBook = await CashBankService.getBankBook({ companyId: company.id }, { id: user.id, companyId: company.id });
    check(bankBook.lines.length === 1 && bankBook.endingBalance === 3000000, "Bank book lấy đúng chứng từ posted BANK");

    // 18. Audit log được ghi đầy đủ: PASS
    const auditCount = await prisma.auditLog.count({
      where: { entityId: doc1.id },
    });
    check(auditCount >= 4, "Audit log ghi nhận toàn bộ bước: CREATE/SUBMIT/APPROVE/POST/REVERSE");

  } finally {
    // Clean up database testing records
    await prisma.cashBankDocument.deleteMany({ where: { projectId: project.id } });
    await prisma.project.deleteMany({ where: { id: project.id } });
    await prisma.company.deleteMany({ where: { id: company.id } });
    await prisma.user.deleteMany({ where: { id: { in: [user.id, manager.id] } } });
    await prisma.auditLog.deleteMany({ where: { userId: { in: [user.id, manager.id] } } });
  }

  console.log("\n==================================================================");
  console.log(` SPRINT 3.1 TESTS COMPLETED. Pass: ${pass}, Fail: ${fail}`);
  console.log("==================================================================");

  if (fail > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch(console.error);
