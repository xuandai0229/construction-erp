'use client';

import React from 'react';

interface DocumentStatusTimelineProps {
  status: string;
  className?: string;
}

export default function DocumentStatusTimeline({ status, className = "" }: DocumentStatusTimelineProps) {
  const steps = ["DRAFT", "SUBMITTED", "APPROVED", "POSTED", "REVERSED"];
  const normalizedStatus = status.toUpperCase() === "PAID" || status.toUpperCase() === "FULLY_SETTLED" ? "POSTED" : status.toUpperCase() === "CANCELLED" ? "REVERSED" : status.toUpperCase() === "PARTIALLY_SETTLED" ? "POSTED" : status.toUpperCase();

  const getStepIndex = (s: string) => {
    return steps.indexOf(s);
  };

  const currentIndex = getStepIndex(normalizedStatus);

  return (
    <div className={`flex items-center justify-between w-full p-4 bg-[var(--card)] border border-[var(--border)] rounded-lg select-none ${className}`}>
      {steps.map((step, idx) => {
        const isCompleted = idx <= currentIndex && currentIndex !== -1;
        const isActive = idx === currentIndex;
        const isReversedStep = step === "REVERSED" && (normalizedStatus === "REVERSED" || status.toUpperCase() === "CANCELLED");

        let colorClass = "bg-[var(--border)] text-[var(--text-tertiary)]";
        if (isReversedStep) {
          colorClass = "bg-rose-500 text-white border-rose-500";
        } else if (isActive) {
          colorClass = "bg-blue-600 text-white ring-4 ring-blue-500/20";
        } else if (isCompleted) {
          colorClass = "bg-emerald-600 text-white";
        }

        return (
          <React.Fragment key={step}>
            {idx > 0 && (
              <div className="flex-1 h-0.5 mx-2 bg-[var(--border)] relative">
                <div
                  className={`absolute inset-0 transition-all duration-300 ${
                    idx <= currentIndex ? (normalizedStatus === "REVERSED" ? "bg-rose-500" : "bg-emerald-600") : "bg-[var(--border)]"
                  }`}
                />
              </div>
            )}
            <div className="flex flex-col items-center space-y-1">
              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-200 ${colorClass}`}>
                {idx + 1}
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-wider ${isActive ? "text-blue-500 font-extrabold" : isReversedStep ? "text-rose-500 font-extrabold" : "text-[var(--text-secondary)]"}`}>
                {step === "POSTED" && (status.toUpperCase() === "PAID" || status.toUpperCase() === "FULLY_SETTLED") ? "POSTED/PAID" : step}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
