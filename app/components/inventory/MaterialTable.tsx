'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  EnterpriseEmptyState, 
  EnterpriseModal, 
  EnterpriseLoadingState, 
  EnterpriseErrorState 
} from '@/app/components/ui-enterprise';

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

  const { data: materialsRes, isLoading, error, refetch } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => { 
      const res = await fetch('/api/inventory/materials'); 
      const json = await res.json(); 
      return json.success ? json.data : []; 
    }
  });

  const materials = Array.isArray(materialsRes) ? materialsRes : [];
  const filteredMaterials = materials.filter((m: any) => 
    m.code.toLowerCase().includes(search.toLowerCase()) || 
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = data.id ? `/api/inventory/materials/${data.id}` : '/api/inventory/materials';
      const res = await fetch(url, { 
        method: data.id ? 'PUT' : 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(data) 
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Lỗi khi lưu vật tư');
      return json.data;
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['materials'] }); 
      setShowModal(false); 
      resetForm(); 
    },
    onError: (err: any) => { 
      alert(err.message); 
    }
  });

  const resetForm = () => { 
    setEditingMaterial(null); 
    setCode(''); 
    setName(''); 
    setUnit(''); 
    setCategory('MATERIAL'); 
    setDefaultAccount('152'); 
    setMinStock('0'); 
  };

  const handleEdit = (mat: any) => {
    setEditingMaterial(mat); 
    setCode(mat.code); 
    setName(mat.name); 
    setUnit(mat.unit);
    setCategory(mat.category || 'MATERIAL'); 
    setDefaultAccount(mat.defaultAccount || '152'); 
    setMinStock(String(mat.minStock || 0)); 
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim() || !unit.trim()) { 
      alert('Vui lòng điền đầy đủ Mã, Tên, Đơn vị tính!'); 
      return; 
    }
    saveMutation.mutate({ 
      id: editingMaterial?.id, 
      code, 
      name, 
      unit, 
      category, 
      defaultAccount, 
      minStock: Number(minStock) || 0 
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input 
          type="text" 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          placeholder="Tìm kiếm mã hoặc tên vật tư..." 
          className="flex-1 h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] text-sm" 
        />
        <button 
          onClick={() => { resetForm(); setShowModal(true); }} 
          className="h-10 px-5 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] font-bold text-sm whitespace-nowrap transition-colors cursor-pointer"
        >
          + Thêm vật tư
        </button>
      </div>

      {isLoading ? (
        <EnterpriseLoadingState message="Đang tải danh mục vật tư..." />
      ) : error ? (
        <EnterpriseErrorState 
          title="Lỗi tải dữ liệu" 
          description="Không thể tải danh mục vật tư từ hệ thống." 
          onRetry={refetch} 
        />
      ) : filteredMaterials.length === 0 ? (
        <EnterpriseEmptyState 
          title="Không tìm thấy vật tư" 
          description="Danh mục chưa ghi nhận vật tư nào khớp với từ khóa tìm kiếm." 
          iconType="generic"
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--card)]">
          <table className="w-full text-xs text-left">
            <thead className="bg-[var(--secondary)] border-b border-[var(--border)] text-[var(--text-secondary)] font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3">Mã vật tư</th>
                <th className="p-3">Tên vật tư</th>
                <th className="p-3">ĐVT</th>
                <th className="p-3">Loại</th>
                <th className="p-3">TK kho</th>
                <th className="p-3 text-right">Tồn tối thiểu</th>
                <th className="p-3 w-20">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-[var(--text-primary)]">
              {filteredMaterials.map((m: any) => (
                <tr key={m.id} className="hover:bg-[var(--secondary)]/25 transition-colors">
                  <td className="p-3 font-bold text-[var(--primary)]">{m.code}</td>
                  <td className="p-3">{m.name}</td>
                  <td className="p-3">{m.unit}</td>
                  <td className="p-3">{m.category === 'MATERIAL' ? 'Nguyên vật liệu' : m.category === 'EQUIPMENT' ? 'Thiết bị/Công cụ' : m.category}</td>
                  <td className="p-3">
                    <span className="px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--text-secondary)] font-mono text-[10px] border border-[var(--border)]">
                      {m.defaultAccount}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono">{m.minStock || 0}</td>
                  <td className="p-3">
                    <button 
                      onClick={() => handleEdit(m)} 
                      className="px-2.5 py-1 text-[10px] font-semibold rounded bg-[var(--secondary)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--secondary)]/70 transition-colors"
                    >
                      Sửa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <EnterpriseModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingMaterial ? 'CẬP NHẬT VẬT TƯ' : 'THÊM MỚI VẬT TƯ'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1.5">Mã vật tư *</label>
              <input 
                type="text" 
                value={code} 
                onChange={(e) => setCode(e.target.value)} 
                disabled={!!editingMaterial} 
                className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] disabled:opacity-50" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1.5">ĐVT *</label>
              <input 
                type="text" 
                value={unit} 
                onChange={(e) => setUnit(e.target.value)} 
                placeholder="Kg, Mét, Bộ..." 
                className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]" 
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1.5">Tên vật tư *</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Nhập tên vật tư chi tiết..." 
              className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1.5">Phân loại</label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)} 
                className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
              >
                <option value="MATERIAL">Nguyên vật liệu (152)</option>
                <option value="FUEL">Nhiên liệu</option>
                <option value="EQUIPMENT">Thiết bị/Công cụ (153)</option>
                <option value="SPARE_PARTS">Phụ tùng</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1.5">TK kho hạch toán</label>
              <input 
                type="text" 
                value={defaultAccount} 
                onChange={(e) => setDefaultAccount(e.target.value)} 
                className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] font-mono" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1.5">Mức tồn kho tối thiểu</label>
            <input 
              type="number" 
              value={minStock} 
              onChange={(e) => setMinStock(e.target.value)} 
              className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] font-mono" 
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
            <button 
              type="button" 
              onClick={() => setShowModal(false)} 
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--secondary)] text-[var(--text-primary)] hover:bg-[var(--secondary)]/80 transition-colors"
            >
              Hủy bỏ
            </button>
            <button 
              type="submit" 
              disabled={saveMutation.isPending} 
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 disabled:opacity-50 transition-colors"
            >
              {saveMutation.isPending ? 'Đang lưu...' : 'Lưu lại'}
            </button>
          </div>
        </form>
      </EnterpriseModal>
    </div>
  );
}
