// ASHA Performance Monitoring
import { useState } from 'react';

export default function AshaPerformance({ data }) {
  const { patients, vitals, consultations } = data;
  const [filterVillage, setFilterVillage] = useState('');

  // Collect unique ASHAs
  const ashaMap = {};
  patients.forEach(p => {
    if (!p.ashaId) return;
    if (!ashaMap[p.ashaId]) ashaMap[p.ashaId] = { name: p.ashaId, patients:0, visits:0, emergencies:0, pendingSync:0, lastActive: null };
    ashaMap[p.ashaId].patients++;
    if (!p.synced) ashaMap[p.ashaId].pendingSync++;
    const ts = new Date(p.createdAt);
    if (!ashaMap[p.ashaId].lastActive || ts > ashaMap[p.ashaId].lastActive) ashaMap[p.ashaId].lastActive = ts;
  });

  vitals.forEach(v => {
    if (!v.ashaId || !ashaMap[v.ashaId]) return;
    ashaMap[v.ashaId].visits++;
    if (v.emergencyTriggered) ashaMap[v.ashaId].emergencies++;
    if (!v.synced) ashaMap[v.ashaId].pendingSync++;
    const ts = new Date(v.createdAt);
    if (ts > (ashaMap[v.ashaId].lastActive || 0)) ashaMap[v.ashaId].lastActive = ts;
  });

  const villages = [...new Set(patients.map(p => p.village).filter(Boolean))];
  let rows = Object.values(ashaMap);

  if (filterVillage) {
    const ashasInVillage = new Set(patients.filter(p=>p.village===filterVillage).map(p=>p.ashaId));
    rows = rows.filter(r => ashasInVillage.has(r.name));
  }

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
        <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>👩‍⚕️ ASHA Performance</div>
        <select value={filterVillage} onChange={e=>setFilterVillage(e.target.value)}
          style={{ padding:'7px 12px', border:'1px solid var(--border)', borderRadius:8, fontSize:13, color:'var(--text)', background:'#fff', fontFamily:'var(--font)' }}>
          <option value="">All Villages</option>
          {villages.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>

      <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:16, overflow:'hidden' }}>
        {rows.length === 0 ? (
          <div style={{ padding:40, textAlign:'center', color:'var(--text3)' }}>No ASHA data available</div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'var(--surface2)' }}>
                  {['ASHA Name','Patients Registered','Visits Logged','Emergencies Triggered','Pending Sync','Last Active'].map(h => (
                    <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:11, color:'var(--text3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.name} style={{ borderTop:'1px solid var(--border)', background: i%2 ? '#fafbfc' : '#fff' }}>
                    <td style={{ padding:'12px 16px', fontWeight:600, color:'var(--text)' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:30, height:30, borderRadius:8, background:'#c47d0a18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'#c47d0a' }}>
                          {r.name[0]}
                        </div>
                        {r.name}
                      </div>
                    </td>
                    <td style={{ padding:'12px 16px', textAlign:'center', fontFamily:'var(--mono)', fontWeight:700, color:'#6b46c1' }}>{r.patients}</td>
                    <td style={{ padding:'12px 16px', textAlign:'center', fontFamily:'var(--mono)', fontWeight:700, color:'#1a6fd4' }}>{r.visits}</td>
                    <td style={{ padding:'12px 16px', textAlign:'center' }}>
                      <span style={{ padding:'3px 10px', borderRadius:99, background: r.emergencies>0 ? '#fef2f2' : '#f0fdf4', color: r.emergencies>0 ? '#dc2626' : '#16a34a', fontWeight:700, fontFamily:'var(--mono)' }}>
                        {r.emergencies}
                      </span>
                    </td>
                    <td style={{ padding:'12px 16px', textAlign:'center' }}>
                      <span style={{ padding:'3px 10px', borderRadius:99, background: r.pendingSync>0 ? '#fffbeb' : '#f0fdf4', color: r.pendingSync>0 ? '#c47d0a' : '#16a34a', fontWeight:700, fontFamily:'var(--mono)' }}>
                        {r.pendingSync}
                      </span>
                    </td>
                    <td style={{ padding:'12px 16px', color:'var(--text3)', fontFamily:'var(--mono)', fontSize:12 }}>{fmtTime(r.lastActive)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
