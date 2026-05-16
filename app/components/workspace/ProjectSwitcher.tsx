'use client';

import { useState, useEffect, useRef } from 'react';
import { useProjectsQuery } from '@/services/queries/useProjects';
import { useERPStore } from '@/store/erpStore';
import { useDebounce } from '@/app/hooks/useDebounce';

export default function ProjectSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { currentProjectId, setCurrentProject } = useERPStore();
  const { data: paginatedData } = useProjectsQuery({ limit: 100 }); // Scalable: load more for search
  const projects = paginatedData?.data || [];
  
  const currentProject = projects.find(p => p.id === currentProjectId);
  
  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
    p.id.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-[var(--secondary)] transition-all group"
      >
        <div className="flex flex-col items-start min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13.5px] font-semibold text-[var(--text-primary)] truncate max-w-[200px]">
              {currentProject?.name || 'Chọn dự án...'}
            </span>
            <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 text-[var(--text-muted)] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m7 10 5 5 5-5" />
            </svg>
          </div>
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-[9px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
              {currentProjectId?.slice(0, 8).toUpperCase() || '--------'}
            </span>
            <span className="text-[8px] text-[var(--text-muted)] opacity-30">•</span>
            <span className="text-[9px] font-bold text-blue-500/80 uppercase tracking-wider italic">Vận hành</span>
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-[320px] bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl z-[100] animate-in fade-in zoom-in-95 duration-200 backdrop-blur-md">
          <div className="p-2.5">
            <div className="relative flex items-center mb-2.5 group">
              <div className="absolute left-4 flex items-center justify-center pointer-events-none z-10">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-[var(--text-muted)] opacity-60 group-focus-within:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                autoFocus
                type="text"
                placeholder="Tìm kiếm dự án..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full !pl-12 pr-3 py-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[12px] font-medium text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all placeholder:text-[var(--text-muted)]"
              />
            </div>

            <div className="max-h-[280px] overflow-y-auto space-y-0.5 pr-1 scrollbar-hide">
              {filteredProjects.length === 0 ? (
                <div className="py-8 text-center text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-widest italic opacity-50">
                  Không tìm thấy hồ sơ
                </div>
              ) : (
                filteredProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => {
                      setCurrentProject(project.id);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full flex flex-col items-start p-2 rounded-lg transition-all group ${
                      currentProjectId === project.id 
                        ? 'bg-blue-600/5 ring-1 ring-blue-500/20' 
                        : 'hover:bg-[var(--secondary)]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-[12px] font-medium tracking-tight ${currentProjectId === project.id ? 'text-blue-500' : 'text-[var(--text-primary)]'}`}>
                        {project.name}
                      </span>
                      {currentProjectId === project.id && (
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] font-medium text-[var(--text-muted)] uppercase tracking-wider">{project.id.slice(0, 8).toUpperCase()}</span>
                      <span className="text-[9px] font-medium text-[var(--text-muted)] opacity-30">•</span>
                      <span className="text-[9px] font-medium text-[var(--text-muted)]">{project.projectType || 'Công trình'}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="p-2 border-t border-[var(--border)]">
            <button className="w-full py-2 flex items-center justify-center gap-2 text-[10px] font-bold text-[var(--text-secondary)] hover:text-blue-500 transition-colors uppercase tracking-widest">
              Xem toàn bộ danh mục dự án
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
