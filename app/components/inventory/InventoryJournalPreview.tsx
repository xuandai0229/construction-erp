'use client';

import { useQuery } from '@tanstack/react-query';
import { EnterpriseLoadingState } from '@/app/components/ui-enterprise';

interface InventoryJournalPreviewProps {
  docId: string;
  isPosted: boolean;
}

export function InventoryJournalPreview({ docId, isPosted }: InventoryJournalPreviewProps) {
  const { data: journalRes, isLoading } = useQuery({
    queryKey: ['inventory-journal-preview', docId],
    queryFn: async () => {
      if (!isPosted) return null;
      const res = await fetch(`/api/inventory/documents/${docId}/journal`);
      const json = await res.json();
      return json.success ? json.data : null;
    },
    enabled: isPosted
  });

  if (!isPosted) return null;

  if (isLoading) {
    return <EnterpriseLoadingState message="Đang tải bút toán kép..." size="sm" />;
  }

  const journal = journalRes;
  if (!journal || !journal.lines || journal.lines.length === 0) {
    return (
      <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-500 text-xs italic">
        Bút toán kép chưa được ghi nhận hoặc đã bị hủy.
      </div>
    );
  }

  const totalDebit = journal.lines.filter((l: any) => l.type === 'DEBIT').reduce((s: number, l: any) => s + Number(l.amount), 0);
  const totalCredit = journal.lines.filter((l: any) => l.type === 'CREDIT').reduce((s: number, l: any) => s + Number(l.amount), 0);

  return (
    <div className="space-y-3 bg-[var(--card)] p-5 rounded-xl border border-[var(--border)]">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest">
          BÚT TOÁN KÉP GHI SỔ CÁI
        </h4>
        <span className="text-[10px] text-[var(--text-muted)] font-mono">Chứng từ gốc: {journal.reference}</span>
      </div>
      <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--background)]">
        <table className="w-full text-xs text-left">
          <thead className="bg-[var(--secondary)] border-b border-[var(--border)] text-[var(--text-secondary)] font-bold uppercase tracking-wider">
            <tr>
              <th className="p-3">Số TK</th>
              <th className="p-3">Tên tài khoản</th>
              <th className="p-3">Diễn giải</th>
              <th className="p-3 text-right">Nợ (Debit)</th>
              <th className="p-3 text-right">Có (Credit)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] text-[var(--text-primary)]">
            {journal.lines.map((line: any, idx: number) => (
              <tr key={idx} className="hover:bg-[var(--secondary)]/25 transition-colors">
                <td className="p-3 font-bold text-[var(--text-secondary)]">{line.account?.code}</td>
                <td className="p-3">{line.account?.name || ''}</td>
                <td className="p-3">{line.description || journal.description || ''}</td>
                <td className="p-3 text-right font-mono text-emerald-500">{line.type === 'DEBIT' ? `${Number(line.amount).toLocaleString('vi-VN')} đ` : '-'}</td>
                <td className="p-3 text-right font-mono text-amber-500">{line.type === 'CREDIT' ? `${Number(line.amount).toLocaleString('vi-VN')} đ` : '-'}</td>
              </tr>
            ))}
            <tr className="bg-[var(--secondary)] font-black text-[var(--text-primary)]">
              <td className="p-3" colSpan={3}>TỔNG CỘNG HẠCH TOÁN</td>
              <td className="p-3 text-right font-mono text-emerald-500">{totalDebit.toLocaleString('vi-VN')} đ</td>
              <td className="p-3 text-right font-mono text-amber-500">{totalCredit.toLocaleString('vi-VN')} đ</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
