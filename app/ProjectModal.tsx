'use client';

import { useState } from 'react';
import { Project } from './project.service';
import { formatCurrency } from './utils';

interface ProjectModalProps {
  isOpen: boolean;
  project?: Project;
  onClose: () => void;
  onSave: (project: Omit<Project, 'id'> | Project) => void;
}

export default function ProjectModal({
  isOpen,
  project,
  onClose,
  onSave,
}: ProjectModalProps) {
  const [formData, setFormData] = useState<Omit<Project, 'id'> | Project>(
    project || {
      name: '',
      code: '',
      investor: '',
      projectType: '',
      totalValue: 0,
      startDate: '',
      endDate: '',
      status: 'active',
      progress: 0,
      image: '',
    }
  );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'totalValue' || name === 'progress'
          ? parseInt(value) || 0
          : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setFormData({
      name: '',
      code: '',
      investor: '',
      projectType: '',
      totalValue: 0,
      startDate: '',
      endDate: '',
      status: 'active',
      progress: 0,
      image: '',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1e293b] border border-[#334155] rounded-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
        <div className="sticky top-0 bg-[#1e293b] border-b border-[#334155] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#e2e8f0]">
            {project ? 'Chỉnh sửa dự án' : 'Thêm dự án mới'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#334155] rounded-lg transition-colors"
          >
            <svg
              className="w-6 h-6 text-[#e2e8f0]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#94a3b8] text-sm font-medium mb-2">
                Tên dự án
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#e2e8f0] focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[#94a3b8] text-sm font-medium mb-2">
                Mã dự án
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#e2e8f0] focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[#94a3b8] text-sm font-medium mb-2">
                Chủ đầu tư
              </label>
              <input
                type="text"
                name="investor"
                value={formData.investor}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#e2e8f0] focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[#94a3b8] text-sm font-medium mb-2">
                Loại dự án
              </label>
              <input
                type="text"
                name="projectType"
                value={formData.projectType}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#e2e8f0] focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[#94a3b8] text-sm font-medium mb-2">
                Giá trị hợp đồng (VND)
              </label>
              <input
                type="number"
                name="totalValue"
                value={formData.totalValue}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#e2e8f0] focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[#94a3b8] text-sm font-medium mb-2">
                Tiến độ (%)
              </label>
              <input
                type="number"
                name="progress"
                value={formData.progress}
                onChange={handleChange}
                min="0"
                max="100"
                required
                className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#e2e8f0] focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[#94a3b8] text-sm font-medium mb-2">
                Ngày bắt đầu
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#e2e8f0] focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[#94a3b8] text-sm font-medium mb-2">
                Ngày kết thúc
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#e2e8f0] focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[#94a3b8] text-sm font-medium mb-2">
                Trạng thái
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#e2e8f0] focus:outline-none focus:border-blue-500"
              >
                <option value="active">Đang thi công</option>
                <option value="completed">Hoàn thành</option>
                <option value="paused">Tạm dừng</option>
              </select>
            </div>

            <div>
              <label className="block text-[#94a3b8] text-sm font-medium mb-2">
                Link ảnh dự án
              </label>
              <input
                type="url"
                name="image"
                value={formData.image}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#e2e8f0] focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-[#334155]">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-[#334155] text-[#e2e8f0] rounded-lg font-medium hover:bg-[#475569] transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {project ? 'Cập nhật' : 'Thêm dự án'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
