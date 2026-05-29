import { prisma } from "../../lib/prisma";
import { InventoryService } from "../../services/inventory.service";
import { InventoryReportService } from "../../services/inventory-report.service";
import { InventoryDocumentType, InventoryDocumentStatus, UserRole } from "../../generated/prisma-client";
import { Decimal } from "decimal.js";

async function main() {
  const uid = `TEST_INV_GUARDS_${Date.now()}`;
  const companyA_Code = `COM_A_${uid}`;
  const companyB_Code = `COM_B_${uid}`;

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

  // Set up roles & ledger accounts for posting tests
  console.log("Setting up ledger accounts...");
  const accountsNeeded = ["152", "621", "3310"];
  for (const code of accountsNeeded) {
    await prisma.ledgerAccount.upsert({
      where: { code },
      create: { code, name: `Account ${code}`, type: "ASSET" },
      update: {},
    });
  }

  // Create test actors
  const creator = await prisma.user.create({
    data: { email: `creator_${uid}@erp.com`, role: UserRole.ACCOUNTANT },
  });
  const approver = await prisma.user.create({
    data: { email: `approver_${uid}@erp.com`, role: UserRole.CFO },
  });
  const compA = await prisma.company.create({
    data: { name: `Company A ${uid}`, code: companyA_Code },
  });
  const compB = await prisma.company.create({
    data: { name: `Company B ${uid}`, code: companyB_Code },
  });

  // Assign Creator and Approver to Company A
  await prisma.user.update({
    where: { id: creator.id },
    data: { companyId: compA.id },
  });
  await prisma.user.update({
    where: { id: approver.id },
    data: { companyId: compA.id },
  });

  // Setup Projects
  const projA = await prisma.project.create({
    data: { name: `Project A ${uid}`, companyId: compA.id },
  });

  try {
    console.log("==================================================================");
    console.log(" RUNNING SPRINT 3.3: INVENTORY / MATERIALS WORKFLOW & SAFETY GUARDS");
    console.log("==================================================================");

    // 1. Tạo kho và vật tư mẫu cho Company A
    const whA = await InventoryService.createWarehouse({
      companyId: compA.id,
      projectId: projA.id,
      code: `KHO_A_${uid}`,
      name: `Kho Vật Tư Thiết Bị Công Trình A`,
    }, creator.id);
    check(!!whA && whA.code === `KHO_A_${uid}`, "Tạo Danh mục Kho thành công");

    const matA = await InventoryService.createMaterialItem({
      companyId: compA.id,
      code: `MAT_A_${uid}`,
      name: `Thép Hoà Phát Phi 18`,
      unit: "KG",
      defaultWarehouseId: whA.id,
      inventoryAccount: "152",
      expenseAccount: "621",
    }, creator.id);
    check(!!matA && matA.code === `MAT_A_${uid}`, "Tạo Danh mục Vật tư thành công");

    // 2. Chặn số lượng <= 0 và đơn giá < 0 (Line Math Guards)
    let negativeMathBlocked = false;
    try {
      await InventoryService.createDocument({
        companyId: compA.id,
        documentType: InventoryDocumentType.PURCHASE_RECEIPT,
        targetWarehouseId: whA.id,
        lines: [
          {
            materialItemId: matA.id,
            quantity: -50, // invalid qty
            unitCost: 18000,
          },
        ],
      }, creator.id);
    } catch (e) {
      negativeMathBlocked = true;
    }
    check(negativeMathBlocked, "Chốt chặn số lượng xuất nhập <= 0 hoạt động hoàn hảo");

    // 3. Tạo phiếu nhập kho mua vào DRAFT thành công
    const docInput = await InventoryService.createDocument({
      companyId: compA.id,
      projectId: projA.id,
      documentType: InventoryDocumentType.PURCHASE_RECEIPT,
      targetWarehouseId: whA.id,
      description: "Nhập mua thép phi 18 Hoà Phát phục vụ móng",
      lines: [
        {
          materialItemId: matA.id,
          quantity: 1000, // 1000 KG
          unitCost: 18000, // 18,000 VND / KG
        },
      ],
    }, creator.id);

    check(
      docInput.status === InventoryDocumentStatus.DRAFT &&
      new Decimal(docInput.netAmount.toString()).equals(18000000),
      "Tạo Phiếu Nhập Kho Nháp (DRAFT) và tính toán tổng tiền thành công"
    );

    // 4. Trình duyệt phiếu thành công
    const docSubmitted = await InventoryService.submitDocument(docInput.id, creator.id);
    check(docSubmitted.status === InventoryDocumentStatus.SUBMITTED, "Trình duyệt Phiếu Nhập Kho thành công");

    // 5. Segregation of Duties: Người tạo phiếu không được tự duyệt phiếu của mình
    let selfApprovalBlocked = false;
    try {
      await InventoryService.approveDocument(docInput.id, creator.id);
    } catch (e) {
      selfApprovalBlocked = true;
    }
    check(selfApprovalBlocked, "Chốt chặn Bất kiêm nhiệm (Segregation of Duties) chặn người lập tự duyệt");

    // 6. CFO phê duyệt phiếu thành công
    const docApproved = await InventoryService.approveDocument(docInput.id, approver.id);
    check(docApproved.status === InventoryDocumentStatus.APPROVED, "CFO duyệt Phiếu Nhập Kho thành công");

    // 7. Hạch toán ghi sổ (Post) Phiếu Nhập
    const docPosted = await InventoryService.postDocument(docInput.id, creator.id);
    check(docPosted.status === InventoryDocumentStatus.POSTED && !!docPosted.postedJournalEntryId, "Ghi sổ Phiếu Nhập thành công và sinh Bút toán Kép Sổ Cái");

    // 8. Đối chiếu Tồn kho & Bình quân gia quyền sau khi nhập
    const balanceMat = await prisma.inventoryBalance.findUnique({
      where: {
        warehouseId_materialItemId_projectId_wbsId: {
          warehouseId: whA.id,
          materialItemId: matA.id,
          projectId: projA.id,
          wbsId: "GLOBAL",
        },
      },
    });

    check(
      balanceMat !== null &&
      new Decimal(balanceMat.quantity.toString()).equals(1000) &&
      new Decimal(balanceMat.avgCost.toString()).equals(18000),
      "Cập nhật Sổ Tồn kho và Giá bình quân gia quyền di động hoàn hảo"
    );

    // 9. Kiểm thử xuất kho dự án & chốt chặn Xuất Âm Kho (Negative Stock Guard)
    let negativeStockBlocked = false;
    try {
      const docIssueDraft = await InventoryService.createDocument({
        companyId: compA.id,
        projectId: projA.id,
        documentType: InventoryDocumentType.ISSUE_TO_PROJECT,
        sourceWarehouseId: whA.id,
        lines: [
          {
            materialItemId: matA.id,
            quantity: 1200, // exceeds available 1000
            unitCost: 0,
          },
        ],
      }, creator.id);

      await InventoryService.submitDocument(docIssueDraft.id, creator.id);
      await InventoryService.approveDocument(docIssueDraft.id, approver.id);
      
      // Posting this should throw ApiError because of Negative Stock!
      await InventoryService.postDocument(docIssueDraft.id, creator.id);
    } catch (e) {
      negativeStockBlocked = true;
    }
    check(negativeStockBlocked, "Chốt chặn chống Xuất Âm Kho (Negative Stock Guard) chặn đứng xuất quá số lượng tồn");

    // 10. Xuất kho hợp lệ, kiểm tra cập nhật số lượng tồn
    const docIssueGood = await InventoryService.createDocument({
      companyId: compA.id,
      projectId: projA.id,
      documentType: InventoryDocumentType.ISSUE_TO_PROJECT,
      sourceWarehouseId: whA.id,
      lines: [
        {
          materialItemId: matA.id,
          quantity: 400, // xuất 400 KG
          unitCost: 0, // Giá lấy bình quân tự động khi post
        },
      ],
    }, creator.id);

    await InventoryService.submitDocument(docIssueGood.id, creator.id);
    await InventoryService.approveDocument(docIssueGood.id, approver.id);
    await InventoryService.postDocument(docIssueGood.id, creator.id);

    const balanceAfterIssue = await prisma.inventoryBalance.findUnique({
      where: {
        warehouseId_materialItemId_projectId_wbsId: {
          warehouseId: whA.id,
          materialItemId: matA.id,
          projectId: projA.id,
          wbsId: "GLOBAL",
        },
      },
    });

    check(
      balanceAfterIssue !== null &&
      new Decimal(balanceAfterIssue.quantity.toString()).equals(600), // 1000 - 400 = 600
      "Xuất kho hợp lệ và cập nhật số lượng tồn kho giảm tương ứng chính xác"
    );

    // 11. Đảo bút toán / Hủy ghi sổ Phiếu Nhập ban đầu (Reversal logic)
    const reversedDoc = await InventoryService.reverseDocument(docInput.id, "Nhập sai chứng từ thực tế", creator.id);
    check(reversedDoc.status === InventoryDocumentStatus.REVERSED && !!reversedDoc.reversalJournalEntryId, "Hủy ghi sổ thành công, tạo bút toán đảo âm Ledger");

    const balanceAfterReversal = await prisma.inventoryBalance.findUnique({
      where: {
        warehouseId_materialItemId_projectId_wbsId: {
          warehouseId: whA.id,
          materialItemId: matA.id,
          projectId: projA.id,
          wbsId: "GLOBAL",
        },
      },
    });

    check(
      balanceAfterReversal !== null &&
      new Decimal(balanceAfterReversal.quantity.toString()).equals(-400), // (1000 - 1000) - 400 = -400 (since we already issued 400)
      "Khôi phục tồn kho đầu kỳ và ghi nhận movements đối ứng thành công"
    );

  } catch (error: any) {
    console.error("Critical test exception:", error);
    fail++;
  } finally {
    // Clean up test actors
    console.log("Cleaning up database test actors...");
    try {
      // Find all journal entries created by the test (either associated with project or having matching references)
      const testEntries = await prisma.journalEntry.findMany({
        where: {
          OR: [
            { projectId: projA.id },
            { reference: { startsWith: "PURCHASE_RECEIPT-" } },
            { reference: { startsWith: "ISSUE_TO_PROJECT-" } },
            { reference: { startsWith: "REV-" } },
          ],
          deletedAt: null
        },
      });

      const entryIds = testEntries.map((e) => e.id);
      if (entryIds.length > 0) {
        // Soft delete the test journal entries loop to modify sourceId and prevent unique constraints!
        for (const entry of testEntries) {
          await prisma.journalEntry.update({
            where: { id: entry.id },
            data: {
              sourceId: `${entry.sourceId}_DEL_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              deletedAt: new Date(),
            },
          });
        }
        console.log(`Soft deleted ${entryIds.length} test journal entries successfully.`);
      }
    } catch (cleanErr) {
      console.warn("Lưu ý: Không thể dọn dẹp JournalEntry thừa trong môi trường này:", cleanErr);
    }

    await prisma.inventoryMovement.deleteMany({ where: { companyId: compA.id } });
    await prisma.inventoryBalance.deleteMany({ where: { companyId: compA.id } });
    await prisma.inventoryDocumentLine.deleteMany({ where: { document: { companyId: compA.id } } });
    await prisma.inventoryDocument.deleteMany({ where: { companyId: compA.id } });
    await prisma.materialItem.deleteMany({ where: { companyId: compA.id } });
    await prisma.warehouse.deleteMany({ where: { companyId: compA.id } });
    await prisma.project.deleteMany({ where: { companyId: compA.id } });
    await prisma.user.deleteMany({ where: { id: { in: [creator.id, approver.id] } } });
    await prisma.company.deleteMany({ where: { id: { in: [compA.id, compB.id] } } });
  }

  console.log("\n==================================================================");
  console.log(` SPRINT 3.3 TEST REPORT SUMMARY: ${pass} PASSED, ${fail} FAILED`);
  console.log("==================================================================");
  if (fail > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main();
