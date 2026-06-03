'use client';

import { useState, useEffect } from 'react';
import { useERPStore } from '@/store/erpStore';

import EnterpriseAppShell from '@/app/components/layout/EnterpriseAppShell';
import EnterpriseHeader from '@/app/components/layout/EnterpriseHeader';
import EnterprisePageContainer from '@/app/components/layout/EnterprisePageContainer';

import {
  EnterpriseCard,
  EnterpriseSection,
  EnterpriseModal,
  FormGroup,
  Input,
  Select
} from '@/app/components/ui-enterprise';

export default function SettingsPage() {
  const userRole = useERPStore(state => state.userRole);

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

  const fetchPeriods = (signal?: AbortSignal) => {
    setLoadingPeriods(true);
    fetch('/api/fiscal-periods', { signal })
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setPeriods(res.data || []);
        }
      })
      .catch(err => {
        if (err?.name !== 'AbortError') {
          console.warn('[Settings] Failed to load fiscal periods:', err);
        }
      })
      .finally(() => setLoadingPeriods(false));
  };

  useEffect(() => {
    const controller = new AbortController();
    if (userRole === 'ADMIN') {
      fetchPeriods(controller.signal);
    }
    return () => controller.abort();
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
      // Mở lại kỳ đã khóa phải có lý do để ghi nhật ký kiểm toán.
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
      alert('Vui lòng nhập lý do mở lại kỳ kế toán để ghi nhận nhật ký kiểm toán!');
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
    <EnterpriseAppShell activeItem="system">
      <EnterpriseHeader
        title="CÀI ĐẶT CẤU HÌNH HỆ THỐNG"
        subtitle="Quản lý tùy chọn cá nhân hóa giao diện, ngôn ngữ, vùng miền và kiểm soát chu kỳ khóa sổ kế toán"
      />
      <EnterprisePageContainer>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[var(--border)]">
          <div>
            <h1 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">Cấu hình tham số hệ thống</h1>
            <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide mt-1">Cấu hình trải nghiệm ERP cá nhân hóa và quản trị an toàn đóng sổ</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Theme & Display */}
          <EnterpriseSection title="1. CHỦ ĐỀ & MẬT ĐỘ HIỂN THỊ">
            <EnterpriseCard p-6 md-p-8>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-[var(--text-secondary)]">Chủ đề giao diện</label>
                  <div className="flex p-1 bg-[var(--secondary)] rounded-xl border border-[var(--border)]">
                    <button
                      onClick={() => toggleTheme('dark')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        theme === 'dark'
                          ? 'bg-blue-600 text-white shadow-md'
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
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        theme === 'light'
                          ? 'bg-blue-600 text-white shadow-md'
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
                  <label className="text-xs font-bold text-[var(--text-secondary)]">Mật độ dữ liệu</label>
                  <div className="flex p-1 bg-[var(--secondary)] rounded-xl border border-[var(--border)]">
                    <button
                      onClick={() => setDensity('compact')}
                      className={`flex-1 py-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        density === 'compact'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      Compact (Khuyên dùng cho ERP)
                    </button>
                    <button
                      onClick={() => setDensity('standard')}
                      className={`flex-1 py-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        density === 'standard'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      Standard
                    </button>
                  </div>
                </div>
              </div>
            </EnterpriseCard>
          </EnterpriseSection>

          {/* System Config */}
          <EnterpriseSection title="2. ĐỊNH DẠNG VÙNG MIỀN & NGÔN NGỮ">
            <EnterpriseCard p-6 md-p-8>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormGroup label="Ngôn ngữ hiển thị">
                  <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
                    <option value="vi">Tiếng Việt (Việt Nam)</option>
                    <option value="en">English (Global)</option>
                  </Select>
                </FormGroup>

                <FormGroup label="Định dạng tiền tệ tiêu chuẩn">
                  <Select>
                    <option>đ - Tiền Đồng Việt Nam</option>
                    <option>USD ($) - Đô La Mỹ</option>
                  </Select>
                </FormGroup>
              </div>
            </EnterpriseCard>
          </EnterpriseSection>

          {/* Admin only */}
          {userRole === 'ADMIN' && (
            <div className="space-y-6">
              <EnterpriseSection title="3. THIẾT LẬP BẢO MẬT & QUẢN TRỊ VIÊN">
                <EnterpriseCard title="CHẾ ĐỘ TỰ ĐỘNG BẢO VỆ DỮ LIỆU" subtitle="Kiểm soát toàn vẹn dữ liệu tự động" headerActions={<span className="rounded-full bg-blue-500/10 px-3 py-1 text-[9px] font-black text-blue-500 ring-1 ring-blue-500/30">QUYỀN TỐI CAO</span>}>
                  <div className="space-y-3">
                    {[
                      { label: 'Tự động sao lưu dữ liệu hệ thống', desc: 'Hệ thống sẽ tự động backup cơ sở dữ liệu vào lúc 00:00 hàng ngày.' },
                      { label: 'Chế độ ghi chép Audit Log trực tuyến', desc: 'Lưu vết tất cả các thao tác sửa đổi, xóa dòng tiền hoặc hạch toán sổ cái.' },
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
                </EnterpriseCard>
              </EnterpriseSection>

              {/* Fiscal Period Locking Control (Batch 5.3) */}
              <EnterpriseSection title="4. KHÓA SỔ KỲ KẾ TOÁN (FISCAL PERIOD SAFETY)">
                <EnterpriseCard title="KIỂM SOÁT ĐÓNG MỞ KỲ HẠCH TOÁN" subtitle="Khi kỳ kế toán bị khóa sổ, mọi giao dịch chỉnh sửa, xóa chi phí hoặc hạch toán mới trong kỳ đó sẽ bị chặn tuyệt đối để bảo vệ tính toàn vẹn số liệu.">
                  {loadingPeriods ? (
                    <div className="text-[11px] text-[var(--text-muted)] italic py-4">Đang truy vấn kỳ kế toán từ máy chủ...</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
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
                                <div className="text-[8px] text-rose-400 mt-1 italic font-medium">
                                  Đã khóa: {new Date(p.lockedAt).toLocaleDateString('vi-VN')}
                                </div>
                              )}
                            </div>

                            <button
                              disabled={isProcessing}
                              onClick={() => handleTogglePeriod(p.month, isLocked)}
                              className={`h-7 px-3 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
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
                </EnterpriseCard>
              </EnterpriseSection>

              {/* Audit Reopen Period Modal popover */}
              <EnterpriseModal
                isOpen={showReopenModal !== null}
                onClose={() => { setShowReopenModal(null); setReopenReason(''); }}
                title="Yêu cầu Xác thực Kiểm toán Sổ sách"
                maxWidth="md"
              >
                <div className="space-y-4 text-xs">
                  <div className="flex items-center gap-3 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                    <div className="h-9 w-9 rounded-full bg-rose-500/15 flex items-center justify-center text-rose-500 shrink-0">
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-rose-500 uppercase text-[10px]">Cảnh báo mở sổ kỳ kế toán</h4>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Bạn đang thực hiện mở sổ đã khóa kỳ: <span className="font-bold">{showReopenModal}</span></p>
                    </div>
                  </div>

                  <FormGroup label="Lý do mở lại sổ kế toán (bắt buộc để ghi nhật ký kiểm toán):">
                    <textarea
                      rows={3}
                      value={reopenReason}
                      onChange={(e) => setReopenReason(e.target.value)}
                      placeholder="Vui lòng nêu rõ lý do điều chỉnh số liệu (ví dụ: bổ sung chứng từ thầu phụ còn thiếu)..."
                      className="w-full p-2.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs min-h-[80px] focus:outline-none focus:border-[var(--primary)] text-[var(--text-primary)]"
                    />
                  </FormGroup>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => { setShowReopenModal(null); setReopenReason(''); }}
                      className="h-[36px] px-4 rounded-[var(--radius-sm)] bg-[var(--secondary)] text-[var(--text-muted)] border border-[var(--border)] hover:bg-[var(--border)]/10 text-xs font-bold cursor-pointer transition-colors"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      onClick={handleReopenPeriodSubmit}
                      className="h-[36px] px-5 rounded-[var(--radius-sm)] bg-rose-600 text-white hover:bg-rose-500 shadow-sm text-xs font-bold cursor-pointer transition-colors"
                    >
                      Xác nhận mở sổ
                    </button>
                  </div>
                </div>
              </EnterpriseModal>
            </div>
          )}
        </div>

        {/* Form save buttons */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-[var(--border)] mt-4">
          {saved && (
            <div className="text-[11px] font-bold text-emerald-500 flex items-center gap-1.5 animate-fade-in">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              Cập nhật tham số thành công!
            </div>
          )}
          <button
            onClick={handleSave}
            className="h-[38px] px-8 rounded-[var(--radius-sm)] bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-sm cursor-pointer transition-colors text-xs"
          >
            Lưu cấu hình
          </button>
        </div>
      </EnterprisePageContainer>
    </EnterpriseAppShell>
  );
}
