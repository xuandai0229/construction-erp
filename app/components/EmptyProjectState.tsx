'use client';

import { useRouter } from 'next/navigation';

export interface EmptyProjectStateProps {
  reason?: 'no-projects' | 'no-current-project' | 'loading';
  onCreateProject?: () => void;
}

export default function EmptyProjectState({ 
  reason = 'no-projects',
  onCreateProject 
}: EmptyProjectStateProps) {
  const router = useRouter();

  const handleCreateProject = () => {
    if (onCreateProject) {
      onCreateProject();
    } else {
      router.push('/projects');
    }
  };

  const content = {
    'no-projects': {
      icon: 'M4 21V8l5-3 5 3v13M14 21V11l6 3v7M7 11h2M7 15h2',
      title: 'Chưa có dự án nào',
      description: 'Hãy khởi tạo dự án đầu tiên để bắt đầu quản lý chi phí & tiến độ.',
      buttonText: 'Tạo hồ sơ dự án',
      buttonColor: 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)]'
    },
    'no-current-project': {
      icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      title: 'Không có dự án được chọn',
      description: 'Vui lòng chọn hoặc tạo dự án để xem chi tiết.',
      buttonText: 'Quay lại Dự án',
      buttonColor: 'bg-slate-600 hover:bg-slate-500'
    },
    'loading': {
      icon: '',
      title: 'Đang tải dữ liệu...',
      description: 'Vui lòng chờ trong giây lát.',
      buttonText: '',
      buttonColor: ''
    }
  };

  const state = content[reason] || content['no-projects'];

  if (reason === 'loading') {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="mb-6 mx-auto h-16 w-16 rounded-full bg-[var(--secondary)] grid place-items-center border border-[var(--border)] shadow-2xl animate-pulse">
            <div className="h-8 w-8 rounded-full border-4 border-[var(--border)] border-t-blue-500 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">{state.title}</h2>
          <p className="text-sm text-[var(--text-muted)]">{state.description}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <div className="mb-6 mx-auto h-24 w-24 rounded-full bg-[var(--secondary)] grid place-items-center border border-[var(--border)] shadow-2xl">
          <svg viewBox="0 0 24 24" className="h-10 w-10 text-[var(--text-muted)]" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d={state.icon} />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2 text-center">{state.title}</h2>
        <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest mb-8 leading-relaxed text-center">
          {state.description}
        </p>
        
        {state.buttonText && (
          <button
            onClick={handleCreateProject}
            className={`w-full erp-btn ${state.buttonColor} text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300`}
          >
            {state.buttonText}
          </button>
        )}
      </div>
    </div>
  );
}
