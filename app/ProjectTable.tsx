'use client';

import { Project } from './project.service';
import { formatCurrency, formatDate } from './utils';
import ProjectRow from './ProjectRow';

interface TableProps {
  projects: Project[];
  currentPage: number;
  itemsPerPage: number;
  onEdit?: (project: Project) => void;
  onDelete?: (id: string) => void;
}

export default function ProjectTable({
  projects,
  currentPage,
  itemsPerPage,
  onEdit,
  onDelete,
}: TableProps) {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProjects = projects.slice(startIndex, endIndex);

  return (
    <div className="px-6 py-4 overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#334155]">
            <th className="text-left py-3 px-4 text-[#94a3b8] font-semibold text-sm w-12">
              #
            </th>
            <th className="text-left py-3 px-4 text-[#94a3b8] font-semibold text-sm">
              Dự án
            </th>
            <th className="text-left py-3 px-4 text-[#94a3b8] font-semibold text-sm">
              Chủ đầu tư
            </th>
            <th className="text-left py-3 px-4 text-[#94a3b8] font-semibold text-sm">
              Loại dự án
            </th>
            <th className="text-right py-3 px-4 text-[#94a3b8] font-semibold text-sm">
              Giá trị hợp đồng
            </th>
            <th className="text-center py-3 px-4 text-[#94a3b8] font-semibold text-sm">
              Ngày bắt đầu
            </th>
            <th className="text-center py-3 px-4 text-[#94a3b8] font-semibold text-sm">
              Ngày kết thúc
            </th>
            <th className="text-left py-3 px-4 text-[#94a3b8] font-semibold text-sm">
              Trạng thái
            </th>
            <th className="text-left py-3 px-4 text-[#94a3b8] font-semibold text-sm">
              Tiến độ
            </th>
            <th className="text-center py-3 px-4 text-[#94a3b8] font-semibold text-sm">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody>
          {paginatedProjects.map((project, index) => (
            <ProjectRow
              key={project.id}
              project={project}
              rowNumber={startIndex + index + 1}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>

      {paginatedProjects.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <svg
              className="w-16 h-16 text-[#334155] mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-[#64748b]">Không có dự án nào để hiển thị</p>
          </div>
        </div>
      )}
    </div>
  );
}
