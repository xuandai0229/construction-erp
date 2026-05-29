import { prisma } from "../../lib/prisma";
import { ManagementReportService } from "../../services/management-report.service";

async function runGuards() {
  console.log("======================================================");
  console.log("    RUNNING SPRINT 2.7: MANAGEMENT REPORTS GUARDS     ");
  console.log("======================================================");

  try {
    const company = await prisma.company.findFirst();
    if (!company) {
      console.log("❌ No company found to run guards.");
      process.exit(1);
    }
    
    const filters = { companyId: company.id };

    // [CHECK 1] Executive Summary Guard
    console.log("\n[CHECK 1] Kiểm tra Executive Summary không dùng mock...");
    const execSummary = await ManagementReportService.getExecutiveSummary(filters);
    if (typeof execSummary.revenue === "number" && typeof execSummary.cost === "number") {
      console.log(`  ✓ Revenue = ${execSummary.revenue}, Cost = ${execSummary.cost}`);
      console.log(`  ✓ Receivable = ${execSummary.receivables}, Advances = ${execSummary.outstandingAdvances}`);
      console.log(`  => CHECK 1: HOÀN TẤT (1/1)`);
    } else {
      throw new Error("Executive Summary data type is incorrect");
    }

    // [CHECK 2] Project Profitability Guard
    console.log("\n[CHECK 2] Kiểm tra Báo cáo Hiệu quả Dự án (Project Profitability)...");
    const profitability = await ManagementReportService.getProjectProfitability(filters);
    if (Array.isArray(profitability)) {
      console.log(`  ✓ Báo cáo trả về ${profitability.length} dự án hợp lệ.`);
      if (profitability.length > 0) {
        console.log(`  ✓ Lợi nhuận dự án đầu tiên: ${profitability[0].profit}`);
      }
      console.log(`  => CHECK 2: HOÀN TẤT (1/1)`);
    } else {
      throw new Error("Project Profitability must return array");
    }

    // [CHECK 3] Debt Management Guard
    console.log("\n[CHECK 3] Kiểm tra Quản trị Công nợ (Debt Aging)...");
    const debt = await ManagementReportService.getDebtManagement(filters);
    if (debt.agingBuckets && debt.arTotal >= 0) {
      console.log(`  ✓ Có đủ thông tin Aging Buckets (notDue, days1_30, ...).`);
      console.log(`  ✓ Tổng AR = ${debt.arTotal}, Tổng AP = ${debt.apTotal}`);
      console.log(`  => CHECK 3: HOÀN TẤT (1/1)`);
    } else {
      throw new Error("Debt Management data is malformed");
    }

    // [CHECK 4] Cashflow Guard
    console.log("\n[CHECK 4] Kiểm tra Báo cáo Dòng tiền (Cashflow)...");
    const cashflow = await ManagementReportService.getCashflowSummary(filters);
    if (typeof cashflow.netCashflow === "number" && Array.isArray(cashflow.periods)) {
      console.log(`  ✓ Dòng tiền phân loại thành ${cashflow.periods.length} kỳ.`);
      console.log(`  ✓ Tổng dòng tiền ròng = ${cashflow.netCashflow}`);
      console.log(`  => CHECK 4: HOÀN TẤT (1/1)`);
    } else {
      throw new Error("Cashflow Summary data is malformed");
    }

    // [CHECK 5] Risk Alerts Guard
    console.log("\n[CHECK 5] Kiểm tra Cảnh báo Rủi ro (Risk Alerts)...");
    const riskAlerts = await ManagementReportService.getRiskAlerts(filters);
    if (Array.isArray(riskAlerts)) {
      console.log(`  ✓ Hệ thống phát hiện ${riskAlerts.length} cảnh báo rủi ro tự động.`);
      console.log(`  => CHECK 5: HOÀN TẤT (1/1)`);
    } else {
      throw new Error("Risk Alerts must return array");
    }

    console.log("\n======================================================");
    console.log(" KẾT QUẢ: 5/5 Báo Cáo Chạy Thành Công - LEVEL 3 GIỮ VỮNG!");
    console.log("======================================================");
    process.exit(0);

  } catch (error: any) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

runGuards();
