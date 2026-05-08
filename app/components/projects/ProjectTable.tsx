'use client';

import { Project } from '@/app/types';
import { useERPStore } from '@/store/erpStore';

const statusLabels: Record<string, { text: string; class: string }> = {
  PLANNED: { text: 'Lập kế hoạch', class: 'badge-info' },
  IN_PROGRESS: { text: 'Đang thi công', class: 'badge-success' },
  ACTIVE: { text: 'Đang hoạt động', class: 'badge-success' },
  COMPLETED: { text: 'Hoàn thành', class: 'badge-info' },
  CLOSED: { text: 'Đã đóng', class: 'badge-muted' },
  CANCELLED: { text: 'Tạm dừng', class: 'badge-warning' },
};

// Mock extending data for visual completeness to match the screenshot exactly
const enrichProject = (p: Project, index: number) => {
  const codes = [
    'PRJ-2024-001', 'PRJ-2024-002', 'PRJ-2024-003', 'PRJ-2024-004', 'PRJ-2024-005', 
    'PRJ-2024-006', 'PRJ-2024-007', 'PRJ-2024-008', 'PRJ-2024-009', 'PRJ-2024-010'
  ];
  
  const types = [
    'Cao ốc văn phòng', 'Khu căn hộ', 'Nhà máy', 'Trường học', 'Trung tâm TM', 
    'Khu nghỉ dưỡng', 'Nhà máy', 'Khu đô thị', 'Bệnh viện', 'Cải tạo'
  ];
  
  const typeColors = [
    'border-blue-500/30 text-blue-400 bg-blue-500/10',
    'border-purple-500/30 text-purple-400 bg-purple-500/10',
    'border-yellow-500/30 text-yellow-400 bg-yellow-500/10',
    'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
    'border-pink-500/30 text-pink-400 bg-pink-500/10',
    'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    'border-yellow-500/30 text-yellow-400 bg-yellow-500/10',
    'border-purple-500/30 text-purple-400 bg-purple-500/10',
    'border-red-500/30 text-red-400 bg-red-500/10',
    'border-slate-500/30 text-slate-400 bg-slate-500/10',
  ];
  
  const progressMap = [56, 32, 68, 100, 25, 40, 45, 18, 100, 60];

  return {
    ...p,
    code: codes[index % codes.length],
    type: types[index % types.length],
    typeColor: typeColors[index % typeColors.length],
    progress: progressMap[index % progressMap.length],
    thumbnail: `https://picsum.photos/seed/${p.id}/80/80`
  };
};

export default function ProjectTable({ projects, onEdit }: { projects: Project[], onEdit: (p: Project) => void }) {
  const enrichedProjects = projects.map(enrichProject);
  const deleteProject = useERPStore(state => state.deleteProject);

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa dự án "${name}"? Thao tác này không thể hoàn tác.`)) {
      deleteProject(id);
    }
  };

  return (
    <div className="erp-card" style={{ borderRadius: '12px' }}>
      <div className="erp-table-wrap">
        <table className="erp-table zebra">
          <thead>
            <tr style={{ height: '44px', background: '#F8FAFC' }}>
              <th style={{width: '5%', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em'}}>#</th>
              <th style={{width: '20%', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Dự án</th>
              <th style={{width: '15%', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Chủ đầu tư</th>
              <th style={{width: '12%', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Loại</th>
              <th style={{width: '15%', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Giá trị</th>
              <th style={{width: '10%', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Bắt đầu</th>
              <th style={{width: '10%', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Kết thúc</th>
              <th style={{width: '10%', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Trạng thái</th>
              <th style={{width: '8%', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Tiến độ</th>
              <th style={{width: '5%', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {enrichedProjects.map((p, i) => (
              <tr key={p.id} style={{ height: '44px', transition: 'background-color 0.15s ease' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')} onMouseLeave={(e) => (e.currentTarget.style.background = '')}>
                <td className="font-medium" style={{ fontSize: '12px', color: '#64748b' }}>{i + 1}</td>
                <td>
                  <div className="flex items-center gap-3">
                    <img src={p.thumbnail} alt={p.name} className="h-10 w-10 rounded-[8px] object-cover border border-[var(--border)]" />
                    <div>
                      <div className="text-[12px] font-bold text-[#111827]">{p.name}</div>
                      <div className="text-[11px] text-[#64748b] mt-0.5">{p.code}</div>
                    </div>
                  </div>
                </td>
                <td className="text-[12px]" style={{ color: '#111827' }}>{p.investor || '—'}</td>
                <td className="text-center text-[12px]">
                  <span className="badge badge-info">{p.type}</span>
                </td>
                <td className="text-money text-[12px] font-bold" style={{ color: '#111827', fontVariantNumeric: 'tabular-nums' }}>{(p.totalValue ?? 0).toLocaleString('vi-VN')}</td>
                <td className="text-center text-[12px]" style={{ color: '#64748b' }}>
                  {p.startDate ? new Date(p.startDate).toLocaleDateString('vi-VN') : '—'}
                </td>
                <td className="text-center text-[12px]" style={{ color: '#64748b' }}>
                  {p.endDate ? new Date(p.endDate).toLocaleDateString('vi-VN') : '—'}
                </td>
                <td className="text-center">
                  <span className={`badge ${statusLabels[p.status].class}`}>
                    {statusLabels[p.status].text}
                  </span>
                </td>
                <td>
                  <div className="flex flex-col gap-1">
                    <div className="text-[11px] font-bold" style={{ color: '#111827' }}>{Number.isFinite(p.progress) ? p.progress : 0}%</div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Number.isFinite(p.progress) ? p.progress : 0}%`,
                          backgroundColor: p.status === 'CANCELLED' ? '#F59E0B' : '#10B981'
                        }}
                      />
                    </div>
                  </div>
                </td>
                <td>
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onEdit(projects.find(proj => proj.id === p.id)!)}
                      className="flex h-7 w-7 items-center justify-center rounded border border-[var(--border)] hover:bg-[var(--bg-muted)] text-[#64748b] hover:text-[#111827] transition-colors"
                      title="Chỉnh sửa"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      className="flex h-7 w-7 items-center justify-center rounded border border-[#FCA5A5] hover:bg-[#FCA5A5]/20 text-[#EF4444] transition-colors"
                      title="Xóa"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {enrichedProjects.length === 0 && (
              <tr>
                <td colSpan={10} className="py-8 text-center" style={{ fontSize: '12px', color: '#9CA3AF' }}>
                  Không có dự án nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-[var(--border)] px-6 py-3 bg-[var(--bg-subtle)]">
        <div className="text-[13px] text-[var(--text-secondary)]">
          Hiển thị <span className="font-semibold text-[var(--text-primary)]">1</span> đến <span className="font-semibold text-[var(--text-primary)]">{enrichedProjects.length}</span> trong tổng số <span className="font-semibold text-[var(--text-primary)]">{enrichedProjects.length}</span> dự án
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-sm" disabled>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button className="btn btn-sm bg-[var(--brand)] text-white">1</button>
          <button className="btn btn-sm" disabled>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

