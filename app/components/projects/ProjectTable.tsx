'use client';

import { Project } from '@/app/types';
import { useERPStore } from '@/store/erpStore';

const statusLabels: Record<string, { text: string; class: string }> = {
  PLANNED: { text: 'Lập kế hoạch', class: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  IN_PROGRESS: { text: 'Đang thi công', class: 'bg-green-500/20 text-green-400 border-green-500/30' },
  ACTIVE: { text: 'Đang hoạt động', class: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  COMPLETED: { text: 'Hoàn thành', class: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  CLOSED: { text: 'Đã đóng', class: 'bg-red-500/20 text-red-400 border-red-500/30' },
  CANCELLED: { text: 'Tạm dừng', class: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
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
    <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/40 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="border-b border-slate-800 bg-slate-800/50 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-5 py-4 text-center w-12">#</th>
              <th className="px-5 py-4">Dự án</th>
              <th className="px-5 py-4">Chủ đầu tư</th>
              <th className="px-5 py-4 text-center">Loại dự án</th>
              <th className="px-5 py-4 text-right">Giá trị hợp đồng</th>
              <th className="px-5 py-4 text-center">Ngày bắt đầu</th>
              <th className="px-5 py-4 text-center">Ngày kết thúc</th>
              <th className="px-5 py-4 text-center">Trạng thái</th>
              <th className="px-5 py-4">Tiến độ</th>
              <th className="px-5 py-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {enrichedProjects.map((p, i) => (
              <tr key={p.id} className="transition-colors hover:bg-slate-800/30">
                <td className="px-5 py-3 text-center font-medium text-slate-500">{i + 1}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <img src={p.thumbnail} alt={p.name} className="h-10 w-10 rounded-md object-cover border border-slate-700 shadow-sm" />
                    <div>
                      <div className="text-[13px] font-bold text-slate-200">{p.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{p.code}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-[13px] font-medium text-slate-300">{p.investor || '-'}</td>
                <td className="px-5 py-3 text-center">
                  <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-medium ${p.typeColor}`}>
                    {p.type}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="text-[13px] font-bold text-slate-200">{(p.totalValue ?? 0).toLocaleString()}</div>
                  <div className="text-[10px] text-slate-500">VND</div>
                </td>
                <td className="px-5 py-3 text-center text-[12px] text-slate-400">
                  {p.startDate ? new Date(p.startDate).toLocaleDateString('vi-VN') : '-'}
                </td>
                <td className="px-5 py-3 text-center text-[12px] text-slate-400">
                  {p.endDate ? new Date(p.endDate).toLocaleDateString('vi-VN') : '-'}
                </td>
                <td className="px-5 py-3 text-center">
                  <span className={`inline-flex items-center justify-center rounded border px-2.5 py-1 text-[11px] font-bold shadow-sm ${statusLabels[p.status].class}`}>
                    {statusLabels[p.status].text}
                  </span>
                </td>
                <td className="px-5 py-3 w-32">
                  <div className="flex flex-col gap-1.5">
                    <div className="text-[11px] font-bold text-slate-300">{p.progress}%</div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div 
                        className={`h-full rounded-full ${p.status === 'COMPLETED' ? 'bg-blue-500' : p.status === 'CANCELLED' ? 'bg-yellow-500' : 'bg-green-500'}`} 
                        style={{ width: `${p.progress}%` }} 
                      />
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-center gap-1.5">
                    <button className="flex h-7 w-7 items-center justify-center rounded border border-slate-700 bg-slate-800/80 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white" title="Xem chi tiết">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => onEdit(projects.find(proj => proj.id === p.id)!)}
                      className="flex h-7 w-7 items-center justify-center rounded border border-slate-700 bg-slate-800/80 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white" 
                      title="Chỉnh sửa"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleDelete(p.id, p.name)}
                      className="flex h-7 w-7 items-center justify-center rounded border border-red-900/30 bg-red-900/10 text-red-500 transition-colors hover:bg-red-900/30 hover:text-red-400" 
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
                <td colSpan={10} className="px-5 py-8 text-center text-slate-500">
                  Không có dự án nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/30 px-5 py-3">
        <div className="text-[13px] text-slate-400">
          Hiển thị <span className="font-semibold text-slate-200">1</span> đến <span className="font-semibold text-slate-200">{enrichedProjects.length}</span> trong tổng số <span className="font-semibold text-slate-200">{enrichedProjects.length}</span> dự án
        </div>
        <div className="flex items-center gap-2">
          <button className="flex h-8 w-8 items-center justify-center rounded border border-slate-700 bg-slate-800/50 text-slate-500 hover:bg-slate-800 hover:text-white disabled:opacity-50">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 text-sm font-semibold text-white shadow-md shadow-blue-900/20">
            1
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded border border-slate-700 bg-slate-800/50 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            2
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded border border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
          <div className="ml-4 flex items-center gap-2">
            <div className="relative">
              <select className="h-8 appearance-none rounded border border-slate-700 bg-slate-800/50 py-0 pl-2 pr-6 text-[13px] text-slate-300 outline-none focus:border-blue-500">
                <option>10 / trang</option>
                <option>20 / trang</option>
                <option>50 / trang</option>
              </select>
              <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

