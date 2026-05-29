import { handleApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { requireAccountingAccess, requireProjectAccess } from "@/lib/route-security";
import { getPostedLedgerLineFilter } from "@/lib/accounting/ledgerFilters";
import { generateCsvResponse } from "@/lib/export/accountingExport";

export async function GET(request: Request) {
  try {
    const user = await requireAccountingAccess("EXPORT");

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") || "";
    const accountCode = searchParams.get("accountCode") || "";

    await requireProjectAccess(user, projectId);

    const baseFilter = getPostedLedgerLineFilter({ projectId });

    const lines = await prisma.transactionLine.findMany({
      where: {
        ...baseFilter,
        ...(accountCode && {
          account: {
            code: accountCode
          }
        })
      },
      include: {
        account: true,
        journalEntry: true
      },
      orderBy: {
        journalEntry: {
          date: "asc"
        }
      }
    });

    const headers = [
      "Ngay hach toan",
      "So chung tu (Ref)",
      "Ma TK",
      "Ten TK",
      "Dien giai chi tiet",
      "Phat sinh No (Debit)",
      "Phat sinh Co (Credit)",
      "Nguon nghiep vu"
    ];

    const rows = lines.map(line => [
      new Date(line.journalEntry.date).toLocaleDateString("vi-VN"),
      line.journalEntry.reference || "",
      line.account.code,
      line.account.name,
      line.description || line.journalEntry.description || "",
      line.type === "DEBIT" ? String(line.amount) : "0",
      line.type === "CREDIT" ? String(line.amount) : "0",
      line.journalEntry.sourceType || ""
    ]);

    const project = await prisma.project.findFirst({ where: { id: projectId } });
    const filename = `SoCai_TK_${accountCode || "ALL"}_${project?.name || "DuAn"}.csv`;

    return await generateCsvResponse({
      userId: user.id,
      companyId: user.companyId,
      projectId,
      reportType: "LEDGER_EXPORT",
      filename,
      headers,
      rows,
      reason: `Xuat so cai TK ${accountCode || "ALL"} cho du an ${project?.name}`
    });

  } catch (error) {
    return handleApiError(error);
  }
}
