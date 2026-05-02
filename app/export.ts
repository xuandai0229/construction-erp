import { Project } from './project.service';

export const exportProjectsToCSV = (projects: Project[]): void => {
  // Header row
  const headers = [
    'Mã dự án',
    'Tên dự án',
    'Chủ đầu tư',
    'Loại dự án',
    'Giá trị hợp đồng (VND)',
    'Ngày bắt đầu',
    'Ngày kết thúc',
    'Trạng thái',
    'Tiến độ (%)',
  ];

  // Format status
  const statusMap: Record<string, string> = {
    active: 'Đang thi công',
    completed: 'Hoàn thành',
    paused: 'Tạm dừng',
  };

  // Data rows
  const rows = projects.map((p) => [
    p.code,
    p.name,
    p.investor,
    p.projectType,
    p.totalValue.toString(),
    p.startDate,
    p.endDate,
    statusMap[p.status] || p.status,
    p.progress.toString(),
  ]);

  // Create CSV content
  let csv = headers.join(',') + '\n';
  rows.forEach((row) => {
    csv += row.map((cell) => `"${cell}"`).join(',') + '\n';
  });

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `projects-${new Date().toISOString().split('T')[0]}.csv`
  );
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportProjectsToJSON = (projects: Project[]): void => {
  const json = JSON.stringify(projects, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `projects-${new Date().toISOString().split('T')[0]}.json`
  );
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
