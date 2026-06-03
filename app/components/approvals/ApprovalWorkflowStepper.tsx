"use client";

interface WorkflowStep {
  id: string;
  label: string;
  description: string;
}

interface ApprovalWorkflowStepperProps {
  status?: string;
  pendingCount?: number;
  processedCount?: number;
  className?: string;
}

const baseSteps: WorkflowStep[] = [
  { id: "DRAFT", label: "Nháp", description: "Chứng từ mới tạo, chưa gửi duyệt." },
  { id: "SUBMITTED", label: "Chờ duyệt", description: "Đang nằm trong hàng đợi phê duyệt." },
  { id: "APPROVED", label: "Đã duyệt", description: "Đã được người có thẩm quyền phê duyệt." },
  { id: "POSTED", label: "Đã ghi sổ", description: "Đã được ghi nhận vào sổ kế toán nếu nghiệp vụ hỗ trợ." },
];

function normalizeStatus(status?: string) {
  const value = (status || "SUBMITTED").toUpperCase();
  if (value === "PENDING") return "SUBMITTED";
  if (value === "PAID" || value === "FULLY_SETTLED" || value === "PARTIALLY_SETTLED") return "POSTED";
  if (value === "REJECTED" || value === "CANCELLED" || value === "REVERSED") return value;
  return value;
}

export default function ApprovalWorkflowStepper({
  status,
  pendingCount = 0,
  processedCount = 0,
  className = "",
}: ApprovalWorkflowStepperProps) {
  const normalized = normalizeStatus(status);
  const currentIndex = baseSteps.findIndex((step) => step.id === normalized);
  const isTerminalException = ["REJECTED", "CANCELLED", "REVERSED"].includes(normalized);
  const terminalLabel: Record<string, string> = {
    REJECTED: "Từ chối",
    CANCELLED: "Đã hủy",
    REVERSED: "Đã đảo bút toán",
  };

  return (
    <section className={`rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 ${className}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-sm font-black text-[var(--text-primary)]">Luồng duyệt chứng từ</h2>
          <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
            Mô tả trạng thái hiện tại của chứng từ theo luồng nghiệp vụ. Stepper này chỉ hiển thị, không thay đổi logic phê duyệt.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase">
          <span className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-amber-700 dark:text-amber-300">
            Chờ duyệt: {pendingCount}
          </span>
          <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-emerald-700 dark:text-emerald-300">
            Đã xử lý: {processedCount}
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        {baseSteps.map((step, index) => {
          const isActive = !isTerminalException && index === currentIndex;
          const isDone = !isTerminalException && currentIndex >= 0 && index < currentIndex;
          const tone = isActive
            ? "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300"
            : isDone
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)]";

          return (
            <div key={step.id} className={`rounded-lg border p-3 ${tone}`}>
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-full border border-current text-[10px] font-black">{index + 1}</span>
                <span className="text-xs font-black">{step.label}</span>
              </div>
              <p className="mt-2 text-[11px] leading-5 opacity-90">{step.description}</p>
              <div className="mt-2 text-[10px] font-bold uppercase">{isActive ? "Đang ở bước này" : isDone ? "Đã hoàn tất" : "Chưa có dữ liệu"}</div>
            </div>
          );
        })}
      </div>

      {isTerminalException && (
        <div className="mt-4 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-700 dark:text-rose-300">
          Trạng thái ngoại lệ: {terminalLabel[normalized] || normalized}. Vui lòng kiểm tra lý do trong lịch sử thao tác hoặc chi tiết chứng từ.
        </div>
      )}

      <div className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] leading-5 text-amber-700 dark:text-amber-300">
        Các mapping Phase 2.8 và dữ liệu đối soát AI vẫn cần người thật phê duyệt trước khi dùng làm số liệu kế toán chính thức.
      </div>
    </section>
  );
}
