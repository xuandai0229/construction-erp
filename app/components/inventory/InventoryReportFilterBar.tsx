'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

interface FilterState {
  warehouseId?: string;
  materialItemId?: string;
  projectId?: string;
  wbsId?: string;
  fromDate: string;
  toDate: string;
}

interface InventoryReportFilterBarProps {
  onFilterChange: (filters: FilterState) => void;
  showMaterialSelect?: boolean;
}

export function InventoryReportFilterBar({ onFilterChange, showMaterialSelect = false }: InventoryReportFilterBarProps) {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
  const endOfDay = today.toISOString().split('T')[0];

  const [warehouseId, setWarehouseId] = useState('');
  const [materialItemId, setMaterialItemId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [wbsId, setWbsId] = useState('');
  const [fromDate, setFromDate] = useState(startOfYear);
  const [toDate, setToDate] = useState(endOfDay);

  // Fetch materials
  const { data: materialsRes } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const res = await fetch('/api/inventory/materials');
      const json = await res.json();
      return json.success ? json.data : [];
    }
  });

  // Fetch warehouses
  const { data: warehousesRes } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await fetch('/api/inventory/warehouses');
      const json = await res.json();
      return json.success ? json.data : [];
    }
  });

  // Fetch projects
  const { data: projectsRes } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects');
      const json = await res.json();
      return json.success ? json.data : [];
    }
  });

  const materials = Array.isArray(materialsRes) ? materialsRes : [];
  const warehouses = Array.isArray(warehousesRes) ? warehousesRes : [];
  const projects = Array.isArray(projectsRes) ? projectsRes : [];

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({
      warehouseId: warehouseId || undefined,
      materialItemId: materialItemId || undefined,
      projectId: projectId || undefined,
      wbsId: wbsId || undefined,
      fromDate,
      toDate
    });
  };

  const inputClass = "w-full h-10 px-3 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all outline-none text-xs";

  return (
    <form onSubmit={handleApply} className="bg-[var(--secondary)]/40 p-5 rounded-xl border border-[var(--border)] space-y-4">
      <div className="flex flex-wrap items-end gap-4 text-xs">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase mb-2">Chọn kho bãi *</label>
          <select
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            className={inputClass}
          >
            <option value="" className="bg-[var(--card)] text-[var(--text-primary)]">-- Tất cả kho bãi --</option>
            {warehouses.map((w: any) => (
              <option key={w.id} value={w.id} className="bg-[var(--card)] text-[var(--text-primary)]">
                [{w.code}] {w.name}
              </option>
            ))}
          </select>
        </div>

        {showMaterialSelect && (
          <div className="flex-1 min-w-[150px]">
            <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase mb-2">Chọn vật tư *</label>
            <select
              required
              value={materialItemId}
              onChange={(e) => setMaterialItemId(e.target.value)}
              className={inputClass}
            >
              <option value="" className="bg-[var(--card)] text-[var(--text-primary)]">-- Chọn vật tư --</option>
              {materials.map((m: any) => (
                <option key={m.id} value={m.id} className="bg-[var(--card)] text-[var(--text-primary)]">
                  [{m.code}] {m.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex-1 min-w-[150px]">
          <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase mb-2">Công trình / Dự án</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className={inputClass}
          >
            <option value="" className="bg-[var(--card)] text-[var(--text-primary)]">-- Tất cả công trình --</option>
            {projects.map((p: any) => (
              <option key={p.id} value={p.id} className="bg-[var(--card)] text-[var(--text-primary)]">
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="w-[120px]">
          <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase mb-2">Từ ngày</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="w-[120px]">
          <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase mb-2">Đến ngày</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          className="h-10 px-5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg hover:shadow-blue-500/10 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer"
        >
          Chạy báo cáo
        </button>
      </div>
    </form>
  );
}
