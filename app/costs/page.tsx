'use client';

import { useEffect, useState, useMemo } from 'react';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { useERPStore } from '@/store/erpStore';
import { formatDate, formatVnd } from '@/app/components/dashboard-data';
import AddCostModal from '@/app/components/modals/AddCostModal';
import { CostRecord } from '@/app/types';

const KPICard = ({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) => (
  <div style={{ background:'white',border:'1px solid var(--border)',borderRadius:'6px',padding:'12px 16px',borderLeft:`3px solid ${color??'var(--brand)'}` }}>
    <div style={{ fontSize:'11px',fontWeight:600,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em' }}>{label}</div>
    <div style={{ fontSize:'22px',fontWeight:700,color:color??'var(--text-primary)',lineHeight:1.2,marginTop:'3px' }}>{value}</div>
    {sub&&<div style={{ fontSize:'11px',color:'var(--text-muted)',marginTop:'2px' }}>{sub}</div>}
  </div>
);

const TYPE_COLORS: Record<string,string> = { LABOR:'#2563EB',MATERIAL:'#16A34A',EQUIPMENT:'#D97706',OTHER:'#64748B' };

export default function CostsPage() {
  const [sidebarCollapsed,setSidebarCollapsed]=useState(false);
  const [editingCost,setEditingCost]=useState<CostRecord|null>(null);
  const [isAdding,setIsAdding]=useState(false);
  const [searchQuery,setSearchQuery]=useState('');
  const [statusFilter,setStatusFilter]=useState('ALL');
  const [typeFilter,setTypeFilter]=useState('ALL');

  const init=useERPStore(s=>s.init);
  const costs=useERPStore(s=>s.costs);
  const wbs=useERPStore(s=>s.wbs);
  const isInit=useERPStore(s=>s.initialized);

  useEffect(()=>{ init(); },[init]);

  const getWbsName=(id:string)=>wbs.find(w=>w.id===id)?.name??'—';

  const filtered=useMemo(()=>{
    let list=costs;
    if(statusFilter!=='ALL') list=list.filter(c=>c.status===statusFilter);
    if(typeFilter!=='ALL')   list=list.filter(c=>c.costType===typeFilter);
    if(searchQuery){ const q=searchQuery.toLowerCase(); list=list.filter(c=>(c.note??'').toLowerCase().includes(q)||(c.supplier??'').toLowerCase().includes(q)); }
    return list;
  },[costs,statusFilter,typeFilter,searchQuery]);

  const totalAll=costs.reduce((s,c)=>s+c.amount,0);
  const totalPaid=costs.filter(c=>c.status==='paid').reduce((s,c)=>s+c.amount,0);
  const totalUnpaid=costs.filter(c=>c.status!=='paid').reduce((s,c)=>s+c.amount,0);
  const unpaidCount=costs.filter(c=>c.status!=='paid').length;

  const categoryMap=costs.reduce((acc,c)=>{ acc[c.costType]=(acc[c.costType]??0)+c.amount; return acc; },{} as Record<string,number>);
  const categories=Object.entries(categoryMap).sort((a,b)=>b[1]-a[1]);
  const costTypes=[...new Set(costs.map(c=>c.costType))];

  if(!isInit) return (
    <div className="erp-shell">
      <Sidebar collapsed={sidebarCollapsed} onToggle={()=>setSidebarCollapsed(!sidebarCollapsed)}/>
      <div className={`erp-main ${sidebarCollapsed?'sidebar-collapsed':''}`}>
        <Header title="Quản lý Chi phí"/>
        <main className="erp-content"><div className="erp-card h-64 skeleton"/></main>
      </div>
    </div>
  );

  return (
    <div className="erp-shell">
      <Sidebar collapsed={sidebarCollapsed} onToggle={()=>setSidebarCollapsed(!sidebarCollapsed)}/>
      <div className={`erp-main ${sidebarCollapsed?'sidebar-collapsed':''}`}>
        <Header title="Quản lý Chi phí"/>
        <main className="erp-content" style={{ display:'flex',flexDirection:'column',gap:'20px' }}>

          {/* Page Header */}
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
            <div>
              <h2 style={{ fontSize:'20px',fontWeight:700,color:'var(--text-primary)' }}>Nhật ký Chi phí</h2>
              <p style={{ fontSize:'12px',color:'var(--text-secondary)',marginTop:'2px' }}>{costs.length} bút toán — Theo dõi chi phí phát sinh</p>
            </div>
            <button onClick={()=>setIsAdding(true)} style={{ display:'flex',alignItems:'center',gap:'6px',height:'36px',padding:'0 16px',background:'var(--brand)',color:'white',border:'none',borderRadius:'6px',fontSize:'13px',fontWeight:600,cursor:'pointer' }}>
              <svg viewBox="0 0 24 24" style={{ height:'14px',width:'14px' }} fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              Thêm chi phí
            </button>
          </div>

          {/* KPI Row */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px' }}>
            <KPICard label="Tổng chi phí"   value={`${(totalAll/1e9).toFixed(2)} tỷ`}    sub={`${costs.length} khoản mục`}             color="var(--brand)"  />
            <KPICard label="Đã thanh toán"  value={`${(totalPaid/1e9).toFixed(2)} tỷ`}   sub={`${costs.filter(c=>c.status==='paid').length} bút toán`} color="var(--success)"/>
            <KPICard label="Chưa thanh toán" value={`${(totalUnpaid/1e9).toFixed(2)} tỷ`} sub={`${unpaidCount} khoản phải trả`}        color="var(--danger)" />
            <KPICard label="Tỉ lệ đã chi"   value={totalAll>0?`${((totalPaid/totalAll)*100).toFixed(1)}%`:'0%'} sub="Hoàn tất thanh toán" color="var(--warning)"/>
          </div>

          {/* Table + Side */}
          <div style={{ display:'grid',gridTemplateColumns:'1fr 260px',gap:'16px',alignItems:'start' }}>

            {/* Main Table */}
            <div style={{ background:'white',border:'1px solid var(--border)',borderRadius:'6px',overflow:'hidden' }}>
              {/* Toolbar */}
              <div style={{ padding:'10px 12px',borderBottom:'1px solid var(--border)',background:'#FAFBFC',display:'flex',gap:'8px',flexWrap:'wrap',alignItems:'center' }}>
                <div style={{ position:'relative',flex:'1 1 180px',maxWidth:'240px' }}>
                  <svg viewBox="0 0 24 24" style={{ position:'absolute',left:'9px',top:'50%',transform:'translateY(-50%)',height:'13px',width:'13px',color:'var(--text-muted)',pointerEvents:'none' }} fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  <input type="text" placeholder="Tìm kiếm..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} style={{ width:'100%',height:'32px',paddingLeft:'28px',paddingRight:'10px',border:'1px solid var(--border)',borderRadius:'5px',fontSize:'12px',color:'var(--text-primary)',outline:'none',background:'white' }}/>
                </div>
                <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{ height:'32px',padding:'0 10px',border:'1px solid var(--border)',borderRadius:'5px',fontSize:'12px',color:'var(--text-secondary)',background:'white',outline:'none',cursor:'pointer' }}>
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="paid">Đã thanh toán</option>
                  <option value="unpaid">Chưa thanh toán</option>
                </select>
                <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} style={{ height:'32px',padding:'0 10px',border:'1px solid var(--border)',borderRadius:'5px',fontSize:'12px',color:'var(--text-secondary)',background:'white',outline:'none',cursor:'pointer' }}>
                  <option value="ALL">Tất cả loại</option>
                  {costTypes.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
                <div style={{ marginLeft:'auto',fontSize:'11px',color:'var(--text-muted)' }}>{filtered.length} kết quả</div>
              </div>

              <div style={{ overflowX:'auto' }}>
                <table className="erp-table zebra" style={{ minWidth:'750px' }}>
                  <thead>
                    <tr>
                      <th style={{ width:'100px' }}>Ngày</th>
                      <th>Nội dung chi phí</th>
                      <th style={{ width:'130px' }}>Hạng mục WBS</th>
                      <th style={{ width:'90px' }}>Loại</th>
                      <th className="text-right" style={{ width:'140px' }}>Số tiền (VND)</th>
                      <th className="text-center" style={{ width:'110px' }}>Trạng thái</th>
                      <th className="text-center" style={{ width:'56px' }}>Sửa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(cost=>(
                      <tr key={cost.id}>
                        <td style={{ fontSize:'12px',color:'var(--text-secondary)',whiteSpace:'nowrap' }}>{formatDate(cost.date)}</td>
                        <td><div style={{ fontWeight:600,color:'var(--text-primary)',fontSize:'13px' }}>{cost.supplier ?? cost.note ?? cost.costType}</div></td>
                        <td style={{ fontSize:'12px',color:'var(--text-secondary)' }}>{getWbsName(cost.wbsId)}</td>
                        <td>
                          <span style={{ fontSize:'10px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.04em',padding:'2px 7px',borderRadius:'3px',background:`${TYPE_COLORS[cost.costType]??'#64748B'}18`,color:TYPE_COLORS[cost.costType]??'#64748B' }}>
                            {cost.costType}
                          </span>
                        </td>
                        <td className="text-right text-money" style={{ color:'var(--text-primary)',fontWeight:700 }}>{formatVnd(cost.amount)}</td>
                        <td style={{ textAlign:'center' }}>
                          <span style={{ fontSize:'10px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.03em',padding:'2px 8px',borderRadius:'4px',background:cost.status==='paid'?'rgba(22,163,74,0.08)':'rgba(217,119,6,0.08)',color:cost.status==='paid'?'var(--success)':'var(--warning)' }}>
                            {cost.status==='paid'?'Đã chi':'Phải trả'}
                          </span>
                        </td>
                        <td style={{ textAlign:'center' }}>
                          <button onClick={()=>setEditingCost(cost)} style={{ display:'inline-flex',alignItems:'center',justifyContent:'center',height:'26px',width:'26px',borderRadius:'4px',border:'1px solid var(--border)',background:'white',cursor:'pointer',color:'var(--text-secondary)' }}
                            onMouseEnter={e=>{ e.currentTarget.style.borderColor='var(--brand)'; e.currentTarget.style.color='var(--brand)'; }}
                            onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-secondary)'; }}>
                            <svg viewBox="0 0 24 24" style={{ height:'12px',width:'12px' }} fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filtered.length===0&&(
                      <tr><td colSpan={7} style={{ textAlign:'center',padding:'48px 16px',color:'var(--text-muted)',fontSize:'13px',fontStyle:'italic' }}>Không có chi phí nào khớp bộ lọc.</td></tr>
                    )}
                  </tbody>
                  {filtered.length>0&&(
                    <tfoot>
                      <tr style={{ background:'#F0F4FF',borderTop:'2px solid var(--border)' }}>
                        <td colSpan={4} style={{ padding:'10px 16px',fontWeight:700,fontSize:'13px',color:'var(--text-primary)' }}>TỔNG CỘNG ({filtered.length})</td>
                        <td className="text-right text-money" style={{ fontWeight:700,color:'var(--brand)',fontSize:'14px' }}>{formatVnd(filtered.reduce((s,c)=>s+c.amount,0))}</td>
                        <td colSpan={2}/>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Side Panel */}
            <div style={{ display:'flex',flexDirection:'column',gap:'12px' }}>
              <div style={{ background:'white',border:'1px solid var(--border)',borderRadius:'6px',overflow:'hidden' }}>
                <div style={{ padding:'10px 16px',borderBottom:'1px solid var(--border)',background:'#FAFBFC' }}>
                  <span style={{ fontSize:'13px',fontWeight:600,color:'var(--text-primary)' }}>Phân loại chi phí</span>
                </div>
                <div style={{ padding:'12px' }}>
                  {categories.length===0?(
                    <div style={{ textAlign:'center',padding:'16px',color:'var(--text-muted)',fontSize:'12px' }}>Chưa có dữ liệu</div>
                  ):categories.map(([cat,amt])=>{
                    const pct=totalAll>0?(amt/totalAll)*100:0;
                    const col=TYPE_COLORS[cat]??'#64748B';
                    return (
                      <div key={cat} style={{ marginBottom:'10px' }}>
                        <div style={{ display:'flex',justifyContent:'space-between',marginBottom:'3px' }}>
                          <span style={{ fontSize:'11px',fontWeight:600,color:col,textTransform:'uppercase' }}>{cat}</span>
                          <span style={{ fontSize:'11px',fontWeight:700,color:'var(--text-primary)' }}>{pct.toFixed(0)}%</span>
                        </div>
                        <div style={{ height:'5px',background:'var(--bg-muted)',borderRadius:'2px',overflow:'hidden',marginBottom:'2px' }}>
                          <div style={{ height:'100%',width:`${pct}%`,background:col,borderRadius:'2px' }}/>
                        </div>
                        <div style={{ fontSize:'10px',color:'var(--text-muted)' }}>{formatVnd(amt)} VND</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ background:'white',border:'1px solid var(--border)',borderRadius:'6px',padding:'12px' }}>
                {[
                  { label:'Tổng chi phí',     value:formatVnd(totalAll),    color:'var(--text-primary)' },
                  { label:'Đã thanh toán',    value:formatVnd(totalPaid),   color:'var(--success)' },
                  { label:'Chưa thanh toán',  value:formatVnd(totalUnpaid), color:'var(--danger)'  },
                ].map(row=>(
                  <div key={row.label} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 0',borderBottom:'1px solid var(--border)' }}>
                    <span style={{ fontSize:'12px',color:'var(--text-secondary)' }}>{row.label}</span>
                    <span style={{ fontSize:'13px',fontWeight:700,color:row.color }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
      <AddCostModal isOpen={isAdding||!!editingCost} onClose={()=>{ setIsAdding(false); setEditingCost(null); }} costRecord={editingCost}/>
    </div>
  );
}
