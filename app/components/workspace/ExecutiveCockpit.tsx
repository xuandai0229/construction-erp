
'use client';

import React from 'react';
import { formatVnd } from '../dashboard-data';

interface CockpitData {
  healthScore: number;
  activeAlerts: number;
  totalInvoiced: number;
  totalOverdue: number;
  atRiskProjects: number;
  topRisks: any[];
}

export default function ExecutiveCockpit({ data }: { data: CockpitData }) {
  const getHealthColor = (score: number) => {
    if (score > 80) return 'text-green-600';
    if (score > 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Health Score Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-blue-50 rounded-full opacity-50" />
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Sức Khỏe Hệ Thống</h3>
        <div className={`text-4xl font-black ${getHealthColor(data.healthScore)} mb-1`}>
          {data.healthScore}%
        </div>
        <p className="text-xs text-gray-400">Dựa trên 24 chỉ số quản trị</p>
        <div className="mt-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs font-bold text-blue-600 uppercase">Hoạt động tốt</span>
        </div>
      </div>

      {/* Financial Health Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Dòng Tiền & Công Nợ</h3>
        <div className="space-y-3">
          <div>
            <div className="text-xs text-gray-400 mb-1">Tổng nợ quá hạn</div>
            <div className="text-xl font-bold text-red-600">{formatVnd(data.totalOverdue)}</div>
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-red-500 h-full" 
              style={{ width: `${Math.min(100, (data.totalOverdue / data.totalInvoiced) * 100)}%` }} 
            />
          </div>
          <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase">
            <span>Tỷ lệ nợ: {Math.round((data.totalOverdue / data.totalInvoiced) * 100) || 0}%</span>
            <span className="text-red-500">Mức báo động</span>
          </div>
        </div>
      </div>

      {/* Portfolio Risk Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Rủi Ro Danh Mục</h3>
        <div className="text-3xl font-black text-gray-800 mb-1">
          {data.atRiskProjects} <span className="text-sm font-medium text-gray-400">dự án rủi ro</span>
        </div>
        <div className="mt-4 space-y-2">
          {data.topRisks.slice(0, 2).map((risk, idx) => (
            <div key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
              <span className="text-xs font-medium text-gray-600 truncate max-w-[120px]">{risk.projectName}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                risk.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
              }`}>
                {risk.riskScore}/100
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
