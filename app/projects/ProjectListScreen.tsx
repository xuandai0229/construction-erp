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
  const limit = 10;

  useEffect(() => { init(); }, [init]);

  const { data: paginatedData, isLoading } = useProjectsQuery({ page, limit });
  const projects = paginatedData?.data || [];
  const metadata = paginatedData?.metadata;
  const totalPages = metadata?.totalPages || 1;

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
          <ProjectCardStats projects={projects} />
          <ProjectFilters />
          <ProjectTable projects={projects} onEdit={setEditingProject} />

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
            <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Trang {page} / {totalPages} (Tổng {metadata?.total || 0} dự án)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
                className="erp-btn h-8 px-4 bg-[var(--secondary)] text-[var(--text-secondary)] border border-[var(--border)] hover:text-[var(--text-primary)] disabled:opacity-40"
              >
                Trang trước
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages || isLoading}
                className="erp-btn h-8 px-4 bg-[var(--secondary)] text-[var(--text-secondary)] border border-[var(--border)] hover:text-[var(--text-primary)] disabled:opacity-40"
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
