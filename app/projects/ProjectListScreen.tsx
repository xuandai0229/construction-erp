'use client';

import { useEffect, useState, useMemo } from 'react';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { Project, ProjectStatus } from '@/app/types';
import { useERPStore } from '@/store/erpStore';
import AddProjectModal from '@/app/components/modals/AddProjectModal';
import { formatVnd, formatDate } from '@/app/components/dashboard-data';

const STATUS_CONFIG: Record<string, { label: string; badge: string; color: string }> = {
  'PLANNED':     { label: 'Planned',   badge: 'badge-info',    color: '#3B82F6' },
  'ACTIVE':      { label: 'Active',   badge: 'badge-success', color: '#22C55E' },
  'IN_PROGRESS': { label: 'Active',   badge: 'badge-success', color: '#22C55E' },
  'COMPLETED':   { label: 'Completed', badge: 'badge-info',    color: '#3B82F6' },
  'CLOSED':      { label: 'Closed',    badge: 'badge-muted',   color: '#9CA3AF' },
  'CANCELLED':   { label: 'Cancelled',   badge: 'badge-warning', color: '#F59E0B' },
};

export default function ProjectListScreen() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const rawProjects = useERPStore(state => state.projects);
  const init = useERPStore(state => state.init);
  const isInitialized = useERPStore(state => state.initialized);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isAddingProject, setIsAddingProject] = useState(false);

  useEffect(() => { init(); }, [init]);

  const projects = useMemo(() => {
    if (!filterStatus) return rawProjects;
    return rawProjects.filter(p => p.status === filterStatus);
  }, [rawProjects, filterStatus]);

  if (!isInitialized) {
    return (
      <div className="erp-shell">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className={`erp-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <Header title="Projects" />
          <main className="erp-content">
            <div style={{
              height: '200px',
              backgroundColor: 'var(--bg-muted)',
              borderRadius: 'var(--radius)',
              animation: 'skeleton-pulse 1.5s infinite',
            }} />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="erp-shell">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className={`erp-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header title="Projects" />
        
        <main className="erp-content" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-24)' }}>
          
          {/* KPI Row */}
          <div className="kpi-row">
            <div className="kpi-card">
              <div className="kpi-label">Total Projects</div>
              <div className="kpi-value">{rawProjects.length}</div>
              <div className="kpi-meta">All statuses</div>
            </div>
            <div className="kpi-card success">
              <div className="kpi-label">Active</div>
              <div className="kpi-value">{rawProjects.filter(p => p.status === 'ACTIVE' || p.status === 'IN_PROGRESS').length}</div>
              <div className="kpi-meta">Currently executing</div>
            </div>
            <div className="kpi-card critical">
              <div className="kpi-label">Contracted Value</div>
              <div className="kpi-value">{formatVnd(rawProjects.reduce((sum, p) => sum + (p.totalValue || 0), 0) / 1000000000)}</div>
              <div className="kpi-meta">In billions</div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="filter-bar">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--sp-8)',
            }}>
              <span style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
              }}>Filter by Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  height: '36px',
                  paddingLeft: 'var(--sp-12)',
                  paddingRight: '32px',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  background: 'white',
                  fontSize: '13px',
                  cursor: 'pointer',
                  appearance: 'none',
                  outline: 'none',
                }}
              >
                <option value="">All</option>
                <option value="PLANNED">Planned</option>
                <option value="ACTIVE">Active</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CLOSED">Closed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <button
              onClick={() => setIsAddingProject(true)}
              style={{
                marginLeft: 'auto',
                height: '36px',
                padding: '0 var(--sp-16)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--sp-8)',
                borderRadius: 'var(--radius)',
                border: 'none',
                background: 'var(--brand)',
                color: 'white',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              New Project
            </button>
          </div>

          {/* Projects Table */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{
              overflowX: 'auto',
            }}>
              <table className="erp-table zebra" style={{
                width: '100%',
                borderCollapse: 'collapse',
              }}>
                <thead>
                  <tr>
                    <th style={{
                      height: '44px',
                      padding: '0 var(--sp-12)',
                      backgroundColor: 'var(--bg-subtle)',
                      borderBottom: '1px solid var(--border)',
                      fontSize: '12px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      textAlign: 'left',
                      color: 'var(--text-secondary)',
                      letterSpacing: '0.05em',
                    }}>Project Name</th>
                    <th style={{
                      height: '44px',
                      padding: '0 var(--sp-12)',
                      backgroundColor: 'var(--bg-subtle)',
                      borderBottom: '1px solid var(--border)',
                      fontSize: '12px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      textAlign: 'left',
                      color: 'var(--text-secondary)',
                      letterSpacing: '0.05em',
                    }}>Owner</th>
                    <th style={{
                      height: '44px',
                      padding: '0 var(--sp-12)',
                      backgroundColor: 'var(--bg-subtle)',
                      borderBottom: '1px solid var(--border)',
                      fontSize: '12px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      textAlign: 'right',
                      color: 'var(--text-secondary)',
                      letterSpacing: '0.05em',
                      width: '140px',
                    }}>Contract Value</th>
                    <th style={{
                      height: '44px',
                      padding: '0 var(--sp-12)',
                      backgroundColor: 'var(--bg-subtle)',
                      borderBottom: '1px solid var(--border)',
                      fontSize: '12px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      textAlign: 'left',
                      color: 'var(--text-secondary)',
                      letterSpacing: '0.05em',
                    }}>Start Date</th>
                    <th style={{
                      height: '44px',
                      padding: '0 var(--sp-12)',
                      backgroundColor: 'var(--bg-subtle)',
                      borderBottom: '1px solid var(--border)',
                      fontSize: '12px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      textAlign: 'left',
                      color: 'var(--text-secondary)',
                      letterSpacing: '0.05em',
                    }}>End Date</th>
                    <th style={{
                      height: '44px',
                      padding: '0 var(--sp-12)',
                      backgroundColor: 'var(--bg-subtle)',
                      borderBottom: '1px solid var(--border)',
                      fontSize: '12px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      textAlign: 'left',
                      color: 'var(--text-secondary)',
                      letterSpacing: '0.05em',
                      width: '100px',
                    }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => {
                    const cfg = STATUS_CONFIG[project.status] || { label: project.status, badge: 'badge-muted', color: '#9CA3AF' };
                    return (
                      <tr key={project.id} style={{ cursor: 'pointer' }}>
                        <td style={{
                          height: '44px',
                          padding: '8px var(--sp-12)',
                          borderBottom: '1px solid var(--border)',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          verticalAlign: 'middle',
                        }}>{project.name}</td>
                        <td style={{
                          height: '44px',
                          padding: '8px var(--sp-12)',
                          borderBottom: '1px solid var(--border)',
                          fontSize: '13px',
                          color: 'var(--text-secondary)',
                          verticalAlign: 'middle',
                        }}>{project.investor || '—'}</td>
                        <td style={{
                          height: '44px',
                          padding: '8px var(--sp-12)',
                          borderBottom: '1px solid var(--border)',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          textAlign: 'right',
                          verticalAlign: 'middle',
                          whiteSpace: 'nowrap',
                        }} className="text-money">
                          {formatVnd(project.totalValue || project.contractValue || 0)}
                        </td>
                        <td style={{
                          height: '44px',
                          padding: '8px var(--sp-12)',
                          borderBottom: '1px solid var(--border)',
                          fontSize: '13px',
                          color: 'var(--text-secondary)',
                          verticalAlign: 'middle',
                        }}>{formatDate(project.startDate)}</td>
                        <td style={{
                          height: '44px',
                          padding: '8px var(--sp-12)',
                          borderBottom: '1px solid var(--border)',
                          fontSize: '13px',
                          color: 'var(--text-secondary)',
                          verticalAlign: 'middle',
                        }}>{formatDate(project.endDate)}</td>
                        <td style={{
                          height: '44px',
                          padding: '8px var(--sp-12)',
                          borderBottom: '1px solid var(--border)',
                          verticalAlign: 'middle',
                        }}>
                          <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: 'var(--sp-16)',
            textAlign: 'center',
            fontSize: '12px',
            color: 'var(--text-muted)',
          }}>
            Showing {projects.length} of {rawProjects.length} projects
          </div>
        </main>
      </div>

      <AddProjectModal
        isOpen={isAddingProject}
        onClose={() => setIsAddingProject(false)}
        project={editingProject}
      />
    </div>
  );
}
                            <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400 hover:text-blue-600" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {projects.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-20 text-slate-400">Chưa có dự án nào</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
      
      <AddProjectModal 
        isOpen={isAddingProject || !!editingProject} 
        onClose={() => { setIsAddingProject(false); setEditingProject(null); }} 
        project={editingProject} 
      />
    </div>
  );
}
