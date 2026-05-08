'use client';

import { useMemo, useState, useEffect } from 'react';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { useERPStore } from '@/store/erpStore';
import { formatVnd } from '@/app/components/dashboard-data';
import { exportToCsv } from '@/app/services/export.service';

const KPICard = ({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) => (
  <div style={{ background:'white',border:'1px solid var(--border)',borderRadius:'6px',padding:'12px 16px',borderLeft:`3px solid ${color??'var(--brand)'}` }}>
    <div style={{ fontSize:'11px',fontWeight:600,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em' }}>{label}</div>
    <div style={{ fontSize:'20px',fontWeight:700,color:color??'var(--text-primary)',lineHeight:1.2,marginTop:'3px' }}>{value}</div>
    {sub&&<div style={{ fontSize:'11px',color:'var(--text-muted)',marginTop:'2px' }}>{sub}</div>}
  </div>
);

export default function ReportsPage() {
  const [collapsed,setCollapsed]=useState(false);
  const currentProjectId = useERPStore(s=>s.currentProjectId);
  const projects         = useERPStore(s=>s.projects);
  const init             = useERPStore(s=>s.init);
  const isInit           = useERPStore(s=>s.initialized);
  const getMonthlyReport = useERPStore(s=>s.getMonthlyReport);
  const getAgingReport   = useERPStore(s=>s.getAgingReport);
  const locks            = useERPStore(s=>s.locks);
  const toggleLock       = useERPStore(s=>s.toggleLock);
  const getDashboardData = useERPStore(s=>s.getDashboardData);

  useEffect(()=>{ init(); },[init]);

  const monthlyData = useMemo(()=>getMonthlyReport(currentProjectId),[currentProjectId,getMonthlyReport]);
  const agingData   = useMemo(()=>getAgingReport(currentProjectId),  [currentProjectId,getAgingReport]);
  const dash        = getDashboardData();

  const agingCategories=['0-30','31-60','61-90','90+'];

  const handleExport=()=>{
    const project=projects.find(p=>p.id===currentProjectId);
    const filename=`BC_Thang_${project?.name||'Project'}_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCsv(filename,monthlyData);
  };

  // Summary KPIs from monthly data
  const totalCashIn  = monthlyData.reduce((s,r)=>s+r.cashIn,0);
  const totalCashOut = monthlyData.reduce((s,r)=>s+r.cashOut,0);
  const totalProfit  = monthlyData.reduce((s,r)=>s+r.profit,0);
  const lastBalance  = monthlyData.length>0?monthlyData[monthlyData.length-1].runningBalance:0;

  if(!isInit) return (
    <div className="erp-shell">
      <Sidebar collapsed={collapsed} onToggle={()=>setCollapsed(!collapsed)}/>
      <div className={`erp-main ${collapsed?'sidebar-collapsed':''}`}>
        <Header title="Báo cáo"/>
        <main className="erp-content"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mt-32"/></main>
      </div>
    </div>
  );

  return (
    <div className="erp-shell">
      <Sidebar collapsed={collapsed} onToggle={()=>setCollapsed(!collapsed)}/>
      <div className={`erp-main ${collapsed?'sidebar-collapsed':''}`}>
        <Header title="Báo cáo Tài chính"/>
        <main className="erp-content" style={{ display:'flex',flexDirection:'column',gap:'20px' }}>

          {/* Page Header */}
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
            <div>
              <h2 style={{ fontSize:'20px',fontWeight:700,color:'var(--text-primary)' }}>Báo cáo Tài chính & Quản trị</h2>
              <p style={{ fontSize:'12px',color:'var(--text-secondary)',marginTop:'2px' }}>Phân tích dòng tiền — Lợi nhuận — Công nợ</p>
            </div>
            <div style={{ display:'flex',gap:'8px' }}>
              <button onClick={handleExport} style={{ display:'flex',alignItems:'center',gap:'6px',height:'36px',padding:'0 16px',background:'white',color:'var(--text-secondary)',border:'1px solid var(--border)',borderRadius:'6px',fontSize:'13px',fontWeight:600,cursor:'pointer' }}>
                <svg viewBox="0 0 24 24" style={{ height:'14px',width:'14px' }} fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5 5 5-5m-5 5V3"/></svg>
                Xuất CSV
              </button>
            </div>
          </div>

          {/* Summary KPIs */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px' }}>
            <KPICard label="Tổng thu"        value={`${(totalCashIn/1e9).toFixed(2)} tỷ`}   sub="Dòng tiền vào"        color="var(--success)" />
            <KPICard label="Tổng chi"         value={`${(totalCashOut/1e9).toFixed(2)} tỷ`}  sub="Dòng tiền ra"         color="var(--danger)"  />
            <KPICard label="Lợi nhuận"        value={`${(totalProfit/1e9).toFixed(2)} tỷ`}   sub="Tích lũy"             color={totalProfit>=0?'var(--success)':'var(--danger)'} />
            <KPICard label="Số dư hiện tại"   value={`${(lastBalance/1e9).toFixed(2)} tỷ`}   sub="Cuối kỳ gần nhất"    color={lastBalance>=0?'var(--brand)':'var(--danger)'} />
          </div>

          {/* Monthly Report Table */}
          <div style={{ background:'white',border:'1px solid var(--border)',borderRadius:'6px',overflow:'hidden' }}>
            <div style={{ padding:'10px 16px',borderBottom:'1px solid var(--border)',background:'#FAFBFC',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <span style={{ fontSize:'13px',fontWeight:600,color:'var(--text-primary)' }}>Kết quả kinh doanh theo tháng</span>
              <div style={{ display:'flex',alignItems:'center',gap:'8px',fontSize:'11px',color:'var(--text-secondary)' }}>
                <span style={{ width:'8px',height:'8px',borderRadius:'50%',background:'var(--danger)',display:'inline-block' }}/>
                Kỳ đã chốt
              </div>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table className="erp-table" style={{ minWidth:'900px' }}>
                <thead>
                  <tr>
                    <th style={{ width:'100px' }}>Tháng</th>
                    <th className="text-right">Dòng tiền vào</th>
                    <th className="text-right">Dòng tiền ra</th>
                    <th className="text-right">Doanh thu</th>
                    <th className="text-right">Chi phí</th>
                    <th className="text-right">Lợi nhuận</th>
                    <th className="text-right">Số dư lũy kế</th>
                    <th className="text-center" style={{ width:'100px' }}>Chốt kỳ</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map(row=>{
                    const isLocked=locks.includes(row.month);
                    return (
                      <tr key={row.month} style={{ background:isLocked?'rgba(220,38,38,0.03)':'white' }}>
                        <td>
                          <div style={{ display:'flex',alignItems:'center',gap:'6px' }}>
                            {isLocked&&(
                              <svg viewBox="0 0 24 24" style={{ height:'12px',width:'12px',color:'var(--danger)',flexShrink:0 }} fill="currentColor">
                                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"/>
                              </svg>
                            )}
                            <span style={{ fontSize:'13px',fontWeight:700,color:'var(--text-primary)' }}>{row.month}</span>
                          </div>
                        </td>
                        <td className="text-right text-money" style={{ color:'var(--success)',fontWeight:600 }}>{formatVnd(row.cashIn)}</td>
                        <td className="text-right text-money" style={{ color:'var(--danger)',fontWeight:600 }}>{formatVnd(row.cashOut)}</td>
                        <td className="text-right text-money" style={{ color:'var(--text-secondary)' }}>{formatVnd(row.revenue)}</td>
                        <td className="text-right text-money" style={{ color:'var(--text-secondary)' }}>{formatVnd(row.cost)}</td>
                        <td className="text-right text-money" style={{ color:row.profit>=0?'var(--success)':'var(--danger)',fontWeight:700 }}>
                          {row.profit>=0?'+':''}{formatVnd(row.profit)}
                        </td>
                        <td className="text-right text-money" style={{ color:row.runningBalance>=0?'var(--brand)':'var(--danger)',fontWeight:700 }}>
                          {formatVnd(row.runningBalance)}
                        </td>
                        <td style={{ textAlign:'center' }}>
                          <button onClick={()=>toggleLock(row.month)} style={{
                            height:'26px',padding:'0 10px',borderRadius:'4px',fontSize:'11px',fontWeight:700,cursor:'pointer',
                            border:'1px solid',
                            borderColor:isLocked?'var(--danger)':'var(--border)',
                            background:isLocked?'rgba(220,38,38,0.08)':'white',
                            color:isLocked?'var(--danger)':'var(--text-secondary)',
                          }}>
                            {isLocked?'Mở khóa':'Chốt kỳ'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {monthlyData.length===0&&(
                    <tr><td colSpan={8} style={{ textAlign:'center',padding:'48px 16px',color:'var(--text-muted)',fontSize:'13px',fontStyle:'italic' }}>Chưa có dữ liệu phát sinh</td></tr>
                  )}
                </tbody>
                {monthlyData.length>0&&(
                  <tfoot>
                    <tr style={{ background:'#F0F4FF',borderTop:'2px solid var(--border)' }}>
                      <td style={{ padding:'10px 16px',fontWeight:700,fontSize:'13px',color:'var(--text-primary)' }}>TỔNG</td>
                      <td className="text-right text-money" style={{ fontWeight:700,color:'var(--success)' }}>{formatVnd(totalCashIn)}</td>
                      <td className="text-right text-money" style={{ fontWeight:700,color:'var(--danger)' }}>{formatVnd(totalCashOut)}</td>
                      <td className="text-right text-money" style={{ fontWeight:700,color:'var(--text-secondary)' }}>{formatVnd(monthlyData.reduce((s,r)=>s+r.revenue,0))}</td>
                      <td className="text-right text-money" style={{ fontWeight:700,color:'var(--text-secondary)' }}>{formatVnd(monthlyData.reduce((s,r)=>s+r.cost,0))}</td>
                      <td className="text-right text-money" style={{ fontWeight:700,color:totalProfit>=0?'var(--success)':'var(--danger)',fontSize:'14px' }}>{totalProfit>=0?'+':''}{formatVnd(totalProfit)}</td>
                      <td className="text-right text-money" style={{ fontWeight:700,color:lastBalance>=0?'var(--brand)':'var(--danger)' }}>{formatVnd(lastBalance)}</td>
                      <td/>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Aging Reports */}
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px' }}>
            {/* AR Aging */}
            <div style={{ background:'white',border:'1px solid var(--border)',borderRadius:'6px',overflow:'hidden' }}>
              <div style={{ padding:'10px 16px',borderBottom:'1px solid var(--border)',background:'rgba(22,163,74,0.03)' }}>
                <span style={{ fontSize:'13px',fontWeight:600,color:'var(--success)' }}>Tuổi nợ Phải thu (AR)</span>
              </div>
              <div style={{ padding:'16px',display:'flex',flexDirection:'column',gap:'10px' }}>
                {agingCategories.map(cat=>{
                  const items=agingData.filter(i=>i.type==='receivable'&&i.category===cat);
                  const total=items.reduce((s,i)=>s+i.amount,0);
                  const col=cat==='0-30'?'var(--success)':cat==='31-60'?'var(--warning)':cat==='61-90'?'#F97316':'var(--danger)';
                  return (
                    <div key={cat} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px',borderRadius:'6px',border:'1px solid var(--border)',background:'var(--bg-subtle)' }}>
                      <div>
                        <div style={{ fontSize:'11px',fontWeight:700,color:col,textTransform:'uppercase',letterSpacing:'0.04em' }}>{cat} ngày</div>
                        <div style={{ fontSize:'16px',fontWeight:700,color:'var(--text-primary)',marginTop:'2px' }}>{formatVnd(total)}</div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:'20px',fontWeight:700,color:col }}>{items.length}</div>
                        <div style={{ fontSize:'10px',color:'var(--text-muted)' }}>bản ghi</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AP Aging */}
            <div style={{ background:'white',border:'1px solid var(--border)',borderRadius:'6px',overflow:'hidden' }}>
              <div style={{ padding:'10px 16px',borderBottom:'1px solid var(--border)',background:'rgba(220,38,38,0.03)' }}>
                <span style={{ fontSize:'13px',fontWeight:600,color:'var(--danger)' }}>Tuổi nợ Phải trả (AP)</span>
              </div>
              <div style={{ padding:'16px',display:'flex',flexDirection:'column',gap:'10px' }}>
                {agingCategories.map(cat=>{
                  const items=agingData.filter(i=>i.type==='payable'&&i.category===cat);
                  const total=items.reduce((s,i)=>s+i.amount,0);
                  const col=cat==='0-30'?'var(--success)':cat==='31-60'?'var(--warning)':cat==='61-90'?'#F97316':'var(--danger)';
                  return (
                    <div key={cat} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px',borderRadius:'6px',border:'1px solid var(--border)',background:'var(--bg-subtle)' }}>
                      <div>
                        <div style={{ fontSize:'11px',fontWeight:700,color:col,textTransform:'uppercase',letterSpacing:'0.04em' }}>{cat} ngày</div>
                        <div style={{ fontSize:'16px',fontWeight:700,color:'var(--text-primary)',marginTop:'2px' }}>{formatVnd(total)}</div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:'20px',fontWeight:700,color:col }}>{items.length}</div>
                        <div style={{ fontSize:'10px',color:'var(--text-muted)' }}>bản ghi</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Profitability Panel */}
          <div style={{ background:'white',border:'1px solid var(--border)',borderRadius:'6px',overflow:'hidden' }}>
            <div style={{ padding:'10px 16px',borderBottom:'1px solid var(--border)',background:'#FAFBFC' }}>
              <span style={{ fontSize:'13px',fontWeight:600,color:'var(--text-primary)' }}>Phân tích lợi nhuận tháng</span>
            </div>
            <div style={{ padding:'16px',display:'flex',flexDirection:'column',gap:'6px' }}>
              {monthlyData.slice(-6).map(row=>{
                const maxProfit=Math.max(...monthlyData.map(r=>Math.abs(r.profit)),1);
                const pct=Math.abs(row.profit)/maxProfit*100;
                const isPos=row.profit>=0;
                return (
                  <div key={row.month} style={{ display:'flex',alignItems:'center',gap:'10px' }}>
                    <div style={{ width:'60px',fontSize:'11px',fontWeight:600,color:'var(--text-secondary)',flexShrink:0 }}>{row.month}</div>
                    <div style={{ flex:1,height:'18px',background:'var(--bg-muted)',borderRadius:'3px',overflow:'hidden',position:'relative' }}>
                      <div style={{ position:'absolute',left:isPos?'50%':undefined,right:isPos?undefined:'50%',height:'100%',width:`${pct/2}%`,background:isPos?'var(--success)':'var(--danger)',borderRadius:'2px' }}/>
                      <div style={{ position:'absolute',left:'50%',top:0,bottom:0,width:'1px',background:'var(--border-mid)'}}/>
                    </div>
                    <div style={{ width:'100px',fontSize:'11px',fontWeight:700,color:isPos?'var(--success)':'var(--danger)',textAlign:'right',flexShrink:0,whiteSpace:'nowrap' }}>
                      {isPos?'+':''}{(row.profit/1e6).toFixed(0)}tr
                    </div>
                  </div>
                );
              })}
              {monthlyData.length===0&&(
                <div style={{ textAlign:'center',padding:'24px',color:'var(--text-muted)',fontSize:'12px' }}>Chưa có dữ liệu tháng</div>
              )}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
