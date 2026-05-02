'use client';

import { useState } from 'react';

export default function ProjectHeader() {
  const [searchDate, setSearchDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4 bg-[#1e293b] border-b border-[#334155]">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative">
          <input
            type="text"
            placeholder="Tìm kiếm dự án..."
            className="px-4 py-2 pl-10 bg-[#0f172a] border border-[#334155] rounded-lg text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-80"
          />
          <svg
            className="absolute left-3 top-2.5 w-5 h-5 text-[#64748b]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-[#64748b]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            className="px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#e2e8f0] focus:outline-none focus:border-blue-500 w-32"
          />
        </div>

        <div className="flex items-center gap-2 pl-4 border-l border-[#334155]">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <span className="text-white font-semibold text-sm">AD</span>
          </div>
          <span className="text-[#e2e8f0] text-sm">admin</span>
        </div>

        <button className="p-2 hover:bg-[#334155] rounded-lg transition-colors relative">
          <svg
            className="w-5 h-5 text-[#e2e8f0]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <span className="absolute top-1 right-0 w-3 h-3 bg-red-500 rounded-full"></span>
        </button>
      </div>
    </div>
  );
}
