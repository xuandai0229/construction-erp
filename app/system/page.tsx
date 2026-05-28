'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { useERPStore } from '@/store/erpStore';
import { UserRole } from '@/app/types';

export default function SystemPage() {
  const userRole = useERPStore(state => state.userRole);
  const setUserRole = useERPStore(state => state.setUserRole);
  const sidebarCollapsed = useERPStore(state => state.sidebarCollapsed);

  const [backupJson, setBackupJson] = useState('');
  const [status, setStatus] = useState({ message: '', type: '' });
  const [loadingBackup, setLoadingBackup] = useState(false);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);

  // Fetch live system alerts (Batch 6.4 Observability)
  const fetchAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const res = await fetch('/api/system/alerts');
      const data = await res.json();
      if (data.success) {
        setAlerts(data.data || []);
      }
    } catch (e) {
      console.warn("Failed to fetch operational alerts", e);
    } finally {
      setLoadingAlerts(false);
    }
  };

  // Fetch live system performance metrics (Batch 7.5 Observability)
  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/monitoring/performance');
      const data = await res.json();
      if (data.success) {
        setMetrics(data.data || null);
      }
    } catch (e) {
      console.warn("Failed to fetch system metrics", e);
    }
  };

  useEffect(() => {
    fetchAlerts();
    fetchMetrics();
    
    // Telemetry polling: Refresh performance metrics every 5 seconds (Batch 7.5)
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  // Live disaster recovery backup export (Batch 6.6)
  const handleExport = async () => {
    setLoadingBackup(true);
    try {
      const res = await fetch('/api/system/backup');
      const data = await res.json();
      if (data.success) {
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `erp_enterprise_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        setStatus({ message: 'Đã kết xuất dữ liệu và tải xuống thành công!', type: 'success' });
        fetchAlerts();
      } else {
        setStatus({ message: data.error || 'Lỗi trích xuất sao lưu', type: 'error' });
      }
    } catch (e: any) {
      setStatus({ message: e.message || 'Lỗi kết nối API sao lưu', type: 'error' });
    } finally {
      setLoadingBackup(false);
    }
  };

  // Safe rollback and validation recovery import (Batch 6.6)
  const handleImport = async () => {
    if (!backupJson) {
      return setStatus({ message: 'Vui lòng dán dữ liệu JSON sao lưu vào ô trống.', type: 'error' });
    }
    
    try {
      const parsed = JSON.parse(backupJson);
      if (window.confirm('CẢNH BÁO: Hành động này sẽ GHI ĐÈ toàn bộ cơ sở dữ liệu hiện tại trong một giao dịch. Hệ thống tự động ROLLBACK nếu phát hiện lỗi tính toàn vẹn. Xác nhận tiếp tục?')) {
        setStatus({ message: 'Đang phục hồi cơ sở dữ liệu...', type: 'info' });
        const res = await fetch('/api/system/backup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ backup: parsed })
        });
        const resData = await res.json();
        if (resData.success) {
          setStatus({ message: 'Khôi phục thành công! Hệ thống đang khởi động lại...', type: 'success' });
          fetchAlerts();
          setTimeout(() => window.location.reload(), 1500);
        } else {
          setStatus({ message: resData.error || 'Lỗi khôi phục cơ sở dữ liệu', type: 'error' });
        }
      }
    } catch (e: any) {
      setStatus({ message: `Dữ liệu không phải là JSON hợp lệ: ${e.message}`, type: 'error' });
    }
  };

  const roles: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'GROUP_DIRECTOR', 'CFO', 'BRANCH_DIRECTOR', 'MANAGER', 'ACCOUNTANT', 'AUDITOR', 'VIEWER'];
  
  const roleLabels: Record<UserRole, string> = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Quản trị viên',
    GROUP_DIRECTOR: 'Giám đốc tập đoàn',
    CFO: 'Giám đốc tài chính (CFO)',
    BRANCH_DIRECTOR: 'Giám đốc chi nhánh',
    MANAGER: 'Quản lý dự án (PM)',
    ACCOUNTANT: 'Kế toán tổng hợp',
    AUDITOR: 'Kiểm toán độc lập',
    VIEWER: 'Người xem (Viewer)',
  };

  const roleStyles: Record<UserRole, string> = {
    SUPER_ADMIN: 'border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10 text-violet-400',
    ADMIN: 'border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400',
    GROUP_DIRECTOR: 'border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400',
    CFO: 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-amber-400',
    BRANCH_DIRECTOR: 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400',
    MANAGER: 'border-teal-500/30 bg-teal-500/5 hover:bg-teal-500/10 text-teal-400',
    ACCOUNTANT: 'border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 text-blue-400',
    AUDITOR: 'border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-400',
    VIEWER: 'border-zinc-500/30 bg-zinc-500/5 hover:bg-zinc-500/10 text-zinc-400',
  };

  const roleDescriptions: Record<UserRole, string> = {
    SUPER_ADMIN: 'Toàn quyền cấu hình, phục hồi hệ thống và phân quyền.',
    ADMIN: 'Quản trị hệ thống, kiểm soát đóng/mở kỳ kế toán và hạch toán.',
    GROUP_DIRECTOR: 'Theo dõi tổng quan toàn tập đoàn, lập kế hoạch ngân sách vĩ mô.',
    CFO: 'Phê duyệt hạch toán, xuất báo cáo tài chính, đóng kỳ kế toán kế hoạch.',
    BRANCH_DIRECTOR: 'Quản lý phê duyệt các dự án thuộc phạm vi chi nhánh phụ trách.',
    MANAGER: 'Quản lý dự án, theo dõi định mức BOQ/WBS, lập đề xuất chi phí.',
    ACCOUNTANT: 'Lập đề xuất chi phí, hóa đơn, thanh toán. Chặn sửa sổ cái trực tiếp.',
    AUDITOR: 'Quyền xem duy nhất (Read-only), đối soát báo cáo và xem Audit Trail.',
    VIEWER: 'Chỉ xem dữ liệu hoạt động cơ bản của dự án.',
  };

  return (
    <div className="erp-page">
      <Sidebar activeItem="system" />
      <main className={`erp-page-main ${sidebarCollapsed ? 'with-sidebar-collapsed' : 'with-sidebar-expanded'}`}>
        <Header />
        
        <div className="erp-content-container animate-fade-in space-y-6">
          {/* Accent Header */}
          <div className="accent-line flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="erp-section-title">Trung tâm Quản trị & Giám sát Vận hành</h1>
              <p className="erp-section-subtitle">Governance, Compliance, Operational Observability & Disaster Recovery Cockpit</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/5 px-4 py-2 text-[11px] text-rose-500 font-bold uppercase tracking-wider">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              Chế độ bảo mật Enterprise Active
            </div>
          </div>

          {/* Interactive Role Switcher Panel for Testing permissions */}
          <section className="erp-card p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-violet-500" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <div>
                <h2 className="text-[12px] font-black uppercase tracking-widest text-[var(--text-primary)]">Trình Giả lập Quyền Hạn (Simulate Governance Matrix)</h2>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Lựa chọn vai trò để kiểm thử phân quyền Module/Hành động và Hạn mức Tài chính ngay lập tức</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map(role => {
                const isActive = userRole === role;
                return (
                  <button
                    key={role}
                    onClick={() => {
                      setUserRole(role);
                      setStatus({ message: `Đã kích hoạt giả lập vai trò: ${roleLabels[role]}`, type: 'success' });
                    }}
                    className={`flex flex-col text-left p-4 rounded-xl border transition-all text-[11px] ${
                      isActive 
                        ? 'border-violet-500 ring-2 ring-violet-500/20 bg-violet-500/10' 
                        : roleStyles[role]
                    }`}
                  >
                    <div className="flex justify-between items-center w-full font-black tracking-wide mb-1.5 uppercase text-[10px]">
                      <span>{roleLabels[role]}</span>
                      {isActive && (
                        <span className="bg-violet-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                          ĐANG CHỌN
                        </span>
                      )}
                    </div>
                    <p className="text-[var(--text-secondary)] font-medium leading-relaxed">
                      {roleDescriptions[role]}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Real-time Telemetry & Performance Observability Cockpit (Batch 7.5) */}
          <section className="erp-card p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-sky-400" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              <div>
                <h2 className="text-[12px] font-black uppercase tracking-widest text-[var(--text-primary)]">Số Liệu Đo Lường Hiệu Năng & An Ninh (Real-time Telemetry Cockpit)</h2>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Bảng đo lường in-memory: Độ trễ API, dung lượng RAM, tần suất lỗi đối soát, và tấn công an ninh</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { 
                  label: 'Độ trễ API trung bình', 
                  value: `${metrics?.performanceMetrics?.api?.averageLatencyMs ?? 0} ms`,
                  color: 'text-sky-400'
                },
                { 
                  label: 'Dung lượng Heap RAM', 
                  value: metrics?.performanceMetrics?.memory?.heapUsed ?? '0.00 MB',
                  color: 'text-emerald-400'
                },
                { 
                  label: 'Tấn công an ninh (Failed Auth)', 
                  value: `${metrics?.performanceMetrics?.security?.failedAuthAttemptsCount ?? 0} lần`,
                  color: (metrics?.performanceMetrics?.security?.failedAuthAttemptsCount ?? 0) > 0 ? 'text-rose-500 animate-pulse font-black' : 'text-[var(--text-primary)]'
                },
                { 
                  label: 'Số dư hạch toán (Postings)', 
                  value: `${metrics?.performanceMetrics?.posting?.totalPostings ?? 0} bút toán`,
                  color: 'text-violet-400'
                },
                { 
                  label: 'Sai lệch đối soát (Recon Fails)', 
                  value: `${metrics?.performanceMetrics?.reconciliation?.failuresCount ?? 0} lỗi`,
                  color: (metrics?.performanceMetrics?.reconciliation?.failuresCount ?? 0) > 0 ? 'text-amber-500 font-black' : 'text-emerald-400'
                }
              ].map(stat => (
                <div key={stat.label} className="rounded-xl bg-[var(--secondary)]/60 border border-[var(--border)] p-4">
                  <div className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider mb-1 leading-snug">{stat.label}</div>
                  <div className={`text-[15px] font-black tabular-nums ${stat.color}`}>{stat.value}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-[10.5px]">
              <div className="rounded-xl bg-[var(--secondary)]/30 border border-[var(--border)] p-4 space-y-2">
                <div className="font-bold text-[var(--text-secondary)] uppercase text-[9.5px] tracking-wider mb-1">Lịch sử xuất báo cáo (Data Export Usage)</div>
                <div className="flex justify-between items-center py-1 border-b border-[var(--border)]">
                  <span>Tệp excel / CSV:</span>
                  <span className="font-bold text-[var(--text-primary)]">{metrics?.performanceMetrics?.exports?.CSV ?? 0} lần</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span>Hồ sơ vector PDF:</span>
                  <span className="font-bold text-[var(--text-primary)]">{metrics?.performanceMetrics?.exports?.PDF ?? 0} lần</span>
                </div>
              </div>

              <div className="rounded-xl bg-[var(--secondary)]/30 border border-[var(--border)] p-4 space-y-2">
                <div className="font-bold text-[var(--text-secondary)] uppercase text-[9.5px] tracking-wider mb-1">Cấu trúc bộ nhớ heap máy chủ</div>
                <div className="flex justify-between items-center py-1 border-b border-[var(--border)]">
                  <span>Heap Total Allocated:</span>
                  <span className="font-bold text-[var(--text-primary)]">{metrics?.performanceMetrics?.memory?.heapTotal ?? 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span>External Buffers:</span>
                  <span className="font-bold text-[var(--text-primary)]">{metrics?.performanceMetrics?.memory?.external ?? 'N/A'}</span>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Observability Section */}
            <section className="erp-card p-6 lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <div>
                    <h2 className="text-[12px] font-black uppercase tracking-widest text-[var(--text-primary)]">Cảnh báo An ninh & Vận hành (Live Security Monitor)</h2>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Giám sát các nỗ lực truy cập bất hợp pháp, mở kỳ hạch toán, sai số liệu đối soát</p>
                  </div>
                </div>
                <button
                  onClick={fetchAlerts}
                  className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--secondary)] text-[var(--text-muted)] transition-all"
                  title="Tải lại log an ninh"
                >
                  <svg viewBox="0 0 24 24" className={`h-4 w-4 ${loadingAlerts ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                  </svg>
                </button>
              </div>

              <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--secondary)]/30">
                <div className="max-h-[300px] overflow-y-auto pr-1 scrollbar-thin divide-y divide-[var(--border)]">
                  {loadingAlerts ? (
                    <div className="p-8 text-center text-[12px] text-[var(--text-muted)] italic animate-pulse">
                      Đang truy vấn nhật ký an ninh...
                    </div>
                  ) : alerts.length === 0 ? (
                    <div className="p-8 text-center text-[11px] text-[var(--text-muted)] italic">
                      Không ghi nhận hành vi bất thường nào trong hệ thống.
                    </div>
                  ) : (
                    alerts.map((alert: any) => {
                      const isCritical = alert.severity === 'CRITICAL';
                      return (
                        <div key={alert.id} className="p-3 text-[11px] hover:bg-[var(--secondary)] transition-colors">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-1.5">
                              <span className={`inline-block h-1.5 w-1.5 rounded-full ${isCritical ? 'bg-rose-500' : 'bg-amber-500'}`} />
                              <span className={`font-black uppercase tracking-wider text-[9px] ${isCritical ? 'text-rose-500' : 'text-amber-500'}`}>
                                {alert.action}
                              </span>
                            </div>
                            <span className="text-[10px] text-[var(--text-muted)] tabular-nums">{new Date(alert.timestamp).toLocaleString('vi-VN')}</span>
                          </div>
                          
                          <p className="text-[var(--text-primary)] font-semibold mt-1">
                            {alert.reason || 'Nhật ký kiểm toán hệ thống'}
                          </p>

                          <div className="flex gap-4 mt-1.5 text-[10px] text-[var(--text-muted)] font-medium">
                            <div>Đối tượng: <span className="font-bold text-[var(--text-secondary)]">{alert.entity} ({alert.entityId})</span></div>
                            <div>Người thực hiện: <span className="font-bold text-violet-400">{alert.user?.name || 'Hệ thống'}</span></div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </section>

            {/* Backup & Recovery Section */}
            <section className="erp-card p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <div>
                  <h2 className="text-[12px] font-black uppercase tracking-widest text-[var(--text-primary)]">Disaster Recovery (Sao lưu)</h2>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Khôi phục giao dịch & Bảo vệ dữ liệu tối đa</p>
                </div>
              </div>

              <button
                disabled={loadingBackup}
                onClick={handleExport}
                className="erp-btn w-full bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 shadow-lg shadow-emerald-600/20 justify-center gap-2 py-2.5"
              >
                {loadingBackup ? (
                  <>
                    <span className="h-3 w-3 animate-spin border-2 border-white border-t-transparent rounded-full" />
                    Đang xuất dữ liệu...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Tải dữ liệu sao lưu (.json)
                  </>
                )}
              </button>

              <div className="pt-4 border-t border-[var(--border)]">
                <label className="erp-label mb-2 text-[10.5px]">Phục hồi cơ sở dữ liệu (Import JSON)</label>
                <textarea
                  value={backupJson}
                  onChange={(e) => setBackupJson(e.target.value)}
                  placeholder="Dán nội dung JSON sao lưu vào đây..."
                  className="erp-input w-full h-24 font-mono text-[10px] resize-none"
                />
                <button
                  onClick={handleImport}
                  className="erp-btn mt-3 w-full border border-rose-500/40 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 justify-center py-2"
                >
                  Khởi động khôi phục dữ liệu
                </button>
              </div>

              {status.message && (
                <div className={`rounded-xl p-3 text-[10.5px] font-bold ${
                  status.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    : status.type === 'info'
                    ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20 animate-pulse'
                    : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                }`}>
                  {status.message}
                </div>
              )}
            </section>

          </div>

          {/* System Health Info */}
          <section className="erp-card p-6">
            <h3 className="text-[12px] font-black text-[var(--text-primary)] uppercase tracking-widest mb-4 flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <path d="M8 21h8m-4-4v4" />
              </svg>
              Thông tin cấu hình & Sức khỏe máy chủ
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Phiên bản lõi', value: 'v3.5.0 Enterprise' },
                { label: 'Vai trò hoạt động', value: roleLabels[userRole] || userRole },
                { label: 'Hệ quản trị DB', value: 'PostgreSQL (Prisma Shared Pool)' },
                { label: 'Trạng thái kết nối', value: 'Ổn định (Active)' },
              ].map(item => (
                <div key={item.label} className="rounded-xl bg-[var(--secondary)] border border-[var(--border)] p-4">
                  <div className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider mb-1">{item.label}</div>
                  <div className="text-[12px] font-bold text-[var(--text-primary)]">{item.value}</div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
