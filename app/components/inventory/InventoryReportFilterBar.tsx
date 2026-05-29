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

  // Fetch WBS
  const { data: wbsRes } = useQuery({
    queryKey: ['wbs'],
    queryFn: async () => {
      const res = await fetch('/api/wbs');
      const json = await res.json();
      return json.success ? json.data : [];
    }
  });

  const materials = Array.isArray(materialsRes) ? materialsRes : [];
  const warehouses = Array.isArray(warehousesRes) ? warehousesRes : [];
  const projects = Array.isArray(projectsRes) ? projectsRes : [];
  const wbsItems = Array.isArray(wbsRes) ? wbsRes : [];

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

  return (
    <form onSubmit={handleApply} className="bg-zinc-900/30 p-5 rounded-xl border border-zinc-800/80 space-y-4">
      <div className="flex flex-wrap items-end gap-4 text-xs">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-[10px] font-black text-zinc-400 uppercase mb-2">Chọn kho bãi *</label>
          <select
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-zinc-750 bg-zinc-850 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">-- Tất cả kho bãi --</option>
            {warehouses.map((w: any) => (
              <option key={w.id} value={w.id}>
                [{w.code}] {w.name}
              </option>
            ))}
          </select>
        </div>

        {showMaterialSelect && (
          <div className="flex-1 min-w-[150px]">
            <label className="block text-[10px] font-black text-zinc-400 uppercase mb-2">Chọn vật tư *</label>
            <select
              required
              value={materialItemId}
              onChange={(e) => setMaterialItemId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-zinc-750 bg-zinc-850 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">-- Chọn vật tư --</option>
              {materials.map((m: any) => (
                <option key={m.id} value={m.id}>
                  [{m.code}] {m.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex-1 min-w-[150px]">
          <label className="block text-[10px] font-black text-zinc-400 uppercase mb-2">Công trình / Dự án</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-zinc-750 bg-zinc-850 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">-- Tất cả công trình --</option>
            {projects.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="w-[120px]">
          <label className="block text-[10px] font-black text-zinc-400 uppercase mb-2">Từ ngày</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-zinc-750 bg-zinc-850 text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="w-[120px]">
          <label className="block text-[10px] font-black text-zinc-400 uppercase mb-2">Đến ngày</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-zinc-750 bg-zinc-850 text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          className="h-10 px-5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg hover:shadow-blue-500/10 transition-all flex items-center gap-2 whitespace-nowrap"
        >
          Chạy báo cáo
        </button>
      </div>
    </form>
  );
}
