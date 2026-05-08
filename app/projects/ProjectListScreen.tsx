'use client';

import { useEffect, useState, useMemo } from 'react';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { Project, ProjectStatus } from '@/app/types';
import { useERPStore } from '@/store/erpStore';
import AddProjectModal from '@/app/components/modals/AddProjectModal';
import { formatVnd, formatDate } from '@/app/components/dashboard-data';

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  'PLANNED':     { label: 'Kế hoạch',   badge: 'badge-info'    },
  'ACTIVE':      { label: 'Thi công',   badge: 'badge-success' },
  'IN_PROGRESS': { label: 'Thi công',   badge: 'badge-success' },
  'COMPLETED':   { label: 'Hoàn thành', badge: 'badge-info'    },
  'CLOSED':      { label: 'Đã đóng',    badge: 'badge-muted'   },
  'CANCELLED':   { label: 'Tạm dừng',   badge: 'badge-warning' },
};

export default function ProjectListScreen() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const rawProjects = useERPStore(state => state.projects);
  const init = useERPStore(state => state.init);
  const isInitialized = useERPStore(state => state.initialized);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isAddingProject, setIsAddingProject] = useState(false);

  useEffect(() => { init(); }, [init]);

  const projects = useMemo(() => rawProjects, [rawProjects]);

  if (!isInitialized) {
    return (
      <div className="erp-shell">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className={`erp-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <Header title="Dự án" />
          <main className="erp-content grid place-items-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="erp-shell">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className={`erp-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header title="Danh sách Dự án" />
        
        <main className="erp-content space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="t-section-title">Quản lý dự án ({projects.length})</h2>
            <button 
              onClick={() => setIsAddingProject(true)}
              className="btn btn-primary"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Thêm dự án mới
            </button>
          </div>

          <div className="erp-card">
            <div className="erp-table-wrap" style={{ border: 'none', borderRadius: 0 }}>
              <table className="erp-table zebra">
                <thead>
                  <tr>
                    <th>Tên dự án</th>
                    <th>Chủ đầu tư</th>
                    <th className="text-right">Giá trị hợp đồng</th>
                    <th>Ngày bắt đầu</th>
                    <th>Ngày kết thúc</th>
                    <th>Trạng thái</th>
                    <th className="text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => {
                    const cfg = STATUS_CONFIG[project.status] || { label: project.status, badge: 'badge-muted' };
                    return (
                      <tr key={project.id}>
                        <td className="font-bold text-slate-900">{project.name}</td>
                        <td className="text-slate-500">{project.investor || '—'}</td>
                        <td className="text-right font-bold text-blue-600 font-money">
                          {formatVnd(project.totalValue || project.contractValue || 0)}
                        </td>
                        <td className="text-[12px] text-slate-400">{formatDate(project.startDate)}</td>
                        <td className="text-[12px] text-slate-400">{formatDate(project.endDate)}</td>
                        <td>
                          <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
                        </td>
                        <td className="text-center">
                          <button 
                            className="btn btn-ghost btn-sm p-1"
                            onClick={() => setEditingProject(project)}
                          >
                            <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400 hover:text-blue-600" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {projects.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-20 text-slate-400">Chưa có dự án nào</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
      
      <AddProjectModal 
        isOpen={isAddingProject || !!editingProject} 
        onClose={() => { setIsAddingProject(false); setEditingProject(null); }} 
        project={editingProject} 
      />
    </div>
  );
}
