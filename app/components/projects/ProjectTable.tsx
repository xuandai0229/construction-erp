'use client';

import { Project } from '@/app/types';
import { useERPStore } from '@/store/erpStore';
import { useRouter } from 'next/navigation';
import { TableVirtuoso } from 'react-virtuoso';
import { useDeleteProjectMutation } from '@/services/queries/useProjects';

const statusLabels: Record<string, { text: string; class: string }> = {
  PLANNED:     { text: 'Lập kế hoạch', class: 'bg-slate-500/15 text-slate-500 border-slate-500/30' },
  IN_PROGRESS: { text: 'Đang thi công', class: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' },
  ACTIVE:      { text: 'Đang hoạt động', class: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' },
  COMPLETED:   { text: 'Hoàn thành', class: 'bg-blue-500/15 text-blue-500 border-blue-500/30' },
  CLOSED:      { text: 'Đã đóng', class: 'bg-rose-500/15 text-rose-500 border-rose-500/30' },
  CANCELLED:   { text: 'Tạm dừng', class: 'bg-amber-500/15 text-amber-500 border-amber-500/30' },
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
  const setCurrentProject = useERPStore(state => state.setCurrentProject);
  const { mutate: deleteProject } = useDeleteProjectMutation();
  const router = useRouter();

  const handleViewDetails = (id: string) => {
    setCurrentProject(id);
    router.push('/wbs');
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa dự án "${name}"? Thao tác này không thể hoàn tác.`)) {
      deleteProject(id);
    }
  };

  return (
    <div className="card-elevation overflow-hidden border border-[var(--border)]">
      <div className="overflow-x-auto scrollbar-hide">
        {enrichedProjects.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
            Không có dự án nào
          </div>
        ) : (
          <TableVirtuoso
            useWindowScroll
            data={enrichedProjects}
            components={{
              Table: (props) => <table {...props} className="erp-table w-full min-w-[1050px]" />,
              TableHead: (props) => <thead {...props} className="bg-[var(--table-head-bg)] shadow-[0_1px_0_var(--border)] z-10 sticky top-[var(--erp-header-height)]" />,
              TableRow: (props) => <tr {...props} className="group hover:bg-[var(--secondary)] transition-colors" />
            }}
            fixedHeaderContent={() => (
              <tr>
                <th className="w-12 text-center bg-[var(--table-head-bg)]">#</th>
                <th className="min-w-[200px] bg-[var(--table-head-bg)]">Dự án</th>
                <th className="min-w-[140px] bg-[var(--table-head-bg)]">Chủ đầu tư</th>
                <th className="w-[120px] text-center bg-[var(--table-head-bg)]">Loại</th>
                <th className="w-[150px] text-right bg-[var(--table-head-bg)]">Giá trị HĐ</th>
                <th className="w-[100px] text-center bg-[var(--table-head-bg)]">Bắt đầu</th>
                <th className="w-[100px] text-center bg-[var(--table-head-bg)]">Kết thúc</th>
                <th className="w-[110px] text-center bg-[var(--table-head-bg)]">Trạng thái</th>
                <th className="w-[120px] bg-[var(--table-head-bg)]">Tiến độ</th>
                <th className="w-[90px] text-center bg-[var(--table-head-bg)]">Thao tác</th>
              </tr>
            )}
            itemContent={(i, p) => (
              <>
                <td className="text-center font-bold text-[var(--text-muted)] group-hover:text-[var(--text-accent)] tabular-nums">{i + 1}</td>
                <td>
                  <div className="flex items-center gap-3">
                    <img
                      src={p.thumbnail}
                      alt={p.name}
                      className="h-9 w-9 rounded-lg object-cover border border-[var(--border)] shrink-0"
                    />
                    <div>
                      <div className="text-[12.5px] font-bold text-[var(--text-primary)] leading-tight">{p.name}</div>
                      <div className="text-[10px] font-bold text-[var(--text-muted)] mt-0.5 font-mono">{p.code}</div>
                    </div>
                  </div>
                </td>
                <td className="text-[12px] font-semibold text-[var(--text-secondary)]">{p.investor || 'Chưa có thông tin'}</td>
                <td className="text-center">
                  <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${p.typeColor}`}>{p.type}</span>
                </td>
                <td className="text-right">
                  <div className="text-[12.5px] font-bold text-[var(--text-primary)] tabular-nums">{(p.totalValue ?? 0).toLocaleString()}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">VND</div>
                </td>
                <td className="text-center text-[11px] font-semibold text-[var(--text-secondary)]">
                  {p.startDate ? new Date(p.startDate).toLocaleDateString('vi-VN') : '—'}
                </td>
                <td className="text-center text-[11px] font-semibold text-[var(--text-secondary)]">
                  {p.endDate ? new Date(p.endDate).toLocaleDateString('vi-VN') : '—'}
                </td>
                <td className="text-center">
                  <span className={`inline-flex items-center justify-center rounded-lg border px-2 py-0.5 text-[10px] font-black ${statusLabels[p.status]?.class || 'bg-slate-500/15 text-slate-500 border-slate-500/30'}`}>
                    {statusLabels[p.status]?.text || p.status}
                  </span>
                </td>
                <td className="w-[120px]">
                  <div className="flex flex-col gap-1.5">
                    <div className="text-[10.5px] font-black text-[var(--text-primary)] tabular-nums">{p.progress}%</div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--secondary)] border border-[var(--border)]">
                      <div
                        className={`h-full rounded-full ${p.status === 'COMPLETED' ? 'bg-blue-500' : p.status === 'CANCELLED' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td>
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => handleViewDetails(p.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                      title="Xem chi tiết"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onEdit(projects.find(proj => proj.id === p.id)!)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                      title="Chỉnh sửa"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                      title="Xóa"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                      </svg>
                    </button>
                  </div>
                </td>
              </>
            )}
          />
        )}
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--table-head-bg)] px-5 py-3">
        <div className="text-[11px] font-bold text-[var(--text-muted)]">
          Hiển thị <span className="font-black text-[var(--text-primary)]">{enrichedProjects.length}</span> dự án
        </div>
        <div className="flex items-center gap-1.5">
          <button className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <button className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-[12px] font-bold text-white shadow-sm shadow-blue-900/20">1</button>
          <button className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
