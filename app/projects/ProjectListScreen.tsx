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

import EnterpriseAppShell from '@/app/components/layout/EnterpriseAppShell';
import EnterpriseHeader from '@/app/components/layout/EnterpriseHeader';
import EnterprisePageContainer from '@/app/components/layout/EnterprisePageContainer';

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

  useEffect(() => {
    if (!isLoading && !isPlaceholderData && paginatedData && page > totalPages && totalPages > 0) {
      setPage(totalPages);
    }
  }, [page, totalPages, isLoading, isPlaceholderData, paginatedData]);

  if (!isInitialized) {
    return (
      <EnterpriseAppShell activeItem="projects">
        <EnterprisePageContainer>
          <div className="flex h-64 flex-col items-center justify-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            <div className="text-[13px] font-semibold text-[var(--text-secondary)]">Đang tải hệ thống...</div>
          </div>
        </EnterprisePageContainer>
      </EnterpriseAppShell>
    );
  }

  return (
    <EnterpriseAppShell activeItem="projects">
      <EnterpriseHeader 
        title="Hồ sơ công trình" 
        subtitle="Quản lý vòng đời và ngân sách dự án"
        actions={
          <button 
            onClick={() => setIsAddingProject(true)}
            className="h-9 px-4 rounded-md bg-[var(--primary)] text-white text-[12px] font-bold hover:bg-[var(--primary)]/90 transition-colors shadow-sm cursor-pointer"
          >
            + THÊM HỒ SƠ
          </button>
        }
      />

      <EnterprisePageContainer>
        <ProjectCardStats 
          stats={metadata?.stats} 
          totalCount={metadata?.total || 0} 
        />
        <ProjectFilters 
          filters={filters} 
          onFilterChange={(f) => {
            setFilters(f);
            setPage(1); 
          }} 
        />
        <ProjectTable projects={projects} totalGlobal={metadata?.total || 0} onEdit={setEditingProject} />

        <EnterprisePagination
          page={page}
          totalPages={totalPages}
          totalItems={metadata?.total || 0}
          onPageChange={setPage}
          isLoading={isLoading}
          className="pt-4"
        />
      </EnterprisePageContainer>

      <AddProjectModal
        isOpen={isAddingProject || !!editingProject}
        onClose={() => { setIsAddingProject(false); setEditingProject(null); }}
        project={editingProject}
      />
    </EnterpriseAppShell>
  );
}
