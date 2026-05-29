'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EnterpriseEmptyState } from '@/app/components/ui-enterprise';

export function WarehouseTable() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<any>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState('');

  const { data: warehousesRes, isLoading, error } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => { const res = await fetch('/api/inventory/warehouses'); const json = await res.json(); return json.success ? json.data : []; }
  });

  const { data: projectsRes } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => { const res = await fetch('/api/projects'); const json = await res.json(); return json.success ? json.data : []; }
  });

  const warehouses = Array.isArray(warehousesRes) ? warehousesRes : [];
  const projects = Array.isArray(projectsRes) ? projectsRes : [];
  const filtered = warehouses.filter((w: any) => w.code.toLowerCase().includes(search.toLowerCase()) || w.name.toLowerCase().includes(search.toLowerCase()));

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = data.id ? `/api/inventory/warehouses/${data.id}` : '/api/inventory/warehouses';
      const res = await fetch(url, { method: data.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Lỗi khi lưu kho');
      return json.data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['warehouses'] }); setShowModal(false); resetForm(); },
    onError: (err: any) => { alert(err.message); }
  });

  const resetForm = () => { setEditingWarehouse(null); setCode(''); setName(''); setProjectId(''); };

  const handleEdit = (w: any) => { setEditingWarehouse(w); setCode(w.code); setName(w.name); setProjectId(w.projectId || ''); setShowModal(true); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) { alert('Vui lòng nhập Mã và Tên kho!'); return; }
    saveMutation.mutate({ id: editingWarehouse?.id, code, name, projectId: projectId || null });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm mã hoặc tên kho bãi..." className="flex-1 h-10 px-3 rounded-lg border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 text-sm" />
        <button onClick={() => { resetForm(); setShowModal(true); }} className="h-10 px-5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm whitespace-nowrap">Thêm kho hàng</button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">{[1,2,3].map(i => <div key={i} className="h-12 w-full animate-pulse bg-zinc-800/40 rounded-lg" />)}</div>
      ) : error ? (
        <div className="p-4 rounded bg-red-950/20 border border-red-900/50 text-red-400">Có lỗi xảy ra khi tải danh mục kho.</div>
      ) : filtered.length === 0 ? (
        <EnterpriseEmptyState title="Không tìm thấy kho hàng nào" description="Hãy tạo mới kho hàng đầu tiên." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/40">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider">
              <tr><th className="p-3">Mã kho</th><th className="p-3">Tên kho bãi</th><th className="p-3">Công trình liên kết</th><th className="p-3 w-20">Thao tác</th></tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-zinc-200">
              {filtered.map((w: any) => (
                <tr key={w.id} className="hover:bg-zinc-800/20">
                  <td className="p-3 font-bold text-blue-400">{w.code}</td>
                  <td className="p-3">{w.name}</td>
                  <td className="p-3">{w.project?.name || <span className="text-zinc-500 italic">Kho tổng</span>}</td>
                  <td className="p-3"><button onClick={() => handleEdit(w)} className="px-2 py-1 text-[10px] font-semibold rounded bg-zinc-800 text-zinc-200 border border-zinc-700 hover:bg-zinc-700">Sửa</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl text-[var(--foreground)]">
            <h3 className="text-lg font-black text-white uppercase tracking-wider mb-6">{editingWarehouse ? 'CẬP NHẬT KHO' : 'THÊM MỚI KHO'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Mã kho *</label><input type="text" value={code} onChange={(e) => setCode(e.target.value)} disabled={!!editingWarehouse} placeholder="KHO_CAT" className="w-full h-10 px-3 rounded-lg border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 disabled:opacity-50" /></div>
              <div><label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Tên kho *</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Kho cát đá dự án A" className="w-full h-10 px-3 rounded-lg border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500" /></div>
              <div><label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Công trình</label><select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-zinc-700 bg-zinc-900 text-white focus:outline-none focus:border-blue-500"><option value="">Không liên kết (Kho tổng)</option>{projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-semibold rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700">Hủy bỏ</button>
                <button type="submit" disabled={saveMutation.isPending} className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50">{saveMutation.isPending ? 'Đang lưu...' : 'Lưu lại'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
