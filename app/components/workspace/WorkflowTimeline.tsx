
'use client';

import React from 'react';

interface TimelineStep {
  label: string;
  status: 'COMPLETED' | 'CURRENT' | 'PENDING' | 'ERROR';
  date?: string | Date;
  actor?: string;
  comment?: string;
}

export default function WorkflowTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <div className="py-6">
      <div className="relative">
        {/* Progress Bar */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100" />
        
        <div className="space-y-8 relative">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-6">
              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-sm shrink-0 ${
                step.status === 'COMPLETED' ? 'bg-green-500 text-white' :
                step.status === 'CURRENT' ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                step.status === 'ERROR' ? 'bg-red-500 text-white' : 'bg-gray-200'
              }`}>
                {step.status === 'COMPLETED' ? (
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <span className="text-[10px] font-bold">{idx + 1}</span>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h4 className={`text-sm font-bold ${step.status === 'CURRENT' ? 'text-blue-600' : 'text-gray-900'}`}>
                    {step.label}
                  </h4>
                  {step.date && (
                    <span className="text-[10px] text-gray-400 font-medium">
                      {new Date(step.date).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                </div>
                {step.actor && (
                  <div className="text-[10px] font-bold text-gray-500 mt-0.5 uppercase tracking-wide">
                    Thực hiện bởi: {step.actor}
                  </div>
                )}
                {step.comment && (
                  <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100 italic">
                    &quot;{step.comment}&quot;
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
