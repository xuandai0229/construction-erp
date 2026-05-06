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

export default function ProjectListScreen() {
  const rawProjects = useERPStore(state => state.projects);
  const init = useERPStore(state => state.init);
  const isInitialized = useERPStore(state => state.initialized);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isAddingProject, setIsAddingProject] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  const projects = useMemo(() => {
    return rawProjects;
  }, [rawProjects]);

  const loading = !isInitialized;

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#020617]">
        <Sidebar activeItem="projects" />
        <main className="ml-[258px] flex-1 grid place-items-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            <div className="text-sm font-medium text-slate-400">Đang tải dữ liệu...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-100">
      <Sidebar activeItem="projects" />
      <main className="ml-[258px] flex-1">
        <ProjectsHeader onAdd={() => setIsAddingProject(true)} />
        <div className="p-6">
          <ProjectCardStats projects={projects} />
          <ProjectFilters />
          <ProjectTable projects={projects} onEdit={setEditingProject} />
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

