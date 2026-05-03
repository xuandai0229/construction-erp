'use client';
/* eslint-disable react-hooks/set-state-in-effect, react/no-unescaped-entities */

import { useState, useEffect } from 'react';
import { Project, ProjectStatus } from '@/app/types';
import * as projectService from '@/app/services/project.service';

interface ProjectListProps {
  onSelectProject?: (project: Project) => void;
}

const statusLabels: Record<ProjectStatus, string> = {
  planning: 'Quy hoạch',
  in_progress: 'Đang thi công',
  completed: 'Hoàn thành',
  on_hold: 'Tạm dừng',
};

const statusColors: Record<ProjectStatus, string> = {
  planning: 'bg-yellow-600',
  in_progress: 'bg-blue-600',
  completed: 'bg-green-600',
  on_hold: 'bg-red-600',
};

export default function ProjectList({ onSelectProject }: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [investor, setInvestor] = useState('');
  const [totalValue, setTotalValue] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('planning');

  const fetchProjects = async () => {
    const data = await projectService.getProjects();
    setProjects(data);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  function resetForm() {
    setName('');
    setInvestor('');
    setTotalValue('');
    setStatus('planning');
    setEditingId(null);
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = totalValue ? parseFloat(totalValue.replace(/,/g, '')) : 0;

    if (editingId) {
      await projectService.updateProject(editingId, { name, investor, total_value: value, status });
    } else {
      await projectService.addProject(name, investor, value, status);
    }

    resetForm();
    await fetchProjects();
  }

  function handleEdit(project: Project) {
    setName(project.name);
    setInvestor(project.investor);
    setTotalValue(project.total_value.toString());
    setStatus(project.status);
    setEditingId(project.id);
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    if (confirm('Bạn có chắc muốn xóa dự án này?')) {
      await projectService.deleteProject(id);
      await fetchProjects();
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
        <h1 className="text-2xl font-bold text-white">Dự án</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Hủy' : '+ Thêm dự án'}
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-800 rounded-lg p-6 mb-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">
            {editingId ? 'Sửa dự án' : 'Thêm dự án mới'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">Tên dự án *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-slate-700 text-white border border-slate-600 rounded-lg"
                  placeholder="Nhập tên dự án"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Chủ đầu tư</label>
                <input
                  type="text"
                  value={investor}
                  onChange={(e) => setInvestor(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 text-white border border-slate-600 rounded-lg"
                  placeholder="Nhập tên chủ đầu tư"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Giá trị (VND)</label>
                <input
                  type="text"
                  value={totalValue}
                  onChange={(e) => setTotalValue(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 text-white border border-slate-600 rounded-lg"
                  placeholder="Nhập giá trị"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Trạng thái</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                  className="w-full px-4 py-2 bg-slate-700 text-white border border-slate-600 rounded-lg"
                >
                  <option value="planning">Quy hoạch</option>
                  <option value="in_progress">Đang thi công</option>
                  <option value="completed">Hoàn thành</option>
                  <option value="on_hold">Tạm dừng</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                {editingId ? 'Lưu' : 'Thêm'}
              </button>
              <button type="button" onClick={resetForm} className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700">
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
              className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-blue-500 cursor-pointer"
              onClick={() => onSelectProject?.(project)}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-white truncate flex-1">{project.name}</h3>
                <span className={`px-2 py-0.5 rounded text-xs text-white ${statusColors[project.status]}`}>
                  {statusLabels[project.status]}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Chủ đầu tư:</span>
                  <span className="text-white truncate ml-2">{project.investor || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Giá trị:</span>
                  <span className="text-green-400 font-medium">{formatCurrency(project.total_value)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ngày tạo:</span>
                  <span className="text-white">{formatDate(project.created_at)}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t border-slate-700">
                <button
                  onClick={(e) => { e.stopPropagation(); handleEdit(project); }}
                  className="flex-1 px-3 py-1.5 bg-slate-700 text-white text-sm rounded hover:bg-slate-600"
                >
                  Sửa
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}
                  className="flex-1 px-3 py-1.5 bg-red-600/20 text-red-400 text-sm rounded hover:bg-red-600/30"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 text-slate-500 text-sm">Tổng số: {projects.length} dự án</div>
    </div>
  );
}
