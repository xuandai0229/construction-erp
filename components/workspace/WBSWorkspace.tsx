"use client";

import React, { useState } from 'react';

interface WBSNode {
  id: string;
  code: string;
  name: string;
  level: number;
  budget: number;
  actual: number;
  committed: number;
  progress: number;
  isExpanded?: boolean;
  children?: WBSNode[];
}

const mockWBS: WBSNode[] = [
  {
    id: '1', code: '1.0', name: 'PHẦN CỌC & MÓNG', level: 0, budget: 120000000, actual: 95000000, committed: 110000000, progress: 85,
    children: [
      { id: '1.1', code: '1.1', name: 'Ép cọc ly tâm D500', level: 1, budget: 50000000, actual: 48000000, committed: 50000000, progress: 98 },
      { id: '1.2', code: '1.2', name: 'Đào đất hố móng', level: 1, budget: 30000000, actual: 25000000, committed: 30000000, progress: 70 },
      { id: '1.3', code: '1.3', name: 'Bê tông lót móng', level: 1, budget: 40000000, actual: 22000000, committed: 30000000, progress: 55 },
    ]
  },
  {
    id: '2', code: '2.0', name: 'PHẦN THÂN TẦNG HẦM', level: 0, budget: 250000000, actual: 120000000, committed: 180000000, progress: 45,
    children: [
      { id: '2.1', code: '2.1', name: 'Ván khuôn dầm sàn', level: 1, budget: 80000000, actual: 45000000, committed: 70000000, progress: 60 },
      { id: '2.2', code: '2.2', name: 'Cốt thép dầm sàn', level: 1, budget: 170000000, actual: 75000000, committed: 110000000, progress: 40 },
    ]
  }
];

export const WBSWorkspace = () => {
  const [data, setData] = useState(mockWBS);

  const renderRows = (nodes: WBSNode[]) => {
    return nodes.map(node => (
      <React.Fragment key={node.id}>
        <tr>
          <td style={{ paddingLeft: `${node.level * 24 + 16}px` }}>
            <span style={{ marginRight: '8px', cursor: 'pointer', opacity: node.children ? 1 : 0 }}>▼</span>
            <span style={{ fontWeight: node.level === 0 ? 700 : 400 }}>{node.code} {node.name}</span>
          </td>
          <td className="text-right">{node.budget.toLocaleString()}</td>
          <td className="text-right">{node.committed.toLocaleString()}</td>
          <td className="text-right" style={{ color: node.actual > node.budget ? 'var(--status-critical)' : 'inherit' }}>
            {node.actual.toLocaleString()}
          </td>
          <td>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="indicator" style={{ width: '60px', marginBottom: 0 }}>
                <div className="indicator-fill" style={{ width: `${node.progress}%`, background: 'var(--brand-primary)' }}></div>
              </div>
              <span style={{ fontSize: '0.75rem' }}>{node.progress}%</span>
            </div>
          </td>
          <td>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '0.7rem' }}>Chi tiết</button>
              <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.7rem' }}>+ Cost</button>
            </div>
          </td>
        </tr>
        {node.children && renderRows(node.children)}
      </React.Fragment>
    ));
  };

  return (
    <div className="wbs-workspace" style={{ marginTop: 'var(--space-xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
        <h3>WBS & BOQ Management Workspace</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input type="text" placeholder="Tìm kiếm hạng mục..." style={{ background: 'var(--erp-card)', border: '1px solid var(--erp-border)', borderRadius: '4px', padding: '4px 12px', color: 'white' }} />
          <button className="btn btn-primary" style={{ padding: '4px 12px' }}>+ Thêm hạng mục</button>
        </div>
      </div>

      <div className="erp-table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th style={{ width: '40%' }}>Mã & Tên Hạng Mục</th>
              <th className="text-right">Ngân sách (Budget)</th>
              <th className="text-right">Cam kết (Committed)</th>
              <th className="text-right">Thực tế (Actual)</th>
              <th style={{ width: '120px' }}>Tiến độ</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {renderRows(data)}
          </tbody>
        </table>
      </div>
    </div>
  );
};
