import { useEffect, useState } from 'react';
import { useERPStore } from '@/store/erpStore';
import { Project, ProjectStatus } from '@/app/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null;
}

const STATUS_OPTS: { value: ProjectStatus; label: string }[] = [
  { value: 'PLANNED', label: 'Lập kế hoạch' },
  { value: 'IN_PROGRESS', label: 'Đang thi công' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'CANCELLED', label: 'Tạm dừng/Hủy' },
];

export default function AddProjectModal({ isOpen, onClose, project }: Props) {
  const addProject = useERPStore(state => state.addProject);
  const updateProject = useERPStore(state => state.updateProject);

  const [form, setForm] = useState({
    name: '',
    investor: '',
    totalValue: '',
    status: 'IN_PROGRESS' as ProjectStatus,
    startDate: '',
    endDate: '',
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
      });
    } else {
      setForm({
        name: '',
        investor: '',
        totalValue: '',
        status: 'IN_PROGRESS',
        startDate: '',
        endDate: '',
      });
    }
  }, [project, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Vui lòng nhập tên dự án');
    if (!form.investor.trim()) return setError('Vui lòng nhập chủ đầu tư');
    const totalValue = parseFloat(form.totalValue.replace(/,/g, ''));
    if (!form.totalValue || isNaN(totalValue) || totalValue < 0)
      return setError('Vui lòng nhập giá trị hợp đồng hợp lệ');

    setLoading(true);
    let res;
    if (project) {
      res = await updateProject(project.id, {
        name: form.name.trim(),
        investor: form.investor.trim(),
        totalValue: totalValue,
        status: form.status,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      });
    } else {
      res = await addProject(
        form.name.trim(),
        form.investor.trim(),
        totalValue,
        form.status,
        form.startDate || undefined,
        form.endDate || undefined
      );
    }
    setLoading(false);

    if (res?.success) {
      onClose();
    } else {
      setError(res?.error || 'Lỗi không xác định');
    }
  };

  return (
    <div className="erp-modal-overlay" onClick={onClose}>
      <div className="erp-modal lg" onClick={e => e.stopPropagation()}>
        <div className="erp-modal-header">
          <h2 className="t-section-title">{project ? 'Cập nhật dự án' : 'Thêm dự án mới'}</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="erp-modal-body space-y-4">
            <div className="erp-form-group">
              <label className="t-label">Tên dự án</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => handleChange('name', e.target.value)}
                placeholder="VD: Cao ốc văn phòng ABC Tower"
                className="erp-input"
                autoFocus
              />
            </div>

            <div className="erp-form-group">
              <label className="t-label">Chủ đầu tư</label>
              <input
                type="text"
                required
                value={form.investor}
                onChange={e => handleChange('investor', e.target.value)}
                placeholder="VD: Công ty TNHH ABC"
                className="erp-input"
              />
            </div>

            <div className="erp-form-group">
              <label className="t-label">Giá trị hợp đồng (VND)</label>
              <input
                type="text"
                required
                value={form.totalValue}
                onChange={e => handleChange('totalValue', e.target.value)}
                placeholder="VD: 50000000000"
                className="erp-input"
              />
            </div>

            <div className="erp-form-group">
              <label className="t-label">Trạng thái</label>
              <select
                value={form.status}
                onChange={e => handleChange('status', e.target.value)}
                className="erp-select"
              >
                {STATUS_OPTS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="erp-form-group">
                <label className="t-label">Ngày bắt đầu</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={e => handleChange('startDate', e.target.value)}
                  className="erp-input"
                />
              </div>
              <div className="erp-form-group">
                <label className="t-label">Ngày kết thúc</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={e => handleChange('endDate', e.target.value)}
                  className="erp-input"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--danger-light)] bg-[var(--danger-light)]/50 px-3 py-2 text-sm text-[var(--danger)]">
                <svg viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                </svg>
                {error}
              </div>
            )}
          </div>

          <div className="erp-modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              )}
              {project ? 'Cập nhật' : 'Tạo dự án'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
