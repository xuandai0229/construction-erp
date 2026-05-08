'use client';

import { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { useERPStore } from '@/store/erpStore';
import { formatVnd, formatDate } from '@/app/components/dashboard-data';
import { RevenueStatus } from '@/app/types';
import AddRevenueModal from '@/app/components/modals/AddRevenueModal';

const KPICard = ({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) => (
  <div style={{ background:'white',border:'1px solid var(--border)',borderRadius:'6px',padding:'12px 16px',borderLeft:`3px solid ${color??'var(--brand)'}` }}>
    <div style={{ fontSize:'11px',fontWeight:600,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em' }}>{label}</div>
    <div style={{ fontSize:'22px',fontWeight:700,color:color??'var(--text-primary)',lineHeight:1.2,marginTop:'3px' }}>{value}</div>
    {sub&&<div style={{ fontSize:'11px',color:'var(--text-muted)',marginTop:'2px' }}>{sub}</div>}
  </div>
);

export default function RevenueListPage() {
  const [sidebarCollapsed,setSidebarCollapsed]=useState(false);
  const [isAdding,setIsAdding]=useState(false);
  const [searchQuery,setSearchQuery]=useState('');
  const [statusFilter,setStatusFilter]=useState('ALL');

  const revenues     = useERPStore(s=>s.revenues);
  const wbs          = useERPStore(s=>s.wbs);
  const init         = useERPStore(s=>s.init);
  const isInit       = useERPStore(s=>s.initialized);
  const updateRevenue= useERPStore(s=>s.updateRevenue);

  useEffect(()=>{ init(); },[init]);

  const getWbsName=(id:string)=>wbs.find(w=>w.id===id)?.name??'—';

  const handleToggle=(id:string,cur:RevenueStatus)=>{
    updateRevenue(id,{ status: cur==='paid'?'unpaid':'paid' });
  };

  const filtered=useMemo(()=>{
    let list=revenues;
    if(statusFilter!=='ALL') list=list.filter(r=>r.status===statusFilter);
    if(searchQuery){ const q=searchQuery.toLowerCase(); list=list.filter(r=>(r.description ?? '').toLowerCase().includes(q)||(r.wbsId||'').toLowerCase().includes(q)); }
    return list;
  },[revenues,statusFilter,searchQuery]);

  const totalAll    = revenues.reduce((s,r)=>s+r.amount,0);
  const totalPaid   = revenues.filter(r=>r.status==='paid').reduce((s,r)=>s+r.amount,0);
  const totalUnpaid = revenues.filter(r=>r.status!=='paid').reduce((s,r)=>s+r.amount,0);
  const paidCount   = revenues.filter(r=>r.status==='paid').length;
  const unpaidCount = revenues.filter(r=>r.status!=='paid').length;
  const collectionRate = totalAll>0?((totalPaid/totalAll)*100):0;

  // Monthly breakdown
  const monthlyMap = revenues.reduce((acc,r)=>{
    const m=new Date(r.date).toLocaleDateString('vi-VN',{ month:'2-digit',year:'numeric' });
    acc[m]=(acc[m]??0)+r.amount;
    return acc;
  },{} as Record<string,number>);
  const months=Object.entries(monthlyMap).sort((a,b)=>a[0].localeCompare(b[0])).slice(-6);

  if(!isInit) return (
    <div className="erp-shell">
      <Sidebar collapsed={sidebarCollapsed} onToggle={()=>setSidebarCollapsed(!sidebarCollapsed)}/>
      <div className={`erp-main ${sidebarCollapsed?'sidebar-collapsed':''}`}>
        <Header title="Doanh thu"/>
        <main className="erp-content"><div className="erp-card h-64 skeleton"/></main>
      </div>
    </div>
  );

  return (
    <div className="erp-shell">
      <Sidebar collapsed={sidebarCollapsed} onToggle={()=>setSidebarCollapsed(!sidebarCollapsed)}/>
      <div className={`erp-main ${sidebarCollapsed?'sidebar-collapsed':''}`}>
        <Header title="Doanh thu"/>
        <main className="erp-content" style={{ display:'flex',flexDirection:'column',gap:'20px' }}>

          {/* Page Header */}
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
            <div>
              <h2 style={{ fontSize:'20px',fontWeight:700,color:'var(--text-primary)' }}>Quản lý Doanh thu</h2>
              <p style={{ fontSize:'12px',color:'var(--text-secondary)',marginTop:'2px' }}>{revenues.length} bản ghi — Theo dõi thu tiền và hoá đơn</p>
            </div>
            <button onClick={()=>setIsAdding(true)} style={{ display:'flex',alignItems:'center',gap:'6px',height:'36px',padding:'0 16px',background:'var(--brand)',color:'white',border:'none',borderRadius:'6px',fontSize:'13px',fontWeight:600,cursor:'pointer' }}>
              <svg viewBox="0 0 24 24" style={{ height:'14px',width:'14px' }} fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              Ghi nhận doanh thu
            </button>
          </div>

          {/* KPI Row */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'12px' }}>
            <KPICard label="Tổng doanh thu"    value={`${(totalAll/1e9).toFixed(2)} tỷ`}    sub={`${revenues.length} bản ghi`}       color="var(--brand)"  />
            <KPICard label="Đã thu"             value={`${(totalPaid/1e9).toFixed(2)} tỷ`}   sub={`${paidCount} hoá đơn hoàn tất`}   color="var(--success)"/>
            <KPICard label="Chưa thu"           value={`${(totalUnpaid/1e9).toFixed(2)} tỷ`} sub={`${unpaidCount} khoản chờ thu`}    color="var(--warning)"/>
            <KPICard label="Tỉ lệ thu"          value={`${collectionRate.toFixed(1)}%`}       sub="Tổng đã thu / Tổng phải thu"        color={collectionRate>=80?'var(--success)':'var(--danger)'} />
            <KPICard label="Chưa thu (số lượng)" value={String(unpaidCount)}                  sub="Cần theo dõi"                       color={unpaidCount>0?'var(--danger)':'var(--success)'} />
          </div>

          {/* Collection Progress */}
          <div style={{ background:'white',border:'1px solid var(--border)',borderRadius:'6px',padding:'16px' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px' }}>
              <span style={{ fontSize:'13px',fontWeight:600,color:'var(--text-primary)' }}>Tiến độ thu tiền</span>
              <div style={{ display:'flex',gap:'16px',fontSize:'12px',color:'var(--text-secondary)' }}>
                <span>Tổng: <strong style={{ color:'var(--brand)' }}>{formatVnd(totalAll)}</strong></span>
                <span>Đã thu: <strong style={{ color:'var(--success)' }}>{formatVnd(totalPaid)}</strong></span>
                <span>Còn lại: <strong style={{ color:'var(--danger)' }}>{formatVnd(totalUnpaid)}</strong></span>
              </div>
            </div>
            <div style={{ height:'10px',background:'var(--bg-muted)',borderRadius:'5px',overflow:'hidden' }}>
              <div style={{ height:'100%',width:`${collectionRate}%`,borderRadius:'5px',background:collectionRate>=80?'var(--success)':collectionRate>=50?'var(--warning)':'var(--danger)',transition:'width 0.5s ease' }}/>
            </div>
            <div style={{ display:'flex',justifyContent:'space-between',marginTop:'6px',fontSize:'11px',color:'var(--text-muted)' }}>
              <span>0%</span>
              <span style={{ fontWeight:700,color:'var(--text-primary)' }}>{collectionRate.toFixed(1)}%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Table + Side */}
          <div style={{ display:'grid',gridTemplateColumns:'1fr 260px',gap:'16px',alignItems:'start' }}>

            {/* Revenue Table */}
            <div style={{ background:'white',border:'1px solid var(--border)',borderRadius:'6px',overflow:'hidden' }}>
              {/* Toolbar */}
              <div style={{ padding:'10px 12px',borderBottom:'1px solid var(--border)',background:'#FAFBFC',display:'flex',gap:'8px',flexWrap:'wrap',alignItems:'center' }}>
                <div style={{ position:'relative',flex:'1 1 180px',maxWidth:'240px' }}>
                  <svg viewBox="0 0 24 24" style={{ position:'absolute',left:'9px',top:'50%',transform:'translateY(-50%)',height:'13px',width:'13px',color:'var(--text-muted)',pointerEvents:'none' }} fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  <input type="text" placeholder="Tìm kiếm..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} style={{ width:'100%',height:'32px',paddingLeft:'28px',paddingRight:'10px',border:'1px solid var(--border)',borderRadius:'5px',fontSize:'12px',color:'var(--text-primary)',outline:'none',background:'white' }}/>
                </div>
                {['ALL','paid','unpaid'].map(f=>(
                  <button key={f} onClick={()=>setStatusFilter(f)} style={{ height:'32px',padding:'0 12px',borderRadius:'5px',fontSize:'12px',fontWeight:statusFilter===f?600:400,cursor:'pointer',border:'1px solid',borderColor:statusFilter===f?'var(--brand)':'var(--border)',background:statusFilter===f?'var(--brand)':'white',color:statusFilter===f?'white':'var(--text-secondary)',transition:'all 0.12s' }}>
                    {f==='ALL'?'Tất cả':f==='paid'?'Đã thu':'Chờ thu'}
                  </button>
                ))}
                <div style={{ marginLeft:'auto',fontSize:'11px',color:'var(--text-muted)' }}>{filtered.length} kết quả</div>
              </div>

              <div style={{ overflowX:'auto' }}>
                <table className="erp-table zebra" style={{ minWidth:'700px' }}>
                  <thead>
                    <tr>
                      <th style={{ width:'100px' }}>Ngày</th>
                      <th style={{ width:'160px' }}>Hạng mục WBS</th>
                      <th>Diễn giải</th>
                      <th className="text-right" style={{ width:'150px' }}>Số tiền (VND)</th>
                      <th className="text-center" style={{ width:'100px' }}>Trạng thái</th>
                      <th className="text-center" style={{ width:'120px' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(rev=>(
                      <tr key={rev.id}>
                        <td style={{ fontSize:'12px',color:'var(--text-secondary)',whiteSpace:'nowrap' }}>{formatDate(rev.date)}</td>
                        <td style={{ fontSize:'12px',fontWeight:600,color:'var(--text-primary)' }}>{getWbsName(rev.wbsId)}</td>
                        <td style={{ fontSize:'13px',color:'var(--text-secondary)' }}>{rev.description}</td>
                        <td className="text-right text-money" style={{ color:'var(--success)',fontWeight:700 }}>{formatVnd(rev.amount)}</td>
                        <td style={{ textAlign:'center' }}>
                          <span style={{ fontSize:'10px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.03em',padding:'2px 8px',borderRadius:'4px',background:rev.status==='paid'?'rgba(22,163,74,0.08)':'rgba(217,119,6,0.08)',color:rev.status==='paid'?'var(--success)':'var(--warning)' }}>
                            {rev.status==='paid'?'Đã thu':'Chờ thu'}
                          </span>
                        </td>
                        <td style={{ textAlign:'center' }}>
                          <button onClick={()=>handleToggle(rev.id,rev.status)} style={{ height:'28px',padding:'0 10px',borderRadius:'4px',border:'1px solid var(--border)',background:'white',fontSize:'11px',fontWeight:600,cursor:'pointer',color:'var(--text-secondary)' }}
                            onMouseEnter={e=>{ e.currentTarget.style.borderColor='var(--brand)'; e.currentTarget.style.color='var(--brand)'; }}
                            onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-secondary)'; }}>
                            {rev.status==='paid'?'Mở lại':'Xác nhận thu'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filtered.length===0&&(
                      <tr><td colSpan={6} style={{ textAlign:'center',padding:'48px 16px',color:'var(--text-muted)',fontSize:'13px',fontStyle:'italic' }}>Chưa có dữ liệu doanh thu.</td></tr>
                    )}
                  </tbody>
                  {filtered.length>0&&(
                    <tfoot>
                      <tr style={{ background:'#F0F4FF',borderTop:'2px solid var(--border)' }}>
                        <td colSpan={3} style={{ padding:'10px 16px',fontWeight:700,fontSize:'13px',color:'var(--text-primary)' }}>TỔNG CỘNG ({filtered.length})</td>
                        <td className="text-right text-money" style={{ fontWeight:700,color:'var(--success)',fontSize:'14px' }}>{formatVnd(filtered.reduce((s,r)=>s+r.amount,0))}</td>
                        <td colSpan={2}/>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Side Panel */}
            <div style={{ display:'flex',flexDirection:'column',gap:'12px' }}>
              {/* Monthly Revenue */}
              <div style={{ background:'white',border:'1px solid var(--border)',borderRadius:'6px',overflow:'hidden' }}>
                <div style={{ padding:'10px 16px',borderBottom:'1px solid var(--border)',background:'#FAFBFC' }}>
                  <span style={{ fontSize:'13px',fontWeight:600,color:'var(--text-primary)' }}>Doanh thu theo tháng</span>
                </div>
                <div style={{ padding:'12px' }}>
                  {months.length===0?(
                    <div style={{ textAlign:'center',padding:'16px',color:'var(--text-muted)',fontSize:'12px' }}>Chưa có dữ liệu</div>
                  ):months.map(([m,amt])=>{
                    const maxAmt=Math.max(...months.map(x=>x[1]));
                    const pct=maxAmt>0?(amt/maxAmt)*100:0;
                    return (
                      <div key={m} style={{ marginBottom:'8px' }}>
                        <div style={{ display:'flex',justifyContent:'space-between',marginBottom:'3px' }}>
                          <span style={{ fontSize:'11px',fontWeight:500,color:'var(--text-secondary)' }}>{m}</span>
                          <span style={{ fontSize:'11px',fontWeight:700,color:'var(--success)' }}>{(amt/1e6).toFixed(0)}tr</span>
                        </div>
                        <div style={{ height:'5px',background:'var(--bg-muted)',borderRadius:'2px',overflow:'hidden' }}>
                          <div style={{ height:'100%',width:`${pct}%`,background:'var(--success)',borderRadius:'2px' }}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary */}
              <div style={{ background:'white',border:'1px solid var(--border)',borderRadius:'6px',padding:'12px' }}>
                {[
                  { label:'Tổng phải thu',  value:formatVnd(totalAll),    color:'var(--text-primary)' },
                  { label:'Đã thu',         value:formatVnd(totalPaid),   color:'var(--success)' },
                  { label:'Chưa thu',       value:formatVnd(totalUnpaid), color:'var(--warning)' },
                  { label:'Tỉ lệ thu',      value:`${collectionRate.toFixed(1)}%`, color:collectionRate>=80?'var(--success)':'var(--danger)' },
                ].map(row=>(
                  <div key={row.label} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 0',borderBottom:'1px solid var(--border)' }}>
                    <span style={{ fontSize:'12px',color:'var(--text-secondary)' }}>{row.label}</span>
                    <span style={{ fontSize:'13px',fontWeight:700,color:row.color }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Unpaid Alert */}
              {unpaidCount>0&&(
                <div style={{ background:'white',border:'1px solid var(--border)',borderRadius:'6px',overflow:'hidden' }}>
                  <div style={{ padding:'10px 16px',borderBottom:'1px solid var(--border)',background:'rgba(217,119,6,0.04)' }}>
                    <span style={{ fontSize:'13px',fontWeight:600,color:'var(--warning)' }}>Chờ thu ({unpaidCount})</span>
                  </div>
                  <div style={{ padding:'10px 12px' }}>
                    {revenues.filter(r=>r.status!=='paid').slice(0,5).map(r=>(
                      <div key={r.id} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:'1px solid var(--border)' }}>
                        <div>
                          <div style={{ fontSize:'11px',fontWeight:600,color:'var(--text-primary)' }}>{(r.description ?? '').slice(0,22)}{(r.description?.length ?? 0)>22?'…':''}</div>
                          <div style={{ fontSize:'10px',color:'var(--text-muted)' }}>{formatDate(r.date)}</div>
                        </div>
                        <span style={{ fontSize:'12px',fontWeight:700,color:'var(--warning)',whiteSpace:'nowrap' }}>{formatVnd(r.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      <AddRevenueModal isOpen={isAdding} onClose={()=>setIsAdding(false)}/>
    </div>
  );
}
