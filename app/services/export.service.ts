export function exportToCsv(filename: string, rows: any[]) {
  console.log('Exporting CSV', filename, rows);
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]).join(',');
  const csv = rows.map(r => Object.values(r).join(',')).join('\n');
  const blob = new Blob([`${headers}\n${csv}`], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}
