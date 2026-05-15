'use client';
/* eslint-disable react-hooks/set-state-in-effect, react/no-unescaped-entities */

import { useState } from 'react';
import { Project, ProjectStatus } from '@/app/types';
import { useProjectsQuery, useCreateProjectMutation, useUpdateProjectMutation, useDeleteProjectMutation } from '@/services/queries/useProjects';

interface ProjectListProps {
  onSelectProject?: (project: Project) => void;
}

const statusLabels: Record<string, string> = {
  PLANNED: 'Quy hoạch',
  IN_PROGRESS: 'Đang thi công',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Tạm dừng/Hủy',
};

const statusColors: Record<string, string> = {
  PLANNED: 'bg-yellow-600',
  IN_PROGRESS: 'bg-blue-600',
  COMPLETED: 'bg-green-600',
  CANCELLED: 'bg-red-600',
};

export default function ProjectList({ onSelectProject }: ProjectListProps) {
  const { data: paginatedData } = useProjectsQuery();
  const projects = paginatedData?.data || [];
  const { mutateAsync: addProject } = useCreateProjectMutation();
  const { mutateAsync: updateProject } = useUpdateProjectMutation();
  const { mutateAsync: deleteProject } = useDeleteProjectMutation();
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [investor, setInvestor] = useState('');
  const [totalValue, setTotalValue] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('PLANNED');

  function resetForm() {
    setName('');
    setInvestor('');
    setTotalValue('');
    setStatus('PLANNED');
    setEditingId(null);
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = totalValue ? parseFloat(totalValue.replace(/,/g, '')) : 0;

    if (editingId) {
      await updateProject({ id: editingId, updates: { name, investor, totalValue: value, status } });
    } else {
      await addProject({ name, investor, totalValue: value, status });
    }

    resetForm();
  }

  function handleEdit(project: Project) {
    setName(project.name);
    setInvestor(project.investor || '');
    setTotalValue((project.totalValue ?? 0).toString());
    setStatus(project.status);
    setEditingId(project.id);
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    if (confirm('Bạn có chắc muốn xóa dự án này?')) {
      await deleteProject(id);
    }
  }

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('vi-VN');
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dự án</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Hủy' : '+ Thêm dự án'}
        </button>
      </div>

      {showForm && (
        <div className="bg-[var(--card)] rounded-lg p-6 mb-6 border border-[var(--border)] card-elevation">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
            {editingId ? 'Sửa dự án' : 'Thêm dự án mới'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[var(--text-muted)] mb-1 text-[11px] font-bold uppercase tracking-wider">Tên dự án *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-[var(--secondary)] text-[var(--text-primary)] border border-[var(--border)] rounded-lg text-[13px] focus:ring-1 focus:ring-blue-500/30 outline-none"
                  placeholder="Nhập tên dự án"
                />
              </div>
              <div>
                <label className="block text-[var(--text-muted)] mb-1 text-[11px] font-bold uppercase tracking-wider">Chủ đầu tư</label>
                <input
                  type="text"
                  value={investor}
                  onChange={(e) => setInvestor(e.target.value)}
                  className="w-full px-4 py-2 bg-[var(--secondary)] text-[var(--text-primary)] border border-[var(--border)] rounded-lg text-[13px] focus:ring-1 focus:ring-blue-500/30 outline-none"
                  placeholder="Nhập tên chủ đầu tư"
                />
              </div>
              <div>
                <label className="block text-[var(--text-muted)] mb-1 text-[11px] font-bold uppercase tracking-wider">Giá trị (VNĐ)</label>
                <input
                  type="text"
                  value={totalValue}
                  onChange={(e) => setTotalValue(e.target.value)}
                  className="w-full px-4 py-2 bg-[var(--secondary)] text-[var(--text-primary)] border border-[var(--border)] rounded-lg text-[13px] focus:ring-1 focus:ring-blue-500/30 outline-none tabular-nums"
                  placeholder="Nhập giá trị"
                />
              </div>
              <div>
                <label className="block text-[var(--text-muted)] mb-1 text-[11px] font-bold uppercase tracking-wider">Trạng thái</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                  className="w-full px-4 py-2 bg-[var(--secondary)] text-[var(--text-primary)] border border-[var(--border)] rounded-lg text-[13px] focus:ring-1 focus:ring-blue-500/30 outline-none"
                >
                  <option value="PLANNED">Quy hoạch</option>
                  <option value="IN_PROGRESS">Đang thi công</option>
                  <option value="COMPLETED">Hoàn thành</option>
                  <option value="CANCELLED">Tạm dừng/Hủy</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 font-bold transition-colors">
                {editingId ? 'Lưu' : 'Thêm'}
              </button>
              <button type="button" onClick={resetForm} className="px-6 py-2 bg-[var(--secondary)] text-[var(--text-primary)] rounded-lg border border-[var(--border)] hover:bg-[var(--hover-bg)] font-bold transition-colors">
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="text-center text-slate-500 py-12">
          <p className="text-xl mb-2">Chưa có dự án nào</p>
          <p>Nhấn "Thêm dự án" để bắt đầu</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)] hover:border-blue-500/50 cursor-pointer card-elevation group transition-all"
              onClick={() => onSelectProject?.(project)}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-bold text-[var(--text-primary)] truncate flex-1 group-hover:text-blue-500 transition-colors">{project.name}</h3>
                <span className={`px-2 py-0.5 rounded text-xs text-white ${statusColors[project.status]}`}>
                  {statusLabels[project.status]}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)] font-medium">Chủ đầu tư:</span>
                  <span className="text-[var(--text-primary)] font-bold truncate ml-2">{project.investor || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)] font-medium">Giá trị:</span>
                  <span className="text-blue-500 font-bold tabular-nums">{formatCurrency(project.totalValue ?? 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)] font-medium">Ngày tạo:</span>
                  <span className="text-[var(--text-secondary)] font-bold tabular-nums">{formatDate(project.createdAt)}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t border-[var(--border)]">
                <button
                  onClick={(e) => { e.stopPropagation(); handleEdit(project); }}
                  className="flex-1 px-3 py-1.5 bg-[var(--secondary)] text-[var(--text-primary)] text-xs font-bold rounded hover:bg-[var(--hover-bg)] transition-colors"
                >
                  Sửa
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}
                  className="flex-1 px-3 py-1.5 bg-rose-500/10 text-rose-500 text-xs font-bold rounded hover:bg-rose-500/20 transition-colors"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-widest opacity-60">Tổng số: {projects.length} dự án</div>
    </div>
  );
}

