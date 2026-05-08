'use client';

import { useState, useEffect } from 'react';
import { useERPStore } from '@/store/erpStore';
import Sidebar from './Sidebar';
import Header from './Header';
import { formatVnd, formatDate, DashboardData } from './dashboard-data';

export default function Dashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const init = useERPStore((s) => s.init);
  const getDashboard = useERPStore((s) => s.getDashboardData);
  const projects = useERPStore((s) => s.projects);
  const isInitialized = useERPStore((s) => s.initialized);

  useEffect(() => { init(); }, [init]);

  const data = getDashboard();

  if (!isInitialized) {
    return (
      <div className="erp-shell">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className={`erp-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <Header />
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

  if (projects.length === 0) {
    return (
      <div className="erp-shell">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className={`erp-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <Header />
          <main className="erp-content">
            <div style={{
              textAlign: 'center',
              padding: 'var(--sp-32)',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
            }}>
              <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1" style={{
                color: 'var(--text-muted)',
                margin: '0 auto var(--sp-16)',
              }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: '0 0 8px',
              }}>No Projects Found</h2>
              <p style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                margin: 0,
              }}>Create a new project to get started</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="erp-shell">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className={`erp-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header data={data} title="Dashboard" />
        
        <main className="erp-content" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-24)' }}>
          
          {/* ── 1. PROJECT HERO SECTION ── */}
          <section style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: 'var(--sp-24)',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: 'var(--sp-24)',
              alignItems: 'start',
            }}>
              {/* Project Image */}
              <div style={{
                width: '240px',
                height: '160px',
                background: 'var(--bg-muted)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                overflow: 'hidden',
                flexShrink: 0,
              }}>
                <img 
                  src="/modern_construction_project_1778222474187.png" 
                  alt="Project" 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </div>

              {/* Project Details */}
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--sp-16)',
                  marginBottom: 'var(--sp-16)',
                }}>
                  <h1 style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    margin: 0,
                  }}>{data.project?.name}</h1>
                  <span className="badge badge-success" style={{ whiteSpace: 'nowrap' }}>
                    Active
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: 'var(--sp-24)',
                  marginBottom: 'var(--sp-20)',
                }}>
                  <div>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      letterSpacing: '0.05em',
                      marginBottom: 'var(--sp-4)',
                    }}>Owner</div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}>{data.project?.investor || 'Company ABC'}</div>
                  </div>
                  <div>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      letterSpacing: '0.05em',
                      marginBottom: 'var(--sp-4)',
                    }}>Contract Value</div>
                    <div className="text-money" style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      color: 'var(--brand)',
                    }}>{formatVnd(data.project?.totalValue || 0)}</div>
                  </div>
                  <div>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      letterSpacing: '0.05em',
                      marginBottom: 'var(--sp-4)',
                    }}>Duration</div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                    }}>{formatDate(data.project?.startDate)} — {formatDate(data.project?.endDate)}</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: 'var(--sp-8)',
                  }}>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      letterSpacing: '0.05em',
                    }}>Overall Progress</span>
                    <span style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      color: 'var(--brand)',
                    }}>{data.progress}%</span>
                  </div>
                  <div style={{
                    height: '6px',
                    background: 'var(--bg-muted)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}>
                    <div
                      style={{
                        height: '100%',
                        background: 'var(--success)',
                        width: `${data.progress}%`,
                        transition: 'width 0.6s ease',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── 2. FINANCIAL KPI ROW ── */}
          <div className="kpi-row">
            <div className="kpi-card">
              <div className="kpi-label">Total Revenue</div>
              <div className="kpi-value">{formatVnd(data.totalRevenue || 0)}</div>
              <div className="kpi-meta">↑ 12.5% vs last month</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Total Costs</div>
              <div className="kpi-value">{formatVnd(data.totalCosts || 0)}</div>
              <div className="kpi-meta">↓ 3.2% vs budget</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Gross Margin</div>
              <div className="kpi-value" style={{
                color: (data.totalRevenue || 0) - (data.totalCosts || 0) > 0 ? 'var(--success)' : 'var(--danger)',
              }}>
                {(((data.totalRevenue || 0) - (data.totalCosts || 0)) / (data.totalRevenue || 1) * 100).toFixed(1)}%
              </div>
              <div className="kpi-meta">Gross profit calculation</div>
            </div>
            <div className="kpi-card critical">
              <div className="kpi-label">Outstanding AR</div>
              <div className="kpi-value">{formatVnd(data.receivable || 0)}</div>
              <div className="kpi-meta">42 days overdue</div>
            </div>
          </div>

          {/* ── 3. CASH FLOW & BUDGET PANELS ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--sp-24)',
          }}>
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: 'var(--sp-16)',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: '0 0 var(--sp-16)',
                textTransform: 'uppercase',
              }}>Cashflow Status</h3>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--sp-12) 0',
                borderBottom: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Available</span>
                <span className="text-money" style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--success)',
                }}>{formatVnd(data.availableCash || 0)}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--sp-12) 0',
                borderBottom: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Committed</span>
                <span className="text-money" style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--warning)',
                }}>{formatVnd(data.committedCash || 0)}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--sp-12) 0',
              }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total</span>
                <span className="text-money" style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}>{formatVnd((data.availableCash || 0) + (data.committedCash || 0))}</span>
              </div>
            </div>

            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: 'var(--sp-16)',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: '0 0 var(--sp-16)',
                textTransform: 'uppercase',
              }}>Budget Health</h3>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--sp-12) 0',
                borderBottom: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Planned</span>
                <span className="text-money" style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}>{formatVnd(data.totalBudget || 0)}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--sp-12) 0',
                borderBottom: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Spent</span>
                <span className="text-money" style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}>{formatVnd(data.totalCosts || 0)}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--sp-12) 0',
              }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Remaining</span>
                <span className="text-money" style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: (data.totalBudget || 0) - (data.totalCosts || 0) > 0 ? 'var(--success)' : 'var(--danger)',
                }}>{formatVnd((data.totalBudget || 0) - (data.totalCosts || 0))}</span>
              </div>
            </div>

            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: 'var(--sp-16)',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: '0 0 var(--sp-16)',
                textTransform: 'uppercase',
              }}>Debt Summary</h3>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--sp-12) 0',
                borderBottom: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Payables (AP)</span>
                <span className="text-money" style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--danger)',
                }}>{formatVnd(data.payable || 0)}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--sp-12) 0',
                borderBottom: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Receivables (AR)</span>
                <span className="text-money" style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--warning)',
                }}>{formatVnd(data.receivable || 0)}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--sp-12) 0',
              }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Net Position</span>
                <span className="text-money" style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: (data.receivable || 0) - (data.payable || 0) > 0 ? 'var(--success)' : 'var(--danger)',
                }}>{formatVnd((data.receivable || 0) - (data.payable || 0))}</span>
              </div>
            </div>
          </div>

          {/* ── 4. RECENT TRANSACTIONS TABLE ── */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{
              padding: 'var(--sp-16)',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-subtle)',
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: 0,
                textTransform: 'uppercase',
              }}>Recent Costs (Last 10)</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
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
                    }}>Description</th>
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
                    }}>Type</th>
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
                      width: '150px',
                    }}>Amount</th>
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
                      width: '120px',
                    }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.costs || []).slice(0, 10).map((cost, i) => (
                    <tr key={i}>
                      <td style={{
                        height: '44px',
                        padding: '8px var(--sp-12)',
                        borderBottom: '1px solid var(--border)',
                        fontSize: '13px',
                        color: 'var(--text-primary)',
                        verticalAlign: 'middle',
                      }}>{cost.description}</td>
                      <td style={{
                        height: '44px',
                        padding: '8px var(--sp-12)',
                        borderBottom: '1px solid var(--border)',
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        verticalAlign: 'middle',
                        textTransform: 'capitalize',
                      }}>{cost.costType}</td>
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
                      }} className="text-money">{formatVnd(cost.amount)}</div>
                      <td style={{
                        height: '44px',
                        padding: '8px var(--sp-12)',
                        borderBottom: '1px solid var(--border)',
                        fontSize: '13px',
                        verticalAlign: 'middle',
                      }}>
                        <span className={`badge badge-${cost.status === 'paid' ? 'success' : 'warning'}`}>
                          {cost.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: 'var(--sp-24)',
            textAlign: 'center',
            borderTop: '1px solid var(--border)',
            marginTop: 'var(--sp-24)',
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--text-muted)',
            }}>© 2024 Construction ERP Enterprise. All rights reserved.</div>
          </div>
        </main>
      </div>
    </div>
  );
}
