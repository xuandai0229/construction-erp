'use client';

import { useState } from 'react';

export default function Sidebar() {
  const [active, setActive] = useState('du-an');

  const menuItems = [
    { id: 'tong-quan', label: 'Tổng quan', icon: '📊', href: '#' },
    { id: 'du-an', label: 'Dự án', icon: '🏗️', href: '#' },
    { id: 'hang-muc', label: 'Hạng mục công trình (WBS)', icon: '📋', href: '#' },
    { id: 'du-toan', label: 'Dự toán', icon: '💰', href: '#' },
    { id: 'chi-phi', label: 'Chi phí', icon: '💸', href: '#' },
    { id: 'cong-nhan', label: 'Công nhân', icon: '👷', href: '#' },
    { id: 'cai-dat-he-thong', label: 'Cài đặt hệ thống', icon: '⚙️', href: '#' },
    { id: 'bao-cao', label: 'Báo cáo', icon: '📈', href: '#' },
    { id: 'danh-muc', label: 'Danh mục', icon: '📑', href: '#' },
  ];

  return (
    <div className="w-56 bg-[#1e293b] border-r border-[#334155] h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-[#334155]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-lg">🏢</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-sm">Construction ERP</h1>
            <p className="text-[#64748b] text-xs">Quản lý dự án xây dựng</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3 text-sm font-medium ${
              active === item.id
                ? 'bg-blue-600 text-white'
                : 'text-[#cbd5e1] hover:bg-[#334155] hover:text-[#e2e8f0]'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#334155]">
        <button className="w-full px-4 py-2 text-left text-[#64748b] hover:text-[#e2e8f0] text-sm transition-colors">
          👤 Đăng xuất
        </button>
      </div>
    </div>
  );
}
