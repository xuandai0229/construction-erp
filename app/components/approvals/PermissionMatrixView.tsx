"use client";

import React from "react";

const ROLES = [
  "SUPER_ADMIN",
  "CFO",
  "ACCOUNTANT",
  "MANAGER",
  "VIEWER",
  "AUDITOR"
];

const MODULES = [
  "INVOICE (Hóa đơn)",
  "COST (Chi phí)",
  "ADVANCE (Tạm ứng)",
  "SETTLEMENT (Quyết toán)",
  "JOURNAL (Sổ cái)"
];

const ACTIONS = ["VIEW", "CREATE", "APPROVE", "POST", "EXPORT"];

export default function PermissionMatrixView() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-zinc-100 p-6">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-zinc-950">Ma Trận Phân Quyền Hệ Thống (Permission Matrix)</h2>
        <p className="text-xs text-zinc-500 mt-1">Bản xem nhanh cấu hình bảo mật vai trò người dùng (RBAC Matrix)</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200 border border-zinc-100 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-zinc-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-700 uppercase tracking-wider border-r border-zinc-100">
                Vai trò / Quyền hạn
              </th>
              {MODULES.map((mod, i) => (
                <th
                  key={i}
                  colSpan={ACTIONS.length}
                  className="px-4 py-2 text-center text-xs font-semibold text-zinc-700 uppercase tracking-wider border-r border-zinc-100 border-b border-zinc-200"
                >
                  {mod}
                </th>
              ))}
            </tr>
            <tr className="bg-zinc-50/50">
              <th className="px-4 py-2 border-r border-zinc-100"></th>
              {MODULES.map(() =>
                ACTIONS.map((act, j) => (
                  <th
                    key={j}
                    className="px-2 py-1.5 text-center text-[9px] font-bold text-zinc-500 uppercase border-r border-zinc-100"
                  >
                    {act}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-zinc-200">
            {ROLES.map((role, i) => (
              <tr key={i} className="hover:bg-zinc-50/50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-zinc-900 border-r border-zinc-100">
                  {role}
                </td>
                {MODULES.map((mod, midx) =>
                  ACTIONS.map((act, aidx) => {
                    const hasAccess = getPermissionStatus(role, mod, act);
                    return (
                      <td
                        key={`${midx}-${aidx}`}
                        className="px-2 py-3 text-center border-r border-zinc-100 whitespace-nowrap"
                      >
                        <span
                          className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                            hasAccess
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-zinc-50 text-zinc-300"
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
    if (action === "APPROVE") return false; // Accountant cannot approve
    return true;
  }

  if (role === "MANAGER") {
    // Managers can only see/create some, and approve project scope
    if (module.includes("JOURNAL")) return false;
    if (action === "VIEW" || action === "CREATE") return true;
    if (action === "APPROVE" && (module.includes("COST") || module.includes("ADVANCE"))) return true;
    return false;
  }

  if (role === "AUDITOR") {
    return action === "VIEW" || action === "EXPORT";
  }

  if (role === "VIEWER") {
    return action === "VIEW";
  }

  return false;
}
