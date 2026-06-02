"use client";

import { useCallback, useEffect, useState } from "react";

type AuditStatus = "PENDING" | "APPROVED" | "FAILED";

export function useAuditedPrint(params: {
  printType: string;
  entityId: string;
  route: string;
  reason: string;
}) {
  const { printType, entityId, route, reason } = params;
  const [status, setStatus] = useState<AuditStatus>("PENDING");
  const [error, setError] = useState("");
  const [auditId, setAuditId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function auditPrint() {
      if (!entityId) {
        setStatus("FAILED");
        setError("Thiếu mã chứng từ cần in.");
        return;
      }

      setStatus("PENDING");
      setError("");

      try {
        const res = await fetch("/api/print/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ printType, entityId, route, reason, format: "HTML" }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || json.message || "Không ghi được audit in chứng từ.");
        }
        if (!cancelled) {
          setAuditId(json.data?.auditId || null);
          setStatus("APPROVED");
        }
      } catch (err) {
        if (!cancelled) {
          setStatus("FAILED");
          setError(err instanceof Error ? err.message : "Không ghi được audit in chứng từ.");
        }
      }
    }

    auditPrint();
    return () => {
      cancelled = true;
    };
  }, [printType, entityId, route, reason]);

  const print = useCallback(() => {
    if (status !== "APPROVED") {
      setError("Chưa thể in vì audit server-side chưa hoàn tất.");
      return;
    }
    window.print();
  }, [status]);

  return { status, error, auditId, print };
}

export function AuditedPrintStatus({ status, error }: { status: AuditStatus; error?: string }) {
  if (status === "APPROVED") return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6 text-center">
      <div className="max-w-md space-y-3">
        <div className={`text-sm font-bold ${status === "FAILED" ? "text-rose-600" : "text-zinc-700"}`}>
          {status === "FAILED" ? "Không thể in chứng từ" : "Đang ghi nhận audit in chứng từ..."}
        </div>
        <p className="text-xs text-zinc-500">
          {status === "FAILED"
            ? error || "Audit server-side thất bại nên hệ thống không trả dữ liệu in."
            : "Hệ thống đang kiểm tra quyền và ghi audit trước khi tải dữ liệu in."}
        </p>
      </div>
    </div>
  );
}
