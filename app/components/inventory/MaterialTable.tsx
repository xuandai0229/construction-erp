'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EnterpriseEmptyState } from '@/app/components/ui-enterprise';

export function MaterialTable() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [category, setCategory] = useState('MATERIAL');
  const [defaultAccount, setDefaultAccount] = useState('152');
  const [minStock, setMinStock] = useState('0');

  const { data: materialsRes, isLoading, error } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => { const res = await fetch('/api/inventory/materials'); const json = await res.json(); return json.success ? json.data : []; }
  });

  const materials = Array.isArray(materialsRes) ? materialsRes : [];
  const filteredMaterials = materials.filter((m: any) => m.code.toLowerCase().includes(search.toLowerCase()) || m.name.toLowerCase().includes(search.toLowerCase()));

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = data.id ? `/api/inventory/materials/${data.id}` : '/api/inventory/materials';
      const res = await fetch(url, { method: data.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Lỗi khi lưu vật tư');
      return json.data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['materials'] }); setShowModal(false); resetForm(); },
    onError: (err: any) => { alert(err.message); }
  });

  const resetForm = () => { setEditingMaterial(null); setCode(''); setName(''); setUnit(''); setCategory('MATERIAL'); setDefaultAccount('152'); setMinStock('0'); };

  const handleEdit = (mat: any) => {
    setEditingMaterial(mat); setCode(mat.code); setName(mat.name); setUnit(mat.unit);
    setCategory(mat.category || 'MATERIAL'); setDefaultAccount(mat.defaultAccount || '152'); setMinStock(String(mat.minStock || 0)); setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim() || !unit.trim()) { alert('Vui lòng điền đầy đủ Mã, Tên, Đơn vị tính!'); return; }
    saveMutation.mutate({ id: editingMaterial?.id, code, name, unit, category, defaultAccount, minStock: Number(minStock) || 0 });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm mã hoặc tên vật tư..." className="flex-1 h-10 px-3 rounded-lg border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 text-sm" />
        <button onClick={() => { resetForm(); setShowModal(true); }} className="h-10 px-5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm whitespace-nowrap">Thêm vật tư</button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">{[1,2,3,4].map(i => <div key={i} className="h-12 w-full animate-pulse bg-zinc-800/40 rounded-lg" />)}</div>
      ) : error ? (
        <div className="p-4 rounded bg-red-950/20 border border-red-900/50 text-red-400">Có lỗi xảy ra khi tải danh mục vật tư.</div>
      ) : filteredMaterials.length === 0 ? (
        <EnterpriseEmptyState title="Không tìm thấy vật tư nào" description="Hãy tạo mới vật tư đầu tiên cho hệ thống kế toán kho." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/40">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider">
              <tr><th className="p-3">Mã vật tư</th><th className="p-3">Tên vật tư</th><th className="p-3">ĐVT</th><th className="p-3">Loại</th><th className="p-3">TK kho</th><th className="p-3 text-right">Tồn tối thiểu</th><th className="p-3 w-20">Thao tác</th></tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-zinc-200">
              {filteredMaterials.map((m: any) => (
                <tr key={m.id} className="hover:bg-zinc-800/20">
                  <td className="p-3 font-bold text-blue-400">{m.code}</td>
                  <td className="p-3">{m.name}</td>
                  <td className="p-3">{m.unit}</td>
                  <td className="p-3">{m.category}</td>
                  <td className="p-3"><span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px]">{m.defaultAccount}</span></td>
                  <td className="p-3 text-right font-mono">{m.minStock || 0}</td>
                  <td className="p-3"><button onClick={() => handleEdit(m)} className="px-2 py-1 text-[10px] font-semibold rounded bg-zinc-800 text-zinc-200 border border-zinc-700 hover:bg-zinc-700">Sửa</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl text-[var(--foreground)]">
            <h3 className="text-lg font-black text-white uppercase tracking-wider mb-6">{editingMaterial ? 'CẬP NHẬT VẬT TƯ' : 'THÊM MỚI VẬT TƯ'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Mã vật tư *</label><input type="text" value={code} onChange={(e) => setCode(e.target.value)} disabled={!!editingMaterial} className="w-full h-10 px-3 rounded-lg border border-zinc-700 bg-zinc-900 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50" /></div>
                <div><label className="block text-xs font-bold text-zinc-400 uppercase mb-2">ĐVT *</label><input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Kg, Mét, Bộ" className="w-full h-10 px-3 rounded-lg border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500" /></div>
              </div>
              <div><label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Tên vật tư *</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Thép Hòa Phát D10" className="w-full h-10 px-3 rounded-lg border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Phân loại</label><select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-zinc-700 bg-zinc-900 text-white focus:outline-none focus:border-blue-500"><option value="MATERIAL">Nguyên vật liệu (152)</option><option value="FUEL">Nhiên liệu</option><option value="EQUIPMENT">Thiết bị/Công cụ (153)</option><option value="SPARE_PARTS">Phụ tùng</option></select></div>
                <div><label className="block text-xs font-bold text-zinc-400 uppercase mb-2">TK kho</label><input type="text" value={defaultAccount} onChange={(e) => setDefaultAccount(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-zinc-700 bg-zinc-900 text-white focus:outline-none focus:border-blue-500" /></div>
              </div>
              <div><label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Tồn tối thiểu</label><input type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-zinc-700 bg-zinc-900 text-white focus:outline-none focus:border-blue-500" /></div>
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
