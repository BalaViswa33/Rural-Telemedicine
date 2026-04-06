// Clinical Analytics — Risk Distribution, Disease Trends, Weekly Consultations
// Uses lightweight inline SVG bar/pie charts (no external dependency)

function BarChart({ data, colors }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const W = 340, H = 160, padL = 36, padB = 28, padT = 10, padR = 10;
  const chartW = W - padL - padR;
  const chartH = H - padB - padT;
  const barW = chartW / data.length * 0.55;
  const gap  = chartW / data.length;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow:'visible' }}>
      {/* Grid lines */}
      {[0,0.25,0.5,0.75,1].map(f => (
        <line key={f} x1={padL} x2={W-padR} y1={padT + chartH*(1-f)} y2={padT + chartH*(1-f)}
          stroke="#e5eaf1" strokeWidth="1" />
      ))}
      {/* Bars */}
      {data.map((d, i) => {
        const x = padL + gap * i + (gap - barW) / 2;
        const barH = Math.max((d.value / max) * chartH, 2);
        const y = padT + chartH - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx={4} fill={colors[i % colors.length]} opacity={0.85} />
            <text x={x + barW/2} y={y - 4} textAnchor="middle" fontSize={10} fill={colors[i % colors.length]} fontWeight={700}>{d.value}</text>
            <text x={padL + gap * i + gap/2} y={H - 6} textAnchor="middle" fontSize={9} fill="#8896aa">{d.label}</text>
          </g>
        );
      })}
      {/* Y axis */}
      <text x={padL - 4} y={padT + chartH} textAnchor="end" fontSize={9} fill="#8896aa">0</text>
      <text x={padL - 4} y={padT} textAnchor="end" fontSize={9} fill="#8896aa">{max}</text>
    </svg>
  );
}

function PieChart({ data, colors }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let angle = -Math.PI / 2;
  const cx = 80, cy = 80, r = 68;
  const slices = data.map((d, i) => {
    const sweep = (d.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    angle += sweep;
    const x2 = cx + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    const large = sweep > Math.PI ? 1 : 0;
    return { path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`, color: colors[i], pct: Math.round((d.value/total)*100), label: d.label };
  });

  return (
    <div style={{ display:'flex', alignItems:'center', gap:16 }}>
      <svg width={160} height={160} viewBox="0 0 160 160">
        {slices.map((s,i) => <path key={i} d={s.path} fill={s.color} stroke="#fff" strokeWidth={2} />)}
      </svg>
      <div style={{ display:'grid', gap:6 }}>
        {slices.map((s,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12 }}>
            <div style={{ width:10, height:10, borderRadius:3, background:s.color, flexShrink:0 }} />
            <span style={{ color:'var(--text2)' }}>{s.label}</span>
            <span style={{ color:s.color, fontWeight:700, fontFamily:'var(--mono)', marginLeft:'auto', minWidth:32, textAlign:'right' }}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:16, padding:'22px 24px' }}>
      <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:16 }}>{title}</div>
      {children}
    </div>
  );
}

export default function ClinicalAnalytics({ data }) {
  const { vitals, consultations } = data;

  // Risk distribution
  const riskData = [
    { label:'Low',       value: vitals.filter(v=>v.risk==='low').length },
    { label:'Medium',    value: vitals.filter(v=>v.risk==='medium').length },
    { label:'High',      value: vitals.filter(v=>v.risk==='high').length },
    { label:'Emergency', value: vitals.filter(v=>v.risk==='emergency').length },
  ];
  const riskColors = ['#16a34a','#c47d0a','#dc2626','#7c0000'];

  // Disease trend
  const diseaseData = [
    { label:'Fever',       value: vitals.filter(v=>v.disease==='fever').length },
    { label:'Diarrhea',    value: vitals.filter(v=>v.disease==='diarrhea').length },
    { label:'Respiratory', value: vitals.filter(v=>v.disease==='respiratory').length },
    { label:'Other',       value: vitals.filter(v=>v.disease==='other').length },
  ];
  const diseaseColors = ['#f59e0b','#3b82f6','#10b981','#8b5cf6'];

  // Weekly consultations (last 7 days)
  const weeklyData = Array.from({length:7}, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toDateString();
    return {
      label: d.toLocaleDateString('en-IN',{weekday:'short'}),
      value: [...vitals, ...consultations].filter(r => new Date(r.createdAt).toDateString() === dayStr).length,
    };
  });
  const weekColors = Array(7).fill('#6b46c1');

  return (
    <div>
      <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:16 }}>📊 Clinical Analytics</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
        <ChartCard title="Risk Distribution">
          <BarChart data={riskData} colors={riskColors} />
        </ChartCard>
        <ChartCard title="Disease Trends">
          <BarChart data={diseaseData} colors={diseaseColors} />
        </ChartCard>
        <ChartCard title="Weekly Consultations">
          <BarChart data={weeklyData} colors={weekColors} />
        </ChartCard>
      </div>
    </div>
  );
}
