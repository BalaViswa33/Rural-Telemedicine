import { useState, useEffect } from 'react';
import SimpleCall from '../call/SimpleCall';
import DashboardLayout from '../components/DashboardLayout';
import { db, STORES } from '../utils/db';
import { notificationManager } from '../utils/notifications';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import NetworkAwareConsult from '../components/NetworkAwareConsult';
import PatientHelp from '../help/PatientHelp';

const timingIcons  = { Morning:'🌅', Afternoon:'☀️', Evening:'🌆', Night:'🌙' };
const timingColors = { Morning:'#f5a623', Afternoon:'#f97316', Evening:'#9b6ff5', Night:'#3d8ef8' };

/* ── Shared helpers ── */
const Stat = ({ label, value, icon, color }) => (
  <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'20px 22px' }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
      <span style={{ fontSize:26 }}>{icon}</span>
      <span style={{ fontSize:26, fontWeight:800, color, fontFamily:'var(--mono)' }}>{value}</span>
    </div>
    <div style={{ fontSize:12, color:'var(--text3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</div>
  </div>
);

const Tag = ({ children, color }) => (
  <span style={{ padding:'4px 11px', borderRadius:20, background:`${color}1a`, color, fontSize:12, fontWeight:700, display:'inline-flex', alignItems:'center', gap:5 }}>
    {children}
  </span>
);

export default function PatientDashboard() {
  const { user } = useAuth();
  const { t, speakPrescription, speakAllMedicines } = useLang();
  const [activeTab, setActiveTab] = useState('prescriptions');
  const [prescriptions, setPrescriptions] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [notifEnabled, setNotifEnabled] = useState(false);

  useEffect(() => {
    db.init().then(() => loadData()).catch(console.error);
  }, []);

  const loadData = async () => {
    const p = await db.getAll(STORES.PRESCRIPTIONS).catch(()=>[]);
    setPrescriptions(p);
    const times = { Morning:'09:00', Afternoon:'14:00', Evening:'18:00', Night:'21:00' };
    const all = [];
    p.forEach(rx => rx.medicines?.forEach(m => m.timing?.forEach(t =>
      all.push({ id:`${rx.id}_${m.id}_${t}`, medicine:m, timeOfDay:t, time:times[t]||'09:00', taken:false, rxId:rx.id })
    )));
    setReminders(all);
  };

  const enableNotif = async () => {
    const ok = await notificationManager.requestPermission();
    setNotifEnabled(ok);
    if (ok) reminders.forEach(r => !r.taken && notificationManager.scheduleReminder(r.id, r.medicine, r.time));
  };

  const markTaken = (id) => {
    setReminders(rs => rs.map(r => r.id===id ? {...r,taken:true} : r));
    notificationManager.cancelReminder(id);
  };

  const pending = reminders.filter(r=>!r.taken);
  const done    = reminders.filter(r=>r.taken);

  return (
    <DashboardLayout title={t('welcomeBack') + `, ${user?.username}`} role="patient" activeTab={activeTab} onTabChange={setActiveTab}>

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:28 }}>
        <Stat label={t('prescriptions')}  value={prescriptions.length}  icon="💊" color="var(--teal)"   />
        <Stat label={t('pending2')}  value={pending.length}        icon="⏰" color="var(--amber)"  />
        <Stat label={t('completed')}      value={done.length}           icon="✅" color="#0fd4a0"       />
        <Stat label={t('activeMeds')}    value={prescriptions.reduce((s,p)=>s+(p.medicines?.length||0),0)} icon="📋" color="var(--violet)" />
      </div>

      {/* ── Prescriptions ── */}
      {activeTab === 'prescriptions' && (
        <div>
          <SectionHead title={t('yourPrescriptions')} count={prescriptions.length} />
          {prescriptions.length === 0
            ? <Empty icon="💊" title={t('noPrescrPatient')} sub={t('noPrescrSub')} />
            : <div style={{ display:'grid', gap:14 }}>
                {prescriptions.map(p => (
                  <div key={p.id} className="card" style={{ background:'var(--surface)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18 }}>
                      <div>
                        <div style={{ fontSize:18, fontWeight:800, color:'var(--text)', marginBottom:4 }}>{p.diagnosis}</div>
                        <div style={{ fontSize:13, color:'var(--text3)' }}>{t('prescribedBy')} {p.doctorName} · {new Date(p.prescribedAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div>
                      </div>
                      <div style={{ display:'flex', gap:10 }}>
                        <Tag color={p.synced ? '#0fd4a0' : '#f5a623'}>{p.synced ? `✓ ${t('synced')}` : `⏳ ${t('local')}`}</Tag>
                        <button onClick={()=>speakAllMedicines(p.medicines)} style={{
                          padding:'7px 14px', background:'var(--teal-glow)', border:'1px solid rgba(15,212,160,0.3)',
                          borderRadius:8, color:'var(--teal)', fontSize:13, fontWeight:700,
                        }}>🔊 {t('listenAll')}</button>
                      </div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
                      {p.medicines?.map((m,i) => (
                        <div key={i} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:12, padding:'16px' }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                            <div>
                              <div style={{ fontSize:15, fontWeight:800, color:'var(--text)' }}>{m.name}</div>
                              <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{m.dosage} · {m.frequency}</div>
                            </div>
                            <button onClick={()=>speakPrescription(m)} style={{ background:'none', border:'1px solid var(--border)', borderRadius:8, padding:'6px 10px', color:'var(--text3)', fontSize:13 }}>▶</button>
                          </div>
                          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                            {m.timing?.map(t => (
                              <Tag key={t} color={timingColors[t]}>{timingIcons[t]} {t}</Tag>
                            ))}
                            <Tag color="var(--blue)">{m.duration}</Tag>
                          </div>
                        </div>
                      ))}
                    </div>
                    {p.notes && <div style={{ marginTop:14, padding:'10px 14px', background:'rgba(245,166,35,0.08)', border:'1px solid rgba(245,166,35,0.2)', borderRadius:10, fontSize:13, color:'#f5a623' }}>📝 {p.notes}</div>}
                  </div>
                ))}
              </div>
          }
        </div>
      )}

      {/* ── Reminders ── */}
      {activeTab === 'reminders' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <SectionHead title={t('medicineReminders')} count={reminders.length} noMargin />
            {!notifEnabled
              ? <button onClick={enableNotif} style={{ padding:'9px 18px', background:'var(--teal)', color:'#0b0f18', border:'none', borderRadius:10, fontSize:13, fontWeight:800 }}>🔔 Enable Notifications</button>
              : <Tag color="var(--teal)">✅ Notifications active</Tag>
            }
          </div>
          {reminders.length === 0
            ? <Empty icon="⏰" title={t('noReminders')} sub={t('noReminderSub')} />
            : <div style={{ display:'grid', gap:10 }}>
                {reminders.map(r => (
                  <div key={r.id} style={{
                    background:'var(--surface)', border:`1px solid ${r.taken ? 'rgba(15,212,160,.2)' : 'var(--border)'}`,
                    borderRadius:14, padding:'16px 20px',
                    display:'flex', alignItems:'center', gap:16,
                    opacity: r.taken ? 0.65 : 1,
                  }}>
                    <div style={{ width:48, height:48, borderRadius:14, background:`${timingColors[r.timeOfDay]}1a`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
                      {timingIcons[r.timeOfDay]}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:15, fontWeight:800, color:'var(--text)' }}>{r.medicine.name}</div>
                      <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{r.medicine.dosage} · ⏰ {r.time}</div>
                    </div>
                    <div style={{ display:'flex', gap:10 }}>
                      <button onClick={()=>speakPrescription(r.medicine)} style={{ padding:'7px 12px', background:'none', border:'1px solid var(--border)', borderRadius:8, color:'var(--text3)', fontSize:13 }}>🔊</button>
                      {!r.taken
                        ? <button onClick={()=>markTaken(r.id)} style={{ padding:'7px 16px', background:'var(--teal)', color:'#0b0f18', border:'none', borderRadius:8, fontSize:13, fontWeight:800 }}>Mark Taken</button>
                        : <Tag color="var(--teal)">✓ Taken</Tag>
                      }
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      )}

      {activeTab === 'consult' && <NetworkAwareConsult doctorName="Sharma" patientName={user?.username} />}

      {activeTab === 'health' && <Empty icon="📊" title={t('healthRecords')} sub={t('noTriageYet')} />}

      {activeTab === 'firstaid' && <PatientHelp />}

      {activeTab === 'videocall' && <SimpleCall />}
    </DashboardLayout>
  );
}

function SectionHead({ title, count, noMargin }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom: noMargin ? 0 : 18 }}>
      <span style={{ fontSize:19, fontWeight:800, color:'var(--text)' }}>{title}</span>
      {count !== undefined && <span style={{ fontSize:12, fontWeight:700, color:'var(--text3)', background:'var(--surface2)', padding:'3px 9px', borderRadius:20, border:'1px solid var(--border)' }}>{count}</span>}
    </div>
  );
}

function Empty({ icon, title, sub }) {
  return (
    <div style={{ textAlign:'center', padding:'80px 20px', background:'var(--surface)', borderRadius:20, border:'1px solid var(--border)' }}>
      <div style={{ fontSize:52, marginBottom:14 }}>{icon}</div>
      <div style={{ fontSize:17, fontWeight:800, color:'var(--text)', marginBottom:6 }}>{title}</div>
      <div style={{ fontSize:13, color:'var(--text3)' }}>{sub}</div>
    </div>
  );
}
