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
        padding: '10px 12px', 
        borderRadius: '8px', 
        cursor: 'pointer',
        background: activeTab === id ? 'linear-gradient(90deg, #dbeafe 0%, #f0f9ff 100%)' : 'transparent',
        color: activeTab === id ? '#1e40af' : '#6b7280',
        fontWeight: activeTab === id ? 700 : 500,
        transition: 'all 0.2s ease',
        marginBottom: '4px',
        borderLeft: activeTab === id ? '3px solid #2563eb' : '3px solid transparent',
        paddingLeft: activeTab === id ? '10px' : '12px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
        <span style={{ fontSize: '1.125rem' }}>{icon}</span>
        <span>{label}</span>
      </div>
      {badge && <span style={{ background: '#ef4444', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', fontWeight: 700 }}>{badge}</span>}
    </div>
  );

  return (
    <div className="erp-layout">
      {/* Sidebar */}
      <aside className="erp-sidebar" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.5rem', color: 'white', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}>G</div>
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '1.125rem', letterSpacing: '-0.02em', color: '#1f2937' }}>ANTIGRAVITY</div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.5px' }}>CONSTRUCTION ERP</div>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', paddingRight: '4px', flex: 1 }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, padding: '12px 0', color: '#9ca3af', letterSpacing: '0.1em' }}>VALIDATION</div>
          <NavItem id="pilot" icon="🚧" label="Pilot Dashboard" badge={2} />
          <NavItem id="rollout" icon="🚀" label="Deployment Hub" />
          <NavItem id="audit-trail" icon="🛡️" label="Operational Audit" />
          
          <div style={{ fontSize: '0.65rem', fontWeight: 700, padding: '12px 0', marginTop: '12px', color: '#9ca3af', letterSpacing: '0.1em' }}>PROJECT COMMAND</div>
          <NavItem id="project-360" icon="🎯" label="Project 360" />
          <NavItem id="executive" icon="📈" label="Portfolio BI" />
          
          <div style={{ fontSize: '0.65rem', fontWeight: 700, padding: '12px 0', marginTop: '12px', color: '#9ca3af', letterSpacing: '0.1em' }}>FIELD & OPS</div>
          <NavItem id="field-hub" icon="📱" label="Field Hub" />
          <NavItem id="wbs-workspace" icon="🌳" label="WBS / BOQ" />
          <NavItem id="documents" icon="📂" label="DMS (Files)" />
        </nav>

        <div style={{ marginTop: '16px', padding: '12px', background: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)', borderRadius: '8px', border: '1px solid #bfdbfe', color: '#1e40af' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '8px' }}>PILOT READINESS</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#10b981' }}>78%</div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1f2937' }}>High Maturity</div>
              <div style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 600 }}>Ready to Scale</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="erp-main" style={{ display: 'grid', gridTemplateColumns: activeTab === 'documents' || activeTab === 'wbs-workspace' || activeTab === 'audit-trail' || activeTab === 'rollout' || activeTab === 'pilot' ? '1fr' : '1fr 320px', gap: '16px', padding: '20px 24px' }}>
        <div style={{ overflowY: 'auto' }}>
          {/* Top Header */}
          <header style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '20px', marginBottom: '18px', marginTop: '-4px' }}>
             <input type="text" placeholder="Global Search (Ctrl+K)..." style={{ flex: 1, maxWidth: '400px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 14px', color: '#111827', fontSize: '13px' }} />
             <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '12px' }}>BÁO CÁO NHANH</button>
                <span style={{ fontSize: '1.25rem', cursor: 'pointer', opacity: 0.8, transition: 'opacity 0.2s' }}>🔔</span>
             </div>
          </header>

          <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            {renderContent()}
          </div>
        </div>

        {/* Collaboration Sidebar */}
        {activeTab !== 'documents' && activeTab !== 'wbs-workspace' && activeTab !== 'audit-trail' && activeTab !== 'rollout' && activeTab !== 'pilot' && (
          <aside style={{ borderLeft: '1px solid #e5e7eb', paddingLeft: '16px', overflowY: 'auto' }}>
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
