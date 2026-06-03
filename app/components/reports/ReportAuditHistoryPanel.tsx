"use client";

import AuditTrailPanel from "@/app/components/accounting/AuditTrailPanel";

export default function ReportAuditHistoryPanel() {
  return (
    <AuditTrailPanel
      recent
      scope="financial-reports"
      limit={10}
      title="Lịch sử xuất/in gần đây"
      description="Theo dõi ai đã xuất báo cáo hoặc in chứng từ tài chính. File chỉ được tạo sau khi server ghi audit thành công."
      className="print:hidden"
    />
  );
}
