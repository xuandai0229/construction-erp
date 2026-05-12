'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useERPStore } from '@/store/erpStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useERPStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Mock login delay
    await new Promise(r => setTimeout(r, 1000));

    const success = await login(email, password);
    if (success) {
      router.push('/');
    } else {
      setError('Email hoặc mật khẩu không đúng. Vui lòng thử lại.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-10 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-600/10 text-blue-400 shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)]">
            <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 21V8l5-3 5 3v13M14 21V11l6 3v7M7 11h2M7 15h2" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Construction ERP</h1>
          <p className="mt-2 text-sm font-medium text-slate-500 uppercase tracking-widest">Enterprise Operating System</p>
        </div>

        <div className="rounded-2xl border border-slate-800/50 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-xl inner-border">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="erp-label">Email / Tên đăng nhập</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                  </svg>
                </div>
                <input
                  type="text"
                  required
                  className="erp-input pl-11"
                  placeholder="admin@construction.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="erp-label">Mật khẩu</label>
                <button type="button" className="text-[11px] font-bold text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-wider">Quên mật khẩu?</button>
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 11V7a4 4 0 0 1 8 0v4M8 11h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z" />
                  </svg>
                </div>
                <input
                  type="password"
                  required
                  className="erp-input pl-11"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="remember" className="h-4 w-4 rounded border-slate-800 bg-slate-950 accent-blue-600" />
              <label htmlFor="remember" className="text-xs font-semibold text-slate-400 select-none">Ghi nhớ đăng nhập</label>
            </div>

            {error && (
              <div className="rounded-lg bg-rose-500/10 p-3 text-xs font-bold text-rose-400 border border-rose-500/20 animate-shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  Đăng nhập vào hệ thống
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-xs font-medium text-slate-500">
          © 2024 CONSTRUCTION ERP PRO EDITION • v2.4.0
        </p>
      </div>
    </div>
  );
}
