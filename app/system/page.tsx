'use client';

import { useState } from 'react';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { useERPStore } from '@/store/erpStore';
import { UserRole } from '@/app/types';

export default function SystemPage() {
  const userRole = useERPStore(state => state.userRole);
  const setUserRole = useERPStore(state => state.setUserRole);
  const getFullBackup = useERPStore(state => state.getFullBackup);
  const restoreBackup = useERPStore(state => state.restoreBackup);

  const [backupJson, setBackupJson] = useState('');
  const [status, setStatus] = useState({ message: '', type: '' });

  const handleExport = () => {
    const json = getFullBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `erp_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    setStatus({ message: 'Đã xuất file backup thành công!', type: 'success' });
  };

  const handleImport = async () => {
    if (!backupJson) return setStatus({ message: 'Vui lòng dán dữ liệu JSON vào ô dưới', type: 'error' });
    if (window.confirm('CẢNH BÁO: Hành động này sẽ GHI ĐÈ toàn bộ dữ liệu hiện tại. Bạn có chắc chắn?')) {
      const res = await restoreBackup(backupJson);
      if (res.success) {
        setStatus({ message: 'Đã khôi phục dữ liệu thành công! Hệ thống đang tải lại...', type: 'success' });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setStatus({ message: res.error || 'Lỗi khôi phục dữ liệu', type: 'error' });
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-100">
      <Sidebar activeItem="system" />
      <main className="ml-[258px] flex-1">
        <Header />
        <div className="p-8 space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Quản trị Hệ thống</h1>
            <p className="text-slate-400 text-sm">Quản lý quyền truy cập, bảo mật và sao lưu dữ liệu</p>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* Role Management */}
            <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="text-lg font-bold text-blue-400">Quyền truy cập (Role)</h3>
              <p className="text-xs text-slate-400">Thay đổi vai trò để kiểm tra phân quyền hệ thống</p>
              
              <div className="space-y-3 pt-4">
                {(['admin', 'accountant', 'staff'] as UserRole[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => setUserRole(role)}
                    className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 transition-all ${
                      userRole === role 
                        ? 'border-blue-500 bg-blue-500/10 text-blue-100' 
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-sm font-bold capitalize">{role}</span>
                    {userRole === role && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                  </button>
                ))}
              </div>

              <div className="mt-6 rounded-lg bg-slate-950 p-4 border border-slate-800">
                <h4 className="text-xs font-bold text-slate-300 mb-2">Quyền hạn vai trò:</h4>
                <ul className="text-[11px] text-slate-500 space-y-1">
                  <li>• <b className="text-slate-300">Admin:</b> Toàn quyền, Khóa/Mở kỳ, Xóa dữ liệu.</li>
                  <li>• <b className="text-slate-300">Accountant:</b> Quản lý Tài chính, Hóa đơn, Thanh toán. Không thể xóa.</li>
                  <li>• <b className="text-slate-300">Staff:</b> Xem báo cáo, Thêm chi phí, WBS. Không thể sửa tài chính.</li>
                </ul>
              </div>
            </section>

            {/* Backup & Restore */}
            <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="text-lg font-bold text-emerald-400">Sao lưu & Khôi phục</h3>
              <p className="text-xs text-slate-400">Xuất toàn bộ database ra file JSON hoặc khôi phục từ bản sao lưu</p>

              <div className="space-y-4 pt-4">
                <button
                  onClick={handleExport}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-500 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5 5 5-5m-5 5V3" />
                  </svg>
                  Tải xuống bản sao lưu (.json)
                </button>

                <div className="pt-4 border-t border-slate-800">
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Khôi phục từ JSON</label>
                  <textarea
                    value={backupJson}
                    onChange={(e) => setBackupJson(e.target.value)}
                    placeholder="Dán nội dung file backup vào đây..."
                    className="w-full h-32 rounded-lg border border-slate-800 bg-slate-950 p-3 text-[10px] text-slate-300 font-mono outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleImport}
                    className="mt-3 w-full rounded-lg border border-rose-500/50 bg-rose-500/10 py-3 text-sm font-bold text-rose-400 hover:bg-rose-500/20 transition-colors"
                  >
                    Khôi phục dữ liệu
                  </button>
                </div>
              </div>

              {status.message && (
                <div className={`mt-4 rounded-lg p-3 text-xs font-bold ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                  {status.message}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
