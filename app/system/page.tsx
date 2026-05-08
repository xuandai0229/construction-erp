'use client';

import { useState } from 'react';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { useERPStore } from '@/store/erpStore';
import { UserRole } from '@/app/types';

const ROLES: { role: UserRole; label: string; desc: string; perms: string[] }[] = [
  { role:'ADMIN',      label:'Quản trị viên', desc:'Toàn quyền hệ thống', perms:['Tất cả quyền','Khóa/Mở kỳ','Xóa dữ liệu','Cài đặt hệ thống'] },
  { role:'ACCOUNTANT', label:'Kế toán',       desc:'Quản lý tài chính',  perms:['Quản lý chi phí','Hóa đơn & thanh toán','Báo cáo tài chính','Không thể xóa'] },
  { role:'MANAGER',    label:'Quản lý DA',    desc:'Quản lý dự án',       perms:['Xem báo cáo','Thêm chi phí & WBS','Không sửa tài chính','Không xóa'] },
  { role:'VIEWER',     label:'Xem báo cáo',   desc:'Chỉ đọc',             perms:['Xem tất cả','Không chỉnh sửa'] },
];

const Tab = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button onClick={onClick} style={{
    height:'38px', padding:'0 18px', border:'none', borderRadius:'0', cursor:'pointer',
    fontSize:'13px', fontWeight:active?600:400, background:'transparent',
    color:active?'var(--brand)':'var(--text-secondary)',
    borderBottom:`2px solid ${active?'var(--brand)':'transparent'}`,
    transition:'all 0.12s',
  }}>
    {label}
  </button>
);

export default function SystemPage() {
  const userRole     = useERPStore(s=>s.userRole);
  const setUserRole  = useERPStore(s=>s.setUserRole);
  const getFullBackup= useERPStore(s=>s.getFullBackup);
  const restoreBackup= useERPStore(s=>s.restoreBackup);

  const [tab,setTab]         = useState<'roles'|'backup'|'company'|'workflow'>('roles');
  const [backupJson,setBackupJson] = useState('');
  const [status,setStatus]   = useState({ message:'', type:'' });
  const [collapsed,setCollapsed] = useState(false);

  const handleExport=()=>{
    const json=getFullBackup();
    const blob=new Blob([json],{ type:'application/json' });
    const url=URL.createObjectURL(blob);
    const link=document.createElement('a');
    link.href=url; link.download=`erp_backup_${new Date().toISOString().split('T')[0]}.json`; link.click();
    setStatus({ message:'Đã xuất file backup thành công!', type:'success' });
  };

  const handleImport=async()=>{
    if(!backupJson) return setStatus({ message:'Vui lòng dán dữ liệu JSON vào ô dưới', type:'error' });
    if(window.confirm('CẢNH BÁO: Hành động này sẽ GHI ĐÈ toàn bộ dữ liệu hiện tại. Bạn có chắc chắn?')) {
      const res=await restoreBackup(backupJson);
      if(res.success) {
        setStatus({ message:'Đã khôi phục dữ liệu thành công! Đang tải lại...', type:'success' });
        setTimeout(()=>window.location.reload(),1500);
      } else {
        setStatus({ message:res.error||'Lỗi khôi phục dữ liệu', type:'error' });
      }
    }
  };

  const currentRole=ROLES.find(r=>r.role===userRole);

  return (
    <div className="erp-shell">
      <Sidebar collapsed={collapsed} onToggle={()=>setCollapsed(!collapsed)}/>
      <div className={`erp-main ${collapsed?'sidebar-collapsed':''}`}>
        <Header title="Cài đặt Hệ thống"/>
        <main className="erp-content" style={{ display:'flex',flexDirection:'column',gap:'20px' }}>

          {/* Page Header */}
          <div>
            <h2 style={{ fontSize:'20px',fontWeight:700,color:'var(--text-primary)' }}>Quản trị Hệ thống</h2>
            <p style={{ fontSize:'12px',color:'var(--text-secondary)',marginTop:'2px' }}>Phân quyền, bảo mật, sao lưu và cấu hình hệ thống</p>
          </div>

          {/* Tabs */}
          <div style={{ background:'white',border:'1px solid var(--border)',borderRadius:'6px',overflow:'hidden' }}>
            <div style={{ display:'flex',borderBottom:'1px solid var(--border)',padding:'0 8px',background:'#FAFBFC' }}>
              {([
                { key:'roles',    label:'Phân quyền' },
                { key:'backup',   label:'Sao lưu & Khôi phục' },
                { key:'company',  label:'Thông tin công ty' },
                { key:'workflow', label:'Luồng phê duyệt' },
              ] as const).map(t=>(
                <Tab key={t.key} label={t.label} active={tab===t.key} onClick={()=>setTab(t.key)}/>
              ))}
            </div>

            {/* TAB: ROLES */}
            {tab==='roles'&&(
              <div style={{ padding:'20px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px' }}>
                {/* Role Selector */}
                <div>
                  <div style={{ fontSize:'13px',fontWeight:600,color:'var(--text-primary)',marginBottom:'12px' }}>Chọn vai trò hiện tại</div>
                  <div style={{ display:'flex',flexDirection:'column',gap:'8px' }}>
                    {ROLES.map(r=>(
                      <button key={r.role} onClick={()=>setUserRole(r.role)} style={{
                        display:'flex',alignItems:'center',justifyContent:'space-between',
                        padding:'12px 16px',borderRadius:'6px',border:'1px solid',cursor:'pointer',textAlign:'left',
                        borderColor:userRole===r.role?'var(--brand)':'var(--border)',
                        background:userRole===r.role?'rgba(37,99,235,0.05)':'white',
                        transition:'all 0.12s',
                      }}>
                        <div>
                          <div style={{ fontSize:'13px',fontWeight:600,color:userRole===r.role?'var(--brand)':'var(--text-primary)' }}>{r.label}</div>
                          <div style={{ fontSize:'11px',color:'var(--text-muted)',marginTop:'2px' }}>{r.desc}</div>
                        </div>
                        {userRole===r.role&&(
                          <div style={{ height:'8px',width:'8px',borderRadius:'50%',background:'var(--brand)',flexShrink:0 }}/>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Permission Detail */}
                <div>
                  <div style={{ fontSize:'13px',fontWeight:600,color:'var(--text-primary)',marginBottom:'12px' }}>
                    Quyền hạn: <span style={{ color:'var(--brand)' }}>{currentRole?.label}</span>
                  </div>
                  <div style={{ background:'var(--bg-subtle)',border:'1px solid var(--border)',borderRadius:'6px',padding:'16px' }}>
                    {currentRole?.perms.map((p,i)=>(
                      <div key={i} style={{ display:'flex',alignItems:'center',gap:'8px',padding:'6px 0',borderBottom:i<(currentRole.perms.length-1)?'1px solid var(--border)':'none' }}>
                        <svg viewBox="0 0 24 24" style={{ height:'14px',width:'14px',color:'var(--success)',flexShrink:0 }} fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M9 12l2 2 4-4"/>
                        </svg>
                        <span style={{ fontSize:'13px',color:'var(--text-primary)' }}>{p}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop:'16px',padding:'12px',background:'rgba(37,99,235,0.05)',borderRadius:'6px',border:'1px solid rgba(37,99,235,0.15)' }}>
                    <div style={{ fontSize:'11px',fontWeight:700,color:'var(--brand)',textTransform:'uppercase',marginBottom:'6px' }}>Chú ý</div>
                    <p style={{ fontSize:'12px',color:'var(--text-secondary)',lineHeight:1.6 }}>
                      Thay đổi vai trò chỉ có hiệu lực trong phiên làm việc hiện tại và dùng để kiểm thử phân quyền. Trong môi trường production, vai trò được gán qua hệ thống xác thực.
                    </p>
                  </div>
                </div>

                {/* Role Matrix */}
                <div style={{ gridColumn:'1/-1' }}>
                  <div style={{ fontSize:'13px',fontWeight:600,color:'var(--text-primary)',marginBottom:'12px' }}>Ma trận phân quyền</div>
                  <div style={{ border:'1px solid var(--border)',borderRadius:'6px',overflow:'hidden' }}>
                    <table style={{ width:'100%',borderCollapse:'collapse',fontSize:'12px' }}>
                      <thead>
                        <tr style={{ background:'var(--bg-subtle)' }}>
                          <th style={{ padding:'8px 16px',textAlign:'left',fontWeight:600,color:'var(--text-secondary)',fontSize:'11px',textTransform:'uppercase',borderBottom:'1px solid var(--border)' }}>Chức năng</th>
                          {ROLES.map(r=>(
                            <th key={r.role} style={{ padding:'8px 16px',textAlign:'center',fontWeight:600,color:userRole===r.role?'var(--brand)':'var(--text-secondary)',fontSize:'11px',textTransform:'uppercase',borderBottom:'1px solid var(--border)' }}>{r.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { fn:'Xem báo cáo',       perms:[true,true,true,true] },
                          { fn:'Thêm chi phí',       perms:[true,true,true,false] },
                          { fn:'Quản lý doanh thu',  perms:[true,true,false,false] },
                          { fn:'Khóa kỳ kế toán',    perms:[true,true,false,false] },
                          { fn:'Quản lý dự án',      perms:[true,false,true,false] },
                          { fn:'Cài đặt hệ thống',   perms:[true,false,false,false] },
                          { fn:'Xóa dữ liệu',        perms:[true,false,false,false] },
                        ].map((row,i)=>(
                          <tr key={row.fn} style={{ background:i%2===0?'white':'var(--bg-subtle)' }}>
                            <td style={{ padding:'8px 16px',color:'var(--text-primary)',fontWeight:500,borderBottom:'1px solid var(--border)' }}>{row.fn}</td>
                            {row.perms.map((has,j)=>(
                              <td key={j} style={{ padding:'8px 16px',textAlign:'center',borderBottom:'1px solid var(--border)' }}>
                                {has?(
                                  <svg viewBox="0 0 24 24" style={{ height:'14px',width:'14px',color:'var(--success)',display:'inline-block' }} fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                ):(
                                  <svg viewBox="0 0 24 24" style={{ height:'14px',width:'14px',color:'var(--border-mid)',display:'inline-block' }} fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: BACKUP */}
            {tab==='backup'&&(
              <div style={{ padding:'20px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px' }}>
                {/* Export */}
                <div>
                  <div style={{ fontSize:'13px',fontWeight:600,color:'var(--text-primary)',marginBottom:'4px' }}>Xuất bản sao lưu</div>
                  <p style={{ fontSize:'12px',color:'var(--text-secondary)',marginBottom:'16px' }}>Xuất toàn bộ dữ liệu hệ thống ra file JSON để lưu trữ hoặc di chuyển.</p>
                  <button onClick={handleExport} style={{ display:'flex',alignItems:'center',gap:'8px',height:'40px',padding:'0 20px',background:'var(--success)',color:'white',border:'none',borderRadius:'6px',fontSize:'13px',fontWeight:600,cursor:'pointer',width:'100%',justifyContent:'center' }}>
                    <svg viewBox="0 0 24 24" style={{ height:'15px',width:'15px' }} fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5 5 5-5m-5 5V3"/></svg>
                    Tải xuống bản sao lưu (.json)
                  </button>
                  <div style={{ marginTop:'12px',padding:'12px',background:'rgba(22,163,74,0.05)',borderRadius:'6px',border:'1px solid rgba(22,163,74,0.15)',fontSize:'12px',color:'var(--text-secondary)' }}>
                    File backup chứa toàn bộ: Dự án, WBS, Chi phí, Doanh thu, Hóa đơn, Thanh toán.
                  </div>
                </div>

                {/* Import */}
                <div>
                  <div style={{ fontSize:'13px',fontWeight:600,color:'var(--text-primary)',marginBottom:'4px' }}>Khôi phục dữ liệu</div>
                  <p style={{ fontSize:'12px',color:'var(--text-secondary)',marginBottom:'12px' }}>Dán nội dung file JSON vào ô dưới để khôi phục.</p>
                  <textarea value={backupJson} onChange={e=>setBackupJson(e.target.value)} placeholder="Dán nội dung file backup (.json) vào đây..." style={{ width:'100%',height:'120px',border:'1px solid var(--border)',borderRadius:'6px',padding:'10px',fontSize:'11px',fontFamily:'monospace',color:'var(--text-primary)',background:'var(--bg-subtle)',outline:'none',resize:'vertical',boxSizing:'border-box' }}/>
                  <button onClick={handleImport} style={{ marginTop:'8px',display:'flex',alignItems:'center',gap:'8px',height:'38px',padding:'0 16px',background:'white',color:'var(--danger)',border:'1px solid var(--danger)',borderRadius:'6px',fontSize:'13px',fontWeight:600,cursor:'pointer',width:'100%',justifyContent:'center' }}>
                    <svg viewBox="0 0 24 24" style={{ height:'14px',width:'14px' }} fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                    Khôi phục dữ liệu (ghi đè)
                  </button>
                  {status.message&&(
                    <div style={{ marginTop:'10px',padding:'10px 12px',borderRadius:'6px',fontSize:'12px',fontWeight:600,background:status.type==='success'?'rgba(22,163,74,0.08)':'rgba(220,38,38,0.08)',color:status.type==='success'?'var(--success)':'var(--danger)',border:`1px solid ${status.type==='success'?'rgba(22,163,74,0.2)':'rgba(220,38,38,0.2)'}` }}>
                      {status.message}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: COMPANY */}
            {tab==='company'&&(
              <div style={{ padding:'20px',maxWidth:'640px' }}>
                <div style={{ fontSize:'13px',fontWeight:600,color:'var(--text-primary)',marginBottom:'16px' }}>Thông tin công ty</div>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px' }}>
                  {[
                    { label:'Tên công ty',       placeholder:'Công ty TNHH ABC Construction' },
                    { label:'Mã số thuế (MST)',   placeholder:'0123456789' },
                    { label:'Địa chỉ',            placeholder:'123 Nguyễn Huệ, Q.1, TP.HCM' },
                    { label:'Số điện thoại',      placeholder:'028 1234 5678' },
                    { label:'Email',              placeholder:'admin@construction.vn' },
                    { label:'Đại diện pháp luật', placeholder:'Nguyễn Văn A' },
                  ].map(f=>(
                    <div key={f.label} style={{ display:'flex',flexDirection:'column',gap:'5px' }}>
                      <label style={{ fontSize:'11px',fontWeight:600,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.04em' }}>{f.label}</label>
                      <input type="text" placeholder={f.placeholder} style={{ height:'36px',padding:'0 10px',border:'1px solid var(--border)',borderRadius:'6px',fontSize:'13px',color:'var(--text-primary)',outline:'none',background:'white' }}/>
                    </div>
                  ))}
                </div>
                <button style={{ marginTop:'20px',height:'38px',padding:'0 24px',background:'var(--brand)',color:'white',border:'none',borderRadius:'6px',fontSize:'13px',fontWeight:600,cursor:'pointer' }}>
                  Lưu thông tin
                </button>
                <div style={{ marginTop:'12px',fontSize:'12px',color:'var(--text-muted)' }}>
                  Thông tin này hiển thị trên báo cáo và hóa đơn xuất ra.
                </div>
              </div>
            )}

            {/* TAB: WORKFLOW */}
            {tab==='workflow'&&(
              <div style={{ padding:'20px' }}>
                <div style={{ fontSize:'13px',fontWeight:600,color:'var(--text-primary)',marginBottom:'16px' }}>Cấu hình luồng phê duyệt</div>
                <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px' }}>
                  {[
                    { label:'Phê duyệt Chi phí',        threshold:'Trên 50 triệu VND',      approver:'Kế toán trưởng' },
                    { label:'Phê duyệt Hóa đơn',        threshold:'Tất cả hóa đơn',          approver:'Quản lý dự án' },
                    { label:'Phê duyệt Thanh toán',     threshold:'Trên 100 triệu VND',     approver:'Giám đốc' },
                    { label:'Chốt kỳ kế toán',          threshold:'Cuối tháng',              approver:'Kế toán trưởng' },
                    { label:'Xóa dữ liệu',              threshold:'Bất kỳ',                  approver:'Admin' },
                    { label:'Điều chỉnh dự toán',       threshold:'Thay đổi >10%',           approver:'Quản lý DA + KT' },
                  ].map(wf=>(
                    <div key={wf.label} style={{ padding:'14px 16px',border:'1px solid var(--border)',borderRadius:'6px',background:'var(--bg-subtle)' }}>
                      <div style={{ fontSize:'13px',fontWeight:600,color:'var(--text-primary)',marginBottom:'8px' }}>{wf.label}</div>
                      <div style={{ display:'flex',flexDirection:'column',gap:'4px' }}>
                        <div style={{ display:'flex',justifyContent:'space-between',fontSize:'11px' }}>
                          <span style={{ color:'var(--text-muted)' }}>Điều kiện</span>
                          <span style={{ fontWeight:600,color:'var(--text-secondary)' }}>{wf.threshold}</span>
                        </div>
                        <div style={{ display:'flex',justifyContent:'space-between',fontSize:'11px' }}>
                          <span style={{ color:'var(--text-muted)' }}>Người phê duyệt</span>
                          <span style={{ fontWeight:600,color:'var(--brand)' }}>{wf.approver}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:'16px',padding:'12px 16px',background:'rgba(37,99,235,0.05)',borderRadius:'6px',border:'1px solid rgba(37,99,235,0.15)',fontSize:'12px',color:'var(--text-secondary)' }}>
                  Cấu hình luồng phê duyệt hiện tại chỉ mang tính tham khảo. Tích hợp với module phê duyệt trong phiên bản tiếp theo.
                </div>
              </div>
            )}
          </div>

          {/* System Info */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px' }}>
            {[
              { label:'Phiên bản',         value:'v2.4.1 Enterprise' },
              { label:'Môi trường',        value:'Development' },
              { label:'Cơ sở dữ liệu',     value:'PostgreSQL / Prisma' },
              { label:'Cập nhật lần cuối', value:new Date().toLocaleDateString('vi-VN') },
            ].map(info=>(
              <div key={info.label} style={{ background:'white',border:'1px solid var(--border)',borderRadius:'6px',padding:'12px 16px' }}>
                <div style={{ fontSize:'11px',fontWeight:600,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em' }}>{info.label}</div>
                <div style={{ fontSize:'13px',fontWeight:600,color:'var(--text-primary)',marginTop:'4px' }}>{info.value}</div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
