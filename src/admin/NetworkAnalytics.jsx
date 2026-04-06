// Network Usage Analytics
function DonutChart({ data, colors }) {
  const total = data.reduce((s,d)=>s+d.value,0)||1;
  const r = 60, cx = 80, cy = 80, stroke = 22;
  let offset = 0;
  const circ = 2 * Math.PI * r;
  const slices = data.map((d,i) => {
    const pct = d.value/total;
    const dashArray = `${pct*circ} ${circ}`;
    const rotate = offset * 360;
    offset += pct;
    return { dashArray, rotate, color: colors[i], pct: Math.round(pct*100), label: d.label };
  });

  return (
    <div style={{ display:'flex', alignItems:'center', gap:24 }}>
      <svg width={160} height={160} viewBox="0 0 160 160">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f4f8" strokeWidth={stroke}/>
        {slices.map((s,i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth={stroke}
            strokeDasharray={s.dashArray}
            strokeDashoffset={0}
            transform={`rotate(${s.rotate - 90} ${cx} ${cy})`}
          />
        ))}
        <text x={cx} y={cy-4} textAnchor="middle" fontSize={10} fill="#8896aa">Total</text>
        <text x={cx} y={cy+12} textAnchor="middle" fontSize={18} fontWeight={800} fill="#0f1623">{total}</text>
      </svg>
      <div style={{ display:'grid', gap:10, flex:1 }}>
        {slices.map((s,i)=>(
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:12, height:12, borderRadius:3, background:s.color, flexShrink:0 }} />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{s.label}</div>
              <div style={{ fontSize:11, color:'var(--text3)' }}>{data[i].value} records</div>
            </div>
            <div style={{ fontSize:16, fontWeight:800, color:s.color, fontFamily:'var(--mono)' }}>{s.pct}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function NetworkAnalytics({ data }) {
  const { vitals, consultations } = data;
  const all = [...vitals, ...consultations];

  const netData = [
    { label:'4G', value: all.filter(r=>r.networkType==='4g').length },
    { label:'3G', value: all.filter(r=>r.networkType==='3g').length },
    { label:'2G', value: all.filter(r=>r.networkType==='2g').length },
    { label:'Offline', value: all.filter(r=>r.networkType==='none'||r.offlineMode).length },
  ];
  const colors = ['#10b981','#3b82f6','#f59e0b','#ef4444'];

  const total = all.length || 1;
  const bars = netData.map((d,i) => ({ ...d, pct: Math.round(d.value/total*100), color: colors[i] }));

  return (
    <div>
      <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:16 }}>📡 Network Usage Analytics</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:16, padding:'24px' }}>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:20 }}>Distribution by Network Type</div>
          <DonutChart data={netData} colors={colors} />
        </div>
        <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:16, padding:'24px' }}>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:20 }}>Connectivity Breakdown</div>
          <div style={{ display:'grid', gap:14 }}>
            {bars.map((b,i) => (
              <div key={i}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:'var(--text2)' }}>{b.label}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:b.color, fontFamily:'var(--mono)' }}>{b.pct}% ({b.value})</span>
                </div>
                <div style={{ height:8, background:'#f1f4f8', borderRadius:99 }}>
                  <div style={{ height:'100%', width:`${b.pct}%`, background:b.color, borderRadius:99, transition:'width .4s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
