// Offline Messages to Doctor Panel (read-only for Admin)
import { useState } from 'react';

export default function MessagesPanel({ data }) {
  const [filter, setFilter] = useState('All');
  const messages = data.messages || [];

  const filtered = filter === 'All' ? messages : messages.filter(m => m.syncStatus === filter);
  const statusColor = { Pending:'#c47d0a', Synced:'#16a34a', Failed:'#dc2626' };
  const statusBg    = { Pending:'#fffbeb', Synced:'#f0fdf4', Failed:'#fef2f2' };

  const fmtTime = ts => {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });
  };

  const tabs = ['All','Pending','Synced','Failed'];
  const counts = tabs.reduce((acc,t) => ({
    ...acc,
    [t]: t === 'All' ? messages.length : messages.filter(m=>m.syncStatus===t).length
  }), {});

  return (
    <div>
      <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:16 }}>💬 Patient Messages to Doctor (Offline)</div>

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{
            padding:'6px 14px', borderRadius:99,
            background: filter===t ? '#6b46c1' : '#fff',
            color: filter===t ? '#fff' : 'var(--text2)',
            border: `1px solid ${filter===t ? '#6b46c1' : 'var(--border)'}`,
            fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'var(--font)',
          }}>
            {t} <span style={{ opacity:.75 }}>({counts[t]})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:16, padding:40, textAlign:'center', color:'var(--text3)' }}>
          No messages found
        </div>
      ) : (
        <div style={{ display:'grid', gap:10 }}>
          {filtered.map(msg => (
            <div key={msg.id} style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:14, padding:'16px 20px' }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
                <div style={{ width:40, height:40, borderRadius:10, background:'#6b46c118', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>💬</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6, flexWrap:'wrap' }}>
                    <span style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{msg.patientName}</span>
                    <span style={{ fontSize:12, color:'var(--text3)', fontFamily:'var(--mono)' }}>ID: {msg.patientId}</span>
                    <span style={{ fontSize:12, color:'var(--text3)' }}>•</span>
                    <span style={{ fontSize:12, color:'var(--text3)' }}>📍 {msg.village}</span>
                    <span style={{ marginLeft:'auto', padding:'3px 10px', borderRadius:99, background:statusBg[msg.syncStatus]||'#f1f4f8', color:statusColor[msg.syncStatus]||'var(--text3)', fontSize:12, fontWeight:600 }}>
                      {msg.syncStatus}
                    </span>
                  </div>
                  <div style={{ fontSize:14, color:'var(--text)', background:'var(--surface2)', padding:'10px 14px', borderRadius:10, marginBottom:8, fontStyle:'italic' }}>
                    "{msg.message}"
                  </div>
                  <div style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--mono)' }}>{fmtTime(msg.timestamp)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
