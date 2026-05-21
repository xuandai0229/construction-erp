'use client';

import React, { useState } from 'react';
import EnterpriseDropdown, { DropdownOption } from './EnterpriseDropdown';

interface StatusFilterProps {
  value: string;
  onChange: (status: string) => void;
}

const statusOptions: DropdownOption[] = [
  {
    value: 'ALL',
    label: 'Tất cả dự án',
    description: 'Hiển thị toàn bộ dự án',
    color: 'var(--text-secondary)',
  },
  {
    value: 'ACTIVE',
    label: 'Đang thi công',
    description: 'Dự án đang hoạt động',
    color: '#10B981',
  },
  {
    value: 'PLANNED',
    label: 'Kế hoạch',
    description: 'Dự án sắp bắt đầu',
    color: '#2563EB',
  },
  {
    value: 'COMPLETED',
    label: 'Hoàn thành',
    description: 'Dự án đã xong',
    color: '#0891B2',
  },
  {
    value: 'CLOSED',
    label: 'Quyết toán',
    description: 'Dự án đã quyết toán',
    color: '#64748B',
  },
];

/**
 * Status Filter Dropdown
 * Replaces inline button filter with enterprise dropdown
 * Renders via portal to prevent overflow clipping
 */
export function StatusFilterDropdown({ value, onChange }: StatusFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = statusOptions.find(opt => opt.value === value);
  const displayLabel = selectedOption?.label || 'Lọc trạng thái';

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          height: '36px',
          padding: '0 14px',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
          border: '1px solid',
          borderColor: isOpen ? 'var(--brand)' : 'var(--border)',
          background: isOpen ? 'var(--brand-light)' : 'white',
          color: isOpen ? 'var(--brand)' : 'var(--text-secondary)',
          transition: 'all 0.12s',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          whiteSpace: 'nowrap',
        }}
      >
        {displayLabel}
        <svg
          viewBox="0 0 24 24"
          style={{
            height: '14px',
            width: '14px',
            transition: 'transform 0.12s',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M19 14l-7 7m0 0l-7-7" />
        </svg>
      </button>

      <EnterpriseDropdown
        isOpen={isOpen}
        options={statusOptions}
        value={value}
        onSelect={(selectedValue) => {
          onChange(selectedValue);
          setIsOpen(false);
        }}
        onClose={() => setIsOpen(false)}
        searchable={false}
      />
    </div>
  );
}

export default StatusFilterDropdown;
