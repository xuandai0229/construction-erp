'use client';

import { useState } from 'react';
import { useERPStore } from '@/store/erpStore';
import { DashboardData } from './dashboard-data';
import { ProjectStatus } from '@prisma/client';
import AddCostModal from '@/app/components/modals/AddCostModal';
import AddBudgetModal from '@/app/components/modals/AddBudgetModal';
import AddRevenueModal from '@/app/components/modals/AddRevenueModal';
import AddInvoiceModal from '@/app/components/modals/AddInvoiceModal';
import AddTaskModal from '@/app/components/modals/AddTaskModal';

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  [ProjectStatus.PLANNED]:     { label: 'Kế hoạch',      color: '#2563EB', bg: 'rgba(37,99,235,0.08)'  },
  [ProjectStatus.ACTIVE]:      { label: 'Đang thi công', color: '#16A34A', bg: 'rgba(22,163,74,0.08)'   },
  [ProjectStatus.IN_PROGRESS]: { label: 'Đang thi công', color: '#16A34A', bg: 'rgba(22,163,74,0.08)'   },
  [ProjectStatus.COMPLETED]:   { label: 'Hoàn thành',    color: '#0891B2', bg: 'rgba(8,145,178,0.08)'   },
  [ProjectStatus.CLOSED]:      { label: 'Đã quyết toán', color: '#64748B', bg: 'rgba(100,116,139,0.08)' },
  [ProjectStatus.CANCELLED]:   { label: 'Tạm dừng',      color: '#D97706', bg: 'rgba(217,119,6,0.08)'   },
};

const QUICK_ACTIONS = [
  { label: 'Chi phí', key: 'cost' },
  { label: 'Doanh thu', key: 'revenue' },
  { label: 'Hóa đơn', key: 'invoice' },
];

export default function Header({
  data: propData,
  title,
}: {
  data?: DashboardData;
  title?: string;
}) {
  const [showCost,    setShowCost]    = useState(false);
  const [showBudget,  setShowBudget]  = useState(false);
  const [showRevenue, setShowRevenue] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showTask,    setShowTask]    = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showNotif,   setShowNotif]   = useState(false);

  const projects          = useERPStore((s) => s.projects);
  const currentProjectId  = useERPStore((s) => s.currentProjectId);
  const setCurrentProject = useERPStore((s) => s.setCurrentProject);
  const getDashboardData  = useERPStore((s) => s.getDashboardData);

  const data      = propData ?? getDashboardData();
  const statusCfg = STATUS_CONFIG[data?.project?.status as ProjectStatus] ?? { label: '—', color: '#64748B', bg: '#F1F5F9' };

  const handleQuickAction = (key: string) => {
    setShowActions(false);
    if (key === 'cost')    setShowCost(true);
    if (key === 'revenue') setShowRevenue(true);
    if (key === 'invoice') setShowInvoice(true);
  };

  const today = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <>
      <AddCostModal    isOpen={showCost}    onClose={() => setShowCost(false)}    />
      <AddBudgetModal  isOpen={showBudget}  onClose={() => setShowBudget(false)}  />
      <AddRevenueModal isOpen={showRevenue} onClose={() => setShowRevenue(false)} />
      <AddInvoiceModal isOpen={showInvoice} onClose={() => setShowInvoice(false)} />
      <AddTaskModal    isOpen={showTask}    onClose={() => setShowTask(false)}     />

      <header className="erp-topbar" style={{ height: '64px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        {/* Left: Title + Project Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', minWidth: 0, flex: 1 }}>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.02em',
            }}
          >
            {title ?? 'Tổng quan'}
          </h1>

          {/* Project Context */}
          {projects.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <select
                  value={currentProjectId}
                  onChange={(e) => setCurrentProject(e.target.value)}
                  style={{
                    height: '36px',
                    minWidth: '200px',
                    padding: '0 32px 0 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: '#F8FAFC',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    outline: 'none',
                    cursor: 'pointer',
                    appearance: 'none',
                  }}
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <svg viewBox="0 0 24 24" style={{ position: 'absolute', right: '10px', height: '14px', width: '14px', color: 'var(--text-muted)', pointerEvents: 'none' }} fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>

              <span className="badge badge-success" style={{ height: '24px', display: 'flex', alignItems: 'center' }}>
                {statusCfg.label}
              </span>
            </div>
          )}
        </div>

        {/* Right: Date, Actions, Notifications, User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Date */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              height: '34px',
              padding: '0 12px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'white',
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              cursor: 'default',
            }}
          >
            <svg viewBox="0 0 24 24" style={{ height: '13px', width: '13px' }} fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {today}
          </div>

          {/* Quick Add Button */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowActions(!showActions)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                height: '34px',
                padding: '0 12px',
                borderRadius: '6px',
                border: 'none',
                background: 'var(--brand)',
                color: 'white',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <svg viewBox="0 0 24 24" style={{ height: '14px', width: '14px' }} fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Thêm mới
              <svg viewBox="0 0 24 24" style={{ height: '12px', width: '12px' }} fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {showActions && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowActions(false)} />
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 4px)',
                    zIndex: 50,
                    background: 'white',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                    minWidth: '160px',
                    padding: '4px',
                  }}
                >
                  {QUICK_ACTIONS.map((a) => (
                    <button
                      key={a.key}
                      onClick={() => handleQuickAction(a.key)}
                      style={{
                        display: 'flex',
                        width: '100%',
                        alignItems: 'center',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'transparent',
                        fontSize: '13px',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        gap: '8px',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-muted)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      + {a.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Notifications */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotif(!showNotif)}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '34px',
                width: '34px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'white',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
              }}
            >
              <svg viewBox="0 0 24 24" style={{ height: '16px', width: '16px' }} fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: 'var(--danger)',
                  border: '1.5px solid white',
                }}
              />
            </button>
            {showNotif && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowNotif(false)} />
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 4px)',
                    zIndex: 50,
                    background: 'white',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                    width: '280px',
                    padding: '0',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Thông báo hệ thống
                  </div>
                  <div style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '8px', textAlign: 'center' }}>
                      Không có thông báo mới
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Divider */}
          <div style={{ width: '1px', height: '24px', background: 'var(--border)' }} />

          {/* User Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                height: '34px',
                width: '34px',
                borderRadius: '50%',
                background: 'var(--brand)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              AD
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>Admin</span>
              <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Quản trị viên</span>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
