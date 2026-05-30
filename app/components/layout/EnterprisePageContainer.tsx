'use client';

import React from 'react';

export default function EnterprisePageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 scrollbar-thin bg-[var(--background)]">
      <div className="mx-auto w-full max-w-[1600px] space-y-6">
        {children}
      </div>
    </div>
  );
}
