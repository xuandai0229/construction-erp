"use client";

import React from "react";

interface TimelineStep {
  label: string;
  role: string;
  user: string;
  time?: string | Date;
  status: "completed" | "current" | "upcoming" | "rejected";
  reason?: string;
}

interface ApprovalTimelineProps {
  steps: TimelineStep[];
}

export const ApprovalTimeline: React.FC<ApprovalTimelineProps> = ({ steps }) => {
  return (
    <div className="flow-root text-xs">
      <ul role="list" className="-mb-8">
        {steps.map((step, idx) => (
          <li key={idx}>
            <div className="relative pb-8">
              {idx !== steps.length - 1 ? (
                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-[var(--border)]" aria-hidden="true" />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span
                    className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-[var(--card)] ${
                      step.status === "completed"
                        ? "bg-emerald-500 text-white"
                        : step.status === "rejected"
                        ? "bg-rose-500 text-white"
                        : step.status === "current"
                        ? "bg-blue-500 text-white"
                        : "bg-[var(--secondary)] text-[var(--text-muted)]"
                    }`}
                  >
                    {step.status === "completed" ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : step.status === "rejected" ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <span className="text-[10px] font-bold">{idx + 1}</span>
                    )}
                  </span>
                </div>
                <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">
                      {step.label} <span className="font-normal text-[var(--text-muted)]">({step.role})</span>
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                      Người thực hiện: <span className="font-semibold">{step.user}</span>
                    </p>
                    {step.reason && (
                      <div className="mt-1.5 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-500 font-medium">
                        Lý do từ chối: {step.reason}
                      </div>
                    )}
                  </div>
                  <div className="text-right text-[10px] whitespace-nowrap text-[var(--text-muted)] font-mono">
                    {step.time ? new Date(step.time).toLocaleString("vi-VN") : "Chưa thực hiện"}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
