'use client';

import { useEffect, useState } from 'react';
import Sidebar from '../../sidebar';
import ProjectForm from '../../project-form';
import { projectService } from '@/services.projectService';
import type { Project } from '@/types';
import Link from 'next/link';

export default function ProjectsPageRoute() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const loadProjects = async () => {
      const data = projectService.getProjects();
      setProjects(data);
      setIsLoading(false);
    };
    loadProjects();
  }, []);

  const handleAddProject = (projectData: Omit<Project, 'id' | 'created_at'>) => {
    const newProject = projectService.addProject(projectData);
    setProjects([...projects, newProject]);
    setShowForm(false);
  };

  const handleDeleteProject = (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      projectService.deleteProject(id);
      setProjects(projects.filter((p) => p.id !== id));
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-900 text-green-200';
      case 'completed':
        return 'bg-blue-900 text-blue-200';
      case 'archived':
        return 'bg-slate-600 text-slate-200';
      default:
        return 'bg-slate-700 text-slate-200';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  return (
    <div className='flex h-screen bg-slate-900'>
      <Sidebar active='projects' />

      <main className='flex-1 flex flex-col'>
        {/* Header */}
        <div className='bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600 px-8 py-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-white'>Projects</h1>
              <p className='text-slate-400 mt-1'>Manage all construction projects</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className='px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors'
            >
              + New Project
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-auto p-8'>
          {isLoading ? (
            <div className='text-center text-slate-400'>Loading...</div>
          ) : projects.length === 0 ? (
            <div className='text-center py-12'>
              <p className='text-slate-400 mb-4'>No projects yet</p>
              <button
                onClick={() => setShowForm(true)}
                className='px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors'
              >
                Create First Project
              </button>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {projects.map((project) => (
                <Link href={`/project/${project.id}`} key={project.id}>
                  <div className='bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-blue-500 transition-all hover:shadow-lg cursor-pointer h-full'>
                    <div className='flex items-start justify-between mb-3'>
                      <h3 className='text-lg font-bold text-white flex-1 line-clamp-2'>
                        {project.name}
                      </h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ml-2 ${getStatusBadgeColor(
                          project.status
                        )}`}
                      >
                        {project.status}
                      </span>
                    </div>

                    <div className='space-y-2 text-sm'>
                      <div>
                        <p className='text-slate-400'>Investor</p>
                        <p className='text-slate-200 font-medium'>{project.investor}</p>
                      </div>

                      <div>
                        <p className='text-slate-400'>Total Value</p>
                        <p className='text-green-400 font-semibold'>
                          {formatCurrency(project.total_value)}
                        </p>
                      </div>

                      <div>
                        <p className='text-slate-400'>Created</p>
                        <p className='text-slate-300'>
                          {new Date(project.created_at).toLocaleDateString('en-US')}
                        </p>
                      </div>
                    </div>

                    <div className='mt-4 pt-4 border-t border-slate-700 flex gap-2'>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleDeleteProject(project.id);
                        }}
                        className='flex-1 px-3 py-2 bg-red-900 hover:bg-red-800 text-red-200 text-sm font-medium rounded transition-colors'
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {showForm && (
        <ProjectForm
          onSubmit={handleAddProject}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
