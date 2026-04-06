// Maternal Health Monitoring Panel
export default function MaternalHealth({ data }) {
  const { patients, vitals } = data;

  const pregnant = patients.filter(p => p.pregnant);
  const today = new Date();

  // Enrich with latest vitals
  const enriched = pregnant.map(p => {
    const pVitals = vitals.filter(v => v.patientId === p.id).sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt));
    const latest = pVitals[0];
    const bp = latest?.bp || '—';
    const [sys, dia] = bp.split('/').map(Number);
    const bpAlert = sys >= 140 || dia >= 90;
    const risk = latest?.risk || 'low';
    const weeksLeft = p.deliveryDate ? Math.max(0, Math.round((new Date(p.deliveryDate) - today) / (7*24*3600000))) : null;
    return { ...p, latestBp: bp, bpAlert, risk, weeksLeft };
  });

  const highRisk = enriched.filter(p => p.risk === 'high' || p.risk === 'emergency');
  const bpAlerts = enriched.filter(p => p.bpAlert);
  const upcoming = enriched.filter(p => p.weeksLeft !== null && p.weeksLeft <= 4).sort((a,b) => a.weeksLeft - b.weeksLeft);

  const riskColor = { low:'#16a34a', medium:'#c47d0a', high:'#dc2626', emergency:'#7c0000' };
  const riskBg   = { low:'#f0fdf4', medium:'#fffbeb', high:'#fef2f2', emergency:'#fff0f0' };

  return (
    <div>
      <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:16 }}>🤰 Maternal Health Monitoring</div>
      {/* Summary cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Total Pregnant', value:pregnant.length, color:'#6b46c1', icon:'🤰' },
          { label:'High-Risk Pregnancies', value:highRisk.length, color:'#dc2626', icon:'⚠️' },
          { label:'BP Alerts (>140/90)', value:bpAlerts.length, color:'#c47d0a', icon:'💉' },
          { label:'Delivering ≤4 Weeks', value:upcoming.length, color:'#0a8a6a', icon:'👶' },
        ].map((c,i) => (
          <div key={i} style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:12, padding:'16px 18px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <span style={{ fontSize:22 }}>{c.icon}</span>
              <span style={{ fontSize:24, fontWeight:800, color:c.color, fontFamily:'var(--mono)' }}>{c.value}</span>
            </div>
            <div style={{ fontSize:11, color:'var(--text3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em' }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Patient table */}
      <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:16, overflow:'hidden' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', fontSize:14, fontWeight:700, color:'var(--text)' }}>Maternal Patient Records</div>
        {enriched.length === 0 ? (
          <div style={{ padding:40, textAlign:'center', color:'var(--text3)' }}>No pregnant patients registered</div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'var(--surface2)' }}>
                  {['Patient','Village','Risk Level','Last BP','Weeks Left','Status'].map(h => (
                    <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:11, color:'var(--text3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {enriched.map((p, i) => (
                  <tr key={p.id} style={{ borderTop:'1px solid var(--border)', background: i%2 ? '#fafbfc' : '#fff' }}>
                    <td style={{ padding:'12px 16px', fontWeight:600, color:'var(--text)' }}>{p.name}</td>
                    <td style={{ padding:'12px 16px', color:'var(--text2)' }}>{p.village}</td>
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{ padding:'3px 10px', borderRadius:99, background:riskBg[p.risk], color:riskColor[p.risk], fontSize:12, fontWeight:600, textTransform:'capitalize' }}>{p.risk}</span>
                    </td>
                    <td style={{ padding:'12px 16px', fontFamily:'var(--mono)', fontSize:13, color: p.bpAlert ? '#dc2626' : 'var(--text2)', fontWeight: p.bpAlert ? 700 : 400 }}>
                      {p.latestBp}{p.bpAlert && ' ⚠️'}
                    </td>
                    <td style={{ padding:'12px 16px', color:'var(--text2)', fontFamily:'var(--mono)' }}>
                      {p.weeksLeft !== null ? `${p.weeksLeft} wks` : '—'}
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{ padding:'3px 10px', borderRadius:99, background: p.bpAlert ? '#fef2f2' : '#f0fdf4', color: p.bpAlert ? '#dc2626' : '#16a34a', fontSize:12, fontWeight:600 }}>
                        {p.bpAlert ? 'Needs Attention' : 'Stable'}
                      </span>
                    </td>
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
