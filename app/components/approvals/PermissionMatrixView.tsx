"use client";

import React from "react";

const ROLES = [
  "SUPER_ADMIN",
  "CFO (Giám đốc Tài chính)",
  "ACCOUNTANT (Kế toán viên)",
  "MANAGER (Quản lý dự án)",
  "VIEWER (Người xem)",
  "AUDITOR (Kiểm toán viên)"
];

const MODULES = [
  "INVOICE (Hóa đơn)",
  "COST (Chi phí)",
  "ADVANCE (Tạm ứng)",
  "SETTLEMENT (Quyết toán)",
  "JOURNAL (Sổ cái)"
];

const ACTIONS = ["VIEW (Xem)", "CREATE (Tạo)", "APPROVE (Duyệt)", "POST (Hạch toán)", "EXPORT (Xuất)"];

export default function PermissionMatrixView() {
  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Ma Trận Phân Quyền Hệ Thống (Permission Matrix)</h2>
        <p className="text-xs text-[var(--text-muted)] mt-1">Bản xem nhanh cấu hình bảo mật vai trò người dùng (RBAC Matrix)</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
        <table className="min-w-full divide-y divide-[var(--border)] border-collapse text-xs">
          <thead>
            <tr className="bg-[var(--secondary)] text-[var(--text-secondary)]">
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider border-r border-[var(--border)]">
                Vai trò / Quyền hạn
              </th>
              {MODULES.map((mod, i) => (
                <th
                  key={i}
                  colSpan={ACTIONS.length}
                  className="px-4 py-2 text-center font-semibold uppercase tracking-wider border-r border-[var(--border)] border-b border-[var(--border)]"
                >
                  {mod}
                </th>
              ))}
            </tr>
            <tr className="bg-[var(--secondary)]/50 text-[var(--text-muted)]">
              <th className="px-4 py-2 border-r border-[var(--border)]"></th>
              {MODULES.map((_, i) =>
                ACTIONS.map((act, j) => (
                  <th
                    key={`${i}-${j}`}
                    className="px-2 py-1.5 text-center text-[9px] font-bold uppercase border-r border-[var(--border)]"
                  >
                    {act.split(" ")[0]}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] text-[var(--text-primary)] bg-[var(--card)]">
            {ROLES.map((role, i) => (
              <tr key={i} className="hover:bg-[var(--secondary)]/25 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold border-r border-[var(--border)]">
                  {role}
                </td>
                {MODULES.map((mod, midx) =>
                  ACTIONS.map((act, aidx) => {
                    const cleanRole = role.split(" ")[0];
                    const hasAccess = getPermissionStatus(cleanRole, mod, act);
                    return (
                      <td
                        key={`${midx}-${aidx}`}
                        className="px-2 py-3 text-center border-r border-[var(--border)] whitespace-nowrap"
                      >
                        <span
                          className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                            hasAccess
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : "bg-[var(--secondary)] text-[var(--text-muted)]/40"
                          }`}
                        >
                          {hasAccess ? "✓" : "—"}
                        </span>
                      </td>
                    );
                  })
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getPermissionStatus(role: string, module: string, action: string): boolean {
  if (role === "SUPER_ADMIN") return true;

  if (role === "CFO") {
    return true; // CFO has full accountant + approval access
  }

  if (role === "ACCOUNTANT") {
    if (action.includes("APPROVE")) return false; // Accountant cannot approve
    return true;
  }

  if (role === "MANAGER") {
    // Managers can only see/create some, and approve project scope
    if (module.includes("JOURNAL")) return false;
    if (action.includes("VIEW") || action.includes("CREATE")) return true;
    if (action.includes("APPROVE") && (module.includes("COST") || module.includes("ADVANCE"))) return true;
    return false;
  }

  if (role === "AUDITOR") {
    return action.includes("VIEW") || action.includes("EXPORT");
  }

  if (role === "VIEWER") {
    return action.includes("VIEW");
  }

  return false;
}
