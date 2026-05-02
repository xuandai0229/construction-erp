'use client';

import { useState, useEffect } from 'react';
import { Project, ProjectService } from './project.service';
import ProjectHeader from './ProjectHeader';
import ProjectStats from './ProjectStats';
import ProjectFilters from './ProjectFilters';
import ProjectTable from './ProjectTable';
import ProjectPagination from './ProjectPagination';
import ProjectModal from './ProjectModal';
import ConfirmDialog from './ConfirmDialog';
import { exportProjectsToCSV } from './export';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [investorFilter, setInvestorFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    projectId: string;
  }>({ isOpen: false, projectId: '' });

  useEffect(() => {
    ProjectService.initializeData();
    const data = ProjectService.getAllProjects();
    setProjects(data);
  }, []);

  useEffect(() => {
    let filtered = projects;

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    if (investorFilter) {
      filtered = filtered.filter((p) =>
        p.investor.toLowerCase().includes(investorFilter.toLowerCase())
      );
    }

    if (typeFilter) {
      filtered = filtered.filter((p) =>
        p.projectType.toLowerCase().includes(typeFilter.toLowerCase())
      );
    }

    if (dateRange.start) {
      filtered = filtered.filter((p) => new Date(p.startDate) >= new Date(dateRange.start));
    }

    if (dateRange.end) {
      filtered = filtered.filter((p) => new Date(p.endDate) <= new Date(dateRange.end));
    }

    setFilteredProjects(filtered);
    setCurrentPage(1);
  }, [projects, searchTerm, statusFilter, investorFilter, typeFilter, dateRange]);

  const handleAddProject = () => {
    setEditingProject(undefined);
    setShowModal(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setShowModal(true);
  };

  const handleSaveProject = (projectData: Omit<Project, 'id'> | Project) => {
    if ('id' in projectData) {
      // Update existing
      const updated = ProjectService.updateProject(projectData.id, projectData);
      if (updated) {
        setProjects(ProjectService.getAllProjects());
      }
    } else {
      // Create new
      ProjectService.createProject(projectData);
      setProjects(ProjectService.getAllProjects());
    }
    setShowModal(false);
  };

  const handleDeleteProject = (id: string) => {
    setDeleteConfirm({ isOpen: true, projectId: id });
  };

  const confirmDelete = () => {
    if (ProjectService.deleteProject(deleteConfirm.projectId)) {
      setProjects(ProjectService.getAllProjects());
    }
    setDeleteConfirm({ isOpen: false, projectId: '' });
  };

  const handleExportCSV = () => {
    exportProjectsToCSV(filteredProjects);
  };

  const stats = ProjectService.getProjectStats();
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

  return (
    <div className="flex-1 flex flex-col bg-[#020617] min-h-screen">
      {/* Header */}
      <ProjectHeader />

      {/* Stats Cards */}
      <ProjectStats stats={stats} />

      {/* Filters */}
      <ProjectFilters
        onSearchChange={setSearchTerm}
        onStatusChange={setStatusFilter}
        onInvestorChange={setInvestorFilter}
        onTypeChange={setTypeFilter}
        onDateRangeChange={(start, end) =>
          setDateRange({ start, end })
        }
        onAddProject={handleAddProject}
        onExportCSV={handleExportCSV}
      />

      {/* Main content - Table */}
      <div className="flex-1 bg-[#020617] border border-[#334155] rounded-lg mx-6 my-4 overflow-hidden">
        <ProjectTable
          projects={filteredProjects}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onEdit={handleEditProject}
          onDelete={handleDeleteProject}
        />
      </div>

      {/* Pagination */}
      <ProjectPagination
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={filteredProjects.length}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
      />

      {/* Modal */}
      <ProjectModal
        isOpen={showModal}
        project={editingProject}
        onClose={() => {
          setShowModal(false);
          setEditingProject(undefined);
        }}
        onSave={handleSaveProject}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Xóa dự án"
        message="Bạn có chắc chắn muốn xóa dự án này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        isDangerous={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, projectId: '' })}
      />
    </div>
  );
}
