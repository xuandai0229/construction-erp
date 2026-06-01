'use client';

import React from 'react';
import { 
  getStatusLabel, 
  getStatusStyleClass,
  EnterpriseDataTable,
  EnterpriseColumn
} from '@/app/components/ui-enterprise';

interface PendingDoc {
  id: string;
  module: string;
  docNo: string;
  projectId: string;
  projectName: string;
  amount: number;
  createdById: string;
  creatorName: string;
  createdAt: Date | string;
  status: string;
}

interface ApprovalInboxTableProps {
  documents: PendingDoc[];
  currentUserId: string;
  onSelect: (doc: PendingDoc) => void;
  onApprove: (doc: PendingDoc) => void;
  onRejectClick: (doc: PendingDoc) => void;
}

export const ApprovalInboxTable: React.FC<ApprovalInboxTableProps> = ({
  documents,
  currentUserId,
  onSelect,
  onApprove,
  onRejectClick
}) => {
  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const getModuleBadge = (mod: string) => {
    switch (mod) {
      case 'INVOICE':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Hóa đơn</span>;
      case 'COST':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">Chi phí</span>;
      case 'ADVANCE':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">Tạm ứng</span>;
      case 'SETTLEMENT':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-purple-500/10 text-purple-500 border border-purple-500/20">Quyết toán</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-[var(--secondary)] text-[var(--text-secondary)] border border-[var(--border)]">{mod}</span>;
    }
  };

  const columns: EnterpriseColumn<PendingDoc>[] = [
    { 
      key: 'docNo', 
      header: 'Số chứng từ', 
      render: row => <span className="font-bold text-[var(--primary)]">{row.docNo}</span>, 
      width: '130px' 
    },
    { 
      key: 'module', 
      header: 'Phân hệ', 
      render: row => getModuleBadge(row.module), 
      width: '120px' 
    },
    { 
      key: 'projectName', 
      header: 'Công trình / Dự án', 
      render: row => row.projectName, 
      minWidth: '200px', 
      truncate: true 
    },
    { 
      key: 'amount', 
      header: 'Giá trị', 
      render: row => <span className="font-mono font-semibold">{formatVND(row.amount)}</span>, 
      width: '160px', 
      align: 'right' 
    },
    { 
      key: 'creatorName', 
      header: 'Người đề xuất', 
      render: row => row.creatorName, 
      width: '140px' 
    },
    { 
      key: 'createdAt', 
      header: 'Ngày tạo', 
      render: row => new Date(row.createdAt).toLocaleDateString('vi-VN'), 
      width: '110px', 
      align: 'center' 
    },
    { 
      key: 'status', 
      header: 'Trạng thái', 
      render: row => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusStyleClass(row.status)}`}>
          {getStatusLabel(row.status)}
        </span>
      ), 
      width: '130px', 
      align: 'center' 
    },
    { 
      key: 'actions', 
      header: 'Thao tác nhanh', 
      render: row => {
        const isCreator = row.createdById === currentUserId;
        const canAction = row.status === 'PENDING' || row.status === 'SUBMITTED';
        if (!canAction) return <span className="text-[var(--text-muted)] text-[11px]">-</span>;
        if (isCreator) {
          return (
            <span className="text-[10px] text-amber-500 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 whitespace-nowrap">
              Bất kiêm nhiệm
            </span>
          );
        }
        return (
          <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onApprove(row)}
              className="px-2.5 py-1 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded border border-emerald-700/30 transition-colors cursor-pointer"
            >
              Duyệt
            </button>
            <button
              onClick={() => onRejectClick(row)}
              className="px-2.5 py-1 text-[10px] font-bold text-[var(--text-primary)] bg-[var(--secondary)] hover:bg-[var(--secondary)]/70 rounded border border-[var(--border)] transition-colors cursor-pointer"
            >
              Từ chối
            </button>
          </div>
        );
      }, 
      width: '160px', 
      align: 'center' 
    }
  ];

  return (
    <EnterpriseDataTable
      data={documents}
      columns={columns}
      getRowKey={row => row.id}
      onRowClick={onSelect}
      minWidth="1150px"
    />
  );
};
