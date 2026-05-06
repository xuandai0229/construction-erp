"use client";

import React, { useState } from 'react';
import { ProjectCommandCenter } from '@/components/dashboard/ProjectCommandCenter';
import { WBSWorkspace } from '@/components/workspace/WBSWorkspace';
import { ApprovalCenter } from '@/components/approval/ApprovalCenter';
import { ExecutiveDashboard } from '@/components/dashboard/ExecutiveDashboard';
import { MobileFieldHub } from '@/components/mobile/MobileFieldHub';
import { DocumentCenter } from '@/components/documents/DocumentCenter';
import { ActivityFeed } from '@/components/collaboration/ActivityFeed';
import { GovernanceDashboard } from '@/components/governance/GovernanceDashboard';
import { RolloutDashboard } from '@/components/deployment/RolloutDashboard';
import { PilotDashboard } from '@/components/pilot/PilotDashboard';

export default function EnterpriseERPPage() {
  const [activeTab, setActiveTab] = useState('project-360');

  const renderContent = () => {
    switch (activeTab) {
      case 'project-360': return <ProjectCommandCenter />;
      case 'wbs-workspace': return <WBSWorkspace />;
      case 'approval-center': return <ApprovalCenter />;
      case 'executive': return <ExecutiveDashboard />;
      case 'field-hub': return <MobileFieldHub />;
      case 'documents': return <DocumentCenter />;
      case 'audit-trail': return <GovernanceDashboard />;
      case 'rollout': return <RolloutDashboard />;
      case 'pilot': return <PilotDashboard />;
      default: return <ProjectCommandCenter />;
    }
  };

  const NavItem = ({ id, icon, label, badge }: { id: string, icon: string, label: string, badge?: number }) => (
    <div 
      onClick={() => setActiveTab(id)}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '12px', 
        borderRadius: '8px', 
        cursor: 'pointer',
        background: activeTab === id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
        color: activeTab === id ? 'var(--brand-primary)' : 'var(--erp-text-muted)',
        fontWeight: activeTab === id ? 700 : 400,
        transition: 'all 0.2s',
        marginBottom: '4px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '1.25rem' }}>{icon}</span>
        <span>{label}</span>
      </div>
      {badge && <span style={{ background: 'var(--status-critical)', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '10px' }}>{badge}</span>}
    </div>
  );

  return (
    <div className="erp-layout">
      {/* Sidebar */}
      <aside className="erp-sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ width: '40px', height: '40px', background: 'var(--brand-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.5rem' }}>G</div>
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '1.125rem', letterSpacing: '-0.02em' }}>ANTIGRAVITY</div>
            <div className="text-muted" style={{ fontSize: '0.65rem', fontWeight: 700 }}>CONSTRUCTION ERP</div>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', paddingRight: '4px' }}>
          <div className="text-muted" style={{ fontSize: '0.65rem', fontWeight: 700, padding: '12px', letterSpacing: '0.1em' }}>VALIDATION</div>
          <NavItem id="pilot" icon="🚧" label="Pilot Dashboard" badge={2} />
          <NavItem id="rollout" icon="🚀" label="Deployment Hub" />
          <NavItem id="audit-trail" icon="🛡️" label="Operational Audit" />
          
          <div className="text-muted" style={{ fontSize: '0.65rem', fontWeight: 700, padding: '12px', letterSpacing: '0.1em', marginTop: '16px' }}>PROJECT COMMAND</div>
          <NavItem id="project-360" icon="🎯" label="Project 360" />
          <NavItem id="executive" icon="📈" label="Portfolio BI" />
          
          <div className="text-muted" style={{ fontSize: '0.65rem', fontWeight: 700, padding: '12px', letterSpacing: '0.1em', marginTop: '16px' }}>FIELD & OPS</div>
          <NavItem id="field-hub" icon="📱" label="Field Hub" />
          <NavItem id="wbs-workspace" icon="🌳" label="WBS / BOQ" />
          <NavItem id="documents" icon="📂" label="DMS (Files)" />
        </nav>

        <div style={{ marginTop: 'auto', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>Pilot Readiness</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--status-healthy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>78%</div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>Maturity: High</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--status-healthy)' }}>Ready to Scale</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="erp-main" style={{ display: 'grid', gridTemplateColumns: activeTab === 'documents' || activeTab === 'wbs-workspace' || activeTab === 'audit-trail' || activeTab === 'rollout' || activeTab === 'pilot' ? '1fr' : '1fr 320px', gap: 'var(--space-xl)' }}>
        <div style={{ overflowY: 'auto' }}>
          {/* Top Header */}
          <header style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '24px', marginBottom: 'var(--space-lg)' }}>
             <input type="text" placeholder="Global Search (Ctrl+K)..." style={{ flex: 1, maxWidth: '400px', background: 'var(--erp-card)', border: '1px solid var(--erp-border)', borderRadius: '8px', padding: '8px 16px', color: 'white' }} />
             <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.7rem' }}>BÁO CÁO NHANH</button>
                <span style={{ fontSize: '1.25rem', cursor: 'pointer' }}>🔔</span>
             </div>
          </header>

          <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            {renderContent()}
          </div>
        </div>

        {/* Collaboration Sidebar */}
        {activeTab !== 'documents' && activeTab !== 'wbs-workspace' && activeTab !== 'audit-trail' && activeTab !== 'rollout' && activeTab !== 'pilot' && (
          <aside style={{ borderLeft: '1px solid var(--erp-border)', paddingLeft: 'var(--space-xl)', overflowY: 'auto' }}>
            <ActivityFeed />
          </aside>
        )}
      </main>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
