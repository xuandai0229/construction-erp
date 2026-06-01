'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  EnterpriseEmptyState,
  EnterpriseLoadingState,
  EnterpriseErrorState,
  EnterpriseDataTable,
  EnterpriseColumn,
  EnterpriseModal
} from '@/app/components/ui-enterprise';

export function WarehouseTable() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<any>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState('');

  const { data: warehousesRes, isLoading, error, refetch } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => { 
      const res = await fetch('/api/inventory/warehouses'); 
      const json = await res.json(); 
      return json.success ? json.data : []; 
    }
  });

  const { data: projectsRes } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => { 
      const res = await fetch('/api/projects'); 
      const json = await res.json(); 
      return json.success ? json.data : []; 
    }
  });

  const warehouses = Array.isArray(warehousesRes) ? warehousesRes : [];
  const projects = Array.isArray(projectsRes) ? projectsRes : [];
  const filtered = warehouses.filter((w: any) => 
    w.code.toLowerCase().includes(search.toLowerCase()) || 
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = data.id ? `/api/inventory/warehouses/${data.id}` : '/api/inventory/warehouses';
      const res = await fetch(url, { 
        method: data.id ? 'PUT' : 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(data) 
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Lỗi khi lưu kho');
      return json.data;
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['warehouses'] }); 
      setShowModal(false); 
      resetForm(); 
    },
    onError: (err: any) => { 
      alert(err.message); 
    }
  });

  const resetForm = () => { 
    setEditingWarehouse(null); 
    setCode(''); 
    setName(''); 
    setProjectId(''); 
  };

  const handleEdit = (w: any) => { 
    setEditingWarehouse(w); 
    setCode(w.code); 
    setName(w.name); 
    setProjectId(w.projectId || ''); 
    setShowModal(true); 
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) { 
      alert('Vui lòng nhập Mã và Tên kho!'); 
      return; 
    }
    saveMutation.mutate({ 
      id: editingWarehouse?.id, 
      code, 
      name, 
      projectId: projectId || null 
    });
  };

  const columns: EnterpriseColumn<any>[] = [
    { key: 'code', header: 'Mã kho', render: row => <span className="font-bold text-[var(--primary)]">{row.code}</span>, width: '150px' },
    { key: 'name', header: 'Tên kho bãi', render: row => row.name, minWidth: '220px' },
    { key: 'project', header: 'Công trình liên kết', render: row => row.project?.name || <span className="text-[var(--text-muted)] italic">Kho tổng</span>, minWidth: '240px' },
    { key: 'actions', header: 'Thao tác', render: row => (
      <button 
        onClick={() => handleEdit(row)} 
        className="px-2.5 py-1 text-[10px] font-semibold rounded bg-[var(--secondary)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--secondary)]/70 transition-colors cursor-pointer"
      >
        Sửa
      </button>
    ), width: '100px', align: 'center' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input 
          type="text" 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          placeholder="Tìm kiếm mã hoặc tên kho bãi..." 
          className="flex-1 h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] text-sm" 
        />
        <button 
          onClick={() => { resetForm(); setShowModal(true); }} 
          className="h-10 px-5 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] font-bold text-sm whitespace-nowrap transition-colors cursor-pointer"
        >
          + Thêm kho bãi
        </button>
      </div>

      {isLoading ? (
        <EnterpriseLoadingState message="Đang tải danh sách kho..." />
      ) : error ? (
        <EnterpriseErrorState 
          title="Lỗi tải dữ liệu" 
          description="Có lỗi xảy ra khi tải danh mục kho bãi." 
          onRetry={refetch}
        />
      ) : filtered.length === 0 ? (
        <EnterpriseEmptyState 
          title="Không tìm thấy kho bãi" 
          description="Hãy tạo mới địa điểm kho bãi đầu tiên." 
          iconType="generic"
        />
      ) : (
        <EnterpriseDataTable
          data={filtered}
          columns={columns}
          getRowKey={row => row.id}
          minWidth="800px"
        />
      )}

      <EnterpriseModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingWarehouse ? 'CẬP NHẬT KHO BÃI' : 'THÊM MỚI KHO BÃI'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1.5">Mã kho *</label>
            <input 
              type="text" 
              value={code} 
              onChange={(e) => setCode(e.target.value)} 
              disabled={!!editingWarehouse} 
              placeholder="KHO_CAT" 
              className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] disabled:opacity-50" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1.5">Tên kho *</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Kho cát đá dự án A" 
              className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1.5">Công trình liên kết</label>
            <select 
              value={projectId} 
              onChange={(e) => setProjectId(e.target.value)} 
              className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="">Không liên kết (Kho tổng)</option>
              {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
            <button 
              type="button" 
              onClick={() => setShowModal(false)} 
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--secondary)] text-[var(--text-primary)] hover:bg-[var(--secondary)]/80 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button 
              type="submit" 
              disabled={saveMutation.isPending} 
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {saveMutation.isPending ? 'Đang lưu...' : 'Lưu lại'}
            </button>
          </div>
        </form>
      </EnterpriseModal>
    </div>
  );
}
