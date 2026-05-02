'use client';

import { Project } from './project.service';
import { formatCurrency, formatDate } from './utils';

interface ProjectRowProps {
  project: Project;
  rowNumber: number;
  onEdit?: (project: Project) => void;
  onDelete?: (id: string) => void;
}

export default function ProjectRow({
  project,
  rowNumber,
  onEdit,
  onDelete,
}: ProjectRowProps) {
  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { bg: string; text: string; label: string } } = {
      active: {
        bg: 'bg-emerald-950/50 border border-emerald-700/50',
        text: 'text-emerald-300',
        label: 'Đang thi công',
      },
      completed: {
        bg: 'bg-blue-950/50 border border-blue-700/50',
        text: 'text-blue-300',
        label: 'Hoàn thành',
      },
      paused: {
        bg: 'bg-amber-950/50 border border-amber-700/50',
        text: 'text-amber-300',
        label: 'Tạm dừng',
      },
    };

    const config = statusMap[status] || statusMap.active;

    return (
      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-emerald-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <tr className="border-b border-[#334155] hover:bg-[#1e293b]/50 transition-colors">
      <td className="py-4 px-4 text-[#e2e8f0] text-sm">{rowNumber}</td>

      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <img
            src={project.image}
            alt={project.name}
            className="w-12 h-12 rounded object-cover"
          />
          <div>
            <p className="text-[#e2e8f0] font-semibold text-sm">{project.name}</p>
            <p className="text-[#64748b] text-xs">{project.code}</p>
          </div>
        </div>
      </td>

      <td className="py-4 px-4 text-[#cbd5e1] text-sm">{project.investor}</td>

      <td className="py-4 px-4 text-[#cbd5e1] text-sm">{project.projectType}</td>

      <td className="py-4 px-4 text-right text-[#e2e8f0] font-semibold text-sm">
        {formatCurrency(project.totalValue)}
      </td>

      <td className="py-4 px-4 text-center text-[#cbd5e1] text-sm">
        {formatDate(project.startDate)}
      </td>

      <td className="py-4 px-4 text-center text-[#cbd5e1] text-sm">
        {formatDate(project.endDate)}
      </td>

      <td className="py-4 px-4">{getStatusBadge(project.status)}</td>

      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-[#0f172a] rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${getProgressColor(project.progress)}`}
              style={{ width: `${project.progress}%` }}
            ></div>
          </div>
          <span className="text-[#cbd5e1] text-xs font-semibold w-12 text-right">
            {project.progress}%
          </span>
        </div>
      </td>

      <td className="py-4 px-4">
        <div className="flex items-center gap-1">
          <button
            className="p-2 hover:bg-[#334155] rounded-lg transition-colors"
            title="Xem"
          >
            <svg
              className="w-4 h-4 text-[#64748b] hover:text-[#e2e8f0]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </button>

          <button
            onClick={() => onEdit?.(project)}
            className="p-2 hover:bg-[#334155] rounded-lg transition-colors"
            title="Chỉnh sửa"
          >
            <svg
              className="w-4 h-4 text-[#64748b] hover:text-[#e2e8f0]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>

          <div className="relative group">
            <button
              className="p-2 hover:bg-[#334155] rounded-lg transition-colors"
              title="Thêm"
            >
              <svg
                className="w-4 h-4 text-[#64748b] hover:text-[#e2e8f0]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>

            <div className="absolute right-0 mt-1 w-40 bg-[#1e293b] border border-[#334155] rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-10">
              <button
                onClick={() => onEdit?.(project)}
                className="w-full text-left px-4 py-2 text-[#cbd5e1] text-sm hover:bg-[#334155] first:rounded-t-lg transition-colors"
              >
                Chỉnh sửa
              </button>
              <button
                onClick={() => onDelete?.(project.id)}
                className="w-full text-left px-4 py-2 text-red-400 text-sm hover:bg-[#334155] transition-colors"
              >
                Xóa
              </button>
              <button className="w-full text-left px-4 py-2 text-[#cbd5e1] text-sm hover:bg-[#334155] last:rounded-b-lg transition-colors">
                Tải xuống
              </button>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}
