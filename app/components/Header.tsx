'use client';

import { useState } from 'react';
import { useERPStore } from '@/store/erpStore';
import { DashboardData, formatVnd } from './dashboard-data';
import { ProjectStatus } from '@prisma/client';
import AddCostModal from '@/app/components/modals/AddCostModal';
import AddBudgetModal from '@/app/components/modals/AddBudgetModal';
import AddRevenueModal from '@/app/components/modals/AddRevenueModal';
import AddInvoiceModal from '@/app/components/modals/AddInvoiceModal';
import AddTaskModal from '@/app/components/modals/AddTaskModal';

const STATUS_CONFIG: Record<ProjectStatus, { label: string; badge: string }> = {
  [ProjectStatus.PLANNED]:     { label: 'Planned',   badge: 'badge-info'    },
  [ProjectStatus.ACTIVE]:      { label: 'Active', badge: 'badge-success' },
  [ProjectStatus.IN_PROGRESS]: { label: 'In Progress', badge: 'badge-success' },
  [ProjectStatus.COMPLETED]:   { label: 'Completed', badge: 'badge-info'    },
  [ProjectStatus.CLOSED]:      { label: 'Closed', badge: 'badge-muted'   },
  [ProjectStatus.CANCELLED]:   { label: 'Cancelled',  badge: 'badge-warning' },
};

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

  const projects          = useERPStore((s) => s.projects);
  const currentProjectId  = useERPStore((s) => s.currentProjectId);
  const setCurrentProject = useERPStore((s) => s.setCurrentProject);
  const userRole          = useERPStore((s) => s.userRole);
  const getDashboardData  = useERPStore((s) => s.getDashboardData);

  const data = propData ?? getDashboardData();
  const statusCfg = STATUS_CONFIG[data?.project?.status as ProjectStatus] ?? { label: '—', badge: 'badge-muted' };

  return (
    <>
      <AddCostModal    isOpen={showCost}    onClose={() => setShowCost(false)}    />
      <AddBudgetModal  isOpen={showBudget}  onClose={() => setShowBudget(false)}  />
      <AddRevenueModal isOpen={showRevenue} onClose={() => setShowRevenue(false)} />
      <AddInvoiceModal isOpen={showInvoice} onClose={() => setShowInvoice(false)} />
      <AddTaskModal    isOpen={showTask}    onClose={() => setShowTask(false)}     />

      <header className="erp-topbar" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--sp-24)',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        height: 'var(--header-height)',
        gap: 'var(--sp-16)',
      }}>
        {/* Left Section: Breadcrumb & Title & Project Selector */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          minWidth: 0,
          gap: 'var(--sp-24)',
          flex: 1,
        }}>
          <h1 style={{
            fontSize: '20px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            margin: 0,
          }}>{title ?? 'Dashboard'}</h1>
          
          {/* Project Selector - Compact ERP Style */}
          {projects.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--sp-12)',
              minWidth: 0,
            }}>
              <div style={{ position: 'relative' }}>
                <select
                  value={currentProjectId}
                  onChange={(e) => setCurrentProject(e.target.value)}
                  style={{
                    height: '36px',
                    maxWidth: '280px',
                    paddingLeft: 'var(--sp-12)',
                    paddingRight: '36px',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-surface)',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'all 0.15s ease',
                    appearance: 'none',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--brand)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <div style={{
                  pointerEvents: 'none',
                  position: 'absolute',
                  right: 'var(--sp-12)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  color: 'var(--text-muted)',
                }}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </div>

              <span className={`badge ${statusCfg.badge}`} style={{
                display: 'inline-flex',
                whiteSpace: 'nowrap',
              }}>
                {statusCfg.label}
              </span>
            </div>
          )}
        </div>

        {/* Right Section: Date, Divider, User Info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--sp-16)',
        }}>
          {/* Date Selector */}
          <div style={{
            display: 'none',
            '@media (min-width: 768px)': { display: 'flex' },
            alignItems: 'center',
            height: '36px',
            paddingLeft: 'var(--sp-12)',
            paddingRight: 'var(--sp-12)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            background: 'var(--bg-surface)',
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            gap: 'var(--sp-8)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-subtle)';
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-mid)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-surface)';
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
          }}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Today</span>
          </div>

          {/* Divider */}
          <div style={{
            width: '1px',
            height: '24px',
            background: 'var(--border)',
          }}></div>

          {/* User Info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--sp-12)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--brand)',
              color: 'white',
              fontWeight: 700,
              fontSize: '12px',
              boxShadow: 'var(--shadow-sm)',
              flexShrink: 0,
            }}>
              AD
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              minWidth: 0,
            }}>
              <span style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                lineHeight: 1.2,
              }}>admin</span>
              <span style={{
                fontSize: '11px',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.025em',
              }}>Admin</span>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
