'use client';

import { useEffect, useState, useMemo } from 'react';
import Sidebar from '@/app/components/Sidebar';
import ProjectsHeader from '@/app/components/projects/ProjectsHeader';
import ProjectCardStats from '@/app/components/projects/ProjectCardStats';
import ProjectFilters from '@/app/components/projects/ProjectFilters';
import ProjectTable from '@/app/components/projects/ProjectTable';
import { Project } from '@/app/types';
import { useERPStore } from '@/store/erpStore';
import { EnterprisePagination } from '@/app/components/ui-enterprise';
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

  const { data: paginatedData, isLoading, isPlaceholderData } = useProjectsQuery({ 
    page, 
    limit,
    status: filters.status,
    search: filters.search
  });
  const projects = paginatedData?.data || [];
  const metadata = paginatedData?.metadata;
  const totalPages = metadata?.totalPages || 1;

  // Bug Fix: Auto-navigate back ONLY when data is fully loaded, NOT placeholder, and actually empty
  // This prevents the "click 2 times" bug where the page rolls back to 1 during loading because
  // totalPages was still referring to the previous (possibly smaller) result set.
  useEffect(() => {
    if (!isLoading && !isPlaceholderData && paginatedData && page > totalPages && totalPages > 0) {
      setPage(totalPages);
    }
  }, [page, totalPages, isLoading, isPlaceholderData, paginatedData]);

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
          <ProjectCardStats 
            stats={metadata?.stats} 
            totalCount={metadata?.total || 0} 
          />
          <ProjectFilters 
            filters={filters} 
            onFilterChange={(f) => {
              setFilters(f);
              setPage(1); // Reset to page 1 on filter change
            }} 
          />
          <ProjectTable projects={projects} totalGlobal={metadata?.total || 0} onEdit={setEditingProject} />

          {/* Enterprise Pagination System */}
          <EnterprisePagination
            page={page}
            totalPages={totalPages}
            totalItems={metadata?.total || 0}
            onPageChange={setPage}
            isLoading={isLoading}
            className="pt-8 mt-2"
          />
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
