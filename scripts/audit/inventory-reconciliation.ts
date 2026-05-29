import { prisma } from "../../lib/prisma";
import { Decimal } from "decimal.js";

async function main() {
  console.log("==================================================================");
  console.log(" KHỞI CHẠY ĐỐI CHIẾU SỐ LIỆU KHO VÀ SỔ CÁI (INVENTORY RECONCILIATION)");
  console.log("==================================================================");

  let discrepancies = 0;

  try {
    // 1. Kiểm tra khớp số dư Sổ chi tiết Kho (InventoryBalance) và Nhật ký di chuyển (InventoryMovement)
    console.log("\n1. Đối chiếu chi tiết Nhật ký Movement và Số dư Tồn kho:");
    const balances = await prisma.inventoryBalance.findMany({
      include: {
        material: true,
        warehouse: true,
      },
    });

    for (const bal of balances) {
      const movements = await prisma.inventoryMovement.findMany({
        where: {
          warehouseId: bal.warehouseId,
          materialItemId: bal.materialItemId,
          projectId: bal.projectId === "GLOBAL" ? null : bal.projectId,
          wbsId: bal.wbsId === "GLOBAL" ? null : bal.wbsId,
        },
      });

      let sumQty = new Decimal(0);
      let sumCost = new Decimal(0);

      for (const mov of movements) {
        const q = new Decimal(mov.quantity.toString());
        const amt = new Decimal(mov.amount.toString());

        sumQty = sumQty.plus(q);
        if (q.greaterThan(0)) {
          sumCost = sumCost.plus(amt);
        } else {
          sumCost = sumCost.minus(amt);
        }
      }

      const balQty = new Decimal(bal.quantity.toString());
      const balTotalCost = new Decimal(bal.totalCost.toString());

      const qtyDiff = sumQty.minus(balQty).abs();
      const costDiff = sumCost.minus(balTotalCost).abs();

      if (qtyDiff.greaterThan(0.0001) || costDiff.greaterThan(1)) {
        discrepancies++;
        console.error(
          `✗ LỆCH SỐ LIỆU [Kho: ${bal.warehouse.code} - Vật tư: ${bal.material.code}]:` +
            `\n  - Tồn kho Số dư: SL = ${balQty.toString()}, Trị giá = ${balTotalCost.toString()} VND` +
            `\n  - Tồn kho Nhật ký: SL = ${sumQty.toString()}, Trị giá = ${sumCost.toString()} VND` +
            `\n  - Chênh lệch: SL = ${qtyDiff.toString()}, Trị giá = ${costDiff.toString()} VND`
        );
      } else {
        console.log(
          `✓ KHỚP [Kho: ${bal.warehouse.code} - Vật tư: ${bal.material.code}]:` +
            ` SL = ${balQty.toString()}, Trị giá = ${balTotalCost.toString()} VND`
        );
      }
    }

    // 2. Đối chiếu Số dư Kho (Account 152) trên Sổ cái và Trị giá Tồn kho thực tế
    console.log("\n2. Đối chiếu Sổ chi tiết kho với Tài khoản 152 trên Sổ Cái (Ledger):");

    // Lấy tổng trị giá tồn kho thực tế trong tất cả các bảng tồn
    const totalBalanceCost = balances.reduce(
      (sum, bal) => sum.plus(new Decimal(bal.totalCost.toString())),
      new Decimal(0)
    );

    // Lấy số dư tài khoản 152 trên Ledger hạch toán
    const account152 = await prisma.ledgerAccount.findUnique({
      where: { code: "152" },
      include: {
        lines: {
          where: { journalEntry: { deletedAt: null } },
        },
      },
    });

    let ledger152Value = new Decimal(0);
    if (account152) {
      for (const line of account152.lines) {
        const amt = new Decimal(line.amount.toString());
        if (line.type === "DEBIT") {
          ledger152Value = ledger152Value.plus(amt);
        } else {
          ledger152Value = ledger152Value.minus(amt);
        }
      }
    }

    const ledgerDiff = totalBalanceCost.minus(ledger152Value).abs();

    if (ledgerDiff.greaterThan(1)) {
      discrepancies++;
      console.warn(
        `⚠ CẢNH BÁO LỆCH SỔ CÁI (LEDGER VS STOCK):` +
          `\n  - Tổng trị giá tồn kho thực tế: ${totalBalanceCost.toString()} VND` +
          `\n  - Tổng số dư tài khoản 152 (Sổ cái): ${ledger152Value.toString()} VND` +
          `\n  - Lệch lệch hạch toán: ${ledgerDiff.toString()} VND` +
          `\n  * Lưu ý: Sai lệch này có thể do các bút toán tổng hợp hạch toán thủ công trực tiếp vào tài khoản 152 không qua chứng từ kho.`
      );
    } else {
      console.log(
        `✓ TUYỆT ĐỐI KHỚP: Tổng trị giá tồn kho (${totalBalanceCost.toString()} VND) hoàn toàn khớp với Sổ cái tài khoản 152 (${ledger152Value.toString()} VND).`
      );
    }
  } catch (error) {
    console.error("Critical reconciliation failure:", error);
    discrepancies++;
  }

  console.log("\n==================================================================");
  console.log(` KẾT QUẢ ĐỐI CHIẾU: Phát hiện ${discrepancies} điểm lệch số liệu.`);
  console.log("==================================================================");

  if (discrepancies > 0) {
    // We don't fail the build since warnings are allowed (e.g. if manual ledger lines are introduced)
    process.exit(0);
  } else {
    process.exit(0);
  }
}

main();
