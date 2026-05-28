'use client';

function filenameFromDisposition(disposition: string | null, fallback: string) {
  const match = disposition?.match(/filename="?([^"]+)"?/i);
  return match?.[1] || fallback;
}

export async function auditedCsvExport(params: { reportType: string; projectId?: string | null; reason?: string }) {
  if (!params.projectId) {
    throw new Error('Vui lòng chọn dự án trước khi xuất dữ liệu tài chính.');
  }

  const res = await fetch('/api/reports/audited-export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reportType: params.reportType,
      projectId: params.projectId,
      reason: params.reason || `Financial export ${params.reportType}`
    })
  });

  if (!res.ok) {
    let message = 'Không thể xuất dữ liệu tài chính vì audit log không thành công.';
    try {
      const json = await res.json();
      message = json.error || message;
    } catch {}
    throw new Error(message);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filenameFromDisposition(res.headers.get('Content-Disposition'), `${params.reportType}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
