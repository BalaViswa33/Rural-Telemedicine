import { useState, useEffect, useRef } from 'react';
import SimpleCall from '../call/SimpleCall';
import ConsultationInbox from '../consultation/ConsultationInbox';
import { useLang } from '../context/LanguageContext';
import DashboardLayout from '../components/DashboardLayout';
import { db, STORES } from '../utils/db';
import { parsePrescription } from '../utils/prescriptionParser';

// ── Shared input components ──────────────────────────────────────────
const iStyle = {
  width:'100%', padding:'10px 13px',
  background:'#fff', border:'1.5px solid var(--border)',
  borderRadius:8, fontSize:13.5, color:'var(--text)', outline:'none',
  fontFamily:'var(--font)', transition:'border-color .15s', boxSizing:'border-box',
};
const Label = ({ text, required }) => (
  <label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--text3)', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.05em' }}>
    {text}{required && <span style={{ color:'var(--red)', marginLeft:2 }}>*</span>}
  </label>
);
const Field = ({ label, required, children }) => (
  <div><Label text={label} required={required}/>{children}</div>
);
const Input = ({ label, required, ...p }) => (
  <Field label={label} required={required}>
    <input required={required} {...p} style={iStyle}
      onFocus={e=>e.target.style.borderColor='#1a6fd4'}
      onBlur={e=>e.target.style.borderColor='var(--border)'}/>
  </Field>
);

// ── Severity colours (white-theme friendly) ──────────────────────────
const sevCfgBase = {
  low:    { bg:'#f0fdf4', border:'#bbf7d0', text:'#16a34a' },
  medium: { bg:'#fffbeb', border:'#fde68a', text:'#b45309' },
  high:   { bg:'#fef2f2', border:'#fecaca', text:'#dc2626' },
};
const getSevCfg = (t) => ({
  low:    { ...sevCfgBase.low,    label: t('low')    },
  medium: { ...sevCfgBase.medium, label: t('medium') },
  high:   { ...sevCfgBase.high,   label: t('high')   },
});

const cardStyle = {
  background:'var(--surface)', border:'1px solid var(--border)',
  borderRadius:12, padding:'22px 24px',
};

// ── Component ────────────────────────────────────────────────────────
export default function DoctorDashboard() {
  const { t, speakAllMedicines } = useLang();
  const sevCfg = getSevCfg(t);
  const [activeTab, setActiveTab]     = useState('triage');
  const [patients, setPatients]       = useState([]);
  const [vitals, setVitals]           = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [dbReady, setDbReady]         = useState(false);
  const [dbError, setDbError]         = useState(null);
  const [toast, setToast]             = useState(null);
  const [saving, setSaving]           = useState(false);

  // Prescribe form
  const [form, setForm]   = useState({ patientId:'', diagnosis:'', freeText:'', notes:'' });
  const [parsed, setParsed] = useState([]);
  const [preview, setPreview] = useState(false);

  const showToast = (msg, type='success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    db.init()
      .then(() => { setDbReady(true); setDbError(null); return loadData(); })
      .catch(err => { console.error('DB init failed:', err); setDbError(err?.message || 'Failed to open database'); });
  }, []);

  const loadData = async () => {
    const p  = await db.getAll(STORES.PATIENTS).catch(()=>[]);
    const v  = await db.getAll(STORES.VITALS).catch(()=>[]);
    const rx = await db.getAll(STORES.PRESCRIPTIONS).catch(()=>[]);
    setPatients(p);
    setVitals(v.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
    setPrescriptions(rx);
  };

  const editMed = (i, f, v) => {
    const u = [...parsed]; u[i][f] = v; setParsed(u);
  };
  const toggleTiming = (mi, t) => {
    const u = [...parsed];
    u[mi].timing = u[mi].timing.includes(t)
      ? u[mi].timing.filter(x => x !== t)
      : [...u[mi].timing, t];
    setParsed(u);
  };

  const savePrescription = async () => {
    if (!parsed.length) { showToast('Parse the prescription first.', 'error'); return; }
    if (!form.patientId) { showToast('Select a patient first.', 'error'); return; }
    setSaving(true);
    try {
      const patient = patients.find(p => p.id === form.patientId);
      await db.add(STORES.PRESCRIPTIONS, {
        id: `prescription_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,
        patientId:   form.patientId,
        patientName: patient?.name || 'Unknown',
        diagnosis:   form.diagnosis,
        medicines:   parsed,
        notes:       form.notes,
        doctorName:  'Doctor',
        prescribedAt: new Date().toISOString(),
      });
      await loadData();
      setForm({ patientId:'', diagnosis:'', freeText:'', notes:'' });
      setParsed([]); setPreview(false);
      showToast(t('prescriptionSavedOk'));
      setActiveTab('history');
    } catch (err) {
      console.error('Save failed:', err);
      showToast('Failed to save: ' + (err?.message || 'Unknown error'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const todayCount = prescriptions.filter(rx =>
    rx.createdAt?.startsWith(new Date().toISOString().slice(0,10))
  ).length;

  const stats = [
    { label:t('totalPatients'),   value: patients.length       },
    { label:t('vitalsRecorded'),  value: vitals.length         },
    { label:t('prescriptions'),    value: prescriptions.length  },
    { label:t('writtenToday'),    value: todayCount            },
  ];

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <DashboardLayout title="Doctor Dashboard" role="doctor" activeTab={activeTab} onTabChange={setActiveTab}>

      {/* Toast */}
      {toast && (
        <div style={{
          position:'fixed', top:20, right:24, zIndex:999,
          padding:'12px 20px', borderRadius:9, fontSize:13, fontWeight:500,
          background: toast.type==='error' ? '#fef2f2' : '#f0fdf4',
          border:`1px solid ${toast.type==='error' ? '#fecaca' : '#bbf7d0'}`,
          color: toast.type==='error' ? '#dc2626' : '#16a34a',
          boxShadow:'0 4px 16px rgba(0,0,0,0.08)',
        }}>{toast.msg}</div>
      )}

      {/* DB error */}
      {dbError && (
        <div style={{ padding:'12px 18px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, color:'#dc2626', fontSize:13, marginBottom:20 }}>
          Database error: {dbError}. Try refreshing the page.
        </div>
      )}

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
        {stats.map((s,i) => (
          <div key={i} style={cardStyle}>
            <div style={{ fontSize:22, fontWeight:800, color:'var(--text)', fontFamily:'var(--mono)', marginBottom:4 }}>{s.value}</div>
            <div style={{ fontSize:11, color:'var(--text3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── AI TRIAGE TAB ── */}
      {activeTab === 'triage' && (
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:'var(--text)', marginBottom:16 }}>
            Patient Vitals & AI Triage ({vitals.length})
          </div>

          {vitals.length === 0 ? (
            <div style={{ ...cardStyle, textAlign:'center', padding:'60px' }}>
              <div style={{ fontSize:15, color:'var(--text3)' }}>No vitals recorded yet. ASHA workers submit vitals from their dashboard.</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {vitals.map(v => {
                const patient = patients.find(p => p.id === v.patientId);
                const sev = v.triageResult?.severity || 'low';
                const cfg = sevCfg[sev];
                const hasPrescription = prescriptions.some(rx => rx.patientId === v.patientId);
                return (
                  <div key={v.id} style={{
                    background:'var(--surface)', border:`1.5px solid ${cfg.border}`,
                    borderRadius:12, overflow:'hidden',
                  }}>
                    {/* Header row */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', background: cfg.bg, borderBottom:`1px solid ${cfg.border}` }}>
                      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                        <div>
                          <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>
                            {patient?.name || 'Unknown Patient'}
                            <span style={{ marginLeft:8, fontSize:12, color:'var(--text3)', fontWeight:400 }}>
                              {patient?.age}y · {patient?.gender} · {patient?.village}
                            </span>
                          </div>
                          <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>
                            Recorded {new Date(v.createdAt).toLocaleString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                          </div>
                        </div>
                        <span style={{
                          padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700,
                          background: cfg.bg, border:`1px solid ${cfg.border}`, color: cfg.text,
                        }}>{cfg.label}</span>
                      </div>
                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        {hasPrescription && (
                          <span style={{ fontSize:11, color:'#16a34a', fontWeight:600, padding:'3px 9px', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:20 }}>
                            Prescription written
                          </span>
                        )}
                        <button
                          onClick={() => {
                            setForm(f => ({ ...f, patientId: v.patientId, diagnosis: v.triageResult?.recommendations?.[0] || '' }));
                            setActiveTab('prescribe');
                          }}
                          style={{
                            padding:'7px 16px', background:'#1a6fd4', color:'#fff',
                            border:'none', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer',
                          }}>
                          Write Prescription
                        </button>
                      </div>
                    </div>

                    {/* Vitals grid */}
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:0 }}>
                      {[
                        { label:'Temperature', value:`${v.temperature} °F` },
                        { label:'Heart Rate',  value:`${v.heartRate} bpm`  },
                        { label:'BP',          value:`${v.bloodPressureSystolic}/${v.bloodPressureDiastolic} mmHg` },
                        { label:'Symptoms',    value: v.symptoms },
                      ].map((item, i) => (
                        <div key={i} style={{ padding:'12px 20px', borderRight: i < 3 ? '1px solid var(--border)' : 'none' }}>
                          <div style={{ fontSize:10, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>{item.label}</div>
                          <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', lineHeight:1.4 }}>{item.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Recommendations */}
                    {v.triageResult?.recommendations?.length > 0 && (
                      <div style={{ padding:'10px 20px 14px', borderTop:'1px solid var(--border)', display:'flex', gap:8, flexWrap:'wrap' }}>
                        {v.triageResult.recommendations.map((r, i) => (
                          <span key={i} style={{ fontSize:12, color: cfg.text, background: cfg.bg, border:`1px solid ${cfg.border}`, borderRadius:6, padding:'4px 10px', fontWeight:500 }}>
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── PRESCRIBE TAB ── */}
      {activeTab === 'prescribe' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          {/* Form */}
          <div style={cardStyle}>
            <div style={{ fontSize:15, fontWeight:700, color:'var(--text)', marginBottom:20 }}>{t('writePrescriptionTitle')}</div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

              <Field label="Patient" required>
                <select
                  value={form.patientId}
                  onChange={e => setForm({...form, patientId:e.target.value})}
                  style={{ ...iStyle, background:'#fff' }}
                  onFocus={e=>e.target.style.borderColor='#1a6fd4'}
                  onBlur={e=>e.target.style.borderColor='var(--border)'}
                >
                  <option value="">Select patient</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} — {p.age}y, {p.village}</option>
                  ))}
                </select>
              </Field>

              <Input
                label="Diagnosis" required
                value={form.diagnosis}
                onChange={e => setForm({...form, diagnosis:e.target.value})}
                placeholder="e.g. Upper Respiratory Infection"
              />

              <Field label="Prescription (free text)" required>
                <textarea
                  required rows={6}
                  value={form.freeText}
                  onChange={e => setForm({...form, freeText:e.target.value})}
                  placeholder={"Paracetamol 500mg twice daily for 5 days\nAmoxicillin 250mg three times a day for 7 days\nCough syrup 10ml at night for 3 days"}
                  style={{ ...iStyle, fontFamily:'var(--mono)', fontSize:13, resize:'vertical' }}
                  onFocus={e=>e.target.style.borderColor='#1a6fd4'}
                  onBlur={e=>e.target.style.borderColor='var(--border)'}
                />
              </Field>

              <Field label="Additional Notes">
                <textarea
                  rows={2} value={form.notes}
                  onChange={e => setForm({...form, notes:e.target.value})}
                  placeholder="Extra instructions..."
                  style={{ ...iStyle, resize:'none' }}
                  onFocus={e=>e.target.style.borderColor='#1a6fd4'}
                  onBlur={e=>e.target.style.borderColor='var(--border)'}
                />
              </Field>

              <button
                onClick={() => { const m = parsePrescription(form.freeText); setParsed(m); setPreview(true); }}
                disabled={!form.freeText}
                style={{
                  padding:'11px', border:'none', borderRadius:8, fontSize:13, fontWeight:600,
                  background: form.freeText ? '#1a6fd4' : 'var(--surface2)',
                  color: form.freeText ? '#fff' : 'var(--text3)',
                  cursor: form.freeText ? 'pointer' : 'not-allowed',
                }}>
                Parse with AI
              </button>
            </div>
          </div>

          {/* Preview */}
          {preview && parsed.length > 0 ? (
            <div style={{ ...cardStyle, border:'1.5px solid #bfdbfe' }}>
              <div style={{ fontSize:15, fontWeight:700, color:'var(--text)', marginBottom:16 }}>Structured Preview</div>
              <div style={{ display:'flex', flexDirection:'column', gap:10, maxHeight:400, overflowY:'auto', marginBottom:16 }}>
                {parsed.map((m, i) => (
                  <div key={i} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10, padding:'14px' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                      {['name','dosage','frequency','duration'].map(f => (
                        <div key={f} style={{ gridColumn: f==='name' ? 'span 2' : 'auto' }}>
                          <div style={{ fontSize:10, color:'var(--text3)', fontWeight:600, textTransform:'uppercase', marginBottom:4 }}>{f}</div>
                          <input
                            value={m[f]} onChange={e => editMed(i, f, e.target.value)}
                            style={{ width:'100%', padding:'7px 10px', background:'#fff', border:'1px solid var(--border)', borderRadius:7, fontSize:13, color:'var(--text)', outline:'none', fontFamily:'var(--font)', boxSizing:'border-box' }}
                          />
                        </div>
                      ))}
                    </div>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      {['Morning','Afternoon','Evening','Night'].map(t => (
                        <button key={t} onClick={() => toggleTiming(i, t)} style={{
                          padding:'4px 12px', borderRadius:20, border:'none', fontSize:12, fontWeight:600,
                          background: m.timing.includes(t) ? '#1a6fd4' : '#eff6ff',
                          color:      m.timing.includes(t) ? '#fff'    : '#1a6fd4',
                          cursor:'pointer',
                        }}>{t}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button
                  onClick={savePrescription} disabled={saving || !dbReady}
                  style={{
                    flex:1, padding:'11px', border:'none', borderRadius:8, fontSize:13, fontWeight:600,
                    background: (saving||!dbReady) ? 'var(--surface2)' : '#16a34a',
                    color:      (saving||!dbReady) ? 'var(--text3)'    : '#fff',
                    cursor:     (saving||!dbReady) ? 'not-allowed'     : 'pointer',
                  }}>
                  {saving ? 'Saving...' : t('savePrescription')}
                </button>
                <button onClick={() => { setPreview(false); setParsed([]); }}
                  style={{ padding:'11px 16px', background:'var(--surface2)', color:'var(--text3)', border:'1px solid var(--border)', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>
                  Clear
                </button>
              </div>
            </div>
          ) : (
            <div style={{ ...cardStyle, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:300 }}>
              <div style={{ fontSize:14, color:'var(--text3)', textAlign:'center' }}>
                Enter prescription text and click<br/><strong>Parse with AI</strong> to structure it
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {activeTab === 'history' && (
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:'var(--text)', marginBottom:16 }}>
            Prescription History ({prescriptions.length})
          </div>
          {prescriptions.length === 0 ? (
            <div style={{ ...cardStyle, textAlign:'center', padding:'60px' }}>
              <div style={{ fontSize:15, color:'var(--text3)' }}>No prescriptions written yet</div>
            </div>
          ) : (
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid var(--border)', background:'var(--surface2)' }}>
                    {[t('patientLabel'),t('diagnosis'),t('medicines'),t('date'),t('status')].map(h => (
                      <th key={h} style={{ padding:'11px 16px', textAlign:'left', fontSize:11, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...prescriptions].reverse().map(rx => (
                    <tr key={rx.id}
                      onMouseEnter={e=>e.currentTarget.style.background='var(--surface2)'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                      style={{ borderBottom:'1px solid var(--border)' }}>
                      <td style={{ padding:'12px 16px', fontWeight:600, color:'var(--text)' }}>{rx.patientName}</td>
                      <td style={{ padding:'12px 16px', color:'var(--text2)' }}>{rx.diagnosis}</td>
                      <td style={{ padding:'12px 16px' }}>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                          {rx.medicines?.slice(0,3).map((m,j) => (
                            <span key={j} style={{ padding:'2px 8px', borderRadius:20, background:'#eff6ff', border:'1px solid #bfdbfe', fontSize:11, color:'#1a6fd4', fontWeight:500 }}>{m.name}</span>
                          ))}
                          {(rx.medicines?.length||0) > 3 && <span style={{ fontSize:11, color:'var(--text3)' }}>+{rx.medicines.length-3} more</span>}
                        </div>
                      </td>
                      <td style={{ padding:'12px 16px', color:'var(--text3)', fontFamily:'var(--mono)', fontSize:12 }}>
                        {new Date(rx.prescribedAt || rx.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td style={{ padding:'12px 16px' }}>
                        <span style={{ padding:'2px 9px', borderRadius:20, fontSize:11, fontWeight:600,
                          background: rx.synced ? '#f0fdf4' : '#fffbeb',
                          color:      rx.synced ? '#16a34a' : '#b45309',
                          border:`1px solid ${rx.synced ? '#bbf7d0' : '#fde68a'}`,
                        }}>
                          {rx.synced ? 'Synced' : 'Local'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── CONSULTATION TAB ── */}
      {activeTab === 'consultation' && <ConsultationInbox />}

      {activeTab === 'videocall' && <SimpleCall />}

    </DashboardLayout>
  );
}
