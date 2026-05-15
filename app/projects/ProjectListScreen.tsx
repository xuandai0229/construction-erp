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

import { useProjectsQuery } from '@/services/queries/useProjects';

export default function ProjectListScreen() {
  const init             = useERPStore(state => state.init);
  const isInitialized    = useERPStore(state => state.initialized);
  const sidebarCollapsed = useERPStore(state => state.sidebarCollapsed);

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<{ status?: string; search?: string }>({});
  const limit = 10;

  useEffect(() => { init(); }, [init]);

  const { data: paginatedData, isLoading } = useProjectsQuery({ 
    page, 
    limit,
    status: filters.status,
    search: filters.search
  });
  const projects = paginatedData?.data || [];
  const metadata = paginatedData?.metadata;
  const totalPages = metadata?.totalPages || 1;

  // Bug Fix: Auto-navigate back ONLY when data is fully loaded and actually empty
  // This prevents the "click 2 times" bug where the page rolls back to 1 during loading
  useEffect(() => {
    if (!isLoading && paginatedData && page > totalPages && totalPages > 0) {
      setPage(totalPages);
    }
  }, [page, totalPages, isLoading, paginatedData]);

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
        className={`erp-page-main ${sidebarCollapsed ? 'with-sidebar-collapsed' : 'with-sidebar-expanded'}`}
      >
        <ProjectsHeader onAdd={() => setIsAddingProject(true)} />

        <div className="erp-content-container animate-fade-in space-y-6">
          <ProjectCardStats projects={projects} totalCount={metadata?.total || 0} />
          <ProjectFilters 
            filters={filters} 
            onFilterChange={(f) => {
              setFilters(f);
              setPage(1); // Reset to page 1 on filter change
            }} 
          />
          <ProjectTable projects={projects} totalGlobal={metadata?.total || 0} onEdit={setEditingProject} />

          {/* Enterprise Pagination System */}
          <div className="flex items-center justify-between pt-8 border-t border-[var(--border)]">
            <div className="flex flex-col gap-1">
              <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] opacity-40">Hệ thống phân trang</div>
              <div className="text-[12px] font-bold text-[var(--text-secondary)] flex items-center gap-2">
                Tổng cộng <span className="text-[var(--text-primary)] text-[14px] font-bold tabular-nums">{metadata?.total || 0}</span> hồ sơ dự án
                <span className="h-3 w-[1px] bg-[var(--border)] mx-1" />
                Trang <span className="text-[var(--text-primary)] tabular-nums">{page}</span> / <span className="tabular-nums">{totalPages}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
                className="h-9 px-5 flex items-center justify-center rounded-xl bg-[var(--secondary)] border border-[var(--border)] text-[11px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-all disabled:opacity-20 disabled:cursor-not-allowed uppercase tracking-widest"
              >
                Trang trước
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`h-9 w-9 flex items-center justify-center rounded-xl text-[11px] font-bold transition-all ${
                      page === i + 1 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-110' 
                        : 'text-[var(--text-muted)] hover:bg-[var(--secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages || isLoading}
                className="h-9 px-5 flex items-center justify-center rounded-xl bg-blue-600 text-white text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
              >
                Trang sau
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
