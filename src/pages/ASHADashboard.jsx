import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { db, STORES } from '../utils/db';
import { useLang } from '../context/LanguageContext';
import ConsultationHandler from '../consultation/ConsultationHandler';
import AISymptomChecker from '../symptomchecker/AISymptomChecker';

const triageRules = (v) => {
  let severity='low', recommendations=[];
  if(v.temperature>103){severity='high';recommendations.push('high_fever');}
  else if(v.temperature>100.4){severity=severity==='high'?'high':'medium';recommendations.push('fever');}
  if(v.bloodPressureSystolic>180||v.bloodPressureDiastolic>120){severity='high';recommendations.push('hypertensive_crisis');}
  else if(v.bloodPressureSystolic>140||v.bloodPressureDiastolic>90){severity=severity==='high'?'high':'medium';recommendations.push('high_bp');}
  if(v.heartRate>120||v.heartRate<50){severity=severity==='high'?'high':'medium';recommendations.push('abnormal_hr');}
  const crits=['chest pain','difficulty breathing','severe bleeding'];
  if(crits.some(s=>v.symptoms.toLowerCase().includes(s))){severity='high';recommendations.push('critical_symptoms');}
  if(!recommendations.length)recommendations.push('normal');
  return {severity,recommendations};
};

const REC_EN = {
  high_fever:'High fever — immediate attention required',
  fever:'Fever — monitor and consult doctor',
  hypertensive_crisis:'Hypertensive crisis — urgent care needed',
  high_bp:'High BP — doctor consultation recommended',
  abnormal_hr:'Abnormal heart rate — evaluation needed',
  critical_symptoms:'Critical symptoms — emergency care required',
  normal:'Vitals normal — routine follow-up recommended',
};

const sevCfg = {
  low:    { border:'#bbf7d0', bg:'#f0fdf4', text:'#16a34a' },
  medium: { border:'#fde68a', bg:'#fffbeb', text:'#b45309' },
  high:   { border:'#fecaca', bg:'#fef2f2', text:'#dc2626' },
};

const iStyle = { width:'100%', padding:'10px 13px', background:'#fff', border:'1.5px solid var(--border)', borderRadius:8, fontSize:13.5, color:'var(--text)', outline:'none', fontFamily:'var(--font)', transition:'border-color .15s', boxSizing:'border-box' };

const EMPTY_P = {name:'',age:'',gender:'',phone:'',address:'',village:''};
const EMPTY_V = {patientId:'',temperature:'',bloodPressureSystolic:'',bloodPressureDiastolic:'',heartRate:'',symptoms:''};

export default function ASHADashboard() {
  const { t, speak, isRTL: rtl } = useLang();
  const [activeTab, setActiveTab] = useState('register');
  const [patients, setPatients]   = useState([]);
  const [syncing, setSyncing]     = useState(false);
  const [unsyncedCount, setUnsynced] = useState(0);
  const [dbReady, setDbReady]     = useState(false);
  const [dbError, setDbError]     = useState(null);
  const [pForm, setPForm]         = useState(EMPTY_P);
  const [vForm, setVForm]         = useState(EMPTY_V);
  const [triageResult, setTriage] = useState(null);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState(null);

  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };

  useEffect(() => {
    db.init().then(()=>{setDbReady(true);setDbError(null);return loadData();}).catch(err=>{console.error(err);setDbError(err?.message||'DB error');});
  },[]);

  const loadData = async () => {
    const p  = await db.getAll(STORES.PATIENTS).catch(()=>[]);
    const up = await db.getUnsynced(STORES.PATIENTS).catch(()=>[]);
    const uv = await db.getUnsynced(STORES.VITALS).catch(()=>[]);
    setPatients(p); setUnsynced(up.length+uv.length);
  };

  const registerPatient = async (e) => {
    e.preventDefault();
    if(!dbReady){showToast(t('initializing'),'error');return;}
    setSaving(true);
    try {
      await db.add(STORES.PATIENTS,{id:`patient_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,...pForm});
      await loadData(); setPForm(EMPTY_P); showToast(t('patientSavedOk'));
    } catch(err){ showToast(err?.message||'Error','error'); }
    finally { setSaving(false); }
  };

  const submitVitals = async (e) => {
    e.preventDefault();
    if(!dbReady){showToast(t('initializing'),'error');return;}
    setSaving(true);
    try {
      const result = triageRules({temperature:parseFloat(vForm.temperature),bloodPressureSystolic:parseInt(vForm.bloodPressureSystolic),bloodPressureDiastolic:parseInt(vForm.bloodPressureDiastolic),heartRate:parseInt(vForm.heartRate),symptoms:vForm.symptoms});
      await db.add(STORES.VITALS,{id:`vitals_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,...vForm,temperature:parseFloat(vForm.temperature),bloodPressureSystolic:parseInt(vForm.bloodPressureSystolic),bloodPressureDiastolic:parseInt(vForm.bloodPressureDiastolic),heartRate:parseInt(vForm.heartRate),triageResult:result});
      await loadData(); setTriage(result); showToast(t('vitalsSavedOk'));
      // speak the triage result
      const sev = result.severity;
      const sevLabel = t(sev); // low/medium/high
      speak(`${t('triageResult')}: ${sevLabel}. ${result.recommendations.map(r=>REC_EN[r]).join('. ')}`);
    } catch(err){ showToast(err?.message||'Error','error'); }
    finally { setSaving(false); }
  };

  const syncData = async () => {
    setSyncing(true);
    try {
      await new Promise(r=>setTimeout(r,1200));
      const up=await db.getUnsynced(STORES.PATIENTS).catch(()=>[]);
      const uv=await db.getUnsynced(STORES.VITALS).catch(()=>[]);
      for(const x of up) await db.markAsSynced(STORES.PATIENTS,x.id);
      for(const x of uv) await db.markAsSynced(STORES.VITALS,x.id);
      await loadData(); showToast(`${t('allSynced')}: ${up.length+uv.length}`);
    } catch(err){showToast(err?.message||'Sync error','error');}
    finally{setSyncing(false);}
  };

  const todayStr = new Date().toISOString().slice(0,10);
  const stats = [
    {label:t('totalPatients'),   value:patients.length},
    {label:t('pendingSync'),     value:unsyncedCount},
    {label:t('registeredToday'), value:patients.filter(p=>p.createdAt?.startsWith(todayStr)).length},
    {label:t('syncStatus'),      value:unsyncedCount===0?t('upToDate'):t('pending')},
  ];

  const card = {background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:'22px 24px'};

  return (
    <DashboardLayout title={t('ashaTitle')} role="asha" activeTab={activeTab} onTabChange={setActiveTab}>

      {toast && (
        <div style={{position:'fixed',top:20,right:24,zIndex:999,padding:'12px 20px',borderRadius:9,fontSize:13,fontWeight:500,background:toast.type==='error'?'#fef2f2':'#f0fdf4',border:`1px solid ${toast.type==='error'?'#fecaca':'#bbf7d0'}`,color:toast.type==='error'?'#dc2626':'#16a34a',boxShadow:'0 4px 16px rgba(0,0,0,0.08)'}}>
          {toast.msg}
        </div>
      )}

      {dbError && (
        <div style={{padding:'12px 18px',background:'#fef2f2',border:'1px solid #fecaca',borderRadius:10,color:'#dc2626',fontSize:13,marginBottom:20}}>
          {t('dbError')}: {dbError}
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:24}}>
        {stats.map((s,i)=>(
          <div key={i} style={card}>
            <div style={{fontSize:22,fontWeight:800,color:'var(--text)',fontFamily:'var(--mono)',marginBottom:4}}>{s.value}</div>
            <div style={{fontSize:11,color:'var(--text3)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>{s.label}</div>
          </div>
        ))}
      </div>

      {unsyncedCount>0&&(
        <div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:10,padding:'12px 18px',marginBottom:20,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontSize:13,color:'#92400e',fontWeight:500}}>{unsyncedCount} {t('recordsPendingSync')}</span>
          <button onClick={syncData} disabled={syncing} style={{padding:'7px 18px',background:'#c47d0a',color:'#fff',border:'none',borderRadius:7,fontSize:12,fontWeight:600,opacity:syncing?.7:1,cursor:'pointer'}}>
            {syncing?t('syncing'):t('syncNow')}
          </button>
        </div>
      )}

      {/* Register */}
      {activeTab==='register'&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:18}}>
          <form onSubmit={registerPatient}>
            <div style={card}>
              <div style={{fontSize:15,fontWeight:700,color:'var(--text)',marginBottom:20}}>{t('registerNewPatient')}</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:18}}>
                <div style={{gridColumn:'span 2'}}>
                  <FL label={t('fullName')} required/>
                  <input required value={pForm.name} onChange={e=>setPForm({...pForm,name:e.target.value})} placeholder={t('fullName')} style={iStyle} onFocus={e=>e.target.style.borderColor='#c47d0a'} onBlur={e=>e.target.style.borderColor='var(--border)'}/>
                </div>
                <div>
                  <FL label={t('age')} required/>
                  <input required type="number" min="0" max="150" value={pForm.age} onChange={e=>setPForm({...pForm,age:e.target.value})} placeholder={t('age')} style={iStyle} onFocus={e=>e.target.style.borderColor='#c47d0a'} onBlur={e=>e.target.style.borderColor='var(--border)'}/>
                </div>
                <div>
                  <FL label={t('gender')} required/>
                  <select required value={pForm.gender} onChange={e=>setPForm({...pForm,gender:e.target.value})} style={{...iStyle,background:'#fff'}} onFocus={e=>e.target.style.borderColor='#c47d0a'} onBlur={e=>e.target.style.borderColor='var(--border)'}>
                    <option value="">{t('selectGender')}</option>
                    <option value="male">{t('male')}</option>
                    <option value="female">{t('female')}</option>
                    <option value="other">{t('other')}</option>
                  </select>
                </div>
                <div style={{gridColumn:'span 2'}}>
                  <FL label={t('phone')} required/>
                  <input required type="tel" value={pForm.phone} onChange={e=>setPForm({...pForm,phone:e.target.value})} placeholder={t('phone')} style={iStyle} onFocus={e=>e.target.style.borderColor='#c47d0a'} onBlur={e=>e.target.style.borderColor='var(--border)'}/>
                </div>
                <div style={{gridColumn:'span 2'}}>
                  <FL label={t('address')}/>
                  <input value={pForm.address} onChange={e=>setPForm({...pForm,address:e.target.value})} placeholder={t('addressOptional')} style={iStyle} onFocus={e=>e.target.style.borderColor='#c47d0a'} onBlur={e=>e.target.style.borderColor='var(--border)'}/>
                </div>
                <div style={{gridColumn:'span 2'}}>
                  <FL label={t('villageArea')} required/>
                  <input required value={pForm.village} onChange={e=>setPForm({...pForm,village:e.target.value})} placeholder={t('villageArea')} style={iStyle} onFocus={e=>e.target.style.borderColor='#c47d0a'} onBlur={e=>e.target.style.borderColor='var(--border)'}/>
                </div>
              </div>
              <button type="submit" disabled={saving||!dbReady} style={{width:'100%',padding:'11px',background:(saving||!dbReady)?'var(--surface3)':'#c47d0a',color:(saving||!dbReady)?'var(--text3)':'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:(saving||!dbReady)?'not-allowed':'pointer'}}>
                {saving?t('saving'):!dbReady?t('initializing'):t('registerBtn')}
              </button>
            </div>
          </form>
          <div style={card}>
            <div style={{fontSize:13,fontWeight:700,color:'var(--text)',marginBottom:14}}>{t('recentRegistrations')}</div>
            {patients.length===0
              ?<div style={{textAlign:'center',padding:'30px 0',color:'var(--text3)',fontSize:13}}>{t('noPatientsYet')}</div>
              :patients.slice(-6).reverse().map(p=>(
                <div key={p.id} style={{paddingBottom:10,marginBottom:10,borderBottom:'1px solid var(--border)'}}>
                  <div style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>{p.name}</div>
                  <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>
                    {p.age}{t('ageFull')!=='Age'?' '+t('ageFull'):''} · {p.gender} · {p.village}
                    <span style={{marginLeft:8,padding:'1px 7px',borderRadius:20,fontSize:10,fontWeight:600,background:p.synced?'#f0fdf4':'#fffbeb',color:p.synced?'#16a34a':'#b45309'}}>
                      {p.synced?t('synced'):t('local')}
                    </span>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* Vitals */}
      {activeTab==='vitals'&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr 380px',gap:18}}>
          <form onSubmit={submitVitals}>
            <div style={card}>
              <div style={{fontSize:15,fontWeight:700,color:'var(--text)',marginBottom:20}}>{t('recordVitals')}</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:18}}>
                <div style={{gridColumn:'span 2'}}>
                  <FL label={t('selectPatient')} required/>
                  <select required value={vForm.patientId} onChange={e=>setVForm({...vForm,patientId:e.target.value})} style={{...iStyle,background:'#fff'}} onFocus={e=>e.target.style.borderColor='#c47d0a'} onBlur={e=>e.target.style.borderColor='var(--border)'}>
                    <option value="">{t('selectPatient')}</option>
                    {patients.map(p=><option key={p.id} value={p.id}>{p.name} — {p.village}</option>)}
                  </select>
                </div>
                {[['tempF','temperature','98.6','number'],['heartRate','heartRate','72','number'],['bpSystolic','bloodPressureSystolic','120','number'],['bpDiastolic','bloodPressureDiastolic','80','number']].map(([lk,fk,ph,tp])=>(
                  <div key={fk}>
                    <FL label={t(lk)} required/>
                    <input required type={tp} value={vForm[fk]} onChange={e=>setVForm({...vForm,[fk]:e.target.value})} placeholder={ph} style={iStyle} onFocus={e=>e.target.style.borderColor='#c47d0a'} onBlur={e=>e.target.style.borderColor='var(--border)'}/>
                  </div>
                ))}
                <div style={{gridColumn:'span 2'}}>
                  <FL label={t('symptoms')} required/>
                  <textarea required rows={3} value={vForm.symptoms} onChange={e=>setVForm({...vForm,symptoms:e.target.value})} placeholder={t('symptomsPlaceholder')} style={{...iStyle,resize:'vertical'}} onFocus={e=>e.target.style.borderColor='#c47d0a'} onBlur={e=>e.target.style.borderColor='var(--border)'}/>
                </div>
              </div>
              <button type="submit" disabled={saving||!dbReady} style={{width:'100%',padding:'11px',background:(saving||!dbReady)?'var(--surface3)':'#c47d0a',color:(saving||!dbReady)?'var(--text3)':'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:(saving||!dbReady)?'not-allowed':'pointer'}}>
                {saving?t('saving'):t('runTriage')}
              </button>
            </div>
          </form>

          {triageResult?(
            <div style={{...card,background:sevCfg[triageResult.severity].bg,border:`1.5px solid ${sevCfg[triageResult.severity].border}`}}>
              <div style={{fontSize:13,fontWeight:700,color:sevCfg[triageResult.severity].text,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:14}}>
                {t(triageResult.severity)}
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {triageResult.recommendations.map((r,i)=>(
                  <div key={i} style={{padding:'10px 13px',background:'rgba(255,255,255,0.7)',borderRadius:8,fontSize:13,color:'var(--text2)',fontWeight:500}}>
                    {REC_EN[r]}
                  </div>
                ))}
              </div>
            </div>
          ):(
            <div style={{...card,display:'flex',alignItems:'center',justifyContent:'center',minHeight:260}}>
              <div style={{textAlign:'center',color:'var(--text3)',fontSize:13}}>{t('submitVitalsFirst')}</div>
            </div>
          )}
        </div>
      )}

      {/* Patients */}
      {activeTab==='patients'&&(
        <div>
          <div style={{fontSize:15,fontWeight:700,color:'var(--text)',marginBottom:16}}>{t('allPatients')} ({patients.length})</div>
          {patients.length===0
            ?<div style={{...card,textAlign:'center',padding:'60px'}}><div style={{fontSize:15,color:'var(--text3)'}}>{t('noPatientsYet')}</div></div>
            :<div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                <thead>
                  <tr style={{borderBottom:'1px solid var(--border)',background:'var(--surface2)'}}>
                    {[t('name'),t('ageGender'),t('phone'),t('village'),t('status'),t('registered')].map(h=>(
                      <th key={h} style={{padding:'11px 16px',textAlign:'left',fontSize:11,fontWeight:600,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.05em'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {patients.map(p=>(
                    <tr key={p.id} onMouseEnter={e=>e.currentTarget.style.background='var(--surface2)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'} style={{borderBottom:'1px solid var(--border)'}}>
                      <td style={{padding:'12px 16px',fontWeight:600,color:'var(--text)'}}>{p.name}</td>
                      <td style={{padding:'12px 16px',color:'var(--text2)'}}>{p.age} / {p.gender}</td>
                      <td style={{padding:'12px 16px',color:'var(--text2)',fontFamily:'var(--mono)'}}>{p.phone}</td>
                      <td style={{padding:'12px 16px',color:'var(--text2)'}}>{p.village}</td>
                      <td style={{padding:'12px 16px'}}>
                        <span style={{padding:'2px 9px',borderRadius:20,fontSize:11,fontWeight:600,background:p.synced?'#f0fdf4':'#fffbeb',color:p.synced?'#16a34a':'#b45309',border:`1px solid ${p.synced?'#bbf7d0':'#fde68a'}`}}>
                          {p.synced?t('synced'):t('local')}
                        </span>
                      </td>
                      <td style={{padding:'12px 16px',color:'var(--text3)',fontFamily:'var(--mono)',fontSize:12}}>{p.createdAt?new Date(p.createdAt).toLocaleDateString('en-IN'):'—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          }
        </div>
      )}

      {activeTab==='consultation'&&(
        <div>
          <div style={{fontSize:15,fontWeight:700,color:'var(--text)',marginBottom:16}}>{t('consultationTitle')}</div>
          <ConsultationHandler role="asha" patientName={patients[0]?.name||''} patientId={patients[0]?.id||''}/>
        </div>
      )}

      {activeTab==='symptomchecker'&&(
        <div>
          <AISymptomChecker patients={patients}/>
        </div>
      )}
    </DashboardLayout>
  );
}

function FL({label,required}){
  return <label style={{display:'block',fontSize:11,fontWeight:600,color:'var(--text3)',marginBottom:5,textTransform:'uppercase',letterSpacing:'0.05em'}}>{label}{required&&<span style={{color:'var(--red)',marginLeft:2}}>*</span>}</label>;
}
