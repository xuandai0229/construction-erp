'use client';

import { useQuery } from '@tanstack/react-query';

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
    return <div className="space-y-2 p-4 rounded-xl border border-zinc-800 bg-zinc-900/30"><div className="h-4 w-40 bg-zinc-800 animate-pulse rounded" /><div className="h-20 w-full bg-zinc-800 animate-pulse rounded" /></div>;
  }

  const journal = journalRes;
  if (!journal || !journal.lines || journal.lines.length === 0) {
    return <div className="p-4 rounded-xl border border-zinc-800/80 bg-yellow-950/15 text-yellow-500 text-xs italic">Bút toán kép chưa được ghi nhận hoặc đã bị hủy.</div>;
  }

  const totalDebit = journal.lines.filter((l: any) => l.type === 'DEBIT').reduce((s: number, l: any) => s + Number(l.amount), 0);
  const totalCredit = journal.lines.filter((l: any) => l.type === 'CREDIT').reduce((s: number, l: any) => s + Number(l.amount), 0);

  return (
    <div className="space-y-3 bg-zinc-900/30 p-5 rounded-xl border border-zinc-800/80">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest">BÚT TOÁN KÉP GHI SỔ CÁI (DOUBLE-ENTRY PREVIEW)</h4>
        <span className="text-[10px] text-zinc-500 font-mono">Ref: {journal.reference}</span>
      </div>
      <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/40">
        <table className="w-full text-xs text-left">
          <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider">
            <tr><th className="p-3">Số TK</th><th className="p-3">Tên tài khoản</th><th className="p-3">Diễn giải</th><th className="p-3 text-right">Nợ (Debit)</th><th className="p-3 text-right">Có (Credit)</th></tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 text-zinc-200">
            {journal.lines.map((line: any, idx: number) => (
              <tr key={idx} className="hover:bg-zinc-800/20">
                <td className="p-3 font-bold text-zinc-300">{line.account?.code}</td>
                <td className="p-3">{line.account?.name || ''}</td>
                <td className="p-3">{line.description || journal.description || ''}</td>
                <td className="p-3 text-right font-mono text-emerald-400">{line.type === 'DEBIT' ? `${Number(line.amount).toLocaleString('vi-VN')} đ` : '-'}</td>
                <td className="p-3 text-right font-mono text-orange-400">{line.type === 'CREDIT' ? `${Number(line.amount).toLocaleString('vi-VN')} đ` : '-'}</td>
              </tr>
            ))}
            <tr className="bg-zinc-900 font-black text-white">
              <td className="p-3" colSpan={3}>TỔNG CỘNG HẠCH TOÁN</td>
              <td className="p-3 text-right font-mono text-emerald-400">{totalDebit.toLocaleString('vi-VN')} đ</td>
              <td className="p-3 text-right font-mono text-orange-400">{totalCredit.toLocaleString('vi-VN')} đ</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
