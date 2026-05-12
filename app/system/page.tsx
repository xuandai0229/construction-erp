'use client';

import { useState } from 'react';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { useERPStore } from '@/store/erpStore';
import { UserRole } from '@/app/types';

export default function SystemPage() {
  const userRole       = useERPStore(state => state.userRole);
  const setUserRole    = useERPStore(state => state.setUserRole);
  const sidebarCollapsed = useERPStore(state => state.sidebarCollapsed);

  const getFullBackup = () => JSON.stringify({ version: '2.0.0', data: 'mock' });
  const restoreBackup = async (data: string) => ({ success: true, error: null });

  const [backupJson, setBackupJson] = useState('');
  const [status, setStatus] = useState({ message: '', type: '' });

  if (userRole !== 'ADMIN') {
    return (
      <div className="erp-page">
        <Sidebar activeItem="system" />
        <main
          className="erp-page-main items-center justify-center"
          style={{ marginLeft: sidebarCollapsed ? 'var(--erp-sidebar-collapsed)' : 'var(--erp-sidebar-width)' }}
        >
          <div className="text-center space-y-6 max-w-sm mx-auto">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/20">
              <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-black text-[var(--text-primary)] mb-2">Truy cập bị từ chối</h1>
              <p className="text-[13px] text-[var(--text-secondary)]">Bạn không có quyền quản trị để truy cập trang cấu hình hệ thống.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

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

  const roles: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'GROUP_DIRECTOR', 'CFO', 'BRANCH_DIRECTOR', 'MANAGER', 'ACCOUNTANT', 'AUDITOR', 'VIEWER'];
  const roleDescriptions: Record<UserRole, string> = {
    SUPER_ADMIN: 'Kiểm soát toàn bộ hệ thống & phân quyền',
    ADMIN: 'Quản trị hệ thống · Khóa/Mở kỳ · Xóa dữ liệu',
    GROUP_DIRECTOR: 'Giám đốc tập đoàn · Xem toàn bộ báo cáo',
    CFO: 'Giám đốc tài chính · Quản lý dòng tiền',
    BRANCH_DIRECTOR: 'Giám đốc chi nhánh · Xem báo cáo chi nhánh',
    MANAGER: 'Quản lý dự án · Thêm chi phí · WBS',
    ACCOUNTANT: 'Quản lý Tài chính, Hóa đơn, Thanh toán',
    AUDITOR: 'Kiểm toán viên · Chỉ xem & xuất báo cáo',
    VIEWER: 'Chỉ xem · Không chỉnh sửa',
  };

  return (
    <div className="erp-page">
      <Sidebar activeItem="system" />
      <main
        className="erp-page-main"
        style={{ marginLeft: sidebarCollapsed ? 'var(--erp-sidebar-collapsed)' : 'var(--erp-sidebar-width)' }}
      >
        <Header />
        <div className="p-6 md:p-8 space-y-8 animate-fade-in">
          <div className="accent-line">
            <h1 className="erp-section-title">Quản trị hệ thống</h1>
            <p className="erp-section-subtitle">Quản lý quyền truy cập, bảo mật và sao lưu dữ liệu</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Role Management */}
            <section className="card-elevation p-6 space-y-4">
              <div className="flex items-center gap-2 mb-5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 11V7a4 4 0 0 1 8 0v4M8 11h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-[12px] font-black text-[var(--text-primary)] uppercase tracking-widest">Quyền truy cập (Role)</h3>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Thay đổi vai trò để kiểm tra phân quyền</p>
                </div>
              </div>

              <div className="space-y-2">
                {roles.map((role) => (
                  <button
                    key={role}
                    onClick={() => setUserRole(role)}
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 transition-all text-left ${
                      userRole === role
                        ? 'border-blue-500/40 bg-blue-500/10 text-[var(--text-primary)]'
                        : 'border-[var(--border)] bg-[var(--secondary)] text-[var(--text-secondary)] hover:border-blue-500/30 hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <div>
                      <div className="text-[12px] font-bold uppercase tracking-wider">{role}</div>
                      <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{roleDescriptions[role]}</div>
                    </div>
                    {userRole === role && <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />}
                  </button>
                ))}
              </div>
            </section>

            {/* Backup & Restore */}
            <section className="card-elevation p-6 space-y-5">
              <div className="flex items-center gap-2 mb-5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5 5 5-5m-5 5V3" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-[12px] font-black text-[var(--text-primary)] uppercase tracking-widest">Sao lưu & Khôi phục</h3>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Xuất/nhập toàn bộ database JSON</p>
                </div>
              </div>

              <button
                onClick={handleExport}
                className="erp-btn w-full bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 justify-center gap-2"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5 5 5-5m-5 5V3" />
                </svg>
                Tải xuống bản sao lưu (.json)
              </button>

              <div className="pt-4 border-t border-[var(--divider)]">
                <label className="erp-label mb-2">Khôi phục từ JSON</label>
                <textarea
                  value={backupJson}
                  onChange={(e) => setBackupJson(e.target.value)}
                  placeholder="Dán nội dung file backup vào đây..."
                  className="erp-input w-full h-32 font-mono text-[11px] resize-none"
                />
                <button
                  onClick={handleImport}
                  className="erp-btn mt-3 w-full border border-rose-500/40 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 justify-center"
                >
                  Khôi phục dữ liệu
                </button>
              </div>

              {status.message && (
                <div className={`rounded-xl p-3 text-[11px] font-bold ${
                  status.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                }`}>
                  {status.message}
                </div>
              )}
            </section>
          </div>

          {/* System Info */}
          <section className="card-elevation p-6">
            <h3 className="text-[12px] font-black text-[var(--text-primary)] uppercase tracking-widest mb-5 flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><path d="M8 21h8m-4-4v4" />
              </svg>
              Thông tin hệ thống
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Phiên bản', value: 'v2.0.0' },
                { label: 'Vai trò hiện tại', value: userRole },
                { label: 'Database', value: 'LocalStorage' },
                { label: 'Build', value: 'Production' },
              ].map(item => (
                <div key={item.label} className="rounded-xl bg-[var(--secondary)] border border-[var(--border)] p-4">
                  <div className="text-[9.5px] font-black text-[var(--text-muted)] uppercase tracking-wider mb-1">{item.label}</div>
                  <div className="text-[13px] font-bold text-[var(--text-primary)]">{item.value}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
