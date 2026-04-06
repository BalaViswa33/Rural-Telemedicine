// Sync Monitoring Panel
export default function SyncMonitoring({ data }) {
  const { patients, vitals, prescriptions, consultations } = data;

  const stores = [
    { name:'Patients',      records: patients,      icon:'👥', color:'#6b46c1' },
    { name:'Vitals',        records: vitals,         icon:'❤️', color:'#dc2626' },
    { name:'Prescriptions', records: prescriptions,  icon:'💊', color:'#1a6fd4' },
    { name:'Consultations', records: consultations,  icon:'📋', color:'#0a8a6a' },
  ];

  const totalPending = stores.reduce((s,st)=>s+st.records.filter(r=>!r.synced).length,0);
  const totalRecords = stores.reduce((s,st)=>s+st.records.length,0);

  // Last sync time = most recent syncedAt across all records
  const allSynced = [...patients,...vitals,...prescriptions,...consultations]
    .filter(r=>r.synced && r.syncedAt)
    .map(r=>new Date(r.syncedAt));
  const lastSync = allSynced.length ? new Date(Math.max(...allSynced)) : null;

  const failedAttempts = parseInt(localStorage.getItem('failedSyncAttempts') || '0');

  const fmtTime = ts => {
    if (!ts) return 'Never';
    const diff = (Date.now() - ts) / 60000;
    if (diff < 60) return `${Math.round(diff)}m ago`;
    if (diff < 1440) return `${Math.round(diff/60)}h ago`;
    return `${Math.round(diff/1440)}d ago`;
  };

  return (
    <div>
      <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:16 }}>🔄 Sync Monitoring</div>

      {/* Summary row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Devices with Pending Sync', value: totalPending > 0 ? Math.ceil(totalPending/5) : 0, icon:'📱', color:'#c47d0a' },
          { label:'Total Unsynced Records',    value: totalPending, icon:'⏳', color:'#dc2626' },
          { label:'Last Sync Time',            value: fmtTime(lastSync), icon:'✅', color:'#16a34a', isText:true },
          { label:'Failed Sync Attempts',      value: failedAttempts, icon:'❌', color:'#dc2626' },
        ].map((c,i) => (
          <div key={i} style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:12, padding:'16px 18px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <span style={{ fontSize:22 }}>{c.icon}</span>
              <span style={{ fontSize:c.isText?14:24, fontWeight:800, color:c.color, fontFamily:'var(--mono)' }}>{c.value}</span>
            </div>
            <div style={{ fontSize:11, color:'var(--text3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em' }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Per-store breakdown */}
      <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:16, overflow:'hidden' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', fontSize:14, fontWeight:700, color:'var(--text)' }}>Store Sync Status</div>
        <div style={{ padding:'16px 20px', display:'grid', gap:14 }}>
          {stores.map(st => {
            const pending = st.records.filter(r=>!r.synced).length;
            const synced  = st.records.filter(r=>r.synced).length;
            const total   = st.records.length || 1;
            const pct     = Math.round((synced/total)*100);
            return (
              <div key={st.name}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                  <span style={{ fontSize:16 }}>{st.icon}</span>
                  <span style={{ fontSize:14, fontWeight:600, color:'var(--text)', flex:1 }}>{st.name}</span>
                  <span style={{ fontSize:12, color:'var(--text3)', fontFamily:'var(--mono)' }}>{synced}/{total} synced</span>
                  {pending > 0 && (
                    <span style={{ padding:'2px 8px', borderRadius:99, background:'#fffbeb', color:'#c47d0a', fontSize:11, fontWeight:700 }}>{pending} pending</span>
                  )}
                  <span style={{ fontSize:13, fontWeight:700, color:pct===100?'#16a34a':st.color, fontFamily:'var(--mono)', minWidth:36, textAlign:'right' }}>{pct}%</span>
                </div>
                <div style={{ height:8, background:'#f1f4f8', borderRadius:99, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${pct}%`, background:pct===100?'#16a34a':st.color, borderRadius:99, transition:'width .4s ease' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
