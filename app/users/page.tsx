'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { useERPStore } from '@/store/erpStore';
import { UserRole } from '@/app/types';
import { format } from 'date-fns';

interface ERPUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

const ROLE_OPTIONS: UserRole[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'GROUP_DIRECTOR',
  'BRANCH_DIRECTOR',
  'CFO',
  'MANAGER',
  'ACCOUNTANT',
  'VIEWER'
];

export default function UsersPage() {
  const user = useERPStore(state => state.user);
  const userRole = useERPStore(state => state.userRole);
  const sidebarCollapsed = useERPStore(state => state.sidebarCollapsed);
  
  const [users, setUsers] = useState<ERPUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingUser, setIsAddingUser] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', {
        headers: { 'x-user-id': user?.email || 'anonymous' }
      });
      const data = await res.json();
      if (!data.error) setUsers(data);
    } catch (e) {
      console.error('Failed to fetch users', e);
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (targetUserId: string, newRole: UserRole) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.email || 'anonymous' 
        },
        body: JSON.stringify({ id: targetUserId, role: newRole })
      });
      if (res.ok) {
        alert('Cập nhật quyền thành công!');
        fetchUsers();
      }
    } catch (e) {
      alert('Lỗi cập nhật');
    }
  };

  if (userRole !== 'SUPER_ADMIN') {
    return (
      <div className="erp-page">
        <Sidebar activeItem="users" />
        <main className="erp-page-main flex items-center justify-center" style={{ marginLeft: sidebarCollapsed ? 'var(--erp-sidebar-collapsed)' : 'var(--erp-sidebar-width)' }}>
          <div className="text-center space-y-4">
             <div className="h-20 w-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg viewBox="0 0 24 24" className="h-10 w-10 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 15v2m0-8v4m-9 4h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" /></svg>
             </div>
             <h1 className="text-2xl font-black text-white">Truy cập bị từ chối</h1>
             <p className="text-slate-400 font-medium">Chỉ <span className="text-blue-400">SUPER_ADMIN</span> mới có quyền quản trị nhân sự cấp cao.</p>
             <div className="pt-6">
               <button onClick={() => window.location.href = '/'} className="erp-btn bg-slate-800 text-white hover:bg-slate-700">Quay lại Trang chủ</button>
             </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="erp-page">
      <Sidebar activeItem="users" />
      <main 
        className="erp-page-main" 
        style={{ marginLeft: sidebarCollapsed ? 'var(--erp-sidebar-collapsed)' : 'var(--erp-sidebar-width)' }}
      >
        <Header />
        <div className="p-6 md:p-8 space-y-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="accent-line">
              <h1 className="erp-section-title text-2xl font-black tracking-tight">Quản lý nhân sự</h1>
              <p className="erp-section-subtitle text-slate-400">Danh sách tài khoản hệ thống và phân quyền tập trung</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <section className="card-elevation overflow-hidden border border-slate-800/50 bg-slate-900/20 backdrop-blur-md rounded-2xl">
              {loading ? (
                <div className="h-64 flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-[11px]">Đang tải dữ liệu...</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-800/30">
                      <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Nhân viên</th>
                      <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Vai trò (Phân quyền)</th>
                      <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Trạng thái</th>
                      <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Ngày gia nhập</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/20 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-black text-xs text-white shadow-lg">
                              {(u.name || u.email).substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-[13.5px] font-bold text-white">{u.name || 'N/A'}</div>
                              <div className="text-[11px] text-slate-500 font-medium">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select 
                            value={u.role}
                            onChange={(e) => updateRole(u.id, e.target.value as UserRole)}
                            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-[10px] font-black text-blue-400 uppercase tracking-wider focus:outline-none focus:ring-2 ring-blue-500/50 cursor-pointer"
                          >
                            {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${u.status === 'ACTIVE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-slate-500'}`} />
                            <span className={`text-[11px] font-bold ${u.status === 'ACTIVE' ? 'text-emerald-400' : 'text-slate-500'}`}>
                              {u.status === 'ACTIVE' ? 'ĐANG HOẠT ĐỘNG' : 'BỊ KHÓA'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">
                            {format(new Date(u.createdAt), 'dd/MM/yyyy')}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
