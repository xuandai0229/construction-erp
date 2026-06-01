'use client';

import { useState, useEffect } from 'react';
import { useERPStore } from '@/store/erpStore';
import { UserRole } from '@/app/types';

import EnterpriseAppShell from '@/app/components/layout/EnterpriseAppShell';
import EnterpriseHeader from '@/app/components/layout/EnterpriseHeader';
import EnterprisePageContainer from '@/app/components/layout/EnterprisePageContainer';

import {
  EnterpriseCard,
  EnterpriseSection,
  EnterpriseBadge
} from '@/app/components/ui-enterprise';

export default function SystemPage() {
  const userRole = useERPStore(state => state.userRole);
  const setUserRole = useERPStore(state => state.setUserRole);

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
    <EnterpriseAppShell activeItem="system">
      <EnterpriseHeader
        title="TRUNG TÂM GIÁM SÁT HỆ THỐNG & ĐIỀU HÀNH AN NINH"
        subtitle="Governance, Compliance, Operational Observability & Disaster Recovery Cockpit"
      />
      <EnterprisePageContainer>
        
        {/* Accent Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[var(--border)]">
          <div>
            <h1 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">Governance & Telemetry Cockpit</h1>
            <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide mt-1">Giám sát tài nguyên, an ninh, phân quyền và phục hồi sau sự cố</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/5 px-4 py-2 text-[10px] text-rose-500 font-bold uppercase tracking-wider select-none shrink-0 self-start md:self-auto">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
            Chế độ bảo mật Enterprise Active
          </div>
        </div>

        {/* Interactive Role Switcher Panel for Testing permissions */}
        <EnterpriseSection title="1. TRÌNH GIẢ LẬP QUYỀN HẠN (SIMULATE GOVERNANCE MATRIX)">
          <EnterpriseCard title="MA TRẬN VAI TRÒ HỆ THỐNG" subtitle="Lựa chọn vai trò để kiểm thử phân quyền Module/Hành động và Hạn mức Tài chính ngay lập tức">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
              {roles.map(role => {
                const isActive = userRole === role;
                return (
                  <button
                    key={role}
                    onClick={() => {
                      setUserRole(role);
                      setStatus({ message: `Đã kích hoạt giả lập vai trò: ${roleLabels[role]}`, type: 'success' });
                    }}
                    className={`flex flex-col text-left p-4 rounded-xl border transition-all text-[11px] cursor-pointer ${
                      isActive 
                        ? 'border-violet-500 ring-2 ring-violet-500/20 bg-violet-500/10 text-violet-400' 
                        : roleStyles[role]
                    }`}
                  >
                    <div className="flex justify-between items-center w-full font-black tracking-wide mb-1.5 uppercase text-[10px]">
                      <span>{roleLabels[role]}</span>
                      {isActive && (
                        <span className="bg-violet-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider select-none">
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
          </EnterpriseCard>
        </EnterpriseSection>

        {/* Real-time Telemetry & Performance Observability Cockpit (Batch 7.5) */}
        <EnterpriseSection title="2. SỐ LIỆU ĐO LƯỜNG HIỆU NĂNG & AN NINH (REAL-TIME TELEMETRY COCKPIT)">
          <EnterpriseCard title="ĐO LƯỜNG TỨ THỜI (IN-MEMORY TELEMETRY)" subtitle="Độ trễ API, bộ nhớ RAM heap, tần suất lỗi đối soát, và phòng chống tấn công an ninh">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-2">
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
                  <div className={`text-[15px] font-black font-mono tabular-nums ${stat.color}`}>{stat.value}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 text-[11px] mt-2">
              <div className="rounded-xl bg-[var(--secondary)]/30 border border-[var(--border)] p-4 space-y-2">
                <div className="font-bold text-[var(--text-secondary)] uppercase text-[9.5px] tracking-wider mb-1">Lịch sử xuất báo cáo (Data Export Usage)</div>
                <div className="flex justify-between items-center py-1 border-b border-[var(--border)]">
                  <span>Tệp excel / CSV:</span>
                  <span className="font-bold text-[var(--text-primary)] font-mono">{metrics?.performanceMetrics?.exports?.CSV ?? 0} lần</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span>Hồ sơ vector PDF:</span>
                  <span className="font-bold text-[var(--text-primary)] font-mono">{metrics?.performanceMetrics?.exports?.PDF ?? 0} lần</span>
                </div>
              </div>

              <div className="rounded-xl bg-[var(--secondary)]/30 border border-[var(--border)] p-4 space-y-2">
                <div className="font-bold text-[var(--text-secondary)] uppercase text-[9.5px] tracking-wider mb-1">Cấu trúc bộ nhớ heap máy chủ</div>
                <div className="flex justify-between items-center py-1 border-b border-[var(--border)]">
                  <span>Heap Total Allocated:</span>
                  <span className="font-bold text-[var(--text-primary)] font-mono">{metrics?.performanceMetrics?.memory?.heapTotal ?? 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span>External Buffers:</span>
                  <span className="font-bold text-[var(--text-primary)] font-mono">{metrics?.performanceMetrics?.memory?.external ?? 'N/A'}</span>
                </div>
              </div>
            </div>
          </EnterpriseCard>
        </EnterpriseSection>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Observability Section */}
          <EnterpriseSection title="3. LOGS AN NINH TRỰC TUYẾN" className="lg:col-span-2">
            <EnterpriseCard
              title="GIÁM SÁT AN NINH & VẬN HÀNH"
              subtitle="Nhật ký các hành vi mở kỳ kế toán, sửa hạch toán dòng tiền, truy cập sai quyền hạn"
              headerActions={
                <button
                  onClick={fetchAlerts}
                  className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--secondary)] text-[var(--text-muted)] transition-all cursor-pointer"
                  title="Tải lại log an ninh"
                >
                  <svg viewBox="0 0 24 24" className={`h-4 w-4 ${loadingAlerts ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                  </svg>
                </button>
              }
            >
              <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--secondary)]/30 mt-2">
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
                              <span className={`inline-block h-1.5 w-1.5 rounded-full ${isCritical ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`} />
                              <span className={`font-black uppercase tracking-wider text-[9px] ${isCritical ? 'text-rose-500' : 'text-amber-500'}`}>
                                {alert.action}
                              </span>
                            </div>
                            <span className="text-[10px] text-[var(--text-muted)] font-mono tabular-nums">{new Date(alert.timestamp).toLocaleString('vi-VN')}</span>
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
            </EnterpriseCard>
          </EnterpriseSection>

          {/* Backup & Recovery Section */}
          <EnterpriseSection title="4. PHỤC HỒI SAU SỰ CỐ">
            <EnterpriseCard title="DISASTER RECOVERY SAO LƯU" subtitle="Sao lưu và khôi phục cơ sở dữ liệu nhanh chóng">
              <div className="space-y-4 mt-2">
                <button
                  disabled={loadingBackup}
                  onClick={handleExport}
                  className="w-full h-[40px] rounded-[var(--radius-sm)] bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 transition-colors"
                >
                  {loadingBackup ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin border-2 border-white border-t-transparent rounded-full" />
                      Đang kết xuất dữ liệu...
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Tải dữ liệu sao lưu (.json)
                    </>
                  )}
                </button>

                <div className="pt-4 border-t border-[var(--border)] text-xs">
                  <label className="text-[11.5px] font-bold text-[var(--text-secondary)] mb-2 block">Phục hồi cơ sở dữ liệu (Import JSON)</label>
                  <textarea
                    value={backupJson}
                    onChange={(e) => setBackupJson(e.target.value)}
                    placeholder="Dán nội dung JSON sao lưu đã tải xuống trước đó tại đây..."
                    className="w-full h-24 p-2.5 rounded-lg bg-[var(--background)] border border-[var(--border)] font-mono text-[10px] resize-none text-[var(--text-primary)] focus:outline-none focus:border-rose-500/40"
                  />
                  <button
                    onClick={handleImport}
                    className="mt-3 w-full h-[36px] rounded-[var(--radius-sm)] border border-rose-500/40 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 font-bold text-xs flex items-center justify-center cursor-pointer transition-colors"
                  >
                    Khởi động khôi phục dữ liệu
                  </button>
                </div>

                {status.message && (
                  <div className={`rounded-xl p-3 text-[10.5px] font-bold border ${
                    status.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : status.type === 'info'
                      ? 'bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse'
                      : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                  }`}>
                    {status.message}
                  </div>
                )}
              </div>
            </EnterpriseCard>
          </EnterpriseSection>

        </div>

        {/* System Health Info */}
        <EnterpriseSection title="5. THÔNG TIN CẤU HÌNH & SỨC KHỎE MÁY CHỦ">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Phiên bản lõi', value: 'v3.5.0 Enterprise' },
              { label: 'Vai trò hoạt động', value: roleLabels[userRole] || userRole },
              { label: 'Hệ quản trị DB', value: 'PostgreSQL (Prisma Shared Pool)' },
              { label: 'Trạng thái kết nối', value: 'Ổn định (Active)' },
            ].map(item => (
              <div key={item.label} className="rounded-xl bg-[var(--secondary)] border border-[var(--border)] p-4 bg-[var(--card)] shadow-sm">
                <div className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider mb-1">{item.label}</div>
                <div className="text-[12px] font-bold text-[var(--text-primary)]">{item.value}</div>
              </div>
            ))}
          </div>
        </EnterpriseSection>

      </EnterprisePageContainer>
    </EnterpriseAppShell>
  );
}
