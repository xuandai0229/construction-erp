'use client';

function filenameFromDisposition(disposition: string | null, fallback: string) {
  const match = disposition?.match(/filename="?([^"]+)"?/i);
  return match?.[1] || fallback;
}

export async function auditedCsvExport(params: { reportType: string; projectId?: string | null; reason?: string }) {
  if (!params.projectId) {
    throw new Error('Vui long chon du an truoc khi xuat du lieu tai chinh.');
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
    let message = 'Khong the xuat du lieu tai chinh vi audit log khong thanh cong.';
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
