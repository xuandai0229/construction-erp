'use client';

import { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { useERPStore } from '@/store/erpStore';
import { formatVnd, formatDate } from '@/app/components/dashboard-data';
import AddPaymentModal from '@/app/components/modals/AddPaymentModal';
import PaymentHistoryModal from '@/app/components/modals/PaymentHistoryModal';

const KPICard = ({ label, value, sub, color, borderColor }: { label: string; value: string; sub?: string; color?: string; borderColor?: string }) => (
  <div style={{ background:'white',border:'1px solid var(--border)',borderRadius:'6px',padding:'12px 16px',borderLeft:`3px solid ${borderColor??color??'var(--brand)'}` }}>
    <div style={{ fontSize:'11px',fontWeight:600,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em' }}>{label}</div>
    <div style={{ fontSize:'22px',fontWeight:700,color:color??'var(--text-primary)',lineHeight:1.2,marginTop:'3px' }}>{value}</div>
    {sub&&<div style={{ fontSize:'11px',color:'var(--text-muted)',marginTop:'2px' }}>{sub}</div>}
  </div>
);

const SectionHeader = ({ label, color, count }: { label: string; color: string; count: number }) => (
  <div style={{ display:'flex',alignItems:'center',gap:'10px',marginBottom:'8px' }}>
    <div style={{ width:'3px',height:'16px',borderRadius:'2px',background:color,flexShrink:0 }}/>
    <span style={{ fontSize:'14px',fontWeight:700,color:'var(--text-primary)' }}>{label}</span>
    <span style={{ fontSize:'11px',fontWeight:600,color:'white',background:color,padding:'1px 7px',borderRadius:'4px' }}>{count}</span>
  </div>
);

export default function DebtPage() {
  const [sidebarCollapsed,setSidebarCollapsed]=useState(false);
  const [selectedInvoice,setSelectedInvoice]=useState<string|null>(null);
  const [historyInvoice,setHistoryInvoice]=useState<string|null>(null);
  const [arFilter,setArFilter]=useState('ALL');
  const [apFilter,setApFilter]=useState('ALL');

  const invoices        = useERPStore(s=>s.invoices);
  const costs           = useERPStore(s=>s.costs);
  const updateCost      = useERPStore(s=>s.updateCost);
  const init            = useERPStore(s=>s.init);
  const isInit          = useERPStore(s=>s.initialized);
  const currentProjectId= useERPStore(s=>s.currentProjectId);

  useEffect(()=>{ init(); },[init]);

  const handlePayCost=(id:string)=>{ updateCost(currentProjectId,id,{ status:'paid' }); };

  const arList=useMemo(()=>{
    let list=invoices;
    if(arFilter==='pending') list=list.filter(i=>i.remainingAmount>0);
    if(arFilter==='paid')    list=list.filter(i=>i.remainingAmount===0);
    return list;
  },[invoices,arFilter]);

  const apList=useMemo(()=>{
    let list=costs.filter(c=>c.status!=='paid');
    if(apFilter==='overdue') list=list.filter(c=>{ const d=new Date(c.date); const diff=(Date.now()-d.getTime())/(1000*60*60*24); return diff>30; });
    return list;
  },[costs,apFilter]);

  // KPIs
  const totalAR       = invoices.reduce((s,i)=>s+i.remainingAmount,0);
  const totalARAll    = invoices.reduce((s,i)=>s+i.amount,0);
  const totalARPaid   = invoices.reduce((s,i)=>s+i.paidAmount,0);
  const totalAP       = costs.filter(c=>c.status!=='paid').reduce((s,c)=>s+c.amount,0);
  const arPaidCount   = invoices.filter(i=>i.remainingAmount===0).length;
  const arPendingCount= invoices.filter(i=>i.remainingAmount>0).length;
  const apCount       = costs.filter(c=>c.status!=='paid').length;

  // Aging
  const getAgingBucket=(dateStr:string)=>{
    const diff=(Date.now()-new Date(dateStr).getTime())/(1000*60*60*24);
    if(diff<=30) return '0–30';
    if(diff<=60) return '31–60';
    if(diff<=90) return '61–90';
    return '90+';
  };

  const apAging=costs.filter(c=>c.status!=='paid').reduce((acc,c)=>{
    const b=getAgingBucket(c.date);
    acc[b]=(acc[b]??0)+c.amount;
    return acc;
  },{} as Record<string,number>);

  if(!isInit) return (
    <div className="erp-shell">
      <Sidebar collapsed={sidebarCollapsed} onToggle={()=>setSidebarCollapsed(!sidebarCollapsed)}/>
      <div className={`erp-main ${sidebarCollapsed?'sidebar-collapsed':''}`}>
        <Header title="Công nợ & Thanh toán"/>
        <main className="erp-content"><div className="erp-card h-64 skeleton"/></main>
      </div>
    </div>
  );

  return (
    <div className="erp-shell">
      <Sidebar collapsed={sidebarCollapsed} onToggle={()=>setSidebarCollapsed(!sidebarCollapsed)}/>
      <div className={`erp-main ${sidebarCollapsed?'sidebar-collapsed':''}`}>
        <Header title="Công nợ & Thanh toán"/>
        <main className="erp-content" style={{ display:'flex',flexDirection:'column',gap:'20px' }}>

          {/* Page Header */}
          <div>
            <h2 style={{ fontSize:'20px',fontWeight:700,color:'var(--text-primary)' }}>AR / AP Dashboard</h2>
            <p style={{ fontSize:'12px',color:'var(--text-secondary)',marginTop:'2px' }}>Phải thu (Accounts Receivable) — Phải trả (Accounts Payable)</p>
          </div>

          {/* KPI Row */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'12px' }}>
            <KPICard label="Tổng phải thu (AR)"    value={`${(totalAR/1e9).toFixed(2)} tỷ`}     sub={`${arPendingCount} hóa đơn`}       color="var(--brand)"   />
            <KPICard label="Đã thu (AR)"            value={`${(totalARPaid/1e9).toFixed(2)} tỷ`} sub={`${arPaidCount} hoàn tất`}         color="var(--success)" />
            <KPICard label="Tổng phải trả (AP)"     value={`${(totalAP/1e9).toFixed(2)} tỷ`}     sub={`${apCount} khoản chưa trả`}       color="var(--danger)"  />
            <KPICard label="AR / AP Net"            value={`${((totalARAll-totalAP)/1e9).toFixed(2)} tỷ`} sub={totalARAll>totalAP?'Dương':'Âm'} color={totalARAll>totalAP?'var(--success)':'var(--danger)'} />
            <KPICard label="Tổng giao dịch"         value={String(invoices.length+apCount)}       sub="Cần xử lý"                         color="var(--brand)"   />
          </div>

          {/* Two-Column Layout */}
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',alignItems:'start' }}>

            {/* AR Section */}
            <div>
              <SectionHeader label="Phải thu khách hàng (AR)" color="var(--success)" count={invoices.length}/>
              <div style={{ background:'white',border:'1px solid var(--border)',borderRadius:'6px',overflow:'hidden' }}>
                <div style={{ padding:'8px 12px',borderBottom:'1px solid var(--border)',background:'#FAFBFC',display:'flex',gap:'6px',alignItems:'center' }}>
                  {[{k:'ALL',l:'Tất cả'},{k:'pending',l:'Còn nợ'},{k:'paid',l:'Hoàn tất'}].map(f=>(
                    <button key={f.k} onClick={()=>setArFilter(f.k)} style={{ height:'28px',padding:'0 10px',borderRadius:'4px',fontSize:'11px',fontWeight:arFilter===f.k?700:400,cursor:'pointer',border:'1px solid',borderColor:arFilter===f.k?'var(--success)':'var(--border)',background:arFilter===f.k?'var(--success)':'white',color:arFilter===f.k?'white':'var(--text-secondary)',transition:'all 0.12s' }}>{f.l}</button>
                  ))}
                  <span style={{ marginLeft:'auto',fontSize:'11px',color:'var(--text-muted)' }}>{arList.length} hóa đơn</span>
                </div>
                <div style={{ overflowX:'auto' }}>
                  <table className="erp-table zebra" style={{ minWidth:'520px' }}>
                    <thead>
                      <tr>
                        <th style={{ width:'90px' }}>Mã HĐ</th>
                        <th style={{ width:'90px' }}>Ngày</th>
                        <th className="text-right">Tổng tiền</th>
                        <th className="text-right">Đã thu</th>
                        <th className="text-right">Còn nợ</th>
                        <th className="text-center" style={{ width:'80px' }}>T.thái</th>
                        <th className="text-center" style={{ width:'110px' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {arList.map(inv=>(
                        <tr key={inv.id}>
                          <td style={{ fontSize:'11px',fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase' }}>{inv.id.slice(0,8)}</td>
                          <td style={{ fontSize:'12px',color:'var(--text-secondary)',whiteSpace:'nowrap' }}>{formatDate(inv.issuedDate)}</td>
                          <td className="text-right text-money" style={{ fontWeight:600 }}>{formatVnd(inv.amount)}</td>
                          <td className="text-right text-money" style={{ color:'var(--success)',fontWeight:600 }}>{formatVnd(inv.paidAmount)}</td>
                          <td className="text-right text-money" style={{ color:inv.remainingAmount>0?'var(--danger)':'var(--success)',fontWeight:700 }}>{formatVnd(inv.remainingAmount)}</td>
                          <td style={{ textAlign:'center' }}>
                            <span style={{ fontSize:'10px',fontWeight:700,textTransform:'uppercase',padding:'2px 6px',borderRadius:'4px',background:inv.remainingAmount===0?'rgba(22,163,74,0.08)':'rgba(220,38,38,0.08)',color:inv.remainingAmount===0?'var(--success)':'var(--danger)' }}>
                              {inv.remainingAmount===0?'Hoàn tất':'Còn nợ'}
                            </span>
                          </td>
                          <td style={{ textAlign:'center' }}>
                            <div style={{ display:'flex',gap:'4px',justifyContent:'center' }}>
                              {inv.remainingAmount>0&&(
                                <button onClick={()=>setSelectedInvoice(inv.id)} style={{ height:'26px',padding:'0 8px',borderRadius:'4px',border:'none',background:'var(--brand)',color:'white',fontSize:'11px',fontWeight:600,cursor:'pointer' }}>Thu tiền</button>
                              )}
                              <button onClick={()=>setHistoryInvoice(inv.id)} style={{ height:'26px',padding:'0 8px',borderRadius:'4px',border:'1px solid var(--border)',background:'white',fontSize:'11px',fontWeight:500,cursor:'pointer',color:'var(--text-secondary)' }}>Lịch sử</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {arList.length===0&&(
                        <tr><td colSpan={7} style={{ textAlign:'center',padding:'32px 16px',color:'var(--text-muted)',fontSize:'12px',fontStyle:'italic' }}>Chưa có hóa đơn phát hành</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {arList.length>0&&(
                  <div style={{ padding:'8px 16px',borderTop:'2px solid var(--border)',background:'#F0F4FF',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                    <span style={{ fontSize:'12px',fontWeight:700,color:'var(--text-primary)' }}>Tổng AR</span>
                    <div style={{ display:'flex',gap:'16px',fontSize:'12px' }}>
                      <span>Tổng: <strong style={{ color:'var(--brand)' }}>{formatVnd(invoices.reduce((s,i)=>s+i.amount,0))}</strong></span>
                      <span>Còn lại: <strong style={{ color:'var(--danger)' }}>{formatVnd(totalAR)}</strong></span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* AP Section */}
            <div>
              <SectionHeader label="Phải trả nhà cung cấp (AP)" color="var(--danger)" count={apCount}/>
              <div style={{ background:'white',border:'1px solid var(--border)',borderRadius:'6px',overflow:'hidden' }}>
                <div style={{ padding:'8px 12px',borderBottom:'1px solid var(--border)',background:'#FAFBFC',display:'flex',gap:'6px',alignItems:'center' }}>
                  {[{k:'ALL',l:'Tất cả'},{k:'overdue',l:'>30 ngày'}].map(f=>(
                    <button key={f.k} onClick={()=>setApFilter(f.k)} style={{ height:'28px',padding:'0 10px',borderRadius:'4px',fontSize:'11px',fontWeight:apFilter===f.k?700:400,cursor:'pointer',border:'1px solid',borderColor:apFilter===f.k?'var(--danger)':'var(--border)',background:apFilter===f.k?'var(--danger)':'white',color:apFilter===f.k?'white':'var(--text-secondary)',transition:'all 0.12s' }}>{f.l}</button>
                  ))}
                  <span style={{ marginLeft:'auto',fontSize:'11px',color:'var(--text-muted)' }}>{apList.length} khoản</span>
                </div>
                <div style={{ overflowX:'auto' }}>
                  <table className="erp-table zebra" style={{ minWidth:'460px' }}>
                    <thead>
                      <tr>
                        <th style={{ width:'90px' }}>Ngày</th>
                        <th>Nội dung</th>
                        <th style={{ width:'90px' }}>Loại</th>
                        <th className="text-right" style={{ width:'130px' }}>Số tiền (VND)</th>
                        <th className="text-center" style={{ width:'130px' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apList.map(cost=>{
                        const daysOld=Math.floor((Date.now()-new Date(cost.date).getTime())/(1000*60*60*24));
                        const isOverdue=daysOld>30;
                        return (
                          <tr key={cost.id} style={{ background:isOverdue?'rgba(220,38,38,0.02)':'white' }}>
                            <td style={{ fontSize:'12px',color:'var(--text-secondary)',whiteSpace:'nowrap' }}>
                              {formatDate(cost.date)}
                              {isOverdue&&<div style={{ fontSize:'10px',color:'var(--danger)',fontWeight:700 }}>{daysOld} ngày</div>}
                            </td>
                            <td style={{ fontSize:'13px',fontWeight:600,color:'var(--text-primary)' }}>{cost.supplier ?? cost.note ?? cost.costType}</td>
                            <td>
                              <span style={{ fontSize:'10px',fontWeight:700,textTransform:'uppercase',padding:'2px 6px',borderRadius:'3px',background:'var(--bg-muted)',color:'var(--text-secondary)' }}>{cost.costType}</span>
                            </td>
                            <td className="text-right text-money" style={{ color:isOverdue?'var(--danger)':'var(--text-primary)',fontWeight:700 }}>{formatVnd(cost.amount)}</td>
                            <td style={{ textAlign:'center' }}>
                              <button onClick={()=>handlePayCost(cost.id)} style={{ height:'28px',padding:'0 10px',borderRadius:'4px',border:'none',background:'var(--brand)',color:'white',fontSize:'11px',fontWeight:600,cursor:'pointer' }}>
                                Xác nhận thanh toán
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {apList.length===0&&(
                        <tr><td colSpan={5} style={{ textAlign:'center',padding:'32px 16px',color:'var(--text-muted)',fontSize:'12px',fontStyle:'italic' }}>Không có khoản phải trả</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {apList.length>0&&(
                  <div style={{ padding:'8px 16px',borderTop:'2px solid var(--border)',background:'rgba(220,38,38,0.04)',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                    <span style={{ fontSize:'12px',fontWeight:700,color:'var(--text-primary)' }}>Tổng AP</span>
                    <strong style={{ fontSize:'13px',color:'var(--danger)' }}>{formatVnd(totalAP)}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Aging Analysis */}
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px' }}>
            <div style={{ background:'white',border:'1px solid var(--border)',borderRadius:'6px',overflow:'hidden' }}>
              <div style={{ padding:'10px 16px',borderBottom:'1px solid var(--border)',background:'#FAFBFC' }}>
                <span style={{ fontSize:'13px',fontWeight:600,color:'var(--text-primary)' }}>Phân tích tuổi nợ AP</span>
              </div>
              <div style={{ padding:'12px 16px',display:'flex',flexDirection:'column',gap:'8px' }}>
                {['0–30','31–60','61–90','90+'].map(bucket=>{
                  const amt=apAging[bucket]??0;
                  const maxAmt=Math.max(...Object.values(apAging),1);
                  const pct=(amt/maxAmt)*100;
                  const col=bucket==='0–30'?'var(--success)':bucket==='31–60'?'var(--warning)':bucket==='61–90'?'#F97316':'var(--danger)';
                  return (
                    <div key={bucket} style={{ display:'flex',alignItems:'center',gap:'10px' }}>
                      <div style={{ width:'60px',fontSize:'11px',fontWeight:600,color:col,textAlign:'right',flexShrink:0 }}>{bucket} ngày</div>
                      <div style={{ flex:1,height:'16px',background:'var(--bg-muted)',borderRadius:'3px',overflow:'hidden' }}>
                        <div style={{ height:'100%',width:`${pct}%`,background:col,borderRadius:'3px',transition:'width 0.3s' }}/>
                      </div>
                      <div style={{ width:'100px',fontSize:'11px',fontWeight:700,color:'var(--text-primary)',textAlign:'right',flexShrink:0,whiteSpace:'nowrap' }}>
                        {formatVnd(amt)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AR Summary */}
            <div style={{ background:'white',border:'1px solid var(--border)',borderRadius:'6px',overflow:'hidden' }}>
              <div style={{ padding:'10px 16px',borderBottom:'1px solid var(--border)',background:'#FAFBFC' }}>
                <span style={{ fontSize:'13px',fontWeight:600,color:'var(--text-primary)' }}>Tóm tắt Công nợ</span>
              </div>
              <div style={{ padding:'12px 16px' }}>
                {[
                  { label:'Tổng phải thu (AR)',    value:formatVnd(totalARAll),  color:'var(--brand)'   },
                  { label:'Đã thu',                value:formatVnd(totalARPaid), color:'var(--success)' },
                  { label:'Còn lại phải thu',      value:formatVnd(totalAR),     color:totalAR>0?'var(--danger)':'var(--success)' },
                  { label:'Tổng phải trả (AP)',    value:formatVnd(totalAP),     color:'var(--danger)'  },
                  { label:'Net (AR – AP)',          value:formatVnd(totalARAll-totalAP), color:totalARAll>totalAP?'var(--success)':'var(--danger)' },
                ].map(row=>(
                  <div key={row.label} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:'1px solid var(--border)' }}>
                    <span style={{ fontSize:'12px',color:'var(--text-secondary)' }}>{row.label}</span>
                    <span style={{ fontSize:'13px',fontWeight:700,color:row.color }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </main>
      </div>

      <AddPaymentModal isOpen={!!selectedInvoice} onClose={()=>setSelectedInvoice(null)} invoiceId={selectedInvoice||undefined}/>
      <PaymentHistoryModal isOpen={!!historyInvoice} onClose={()=>setHistoryInvoice(null)} invoiceId={historyInvoice||undefined}/>
    </div>
  );
}
