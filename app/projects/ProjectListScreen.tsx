'use client';

import { useEffect, useState, useMemo } from 'react';
import Sidebar from '@/app/components/Sidebar';
import ProjectsHeader from '@/app/components/projects/ProjectsHeader';
import ProjectCardStats from '@/app/components/projects/ProjectCardStats';
import ProjectFilters from '@/app/components/projects/ProjectFilters';
import ProjectTable from '@/app/components/projects/ProjectTable';
import { Project } from '@/app/types';
import { initSampleData } from '@/app/services/project.service';
import { useERPStore } from '@/store/erpStore';

export default function ProjectListScreen() {
  const rawProjects = useERPStore(state => state.projects);
  const init = useERPStore(state => state.init);
  const isInitialized = useERPStore(state => state.initialized);

  useEffect(() => {
    initSampleData();
    init();
  }, [init]);

  const projects = useMemo(() => {
    if (!isInitialized) return [];
    
    // Create a deep copy of rawProjects to avoid mutating Zustand state
    const data = rawProjects.map(p => ({ ...p }));
    
    if (data.length > 0 && data.length < 10) {
      const extra: Project[] = [
        { id: 'proj-4', name: 'Trường học liên cấp DEF', investor: 'Sở Giáo dục & Đào tạo', total_value: 30000000000, status: 'completed', created_at: '2024-01-10T08:00:00Z', start_date: '2024-01-10T00:00:00Z', end_date: '2025-01-10T00:00:00Z' },
        { id: 'proj-5', name: 'Trung tâm thương mại GHI', investor: 'Công ty CP Thương mại GHI', total_value: 95000000000, status: 'in_progress', created_at: '2024-02-20T08:00:00Z', start_date: '2024-02-20T00:00:00Z', end_date: '2026-02-20T00:00:00Z' },
        { id: 'proj-6', name: 'Khu nghỉ dưỡng Paradise', investor: 'Công ty CP Du lịch Paradise', total_value: 200000000000, status: 'on_hold', created_at: '2023-06-01T08:00:00Z', start_date: '2023-06-01T00:00:00Z', end_date: '2025-06-01T00:00:00Z' },
        { id: 'proj-7', name: 'Nhà xưởng sản xuất 2', investor: 'Công ty TNHH Sản xuất 2', total_value: 60000000000, status: 'in_progress', created_at: '2024-04-05T08:00:00Z', start_date: '2024-04-05T00:00:00Z', end_date: '2025-04-05T00:00:00Z' },
        { id: 'proj-8', name: 'Khu đô thị Green Park', investor: 'Công ty CP BĐS Green', total_value: 150000000000, status: 'in_progress', created_at: '2023-03-01T08:00:00Z', start_date: '2023-03-01T00:00:00Z', end_date: '2026-03-01T00:00:00Z' },
        { id: 'proj-9', name: 'Bệnh viện đa khoa HJK', investor: 'Sở Y tế', total_value: 70000000000, status: 'completed', created_at: '2024-01-12T08:00:00Z', start_date: '2024-01-12T00:00:00Z', end_date: '2025-01-12T00:00:00Z' },
        { id: 'proj-10', name: 'Cải tạo chung cư LMN', investor: 'Ban quản lý chung cư LMN', total_value: 15000000000, status: 'in_progress', created_at: '2024-05-01T08:00:00Z', start_date: '2024-05-01T00:00:00Z', end_date: '2024-11-01T00:00:00Z' },
      ];
      const allProjects = [...data, ...extra];
      
      if (allProjects[0]) {
        allProjects[0].name = 'Cao ốc văn phòng ABC';
        allProjects[0].investor = 'Công ty TNHH ABC';
        allProjects[0].start_date = '2024-01-01T00:00:00Z';
        allProjects[0].end_date = '2025-12-31T00:00:00Z';
        allProjects[0].status = 'in_progress';
      }
      
      if (allProjects[1]) {
        allProjects[1].name = 'Khu căn hộ Sunrise City';
        allProjects[1].investor = 'Công ty CP Đầu tư Sunrise';
        allProjects[1].start_date = '2024-03-15T00:00:00Z';
        allProjects[1].end_date = '2026-03-15T00:00:00Z';
        allProjects[1].status = 'in_progress';
      }
      
      if (allProjects[2]) {
        allProjects[2].name = 'Nhà máy sản xuất XYZ';
        allProjects[2].investor = 'Công ty TNHH XYZ';
        allProjects[2].start_date = '2024-02-01T00:00:00Z';
        allProjects[2].end_date = '2025-01-31T00:00:00Z';
        allProjects[2].status = 'in_progress';
      }

      return allProjects;
    }
    
    return data;
  }, [rawProjects, isInitialized]);

  const loading = !isInitialized;

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#020617]">
        <Sidebar activeItem="projects" />
        <main className="ml-[258px] flex-1 grid place-items-center">
           <div className="rounded-lg border border-slate-800 bg-slate-900 px-6 py-4 text-sm font-semibold text-slate-300">Đang tải dữ liệu dự án...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-100">
      <Sidebar activeItem="projects" />
      <main className="ml-[258px] flex-1">
        <ProjectsHeader />
        <div className="p-6">
          <ProjectCardStats projects={projects} />
          <ProjectFilters />
          <ProjectTable projects={projects} />
        </div>
      </main>
    </div>
  );
}
