// Overview stat cards reading from real IndexedDB data
export default function OverviewCards({ data }) {
  const { patients, vitals, prescriptions, consultations, messages } = data;

  const today = new Date().toDateString();
  const emergencyToday = vitals.filter(v => v.risk === 'emergency' && new Date(v.createdAt).toDateString() === today).length;
  const highRisk = vitals.filter(v => v.risk === 'high' || v.risk === 'emergency').length;
  const pendingSync = [
    ...patients.filter(p => !p.synced),
    ...vitals.filter(v => !v.synced),
    ...prescriptions.filter(p => !p.synced),
    ...consultations.filter(c => !c.synced),
  ].length;
  const offlineMsgs = messages.filter(m => m.syncStatus === 'Pending').length;
  const offlineConsults = consultations.filter(c => c.offlineMode).length;
  const offlinePct = consultations.length ? Math.round((offlineConsults / consultations.length) * 100) : 0;

  const cards = [
    { label: 'Total Patients',        value: patients.length,         icon: '👥', color: '#6b46c1' },
    { label: 'Active Cases',           value: vitals.filter(v=>v.risk!=='low').length, icon: '🩺', color: '#1a6fd4' },
    { label: 'Emergency Today',        value: emergencyToday,          icon: '🚨', color: '#dc2626' },
    { label: 'High Risk Cases',        value: highRisk,                icon: '⚠️', color: '#c47d0a' },
    { label: 'Pending Sync Records',   value: pendingSync,             icon: '🔄', color: '#0a8a6a' },
    { label: 'Offline Msgs to Doctor', value: offlineMsgs,            icon: '💬', color: '#6366f1' },
    { label: 'Total Consultations',    value: consultations.length,    icon: '📋', color: '#0891b2' },
    { label: 'Offline Consultations',  value: `${offlinePct}%`,       icon: '📡', color: '#7c3aed' },
  ];

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:28 }}>
      {cards.map((c, i) => (
        <div key={i} style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:14, padding:'20px 22px', transition:'box-shadow .2s' }}
          onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.09)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow='none'}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:`${c.color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{c.icon}</div>
            <span style={{ fontSize:26, fontWeight:800, color:c.color, fontFamily:'var(--mono)' }}>{c.value}</span>
          </div>
          <div style={{ fontSize:11, color:'var(--text3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>{c.label}</div>
        </div>
      ))}
    </div>
  );
}
