"use client";

import React, { useEffect, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface CheckItem  { category: string; item: string; status: "CLEAR"|"BLOCKING"|"WARNING"; count?: number; detail?: string }
interface Exception  { id: string; severity: "CRITICAL"|"HIGH"|"MEDIUM"; category: string; description: string; agingDays: number }
interface CloseState {
  period: string;
  closeReadiness: "READY"|"BLOCKED";
  blockingCount: number;
  warningCount: number;
  criticalExceptions: number;
  checklist: CheckItem[];
  kpis: { periodLocked: boolean; closeDurationDays: number|null; manualJournalRatio: string; lateApprovals: number; totalJournalsPosted: number };
  exceptions: Exception[];
}

// ─── Colour helpers ───────────────────────────────────────────────────────────
const statusColor  = { CLEAR: "#10b981", BLOCKING: "#ef4444", WARNING: "#f59e0b" } as const;
const severityColor= { CRITICAL: "#ef4444", HIGH: "#f59e0b", MEDIUM: "#3b82f6"  } as const;

// ─── Sub-components ───────────────────────────────────────────────────────────
function KPITile({ label, value, sub, urgent }: { label: string; value: string|number; sub?: string; urgent?: boolean }) {
  return (
    <div style={{
      padding: "1.5rem", borderRadius: "8px",
      border: `1px solid ${urgent ? "#fecaca" : "#e2e8f0"}`,
      background: urgent ? "#fef2f2" : "#fff",
    }}>
      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: "1.75rem", fontWeight: 900, marginTop: "4px", color: urgent ? "#ef4444" : "#0f172a" }}>{value}</div>
      {sub && <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>{sub}</div>}
    </div>
  );
}

function ChecklistRow({ item }: { item: CheckItem }) {
  return (
    <tr>
      <td style={{ padding: "10px 12px", fontWeight: 600, fontSize: "0.8rem" }}>{item.category}</td>
      <td style={{ padding: "10px 12px", fontSize: "0.875rem" }}>{item.item}</td>
      <td style={{ padding: "10px 12px", textAlign: "center" }}>
        {item.count !== undefined && (
          <span style={{ fontWeight: 700, color: item.count > 0 ? statusColor[item.status] : "#10b981" }}>
            {item.count}
          </span>
        )}
      </td>
      <td style={{ padding: "10px 12px" }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          padding: "3px 10px", borderRadius: "20px", fontSize: "0.7rem", fontWeight: 700,
          background: `${statusColor[item.status]}20`, color: statusColor[item.status],
        }}>
          {item.status === "CLEAR" ? "✓" : item.status === "BLOCKING" ? "✕ BLOCKING" : "⚠ WARNING"}
        </span>
      </td>
      <td style={{ padding: "10px 12px", fontSize: "0.75rem", color: "#64748b", maxWidth: "280px" }}>{item.detail ?? "—"}</td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function FinancialOperationsCenter() {
  const currentPeriod = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  const [period,    setPeriod]    = useState(currentPeriod());
  const [data,      setData]      = useState<CloseState | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [locking,   setLocking]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [lockError, setLockError] = useState<string | null>(null);

  const fetchClose = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/finance/close?period=${period}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [period]);

  useEffect(() => { fetchClose(); }, [fetchClose]);

  const lockPeriod = async () => {
    if (!confirm(`Are you sure you want to lock period ${period}? This cannot be undone without CFO override.`)) return;
    setLocking(true); setLockError(null);
    try {
      const res = await fetch("/api/finance/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period, lockedById: "CFO_USER_ID", cfoCertification: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      fetchClose();
    } catch (e: any) { setLockError(e.message); }
    finally { setLocking(false); }
  };

  const isReady = data?.closeReadiness === "READY";

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", padding: "2.5rem", background: "#f1f5f9", minHeight: "100vh", color: "#1e293b" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem" }}>
        <div>
          <div style={{ fontSize: "0.7rem", fontWeight: 900, letterSpacing: "0.15em", color: "#64748b" }}>
            ENTERPRISE FINANCIAL OPERATIONS SYSTEM
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: 900, margin: "6px 0 0", color: "#0f172a" }}>
            Financial Close War Room
          </h1>
          <p style={{ color: "#64748b", marginTop: "4px", fontSize: "0.875rem" }}>
            Month-End Close Governance & Reconciliation Control Center
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <input
            type="month"
            value={period}
            onChange={e => setPeriod(e.target.value)}
            style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.875rem" }}
          />
          <button
            onClick={fetchClose}
            disabled={loading}
            style={{ padding: "8px 16px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 700, fontSize: "0.875rem" }}
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: "16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#ef4444", marginBottom: "1.5rem" }}>
          ⚠ {error}
        </div>
      )}

      {data && (
        <>
          {/* ── Status Banner ─────────────────────────────────────────────── */}
          <div style={{
            padding: "1rem 1.5rem", borderRadius: "8px", marginBottom: "1.5rem",
            background: isReady ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${isReady ? "#bbf7d0" : "#fecaca"}`,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ fontSize: "1.5rem" }}>{isReady ? "✅" : "🔴"}</div>
              <div>
                <div style={{ fontWeight: 900, fontSize: "1rem", color: isReady ? "#15803d" : "#b91c1c" }}>
                  {isReady ? `Period ${period} is READY for CFO sign-off and lock.` : `Period ${period} is BLOCKED — ${data.blockingCount} issue(s) must be resolved.`}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>
                  {data.warningCount} warning(s) | {data.criticalExceptions} critical exception(s)
                  {data.kpis.periodLocked && " | 🔒 PERIOD LOCKED"}
                </div>
              </div>
            </div>
            {!data.kpis.periodLocked && (
              <button
                onClick={lockPeriod}
                disabled={!isReady || locking}
                style={{
                  padding: "10px 20px", borderRadius: "6px", fontWeight: 700, fontSize: "0.875rem",
                  border: "none", cursor: isReady ? "pointer" : "not-allowed",
                  background: isReady ? "#0f172a" : "#cbd5e1",
                  color: isReady ? "#fff" : "#94a3b8",
                }}
              >
                {locking ? "Locking…" : "🔒 Lock Period & CFO Certify"}
              </button>
            )}
          </div>

          {lockError && (
            <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", color: "#b91c1c", marginBottom: "1rem", fontSize: "0.875rem" }}>
              Lock failed: {lockError}
            </div>
          )}

          {/* ── KPIs ──────────────────────────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px", marginBottom: "1.5rem" }}>
            <KPITile label="PERIOD STATUS"           value={data.kpis.periodLocked ? "LOCKED 🔒" : "OPEN"} />
            <KPITile label="CLOSE DURATION (DAYS)"   value={data.kpis.closeDurationDays ?? "—"} sub="Days after period end" urgent={(data.kpis.closeDurationDays ?? 0) > 10} />
            <KPITile label="MANUAL JOURNAL RATIO"    value={data.kpis.manualJournalRatio} sub="Target: <20%" urgent={parseFloat(data.kpis.manualJournalRatio) > 20} />
            <KPITile label="LATE APPROVALS"          value={data.kpis.lateApprovals} sub="Pending >48h" urgent={data.kpis.lateApprovals > 0} />
            <KPITile label="JOURNALS POSTED"         value={data.kpis.totalJournalsPosted} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "24px" }}>

            {/* ── Pre-Close Checklist ───────────────────────────────────── */}
            <div style={{ background: "#fff", borderRadius: "8px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Pre-Close Checklist</h2>
                <div style={{ fontSize: "0.75rem" }}>
                  <span style={{ color: "#10b981", fontWeight: 700 }}>{data.checklist.filter(c=>c.status==="CLEAR").length} CLEAR</span>
                  {"  "}
                  <span style={{ color: "#ef4444", fontWeight: 700 }}>{data.blockingCount} BLOCKING</span>
                  {"  "}
                  <span style={{ color: "#f59e0b", fontWeight: 700 }}>{data.warningCount} WARNING</span>
                </div>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase" }}>
                    <th style={{ padding: "8px 12px", textAlign: "left" }}>Category</th>
                    <th style={{ padding: "8px 12px", textAlign: "left" }}>Check Item</th>
                    <th style={{ padding: "8px 12px", textAlign: "center" }}>Count</th>
                    <th style={{ padding: "8px 12px", textAlign: "left" }}>Status</th>
                    <th style={{ padding: "8px 12px", textAlign: "left" }}>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {data.checklist.map((c, i) => (
                    <ChecklistRow key={i} item={c} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Exception Grid ────────────────────────────────────────── */}
            <div style={{ background: "#fff", borderRadius: "8px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #e2e8f0" }}>
                <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Active Exceptions</h2>
                <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#64748b" }}>
                  Detected by automated daily scan — requires Finance team action
                </p>
              </div>
              <div style={{ padding: "1rem", maxHeight: "480px", overflowY: "auto" }}>
                {data.exceptions.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2rem", color: "#10b981", fontWeight: 700 }}>
                    ✓ No exceptions detected
                  </div>
                ) : (
                  data.exceptions.map((ex, i) => (
                    <div key={i} style={{
                      padding: "12px 14px", borderRadius: "6px", marginBottom: "10px",
                      borderLeft: `4px solid ${severityColor[ex.severity]}`,
                      background: `${severityColor[ex.severity]}08`,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontSize: "0.7rem", fontWeight: 900, color: severityColor[ex.severity] }}>
                          {ex.severity} — {ex.category}
                        </span>
                        {ex.agingDays > 0 && (
                          <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Aging: {ex.agingDays}d</span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "#334155" }}>{ex.description}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
