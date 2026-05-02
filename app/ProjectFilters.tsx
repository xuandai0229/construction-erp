'use client';

import { useState } from 'react';

interface FilterProps {
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onInvestorChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onDateRangeChange: (start: string, end: string) => void;
  onAddProject?: () => void;
  onExportCSV?: () => void;
}

export default function ProjectFilters({
  onSearchChange,
  onStatusChange,
  onInvestorChange,
  onTypeChange,
  onDateRangeChange,
  onAddProject,
  onExportCSV,
}: FilterProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') {
      setStartDate(value);
      onDateRangeChange(value, endDate);
    } else {
      setEndDate(value);
      onDateRangeChange(startDate, value);
    }
  };

  return (
    <div className="px-6 py-4 bg-[#1e293b] border-b border-[#334155] space-y-4">
      <div className="flex gap-4 items-end flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[#94a3b8] text-sm font-medium mb-2">
            Tìm kiếm theo tên/mã dự án
          </label>
          <input
            type="text"
            placeholder="Nhập tên hoặc mã..."
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        <div className="min-w-[150px]">
          <label className="block text-[#94a3b8] text-sm font-medium mb-2">
            Trạng thái
          </label>
          <select
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#e2e8f0] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer transition-all"
          >
            <option value="">Tất cả</option>
            <option value="active">Đang thi công</option>
            <option value="completed">Hoàn thành</option>
            <option value="paused">Tạm dừng</option>
          </select>
        </div>

        <div className="min-w-[150px]">
          <label className="block text-[#94a3b8] text-sm font-medium mb-2">
            Chủ đầu tư
          </label>
          <input
            type="text"
            placeholder="Lọc theo chủ đầu tư..."
            onChange={(e) => onInvestorChange(e.target.value)}
            className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        <div className="min-w-[150px]">
          <label className="block text-[#94a3b8] text-sm font-medium mb-2">
            Loại dự án
          </label>
          <input
            type="text"
            placeholder="Lọc theo loại..."
            onChange={(e) => onTypeChange(e.target.value)}
            className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        <button className="px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#e2e8f0] hover:bg-[#1e293b] transition-colors flex items-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4a8 8 0 100 16 8 8 0 000-16zM12 8v4m0 4h.01"
            />
          </svg>
          Lọc
        </button>
      </div>

      <div className="flex gap-4 items-end flex-wrap pt-2 border-t border-[#334155]">
        <div className="min-w-[130px]">
          <label className="block text-[#94a3b8] text-sm font-medium mb-2">
            Ngày bắt đầu
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => handleDateChange('start', e.target.value)}
            className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#e2e8f0] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        <div className="min-w-[130px]">
          <label className="block text-[#94a3b8] text-sm font-medium mb-2">
            Ngày kết thúc
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => handleDateChange('end', e.target.value)}
            className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#e2e8f0] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={onAddProject}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Thêm dự án
          </button>

          <button
            onClick={onExportCSV}
            className="px-6 py-2 bg-[#0f172a] border border-[#334155] text-[#e2e8f0] rounded-lg font-medium hover:bg-[#1e293b] transition-all flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m4-3H8m7-9H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z"
              />
            </svg>
            Xuất Excel
          </button>
        </div>
      </div>
    </div>
  );
}
