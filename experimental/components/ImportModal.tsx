'use client';

import React, { useState } from 'react';

interface ImportModalProps {
  title: string;
  onImport: (data: any[]) => Promise<any>;
  onClose: () => void;
  templateUrl?: string;
}

function IconPath({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

export function ImportModal({ title, onImport, onClose, templateUrl }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    try {
      // In a real app, we would parse Excel here or send to API
      // For the demo, we simulate parsing a small array
      const mockData = [
        { amount: 1000, wbsId: '...', note: 'Imported item 1' },
        { amount: 2000, wbsId: '...', note: 'Imported item 2' },
      ];
      const res = await onImport(mockData);
      setResult(res);
    } catch (err: any) {
      alert(`Lỗi import: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <IconPath path="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242M12 12v9m-4-4l4 4 4-4" />
            Nhập dữ liệu {title}
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <IconPath path="M6 18L18 6M6 6l12 12" />
          </button>
        </div>

        <div className="p-8">
          {!result ? (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-slate-800 rounded-xl p-10 text-center hover:border-blue-500/50 transition-colors cursor-pointer group relative">
                <input 
                  type="file" 
                  accept=".csv,.xlsx,.xls" 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-blue-500/10 rounded-full text-blue-500 group-hover:scale-110 transition-transform">
                    <IconPath path="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" />
                  </div>
                  <div>
                    <p className="text-slate-200 font-medium">{file ? file.name : 'Chọn file Excel hoặc CSV'}</p>
                    <p className="text-xs text-slate-500 mt-1">Dung lượng tối đa 5MB</p>
                  </div>
                </div>
              </div>

              {templateUrl && (
                <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 flex items-center justify-between">
                  <div className="text-sm text-slate-400 italic">Chưa có file mẫu?</div>
                  <a href={templateUrl} className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1">
                    <IconPath path="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    Tải file mẫu
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-xl space-y-4">
              <div className="flex items-center gap-3 text-emerald-500">
                <IconPath path="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" />
                <span className="font-bold">Import thành công!</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-950 p-3 rounded border border-slate-800">
                  <div className="text-slate-500 text-xs mb-1">THÀNH CÔNG</div>
                  <div className="text-emerald-500 text-lg font-bold">{result.success}</div>
                </div>
                <div className="bg-slate-950 p-3 rounded border border-slate-800">
                  <div className="text-slate-500 text-xs mb-1">THẤT BẠI</div>
                  <div className="text-red-500 text-lg font-bold">{result.failed}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-slate-400 hover:text-slate-200"
          >
            Đóng
          </button>
          {!result && (
            <button
              onClick={handleSubmit}
              disabled={!file || loading}
              className="px-8 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm font-bold rounded-lg transition-all flex items-center gap-2"
            >
              {loading && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
              Bắt đầu nhập dữ liệu
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
