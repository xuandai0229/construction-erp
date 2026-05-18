'use client';

import { useState, useEffect } from 'react';
import { useERPStore } from '@/store/erpStore';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';

export default function SettingsPage() {
  const sidebarCollapsed = useERPStore(state => state.sidebarCollapsed);
  const userRole         = useERPStore(state => state.userRole);

  const [theme, setTheme] = useState('dark');
  const [density, setDensity] = useState('compact');
  const [language, setLanguage] = useState('vi');
  const [saved, setSaved] = useState(false);

  // Fiscal period state variables (Batch 5.3)
  const [periods, setPeriods] = useState<any[]>([]);
  const [loadingPeriods, setLoadingPeriods] = useState(false);
  const [lockingMonth, setLockingMonth] = useState<string | null>(null);
  const [reopenReason, setReopenReason] = useState('');
  const [showReopenModal, setShowReopenModal] = useState<string | null>(null);

  const fetchPeriods = () => {
    setLoadingPeriods(true);
    fetch('/api/fiscal-periods')
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setPeriods(res.data || []);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingPeriods(false));
  };

  useEffect(() => {
    if (userRole === 'ADMIN') {
      fetchPeriods();
    }
  }, [userRole]);

  // Read saved settings on mount (client-only) to avoid SSR/hydration mismatch
  useEffect(() => {
    setTheme(localStorage.getItem('theme') || 'dark');
    setDensity(localStorage.getItem('erp-density') || 'compact');
    setLanguage(localStorage.getItem('erp-language') || 'vi');
  }, []);

  const toggleTheme = (val: string) => {
    setTheme(val);
    if (val === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('theme', val);
  };

  const handleTogglePeriod = async (month: string, currentLockState: boolean) => {
    if (currentLockState) {
      // Reopening a locked period requires a reason for the Audit Trail! (Batch 5.3)
      setShowReopenModal(month);
    } else {
      // Locking can be done directly with system notification
      setLockingMonth(month);
      try {
        const res = await fetch('/api/fiscal-periods', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ month, isLocked: true, reason: 'Kỳ kế toán được đóng sổ thủ công bởi Admin.' })
        });
        const data = await res.json();
        if (data.success) {
          fetchPeriods();
        } else {
          alert('Lỗi: ' + data.error);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLockingMonth(null);
      }
    }
  };

  const handleReopenPeriodSubmit = async () => {
    if (!showReopenModal) return;
    if (!reopenReason.trim()) {
      alert('Vui lòng nhập lý do mở lại kỳ kế toán để ghi nhận nhật ký kiểm toán (Audit Trail)!');
      return;
    }
    const month = showReopenModal;
    setLockingMonth(month);
    try {
      const res = await fetch('/api/fiscal-periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, isLocked: false, reason: reopenReason })
      });
      const data = await res.json();
      if (data.success) {
        setShowReopenModal(null);
        setReopenReason('');
        fetchPeriods();
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLockingMonth(null);
    }
  };

  const handleSave = () => {
    localStorage.setItem('erp-density', density);
    localStorage.setItem('erp-language', language);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="erp-page">
      <Sidebar activeItem="system" />
      <main className={`erp-page-main ${sidebarCollapsed ? 'with-sidebar-collapsed' : 'with-sidebar-expanded'}`}>
        <Header />

        <div className="erp-content-container animate-fade-in space-y-8">
          <div className="accent-line">
            <h1 className="erp-section-title">Cài đặt hệ thống</h1>
            <p className="erp-section-subtitle">Cấu hình trải nghiệm ERP cá nhân hóa</p>
          </div>

          <div className="space-y-6">
            {/* Theme & Display */}
            <section className="card-elevation p-6 md:p-8">
              <h3 className="text-[12px] font-black text-[var(--text-primary)] uppercase tracking-widest mb-6 flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-11.314l.707.707m11.314 11.314l.707.707M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14z" />
                </svg>
                Giao diện & Trải nghiệm
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="erp-label">Chủ đề</label>
                  <div className="flex p-1 bg-[var(--secondary)] rounded-xl border border-[var(--border)]">
                    <button
                      onClick={() => toggleTheme('dark')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[11px] font-bold transition-all ${
                        theme === 'dark'
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                      </svg>
                      Dark Executive
                    </button>
                    <button
                      onClick={() => toggleTheme('light')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[11px] font-bold transition-all ${
                        theme === 'light'
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-11.314l.707.707m11.314 11.314l.707.707M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14z" />
                      </svg>
                      Light Professional
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="erp-label">Mật độ dữ liệu</label>
                  <div className="flex p-1 bg-[var(--secondary)] rounded-xl border border-[var(--border)]">
                    <button
                      onClick={() => setDensity('compact')}
                      className={`flex-1 py-2.5 rounded-lg text-[11px] font-bold transition-all ${
                        density === 'compact'
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      Compact (ERP)
                    </button>
                    <button
                      onClick={() => setDensity('standard')}
                      className={`flex-1 py-2.5 rounded-lg text-[11px] font-bold transition-all ${
                        density === 'standard'
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      Standard
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* System Config */}
            <section className="card-elevation p-6 md:p-8">
              <h3 className="text-[12px] font-black text-[var(--text-primary)] uppercase tracking-widest mb-6 flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12V3H3v18h10M12 3v18M3 9h18M3 15h10" />
                </svg>
                Cấu hình hệ thống
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="erp-label">Ngôn ngữ</label>
                  <select className="erp-input" value={language} onChange={(e) => setLanguage(e.target.value)}>
                    <option value="vi">Tiếng Việt (Mặc định)</option>
                    <option value="en">English (Global)</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="erp-label">Định dạng tiền tệ</label>
                  <select className="erp-input">
                    <option>VNĐ (₫)</option>
                    <option>USD ($)</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Admin only */}
            {userRole === 'ADMIN' && (
              <div className="space-y-6">
                <section className="card-elevation p-6 md:p-8 border-blue-500/20 bg-blue-600/5">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[12px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 11V7a4 4 0 0 1 8 0v4M8 11h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z" />
                      </svg>
                      Thiết lập quản trị viên
                    </h3>
                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-[9px] font-black text-blue-500 ring-1 ring-blue-500/30">
                      QUYỀN TỐI CAO
                    </span>
                  </div>

                  <div className="space-y-3">
                    {[
                      { label: 'Tự động sao lưu dữ liệu', desc: 'Hệ thống sẽ backup vào 00:00 hàng ngày.' },
                      { label: 'Chế độ Audit Log', desc: 'Ghi lại mọi thay đổi dữ liệu tài chính.' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--secondary)]">
                        <div>
                          <div className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-tight">{item.label}</div>
                          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{item.desc}</div>
                        </div>
                        <div className="h-6 w-11 rounded-full bg-blue-600 relative p-1 cursor-pointer shrink-0">
                          <div className="h-4 w-4 rounded-full bg-white absolute right-1 shadow" />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Fiscal Period Locking Control (Batch 5.3) */}
                <section className="card-elevation p-6 md:p-8 border-rose-500/20 bg-rose-950/5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-[12px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        Khóa sổ kỳ kế toán (Fiscal Period Safety)
                      </h3>
                      <p className="text-[10px] text-[var(--text-muted)] mt-1">Khi kỳ kế toán bị khóa sổ, mọi giao dịch chỉnh sửa, xóa chi phí hoặc hạch toán mới trong kỳ đó sẽ bị chặn tuyệt đối để bảo vệ tính toàn vẹn số liệu.</p>
                    </div>
                  </div>

                  {loadingPeriods ? (
                    <div className="text-[11px] text-[var(--text-muted)] italic py-4">Đang tải danh sách kỳ kế toán...</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                      {periods.map((p: any) => {
                        const isLocked = p.isLocked;
                        const isProcessing = lockingMonth === p.month;

                        return (
                          <div
                            key={p.id}
                            className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${
                              isLocked
                                ? 'bg-rose-500/5 border-rose-500/30'
                                : 'bg-[var(--secondary)]/40 border-[var(--border)] hover:border-[var(--text-muted)]/30'
                            }`}
                          >
                            <div>
                              <div className="text-[11px] font-bold text-[var(--text-primary)]">{p.name || p.month}</div>
                              <div className="text-[9px] text-[var(--text-muted)] mt-0.5">Mã kỳ: {p.month}</div>
                              {isLocked && p.lockedAt && (
                                <div className="text-[8px] text-rose-400 mt-1 italic">
                                  Đã khóa: {new Date(p.lockedAt).toLocaleDateString('vi-VN')}
                                </div>
                              )}
                            </div>

                            <button
                              disabled={isProcessing}
                              onClick={() => handleTogglePeriod(p.month, isLocked)}
                              className={`h-7 px-3 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                                isLocked
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                              }`}
                            >
                              {isProcessing ? (
                                <span className="h-2 w-2 rounded-full bg-current animate-ping" />
                              ) : isLocked ? (
                                <>
                                  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                  Mở sổ
                                </>
                              ) : (
                                <>
                                  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                  Khóa sổ
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Audit Reopen Period Modal popover */}
                {showReopenModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-md p-6 rounded-2xl bg-[var(--primary)] border border-[var(--border)] shadow-2xl space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0">
                          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-[12px] font-black text-rose-500 uppercase tracking-widest">Yêu cầu xác thực kiểm toán</h4>
                          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Mở lại kỳ kế toán đã khóa: {showReopenModal}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="erp-label text-rose-400">Lý do mở lại sổ kế toán (Bắt buộc)</label>
                        <textarea
                          rows={3}
                          value={reopenReason}
                          onChange={(e) => setReopenReason(e.target.value)}
                          placeholder="Vui lòng nêu rõ lý do điều chỉnh số liệu (ví dụ: bổ sung chứng từ hoàn công thầu phụ)..."
                          className="erp-input w-full min-h-[80px]"
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          onClick={() => { setShowReopenModal(null); setReopenReason(''); }}
                          className="erp-btn bg-[var(--secondary)] text-[var(--text-muted)] border border-[var(--border)] hover:bg-[var(--border)]/10"
                        >
                          Hủy bỏ
                        </button>
                        <button
                          onClick={handleReopenPeriodSubmit}
                          className="erp-btn bg-rose-600 text-white hover:bg-rose-500 shadow-lg shadow-rose-600/20"
                        >
                          Xác nhận mở sổ
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-4 pt-2">
            {saved && (
              <div className="text-[11px] font-bold text-emerald-500 flex items-center gap-1.5 animate-fade-in">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Đã lưu thành công
              </div>
            )}
            <button
              onClick={handleSave}
              className="erp-btn bg-blue-600 text-white px-10 hover:bg-blue-500 shadow-lg shadow-blue-600/20"
            >
              Lưu cấu hình
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
