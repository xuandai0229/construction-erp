import { prisma } from "../../lib/prisma";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const args = process.argv.slice(2);
  const isApply = args.includes("--apply");
  const hasConfirmation = args.includes("--confirm=TOI_MUON_SOFT_DELETE_BUT_TOAN_TEST");

  console.log("==================================================================");
  console.log(" KHỞI CHẠY AUDIT VÀ PHÁT HIỆN BÚT TOÁN KHO MỒ CÔI (ORPHAN JOURNAL AUDIT)");
  console.log("==================================================================");

  // 1. ENVIRONMENT GUARD: Block execution in production!
  const isProd = process.env.NODE_ENV === "production" || process.env.DATABASE_URL?.includes("prod");
  if (isProd && isApply) {
    console.error("✗ LỖI BẢO MẬT: Không được phép chạy thay đổi dữ liệu trong môi trường PRODUCTION!");
    process.exit(1);
  }

  // 2. Scan for JournalEntries with references related to inventory that might be orphans
  const journalEntries = await prisma.journalEntry.findMany({
    where: {
      OR: [
        { reference: { startsWith: "PURCHASE_RECEIPT-PN-" } },
        { reference: { startsWith: "ISSUE_TO_PROJECT-PX-" } },
        { reference: { startsWith: "REV-" } },
      ],
    },
    include: {
      project: true,
    },
  });

  const orphans = [];
  const activeTestFixtures = [];

  for (const entry of journalEntries) {
    const isOrphan = !entry.projectId || !entry.project || entry.project.deletedAt !== null;
    const info = {
      id: entry.id,
      reference: entry.reference,
      description: entry.description,
      projectId: entry.projectId,
      isPosted: entry.isPosted,
      createdAt: entry.createdAt,
      deletedAt: entry.deletedAt,
      isOrphan,
    };

    if (isOrphan) {
      orphans.push(info);
    } else {
      activeTestFixtures.push(info);
    }
  }

  // 3. Generate detailed Markdown Report
  const reportPath = path.join(process.cwd(), "docs", "audit", "inventory-orphan-journal-audit.md");
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportMarkdown = `# BÁO CÁO AUDIT BÚT TOÁN KHO MỒ CÔI (INVENTORY ORPHAN JOURNAL AUDIT)
**Ngày kiểm toán**: ${new Date().toISOString()}
**Môi trường**: ${process.env.NODE_ENV || "development"}
**Người thực hiện**: Hệ thống Kế toán trưởng ERP tự động

---

## I. TỔNG QUAN HỆ THỐNG
*   **Tổng số bút toán kho quét được**: ${journalEntries.length}
*   **Số lượng bút toán mồ côi (Orphaned)**: ${orphans.length}
*   **Số lượng bút toán test hoạt động (Active Test Fixtures)**: ${activeTestFixtures.length}

---

## II. DANH SÁCH BÚT TOÁN MỒ CÔI PHÁT HIỆN
Dưới đây là danh sách chi tiết các bút toán kho không liên kết với bất kỳ dự án hiện hành nào (có thể do dự án đã bị xóa sau khi chạy test):

${
  orphans.length === 0
    ? "*Không phát hiện bút toán mồ côi nào.*"
    : `| STT | ID Bút toán | Số Tham Chiếu (Reference) | Diễn Giải | Ngày tạo | Trạng thái Soft Delete |
|:---:|:---|:---|:---|:---|:---|
` +
      orphans
        .map(
          (o, idx) =>
            `| ${idx + 1} | \`${o.id}\` | \`${o.reference}\` | ${o.description} | ${o.createdAt.toISOString()} | ${
              o.deletedAt ? `Đã Soft Delete (${o.deletedAt.toISOString()})` : "Chưa Soft Delete"
            } |`
        )
        .join("\n")
}

---

## III. TUYÊN BỐ TUÂN THỦ LEVEL 3 ACCOUNTING
*   **Không Hard Delete**: Hệ thống tuân thủ nghiêm ngặt chuẩn mực kế toán Việt Nam và quy định ERP Level 3. Không có bất kỳ dòng dữ liệu nào bị xóa vật lý khỏi cơ sở dữ liệu.
*   **Soft Delete Audit Trail**: Các bút toán thử nghiệm mồ côi được đánh dấu \`deletedAt\` để ẩn khỏi báo cáo tài chính nhưng giữ nguyên toàn bộ lịch sử trong database phục vụ thanh tra thuế.
`;

  fs.writeFileSync(reportPath, reportMarkdown, "utf8");
  console.log(`✓ Báo cáo đối chiếu đã được xuất ra: docs/audit/inventory-orphan-journal-audit.md`);

  // 4. Remediation logic (Dry-run by default, soft-delete ONLY if flags are passed)
  if (orphans.length > 0) {
    const undeletedOrphans = orphans.filter((o) => !o.deletedAt);
    console.log(`\nPhát hiện ${undeletedOrphans.length} bút toán mồ côi chưa được soft-delete.`);

    if (isApply && hasConfirmation) {
      console.log("\n[APPLY MODE] Đang tiến hành soft-delete an toàn các bút toán mồ côi...");
      
      const idsToSoftDelete = undeletedOrphans.map((o) => o.id);
      if (idsToSoftDelete.length > 0) {
        await prisma.journalEntry.updateMany({
          where: { id: { in: idsToSoftDelete } },
          data: { deletedAt: new Date() },
        });

        // Ghi AuditLog
        await prisma.auditLog.create({
          data: {
            userId: "SYSTEM_TEST",
            action: "UPDATE",
            entity: "JournalEntry",
            entityId: idsToSoftDelete.join(","),
            newData: { description: "Soft deleted orphaned test journal entries via audit remediation" },
          },
        });

        console.log(`✓ Thành công: Đã soft-delete ${idsToSoftDelete.length} bút toán mồ côi.`);
      }
    } else {
      console.log("\n[DRY RUN] Các bút toán mồ côi sau sẽ được soft-delete nếu chạy lệnh với: ");
      console.log("  --apply --confirm=TOI_MUON_SOFT_DELETE_BUT_TOAN_TEST");
      for (const o of undeletedOrphans) {
        console.log(`  - ID: ${o.id} | Ref: ${o.reference} | ${o.description}`);
      }
    }
  } else {
    console.log("✓ Tuyệt vời: Không có bút toán mồ côi nào cần xử lý.");
  }

  console.log("\n==================================================================");
  console.log(" HOÀN THÀNH AUDIT BÚT TOÁN KHO MỒ CÔI");
  console.log("==================================================================");
}

main();
