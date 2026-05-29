import { auditExportOrThrow } from "@/lib/route-security";

export interface ExportDataParams {
  userId: string;
  companyId?: string | null;
  projectId?: string | null;
  reportType: string;
  filename: string;
  headers: string[];
  rows: string[][];
  reason?: string;
}

export async function generateCsvResponse(params: ExportDataParams): Promise<Response> {
  // Ghi nhận lịch sử kiểm toán bảo mật (Audit Log) cho hoạt động xuất dữ liệu nhạy cảm
  await auditExportOrThrow({
    userId: params.userId,
    companyId: params.companyId,
    projectId: params.projectId,
    reportType: params.reportType,
    format: "CSV",
    reason: params.reason || `Xuất báo cáo tài chính ${params.reportType}`
  });

  // Excel UTF-8 BOM
  const BOM = "\uFEFF";
  
  const escapeCsv = (val: string) => {
    if (val === null || val === undefined) return "";
    let str = String(val).replace(/"/g, '""');
    if (str.includes(",") || str.includes("\n") || str.includes('"')) {
      str = `"${str}"`;
    }
    return str;
  };

  const csvContent = [
    params.headers.map(escapeCsv).join(","),
    ...params.rows.map(row => row.map(escapeCsv).join(","))
  ].join("\n");

  const responseContent = BOM + csvContent;

  return new Response(responseContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${params.filename}"`,
      "Cache-Control": "no-store, max-age=0"
    }
  });
}
