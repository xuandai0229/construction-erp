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
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {steps.map((step, idx) => (
          <li key={idx}>
            <div className="relative pb-8">
              {idx !== steps.length - 1 ? (
                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-zinc-200" aria-hidden="true" />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span
                    className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                      step.status === "completed"
                        ? "bg-emerald-500 text-white"
                        : step.status === "rejected"
                        ? "bg-rose-500 text-white"
                        : step.status === "current"
                        ? "bg-blue-500 text-white"
                        : "bg-zinc-200 text-zinc-500"
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
                      <span className="text-xs font-semibold">{idx + 1}</span>
                    )}
                  </span>
                </div>
                <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                  <div>
                    <p className="text-sm font-semibold text-zinc-950">
                      {step.label} <span className="font-normal text-zinc-500">({step.role})</span>
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">Người thực hiện: <span className="font-semibold text-zinc-700">{step.user}</span></p>
                    {step.reason && (
                      <div className="mt-1.5 p-2 bg-rose-50 border border-rose-100 rounded-lg text-xs text-rose-700 font-medium">
                        Lý do từ chối: {step.reason}
                      </div>
                    )}
                  </div>
                  <div className="text-right text-xs whitespace-nowrap text-zinc-400">
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
