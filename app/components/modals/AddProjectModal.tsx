import { useEffect, useState, useRef } from 'react';
import { Project, ProjectStatus } from '@/app/types';
import { useCreateProjectMutation, useUpdateProjectMutation } from '@/services/queries/useProjects';
import PortalOverlay from '@/app/components/shared/PortalOverlay';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null;
}

const STATUS_OPTS: { value: ProjectStatus; label: string; icon: string; desc: string; color: string; bg: string }[] = [
  { value: 'PLANNED', label: 'Lập kế hoạch', icon: '📋', desc: 'Đang chuẩn bị hồ sơ và triển khai', color: 'text-slate-400', bg: 'bg-slate-500/10 ring-slate-500/20' },
  { value: 'IN_PROGRESS', label: 'Đang thi công', icon: '🚧', desc: 'Dự án đang được thi công thực tế', color: 'text-blue-400', bg: 'bg-blue-500/10 ring-blue-500/20' },
  { value: 'ACTIVE', label: 'Đang vận hành', icon: '⚡', desc: 'Dự án đang vận hành và khai thác', color: 'text-emerald-400', bg: 'bg-emerald-500/10 ring-emerald-500/20' },
  { value: 'COMPLETED', label: 'Hoàn thành', icon: '✅', desc: 'Đã nghiệm thu và bàn giao', color: 'text-green-400', bg: 'bg-green-500/10 ring-green-500/20' },
  { value: 'CANCELLED', label: 'Tạm dừng', icon: '⏸', desc: 'Tạm dừng triển khai', color: 'text-amber-400', bg: 'bg-amber-500/10 ring-amber-500/20' },
];

export default function AddProjectModal({ isOpen, onClose, project }: Props) {
  const { mutateAsync: createProject } = useCreateProjectMutation();
  const { mutateAsync: updateProject } = useUpdateProjectMutation();
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [statusTriggerRect, setStatusTriggerRect] = useState<DOMRect | null>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    name: '',
    investor: '',
    totalValue: '',
    status: 'IN_PROGRESS' as ProjectStatus,
    startDate: '',
    endDate: '',
    projectType: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name,
        investor: project.investor || '',
        totalValue: (project.totalValue ?? 0).toString(),
        status: project.status,
        startDate: project.startDate?.split('T')[0] || '',
        endDate: project.endDate?.split('T')[0] || '',
        projectType: project.projectType || '',
      });
    } else {
      setForm({
        name: '',
        investor: '',
        totalValue: '',
        status: 'IN_PROGRESS',
        startDate: '',
        endDate: '',
        projectType: '',
      });
    }
    setShowStatusPicker(false);
  }, [project, isOpen]);

  // PortalOverlay handles click outside natively

  if (!isOpen) return null;

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const selectedStatus = STATUS_OPTS.find(s => s.value === form.status) || STATUS_OPTS[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Vui lòng nhập tên dự án');
    if (!form.investor.trim()) return setError('Vui lòng nhập chủ đầu tư');
    const totalValue = parseFloat(form.totalValue.replace(/,/g, ''));
    if (!form.totalValue || isNaN(totalValue) || totalValue < 0)
      return setError('Vui lòng nhập giá trị hợp đồng hợp lệ');

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        investor: form.investor.trim(),
        totalValue: totalValue,
        status: form.status,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        projectType: form.projectType || undefined,
      };

      if (project) {
        await updateProject({ id: project.id, updates: payload });
      } else {
        await createProject(payload);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Lỗi không xác định');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[800] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg mx-4 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between border-b border-[var(--divider)] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                {project ? <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /> : <path d="M12 5v14M5 12h14" />}
              </svg>
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-[var(--text-primary)] tracking-tight">{project ? 'Cập nhật hồ sơ dự án' : 'Khởi tạo hồ sơ công trình'}</h2>
              <p className="text-[10px] font-medium text-[var(--text-muted)] tracking-wider uppercase opacity-60">{project ? 'Quản lý dữ liệu vận hành' : 'Thiết lập thông tin quản trị cơ bản'}</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--secondary)] hover:text-[var(--text-primary)] transition-colors">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Tên dự án/công trình <span className="text-rose-500">*</span></label>
              <input
                type="text"
                value={form.name}
                onChange={e => handleChange('name', e.target.value)}
                placeholder="VD: Tổ hợp cao ốc văn phòng - Giai đoạn 1"
                className="erp-input w-full"
                autoFocus
              />
            </div>

            <div className="col-span-2">
              <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Chủ đầu tư/Pháp nhân <span className="text-rose-500">*</span></label>
              <input
                type="text"
                value={form.investor}
                onChange={e => handleChange('investor', e.target.value)}
                placeholder="VD: Tổng công ty Đầu tư Phát triển Nhà"
                className="erp-input w-full"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Giá trị HĐ (VND) <span className="text-rose-500">*</span></label>
              <input
                type="text"
                value={form.totalValue}
                onChange={e => handleChange('totalValue', e.target.value)}
                placeholder="VD: 50,000,000,000"
                className="erp-input w-full tabular-nums"
              />
            </div>
            
            <div>
              <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Phân loại công trình</label>
              <input
                type="text"
                value={form.projectType}
                onChange={e => handleChange('projectType', e.target.value)}
                placeholder="VD: Dân dụng/Công nghiệp"
                className="erp-input w-full"
              />
            </div>

            {/* Enterprise Status Selector */}
            <div className="col-span-2" ref={statusRef}>
              <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Trạng thái vận hành</label>
              <button
                type="button"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setStatusTriggerRect(rect);
                  setShowStatusPicker(!showStatusPicker);
                }}
                className={`erp-input w-full flex items-center gap-3 cursor-pointer hover:border-blue-500/30 transition-all text-left ${showStatusPicker ? '!border-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.1)]' : ''}`}
              >
                <span className={`h-6 w-6 flex items-center justify-center rounded-md text-sm ${selectedStatus.bg} ring-1`}>
                  {selectedStatus.icon}
                </span>
                <div className="flex-1">
                  <span className={`text-[12.5px] font-semibold ${selectedStatus.color}`}>{selectedStatus.label}</span>
                  <span className="text-[10px] text-[var(--text-muted)] opacity-50 ml-2">{selectedStatus.desc}</span>
                </div>
                <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 text-[var(--text-muted)] transition-transform duration-200 ${showStatusPicker ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              <PortalOverlay
                isOpen={showStatusPicker}
                onClose={() => setShowStatusPicker(false)}
                triggerRect={statusTriggerRect}
                width={430} // Same approx width as modal column
                zIndex={1000} // var(--z-alerts) to be above modal (z-800)
              >
                <div className="py-1.5">
                  {STATUS_OPTS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        handleChange('status', opt.value);
                        setShowStatusPicker(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-[var(--secondary)]
                        ${form.status === opt.value ? 'bg-blue-500/5' : ''}
                      `}
                    >
                      <span className={`h-8 w-8 flex items-center justify-center rounded-lg text-sm ${opt.bg} ring-1`}>
                        {opt.icon}
                      </span>
                      <div className="flex-1">
                        <div className={`text-[13px] font-semibold ${opt.color}`}>{opt.label}</div>
                        <div className="text-[10px] text-[var(--text-muted)] opacity-60 mt-0.5">{opt.desc}</div>
                      </div>
                      {form.status === opt.value && (
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </PortalOverlay>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Ngày khởi công</label>
              <input
                type="date"
                value={form.startDate}
                onChange={e => handleChange('startDate', e.target.value)}
                className="erp-input w-full"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Dự kiến bàn giao</label>
              <input
                type="date"
                value={form.endDate}
                onChange={e => handleChange('endDate', e.target.value)}
                className="erp-input w-full"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-[10px] font-bold text-rose-500 uppercase tracking-widest">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
              </svg>
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-[var(--divider)] mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-[10px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] uppercase tracking-widest transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-2.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-blue-600/10 hover:bg-blue-500 disabled:opacity-40 transition-all"
            >
              {loading ? (
                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              ) : (
                <span>{project ? 'Lưu thay đổi' : 'Khởi tạo hồ sơ'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
