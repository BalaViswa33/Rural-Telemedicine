// Emergency Alerts Panel
import { useState } from 'react';

export default function EmergencyPanel({ data }) {
  const [alerts, setAlerts] = useState(() => {
    const stored = JSON.parse(localStorage.getItem('emergencyAlerts') || '[]');
    // Also derive from vitals
    const derived = (data.vitals || [])
      .filter(v => v.risk === 'emergency' || v.emergencyTriggered)
      .map(v => {
        const patient = (data.patients || []).find(p => p.id === v.patientId);
        return {
          id: `auto-${v.id}`,
          patientName: patient?.name || v.patientId,
          village: patient?.village || '—',
          risk: v.risk,
          time: v.createdAt,
          status: 'Pending',
        };
      });
    // Merge stored + derived (avoid dupes)
    const ids = new Set(stored.map(a=>a.id));
    return [...stored, ...derived.filter(d=>!ids.has(d.id))];
  });

  const resolve = (id) => {
    const updated = alerts.map(a => a.id === id ? {...a, status:'Resolved'} : a);
    setAlerts(updated);
    localStorage.setItem('emergencyAlerts', JSON.stringify(updated));
  };

  const statusColor = { Pending:'#c47d0a', Delivered:'#1a6fd4', Resolved:'#16a34a' };
  const statusBg    = { Pending:'#fffbeb', Delivered:'#eff6ff', Resolved:'#f0fdf4' };
  const riskColor   = { high:'#dc2626', emergency:'#7c0000' };

  const fmtTime = ts => {
    if (!ts) return '—';
    const diff = (Date.now() - new Date(ts)) / 60000;
    if (diff < 60) return `${Math.round(diff)}m ago`;
    if (diff < 1440) return `${Math.round(diff/60)}h ago`;
    return `${Math.round(diff/1440)}d ago`;
  };

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>🚨 Emergency Alerts</div>
        <div style={{ padding:'4px 12px', borderRadius:99, background:'#fef2f2', color:'#dc2626', fontSize:12, fontWeight:700 }}>
          {alerts.filter(a=>a.status==='Pending').length} Pending
        </div>
      </div>

      {alerts.length === 0 ? (
        <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:16, padding:40, textAlign:'center', color:'var(--text3)' }}>
          <div style={{ fontSize:32, marginBottom:8 }}>✅</div>
          No emergency alerts
        </div>
      ) : (
        <div style={{ display:'grid', gap:10 }}>
          {alerts.map(alert => (
            <div key={alert.id} style={{ background:'#fff', border:`1px solid ${alert.status==='Pending' ? '#fecaca' : 'var(--border)'}`, borderRadius:14, padding:'16px 20px', display:'flex', alignItems:'center', gap:16 }}>
              <div style={{ width:42, height:42, borderRadius:11, background: alert.status==='Pending' ? '#fef2f2' : '#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
                {alert.status === 'Resolved' ? '✅' : '🚨'}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <span style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{alert.patientName}</span>
                  <span style={{ fontSize:12, color:'var(--text3)' }}>•</span>
                  <span style={{ fontSize:12, color:'var(--text3)' }}>{alert.village}</span>
                  <span style={{ fontSize:11, padding:'2px 8px', borderRadius:99, background:'#fef2f2', color:riskColor[alert.risk]||'#dc2626', fontWeight:700, textTransform:'capitalize' }}>{alert.risk}</span>
                </div>
                <div style={{ fontSize:12, color:'var(--text3)', fontFamily:'var(--mono)' }}>{fmtTime(alert.time)}</div>
              </div>
              <span style={{ padding:'4px 12px', borderRadius:99, background:statusBg[alert.status], color:statusColor[alert.status], fontSize:12, fontWeight:700, flexShrink:0 }}>
                {alert.status}
              </span>
              {alert.status !== 'Resolved' && (
                <button onClick={() => resolve(alert.id)} style={{ padding:'7px 14px', borderRadius:8, background:'#6b46c1', color:'#fff', border:'none', fontSize:12, fontWeight:600, cursor:'pointer', flexShrink:0 }}
                  onMouseEnter={e=>e.currentTarget.style.background='#553c9a'}
                  onMouseLeave={e=>e.currentTarget.style.background='#6b46c1'}>
                  Resolve
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
