"use client";

import React, { useState, useEffect } from 'react';

export const MobileFieldHub = () => {
  const [offlineDrafts, setOfflineDrafts] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [fieldMode, setFieldMode] = useState(false); // P0: Field Visibility Mode

  // Simulate loading drafts from localStorage
  useEffect(() => {
    const drafts = JSON.parse(localStorage.getItem('erp_mobile_drafts') || '[]');
    setOfflineDrafts(drafts);
  }, []);

  const saveDraft = (data: any) => {
    const newDrafts = [...offlineDrafts, { ...data, id: Date.now(), timestamp: new Date() }];
    setOfflineDrafts(newDrafts);
    localStorage.setItem('erp_mobile_drafts', JSON.stringify(newDrafts));
  };

  const syncAll = async () => {
    setSyncing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setOfflineDrafts([]);
    localStorage.removeItem('erp_mobile_drafts');
    setSyncing(false);
  };

  // P0: Ultra-Fast MB Entry Workflow (reduced steps)
  const [showQuickMB, setShowQuickMB] = useState(false);
  const [mbData, setMbData] = useState({ wbs: '', qty: '', unit: 'm3' });

  const handleQuickMBSubmit = () => {
    saveDraft({ type: 'MB_ENTRY', ...mbData });
    setShowQuickMB(false);
    setMbData({ wbs: '', qty: '', unit: 'm3' });
  };

  // Sunlight-safe UI Overrides
  const themeStyles: any = fieldMode ? {
    bg: '#000000',
    card: '#1a1a1a',
    text: '#ffffff',
    primary: '#fbbf24', // Amber/Yellow for high visibility
    border: '#ffffff',
    fontSizeBase: '1.1rem',
    btnPadding: '16px 24px'
  } : {
    bg: 'var(--erp-bg)',
    card: 'var(--erp-card)',
    text: 'var(--erp-text)',
    primary: 'var(--brand-primary)',
    border: 'var(--erp-border)',
    fontSizeBase: '0.875rem',
    btnPadding: '10px 20px'
  };

  return (
    <div className="mobile-hub" style={{ 
      maxWidth: '480px', 
      margin: '0 auto', 
      padding: '16px', 
      background: themeStyles.bg, 
      minHeight: '100vh',
      color: themeStyles.text,
      fontSize: themeStyles.fontSizeBase
    }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: fieldMode ? '1.5rem' : '1.125rem' }}>Field Hub v2.0</h3>
        <button 
          onClick={() => setFieldMode(!fieldMode)}
          style={{ 
            background: fieldMode ? '#fff' : '#334155', 
            color: fieldMode ? '#000' : '#fff',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            fontWeight: 900,
            fontSize: '0.75rem'
          }}
        >
          {fieldMode ? '🌞 CHẾ ĐỘ NGOÀI TRỜI: ON' : '🌓 CHẾ ĐỘ TRONG NHÀ'}
        </button>
      </header>

      {/* P0: Ultra-Fast MB Entry Trigger */}
      {!showQuickMB ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div 
            onClick={() => setShowQuickMB(true)} 
            className="kpi-card" 
            style={{ 
              textAlign: 'center', 
              padding: '32px 16px', 
              background: themeStyles.card, 
              border: `2px solid ${fieldMode ? themeStyles.primary : themeStyles.border}`,
              borderColor: fieldMode ? themeStyles.primary : 'var(--erp-border)'
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>⚡</div>
            <div style={{ fontWeight: 900 }}>NHẬP MB NHANH</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>3 bước - 30 giây</div>
          </div>

          <div className="kpi-card" style={{ textAlign: 'center', padding: '32px 16px', background: themeStyles.card, border: `2px solid ${themeStyles.border}` }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📸</div>
            <div style={{ fontWeight: 900 }}>CHỤP ẢNH</div>
          </div>
        </div>
      ) : (
        <div className="kpi-card" style={{ background: themeStyles.card, border: `3px solid ${themeStyles.primary}`, padding: '24px' }}>
          <h4 style={{ marginBottom: '16px', color: themeStyles.primary }}>QUICK MB (Step 1/2)</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <select 
               style={{ padding: '16px', fontSize: '1.2rem', borderRadius: '8px' }}
               value={mbData.wbs}
               onChange={(e) => setMbData({...mbData, wbs: e.target.value})}
            >
               <option value="">-- Chọn hạng mục WBS --</option>
               <option value="wbs-1">Cọc vây D1000</option>
               <option value="wbs-2">Thép móng Trục A</option>
            </select>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="number" 
                placeholder="Số lượng" 
                style={{ flex: 1, padding: '16px', fontSize: '1.5rem', borderRadius: '8px' }}
                value={mbData.qty}
                onChange={(e) => setMbData({...mbData, qty: e.target.value})}
              />
              <select style={{ width: '80px', padding: '16px' }} value={mbData.unit} onChange={(e) => setMbData({...mbData, unit: e.target.value})}>
                <option>m3</option>
                <option>m2</option>
                <option>kg</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
               <button onClick={() => setShowQuickMB(false)} style={{ flex: 1, padding: '16px', background: '#444', color: '#fff', border: 'none', borderRadius: '8px' }}>HỦY</button>
               <button onClick={handleQuickMBSubmit} style={{ flex: 2, padding: '16px', background: themeStyles.primary, color: fieldMode ? '#000' : '#fff', border: 'none', borderRadius: '8px', fontWeight: 900 }}>LƯU MB NHANH</button>
            </div>
          </div>
        </div>
      )}

      {/* Offline Sync Area - High Visibility */}
      {offlineDrafts.length > 0 && (
        <div style={{ 
          marginTop: '24px', 
          padding: '16px', 
          background: fieldMode ? '#fff' : 'rgba(245, 158, 11, 0.1)', 
          color: fieldMode ? '#000' : 'var(--status-warning)',
          borderRadius: '12px',
          border: fieldMode ? 'none' : '1px solid var(--status-warning)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 900 }}>{offlineDrafts.length} BẢN NHÁP CHỜ ĐỒNG BỘ</div>
            <button 
              onClick={syncAll}
              disabled={syncing}
              style={{ 
                background: fieldMode ? '#000' : 'var(--status-warning)', 
                color: '#fff',
                padding: '12px 16px',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 900
              }}
            >
              {syncing ? '...' : 'GỬI NGAY'}
            </button>
          </div>
        </div>
      )}

      {/* Gloves-friendly Action List */}
      <div style={{ marginTop: '32px' }}>
        <h4 style={{ marginBottom: '16px' }}>Tác vụ ưu tiên</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
           <div className="kpi-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', background: themeStyles.card }}>
              <span style={{ fontSize: '1.5rem' }}>📦</span>
              <div style={{ fontWeight: 700 }}>PHIẾU NHẬP KHO (GRN)</div>
           </div>
           <div className="kpi-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', background: themeStyles.card }}>
              <span style={{ fontSize: '1.5rem' }}>📝</span>
              <div style={{ fontWeight: 700 }}>YÊU CẦU VẬT TƯ (PR)</div>
           </div>
        </div>
      </div>
    </div>
  );
};
