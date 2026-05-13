'use client';

import { useEffect, useState, useMemo } from 'react';
import Sidebar from '@/app/components/Sidebar';
import ProjectsHeader from '@/app/components/projects/ProjectsHeader';
import ProjectCardStats from '@/app/components/projects/ProjectCardStats';
import ProjectFilters from '@/app/components/projects/ProjectFilters';
import ProjectTable from '@/app/components/projects/ProjectTable';
import { Project } from '@/app/types';
import { useERPStore } from '@/store/erpStore';
import AddProjectModal from '@/app/components/modals/AddProjectModal';

import { useProjectsQuery, useGlobalProjectsStatsQuery } from '@/services/queries/useProjects';

export default function ProjectListScreen() {
  const init             = useERPStore(state => state.init);
  const isInitialized    = useERPStore(state => state.initialized);
  const sidebarCollapsed = useERPStore(state => state.sidebarCollapsed);

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => { init(); }, [init]);

  const { data: globalStats } = useGlobalProjectsStatsQuery();
  const { data } = useProjectsQuery({ page, limit: 10 });
  const projects = data?.data || [];
  const metadata = data?.metadata || { total: 0, page: 1, limit: 10, totalPages: 1 };
  const totalItems = metadata.total || (globalStats?.total ?? 0);

  if (!isInitialized) {
    return (
      <div className="erp-page">
        <Sidebar activeItem="projects" />
        <main
          className="erp-page-main items-center justify-center"
          style={{ marginLeft: sidebarCollapsed ? 'var(--erp-sidebar-collapsed)' : 'var(--erp-sidebar-width)' }}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            <div className="text-[13px] font-semibold text-[var(--text-secondary)]">Đang tải dữ liệu...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="erp-page">
      <Sidebar activeItem="projects" />
      <main
        className="erp-page-main"
        style={{ marginLeft: sidebarCollapsed ? 'var(--erp-sidebar-collapsed)' : 'var(--erp-sidebar-width)' }}
      >
        <ProjectsHeader onAdd={() => setIsAddingProject(true)} />

        <div className="p-6 md:p-8 space-y-6 animate-fade-in">
          <ProjectCardStats stats={globalStats} />
          <ProjectFilters />
          <ProjectTable projects={projects} onEdit={setEditingProject} page={page} limit={10} />

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
            <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Hiển thị {Math.min(totalItems, (page - 1) * 10 + 1)}-{Math.min(page * 10, totalItems)} trong {totalItems} dự án
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-30"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
              </button>
              
              {Array.from({ length: metadata.totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-8 w-8 rounded-lg text-[12px] font-bold transition-all ${
                    page === p 
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/20' 
                      : 'border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                disabled={page >= metadata.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-30"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
              </button>
            </div>
          </div>
        </div>
      </main>

      <AddProjectModal
        isOpen={isAddingProject || !!editingProject}
        onClose={() => { setIsAddingProject(false); setEditingProject(null); }}
        project={editingProject}
      />
    </div>
  );
}
