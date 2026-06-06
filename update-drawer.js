const fs = require('fs');
let content = fs.readFileSync('app/components/accounting/FinancialDrilldownDrawer.tsx', 'utf8');

// Add state for generic document
content = content.replace(
  'const [journalLines, setJournalLines] = useState<any[]>([]);',
  'const [journalLines, setJournalLines] = useState<any[]>([]);\n  const [detailModalDoc, setDetailModalDoc] = useState<any>(null);'
);

// Replace 'Hành động' column
content = content.replace(
  /key: "action",[\s\S]*?width: "130px",/,
  `key: "action",
                  header: "Hành động",
                  render: (row) => {
                    const url = buildSourceUrl(row);
                    if (url) {
                      return (
                        <a className="text-xs font-bold text-[var(--primary)] hover:underline" href={url} target="_blank" rel="noreferrer">
                          Mở chứng từ
                        </a>
                      );
                    }
                    return (
                      <button type="button" onClick={() => setDetailModalDoc(row)} className="text-xs font-bold text-[var(--primary)] hover:underline">
                        Xem chi tiết
                      </button>
                    );
                  },
                  align: "center",
                  width: "130px",`
);

// Add the modal at the end of the drawer content
const modalHtml = `

          {/* Fallback Document Modal */}
          {detailModalDoc && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-lg rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl">
                <h3 className="text-lg font-black text-[var(--text-primary)]">Chi tiết chứng từ</h3>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">Không có bản in trực tiếp cho loại chứng từ này.</p>
                
                <div className="mt-6 space-y-3 text-sm">
                  <div className="grid grid-cols-3 gap-2 border-b border-[var(--border)] pb-2">
                    <span className="font-semibold text-[var(--text-secondary)]">Loại chứng từ:</span>
                    <span className="col-span-2 font-bold text-[var(--text-primary)]">{sourceTypeLabel(detailModalDoc.sourceType)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-b border-[var(--border)] pb-2">
                    <span className="font-semibold text-[var(--text-secondary)]">Số chứng từ:</span>
                    <span className="col-span-2 font-mono text-[var(--text-primary)]">{detailModalDoc.number || 'Chưa có'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-b border-[var(--border)] pb-2">
                    <span className="font-semibold text-[var(--text-secondary)]">Số tiền:</span>
                    <span className="col-span-2 font-mono font-bold text-emerald-600">{formatVnd(detailModalDoc.amount)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-b border-[var(--border)] pb-2">
                    <span className="font-semibold text-[var(--text-secondary)]">Trạng thái:</span>
                    <span className="col-span-2 font-bold">{detailModalDoc.status}</span>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button type="button" onClick={() => setDetailModalDoc(null)} className="h-9 rounded-md bg-[var(--primary)] px-4 text-xs font-bold text-white transition hover:bg-[var(--primary-hover)]">
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}
`;

content = content.replace(
  '        </EnterpriseDrawer>',
  modalHtml + '\n        </EnterpriseDrawer>'
);

// Reduce minWidth of datatable so it doesn't get clipped on left side
content = content.replace('minWidth="1120px"', 'minWidth="980px"');

fs.writeFileSync('app/components/accounting/FinancialDrilldownDrawer.tsx', content, 'utf8');
console.log("Updated FinancialDrilldownDrawer.tsx");
