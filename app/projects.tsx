'use client';

import { useState, useEffect } from 'react';
import { Project, ProjectService } from './project.service';
import ProjectHeader from './ProjectHeader';
import ProjectStats from './ProjectStats';
import ProjectFilters from './ProjectFilters';
import ProjectTable from './ProjectTable';
import ProjectPagination from './ProjectPagination';

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
      />

      {/* Main content - Table */}
      <div className="flex-1 bg-[#020617] border border-[#334155] rounded-lg mx-6 my-4 overflow-hidden">
        <ProjectTable
          projects={filteredProjects}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
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
    </div>
  );
}
