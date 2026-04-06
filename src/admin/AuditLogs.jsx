// Audit Logs Panel
import { useState } from 'react';

const ACTION_ICONS = {
  'Patient Registered':    { icon:'👤', color:'#6b46c1' },
  'Triage Completed':      { icon:'❤️', color:'#dc2626' },
  'Emergency Triggered':   { icon:'🚨', color:'#7c0000' },
  'Consultation Started':  { icon:'💬', color:'#1a6fd4' },
  'Message Sent':          { icon:'📨', color:'#0a8a6a' },
  'Prescription Written':  { icon:'💊', color:'#c47d0a' },
};
const ROLE_COLOR = { asha:'#c47d0a', doctor:'#1a6fd4', patient:'#0a8a6a', admin:'#6b46c1' };
const ROLE_BG    = { asha:'#fffbeb', doctor:'#eff6ff', patient:'#f0fdf4', admin:'#f5f3ff' };

// Auto-log helper — call from other components to register audit events
export function addAuditLog(role, action, user) {
  const logs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
  logs.unshift({
    id: `L${Date.now()}`,
    role, action, user: user || role,
    timestamp: new Date().toISOString(),
    deviceId: `DEV-${Math.floor(Math.random()*9000+1000)}`,
  });
  localStorage.setItem('auditLogs', JSON.stringify(logs.slice(0, 200))); // keep last 200
}

export default function AuditLogs({ data }) {
  const [filterRole, setFilterRole] = useState('All');
  const [filterAction, setFilterAction] = useState('All');
  const logs = data.auditLogs || [];

  const roles   = ['All', ...new Set(logs.map(l=>l.role).filter(Boolean))];
  const actions = ['All', ...Object.keys(ACTION_ICONS)];

  const filtered = logs.filter(l =>
    (filterRole   === 'All' || l.role   === filterRole) &&
    (filterAction === 'All' || l.action === filterAction)
  );

  const fmtTime = ts => {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit', second:'2-digit' });
  };

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
        <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>📝 Audit Logs</div>
        <div style={{ display:'flex', gap:10 }}>
          <select value={filterRole} onChange={e=>setFilterRole(e.target.value)}
            style={{ padding:'7px 12px', border:'1px solid var(--border)', borderRadius:8, fontSize:13, color:'var(--text)', background:'#fff', fontFamily:'var(--font)' }}>
            {roles.map(r=><option key={r} value={r}>{r==='All'?'All Roles':r}</option>)}
          </select>
          <select value={filterAction} onChange={e=>setFilterAction(e.target.value)}
            style={{ padding:'7px 12px', border:'1px solid var(--border)', borderRadius:8, fontSize:13, color:'var(--text)', background:'#fff', fontFamily:'var(--font)' }}>
            {actions.map(a=><option key={a} value={a}>{a==='All'?'All Actions':a}</option>)}
          </select>
        </div>
      </div>

      <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:16, overflow:'hidden' }}>
        <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 20px', borderBottom:'1px solid var(--border)', background:'var(--surface2)' }}>
          <span style={{ fontSize:11, color:'var(--text3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em' }}>Showing {filtered.length} of {logs.length} entries</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding:40, textAlign:'center', color:'var(--text3)' }}>No audit logs found</div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#fafbfc' }}>
                  {['Action','Role','User / ASHA','Timestamp','Device ID'].map(h=>(
                    <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:11, color:'var(--text3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0,100).map((log,i)=>{
                  const cfg = ACTION_ICONS[log.action] || { icon:'📌', color:'#8896aa' };
                  return (
                    <tr key={log.id} style={{ borderTop:'1px solid var(--border)', background:i%2?'#fafbfc':'#fff' }}>
                      <td style={{ padding:'11px 16px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ fontSize:16 }}>{cfg.icon}</span>
                          <span style={{ fontWeight:600, color:cfg.color }}>{log.action}</span>
                        </div>
                      </td>
                      <td style={{ padding:'11px 16px' }}>
                        <span style={{ padding:'3px 10px', borderRadius:99, background:ROLE_BG[log.role]||'#f1f4f8', color:ROLE_COLOR[log.role]||'var(--text3)', fontSize:12, fontWeight:600, textTransform:'capitalize' }}>
                          {log.role}
                        </span>
                      </td>
                      <td style={{ padding:'11px 16px', color:'var(--text2)', fontWeight:500 }}>{log.user || '—'}</td>
                      <td style={{ padding:'11px 16px', color:'var(--text3)', fontFamily:'var(--mono)', fontSize:12, whiteSpace:'nowrap' }}>{fmtTime(log.timestamp)}</td>
                      <td style={{ padding:'11px 16px', color:'var(--text3)', fontFamily:'var(--mono)', fontSize:12 }}>{log.deviceId || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
