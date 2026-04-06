import { useState, useEffect, useRef, useCallback } from 'react';
import { getNetworkQuality, getNetworkInfo, compressImage, formatBytes, sendMeshMessage, onMeshMessage, getMeshHistory } from '../utils/network';

function SignalBar({ bars, color }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:20 }}>
      {[1,2,3,4].map(n=>(
        <div key={n} style={{ width:5, height:n*5, borderRadius:2, background:n<=bars?color:'rgba(255,255,255,0.08)', transition:'background .3s' }}/>
      ))}
    </div>
  );
}

// ─── VideoPanel ───────────────────────────────────────────────────────────────
function VideoPanel({ doctorName }) {
  const [state, setState] = useState('idle'); // idle | calling | connected
  const [muted, setMuted] = useState(false);
  const [netStatus, setNetStatus] = useState('ok'); // ok | low | offline
  const videoRef  = useRef(null);
  const streamRef = useRef(null);

  // Monitor network while on a call
  useEffect(() => {
    const check = () => {
      if (!navigator.onLine) { setNetStatus('offline'); return; }
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (conn) {
        const { effectiveType, downlink } = conn;
        if (effectiveType === '2g' || effectiveType === 'slow-2g' || downlink < 0.5) {
          setNetStatus('low');
        } else {
          setNetStatus('ok');
        }
      } else {
        setNetStatus('ok');
      }
    };
    check();
    window.addEventListener('online', check);
    window.addEventListener('offline', check);
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) conn.addEventListener('change', check);
    const t = setInterval(check, 3000);
    return () => {
      window.removeEventListener('online', check);
      window.removeEventListener('offline', check);
      if (conn) conn.removeEventListener('change', check);
      clearInterval(t);
    };
  }, []);

  const attachStream = (stream) => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  };

  const start = async () => {
    if (streamRef.current) return;
    setState('calling');
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = s;
      attachStream(s);
      setState('connected');
    } catch (err) {
      setState('idle');
      const msg = err.name === 'NotAllowedError'
        ? 'Camera/microphone permission denied. Allow access in browser settings.'
        : 'Could not access camera: ' + err.message;
      alert(msg);
    }
  };

  const end = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setState('idle');
    setMuted(false);
  };

  const toggleMute = () => {
    const next = !muted;
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = !next; });
    setMuted(next);
  };

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  const netBanner = state === 'connected' && netStatus !== 'ok' ? (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
      padding: '10px 14px',
      background: netStatus === 'offline' ? 'rgba(239,68,68,0.92)' : 'rgba(234,179,8,0.92)',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span style={{ fontSize: 16 }}>{netStatus === 'offline' ? '📵' : '⚠️'}</span>
      <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>
        {netStatus === 'offline'
          ? 'No internet — call may disconnect'
          : 'Weak signal — video quality reduced'}
      </span>
      {netStatus === 'offline' && (
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
          Camera still on
        </span>
      )}
    </div>
  ) : null;

  return (
    <div>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:4 }}>🎥 Video Consultation</div>
        <div style={{ fontSize:13, color:'var(--text3)' }}>
          {netStatus === 'offline' ? '📵 No internet connection' : netStatus === 'low' ? '⚠️ Weak signal detected' : 'Strong signal — HD video available with Dr. ' + doctorName}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
        <div style={{ position:'relative', borderRadius:12, overflow:'hidden', background:'#0b0f18', aspectRatio:'4/3' }}>
          {netBanner}
          {state !== 'connected' && (
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:2, background:'#0b0f18' }}>
              {state === 'idle'    && <span style={{ fontSize:36 }}>📷</span>}
              {state === 'calling' && <div style={{ width:28,height:28,border:'3px solid #22c55e',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 1s linear infinite' }}/>}
            </div>
          )}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', transform:'scaleX(-1)' }}
          />
          <span style={{ position:'absolute',bottom:8,left:8,zIndex:3,background:'rgba(0,0,0,0.6)',color:'#fff',fontSize:11,padding:'3px 8px',borderRadius:6,fontFamily:'var(--mono)' }}>You</span>
        </div>
        <div style={{ background:'var(--surface2)', borderRadius:12, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', aspectRatio:'4/3', position:'relative' }}>
          <span style={{ fontSize:48 }}>👨‍⚕️</span>
          <span style={{ fontSize:13,color:'var(--text3)',marginTop:8,fontWeight:700 }}>Dr. {doctorName}</span>
          <span style={{ position:'absolute',top:10,right:10,width:9,height:9,borderRadius:'50%',background:'var(--teal)' }}/>
        </div>
      </div>

      {/* Controls — always visible, behaviour changes by state */}
      {state === 'idle' && (
        <div>
          <div style={{ fontSize:12, color:'var(--text3)', marginBottom:12, padding:'8px 14px', background:'rgba(15,212,160,0.08)', border:'1px solid rgba(15,212,160,0.2)', borderRadius:10 }}>
            Your browser will ask for camera & microphone permission — click <strong>Allow</strong>
          </div>
          <button onClick={start} style={Btn('#22c55e')}>📹 Start Video Call</button>
        </div>
      )}
      {state === 'calling' && (
        <div style={{ fontSize:14, color:'var(--text3)', padding:'8px 0' }}>Accessing camera… allow permission if prompted</div>
      )}
      {state === 'connected' && (
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={toggleMute} style={{ padding:'10px 18px', background: muted?'rgba(239,68,68,0.15)':'var(--surface2)', border: muted?'1px solid rgba(239,68,68,0.4)':'1px solid var(--border2)', borderRadius:10, color: muted?'#ef4444':'var(--text2)', fontSize:13, fontWeight:700, cursor:'pointer' }}>
            {muted ? '🔇 Unmute' : '🎤 Mute'}
          </button>
          <button onClick={end} style={{ padding:'10px 24px', background:'#ef4444', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:800, cursor:'pointer', marginLeft:'auto' }}>📵 End Call</button>
        </div>
      )}
    </div>
  );
}

// ─── AudioPanel ───────────────────────────────────────────────────────────────
function AudioPanel({ doctorName }) {
  const [state, setState] = useState('idle');
  const [secs, setSecs] = useState(0);
  const [muted, setMuted] = useState(false);
  const timer  = useRef(null);
  const stream = useRef(null);

  const start = async () => {
    setState('calling');
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio:true });
      setState('connected');
      timer.current = setInterval(() => setSecs(s => s+1), 1000);
    } catch { setState('idle'); alert('Microphone required.'); }
  };

  const end = () => {
    stream.current?.getTracks().forEach(t => t.stop());
    stream.current = null;
    clearInterval(timer.current);
    setState('idle');
    setSecs(0);
    setMuted(false);
  };

  const toggleMute = () => {
    const next = !muted;
    stream.current?.getAudioTracks().forEach(t => { t.enabled = !next; });
    setMuted(next);
  };

  useEffect(() => () => { stream.current?.getTracks().forEach(t => t.stop()); clearInterval(timer.current); }, []);

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:4 }}>📞 Audio Consultation</div>
        <div style={{ fontSize:13, color:'var(--text3)', marginBottom:8 }}>3G signal — audio only. Move closer to WiFi for video.</div>
        <span style={{ padding:'4px 12px', borderRadius:20, background:'rgba(61,142,248,0.12)', border:'1px solid rgba(61,142,248,0.25)', color:'var(--blue)', fontSize:12, fontWeight:700 }}>ℹ️ Move to stronger signal for video</span>
      </div>
      {state==='idle'    && <button onClick={start} style={Btn('#3b82f6')}>📞 Start Audio Call</button>}
      {state==='calling' && <div style={{ display:'flex',alignItems:'center',gap:12,padding:'20px 0' }}><div style={{ width:28,height:28,border:'3px solid var(--blue)',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 1s linear infinite' }}/><span style={{ fontSize:14,color:'var(--text3)' }}>Connecting…</span></div>}
      {state==='connected' && (
        <div style={{ display:'flex', gap:20, alignItems:'center' }}>
          <div style={{ background:'var(--surface2)', border:'1.5px solid rgba(61,142,248,.3)', borderRadius:16, padding:'28px 32px', textAlign:'center', flex:1 }}>
            <div style={{ fontSize:52,marginBottom:8 }}>👨‍⚕️</div>
            <div style={{ fontSize:15,fontWeight:800,color:'var(--text)',marginBottom:4 }}>Dr. {doctorName}</div>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:8,color:'var(--teal)',fontWeight:700,fontSize:14 }}>
              <span style={{ width:8,height:8,borderRadius:'50%',background:'var(--teal)',display:'inline-block',animation:'pulse 1.5s infinite' }}/>
              {fmt(secs)}
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <button onClick={toggleMute} style={{ padding:'10px 18px', background: muted?'rgba(239,68,68,0.15)':'var(--surface2)', border: muted?'1px solid rgba(239,68,68,0.4)':'1px solid var(--border2)', borderRadius:10, color: muted?'#ef4444':'var(--text2)', fontSize:13, fontWeight:700, cursor:'pointer' }}>
              {muted ? '🔇 Unmute' : '🎤 Mute'}
            </button>
            <button onClick={end} style={{ padding:'12px 22px', background:'#ef4444', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:800, cursor:'pointer' }}>📵 End</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── savePhotoConsultation ────────────────────────────────────────────────────
function savePhotoConsultation(data) {
  return new Promise((resolve) => {
    const req = indexedDB.open('HealthSystemDB', 2);
    req.onerror = () => resolve(null);
    req.onsuccess = () => {
      const idb = req.result;
      if (!idb.objectStoreNames.contains('consultations')) { idb.close(); resolve(null); return; }
      const record = {
        id: `cns_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
        patientId: data.patientId || 'patient',
        patientName: data.patientName || 'Patient',
        description: data.description || '',
        imageData: data.imageData || null,
        imageName: data.imageName || null,
        networkMode: '2G',
        synced: false,
        createdAt: new Date().toISOString(),
      };
      const r = idb.transaction(['consultations'], 'readwrite').objectStore('consultations').add(record);
      r.onsuccess = () => { idb.close(); resolve(record); };
      r.onerror   = () => { idb.close(); resolve(null); };
    };
    req.onupgradeneeded = (e) => {
      const idb = e.target.result;
      if (!idb.objectStoreNames.contains('consultations')) {
        idb.createObjectStore('consultations', { keyPath: 'id' });
      }
    };
  });
}

// ─── ImagePanel ───────────────────────────────────────────────────────────────
function ImagePanel({ patientName }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [compressed, setCompressed] = useState(null);
  const [compressing, setCompressing] = useState(false);
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const pick = async (e) => {
    const f = e.target.files[0]; if(!f) return;
    setFile(f); setCompressed(null); setSent(false);
    setPreview(URL.createObjectURL(f));
    setCompressing(true);
    try { const b = await compressImage(f, 800, 0.45); setCompressed({ blob: b, size: b.size }); }
    catch { alert('Compression failed.'); }
    setCompressing(false);
  };

  const send = async () => {
    if (!compressed) return;
    setSending(true);
    const base64 = await new Promise((res) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result);
      reader.readAsDataURL(compressed.blob);
    });
    await savePhotoConsultation({
      patientName: patientName || 'Patient',
      description: description.trim(),
      imageData: base64,
      imageName: file?.name || 'photo.jpg',
    });
    setSending(false);
    setSent(true);
  };

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:4 }}>📷 Send Photo to Doctor</div>
        <div style={{ fontSize:13, color:'var(--text3)', marginBottom:8 }}>2G signal — upload a photo of your concern, doctor will review it</div>
        <span style={{ padding:'4px 12px', borderRadius:20, background:'rgba(245,166,35,0.12)', border:'1px solid rgba(245,166,35,0.25)', color:'var(--amber)', fontSize:12, fontWeight:700 }}>⚠️ Auto-compressed for 2G network</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <label style={{ border:'2px dashed var(--border2)', borderRadius:14, padding:'24px', textAlign:'center', cursor:'pointer', background:'var(--surface2)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, minHeight:180 }}>
          <input type="file" accept="image/*" onChange={pick} style={{ display:'none' }}/>
          {preview ? <img src={preview} alt="" style={{ maxWidth:'100%', maxHeight:150, borderRadius:8 }}/> : <><span style={{fontSize:36}}>📸</span><span style={{fontSize:13,color:'var(--text3)'}}>Click to select image</span></>}
        </label>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {file && (
            <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:12, padding:'14px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:13 }}>
                <span style={{ color:'var(--text3)' }}>Original:</span>
                <span style={{ color:'var(--text)', fontWeight:700, fontFamily:'var(--mono)' }}>{formatBytes(file.size)}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:13 }}>
                <span style={{ color:'var(--text3)' }}>Compressed:</span>
                <span style={{ color:'var(--teal)', fontWeight:700, fontFamily:'var(--mono)' }}>{compressing?'Working…':compressed?formatBytes(compressed.size):'—'}</span>
              </div>
              {compressed && <div style={{ display:'flex',justifyContent:'space-between',fontSize:13 }}>
                <span style={{color:'var(--text3)'}}>Saved:</span>
                <span style={{color:'var(--teal)',fontWeight:700,fontFamily:'var(--mono)'}}>{Math.round((1-compressed.size/file.size)*100)}% smaller</span>
              </div>}
            </div>
          )}
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your symptoms…" rows={3}
            style={{ padding:'10px 12px', background:'var(--surface2)', border:'1.5px solid var(--border)', borderRadius:10, fontSize:13, color:'var(--text)', outline:'none', fontFamily:'var(--font)', resize:'none' }}/>
          {!sent
            ? <button onClick={send} disabled={!compressed||compressing||sending} style={{ padding:'12px', background:compressed&&!compressing&&!sending?'var(--amber)':'var(--surface2)', color:compressed&&!compressing&&!sending?'#0b0f18':'var(--text3)', border:'none', borderRadius:10, fontSize:14, fontWeight:800, cursor:compressed&&!compressing&&!sending?'pointer':'not-allowed' }}>
                {sending?'⏳ Saving…':compressing?'⏳ Compressing…':'📤 Send to Doctor'}
              </button>
            : <div style={{ padding:'14px', background:'rgba(15,212,160,.08)', border:'1px solid rgba(15,212,160,.25)', borderRadius:10, fontSize:13, fontWeight:700, color:'var(--teal)', textAlign:'center' }}>✅ Photo sent! Doctor will see it in "Patient Photos" tab.</div>
          }
        </div>
      </div>
    </div>
  );
}

// ─── MeshPanel ────────────────────────────────────────────────────────────────
function MeshPanel({ userName }) {
  const [msgs, setMsgs] = useState(getMeshHistory());
  const [draft, setDraft] = useState('');
  const bottomRef = useRef(null);
  useEffect(()=>{ const u=onMeshMessage(m=>setMsgs(p=>[...p,m])); return u; },[]);
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}); },[msgs]);
  const send = () => {
    const text=draft.trim(); if(!text) return;
    sendMeshMessage({from:userName||'Patient',to:'Doctor',text});
    setMsgs(p=>[...p,{id:`l_${Date.now()}`,from:userName||'Patient',to:'Doctor',text,timestamp:new Date().toISOString()}]);
    setDraft('');
  };
  return (
    <div>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:4 }}>📡 Mesh Network</div>
        <div style={{ fontSize:13, color:'var(--text3)', marginBottom:8 }}>No signal — using device-to-device mesh network</div>
        <span style={{ display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',borderRadius:20,background:'rgba(240,82,82,0.1)',border:'1px solid rgba(240,82,82,0.25)',color:'var(--red)',fontSize:12,fontWeight:700 }}>
          <span style={{width:7,height:7,borderRadius:'50%',background:'var(--red)',animation:'pulse 1.5s infinite',display:'inline-block'}}/>No Signal — Mesh Active
        </span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:14 }}>
        <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:12, padding:12, height:260, overflowY:'auto', display:'flex', flexDirection:'column', gap:8 }}>
          {msgs.length===0 ? <div style={{textAlign:'center',color:'var(--text3)',fontSize:13,paddingTop:80}}>No messages yet</div>
            : msgs.map(m=>{
                const own=m.from===(userName||'Patient');
                return (
                  <div key={m.id} style={{display:'flex',justifyContent:own?'flex-end':'flex-start'}}>
                    <div style={{maxWidth:'75%',padding:'9px 13px',background:own?'var(--blue)':'var(--surface)',color:own?'#fff':'var(--text)',borderRadius:own?'14px 14px 4px 14px':'14px 14px 14px 4px',fontSize:13,border:own?'none':'1px solid var(--border)'}}>
                      <div style={{fontSize:10,opacity:.6,marginBottom:3}}>{m.from}→{m.to}</div>
                      {m.text}
                      <div style={{fontSize:9,opacity:.5,marginTop:3,textAlign:'right',fontFamily:'var(--mono)'}}>{new Date(m.timestamp).toLocaleTimeString()}</div>
                    </div>
                  </div>
                );
              })
          }
          <div ref={bottomRef}/>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <textarea value={draft} onChange={e=>setDraft(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&(e.preventDefault(),send())}
            placeholder="Describe symptoms…" rows={6}
            style={{ flex:1,padding:'11px 13px',background:'var(--surface2)',border:'1.5px solid var(--border)',borderRadius:11,fontSize:13,color:'var(--text)',outline:'none',fontFamily:'var(--font)',resize:'none',transition:'border-color .2s' }}
            onFocus={e=>e.target.style.borderColor='var(--red)'} onBlur={e=>e.target.style.borderColor='var(--border)'}/>
          <button onClick={send} disabled={!draft.trim()} style={{ padding:'12px',background:draft.trim()?'var(--red)':'var(--surface2)',color:draft.trim()?'#fff':'var(--text3)',border:'none',borderRadius:10,fontSize:14,fontWeight:800,cursor:draft.trim()?'pointer':'not-allowed' }}>📡 Send via Mesh</button>
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}`}</style>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function NetworkAwareConsult({ doctorName='Sharma', patientName }) {
  const [quality, setQuality] = useState(getNetworkQuality());
  const [manualOverride, setManualOverride] = useState(false);
  const info = getNetworkInfo(quality);

  const selectQuality = useCallback((q) => {
    setManualOverride(true);
    setQuality(q);
  }, []);

  useEffect(() => {
    if (manualOverride) return;
    const refresh = () => setQuality(getNetworkQuality());
    window.addEventListener('online', refresh);
    window.addEventListener('offline', refresh);
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) conn.addEventListener('change', refresh);
    return () => {
      window.removeEventListener('online', refresh);
      window.removeEventListener('offline', refresh);
      if (conn) conn.removeEventListener('change', refresh);
    };
  }, [manualOverride]);

  return (
    <div>
      {/* Network status bar */}
      <div style={{ background:'var(--surface)', border:`1px solid color-mix(in srgb, ${info.color} 30%, transparent)`, borderRadius:16, padding:'16px 20px', marginBottom:16, display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
        <SignalBar bars={info.bars} color={info.color}/>
        <div style={{ flex:1, minWidth:120 }}>
          <div style={{ fontSize:14,fontWeight:800,color:'var(--text)' }}>{info.icon} {info.label}</div>
          <div style={{ fontSize:12,color:'var(--text3)',marginTop:2 }}>{info.recommendation}</div>
        </div>
        <div style={{ padding:'5px 12px',background:`color-mix(in srgb, ${info.color} 12%, transparent)`,border:`1px solid color-mix(in srgb, ${info.color} 25%, transparent)`,borderRadius:20,fontSize:12,fontWeight:800,color:info.color }}>
          {quality==='strong'?'4G/WiFi HD':quality==='medium'?'3G Audio':quality==='weak'?'2G Image':'No Signal Mesh'}
        </div>
        <div style={{ display:'flex', gap:6, borderLeft:'1px solid var(--border)', paddingLeft:16 }}>
          {['strong','medium','weak','none'].map(q=>(
            <button key={q} onClick={()=>selectQuality(q)} style={{
              padding:'5px 12px', borderRadius:20, cursor:'pointer',
              border:`1.5px solid ${quality===q?getNetworkInfo(q).color:'var(--border)'}`,
              background:quality===q?`color-mix(in srgb, ${getNetworkInfo(q).color} 15%, transparent)`:'transparent',
              color:quality===q?getNetworkInfo(q).color:'var(--text3)',
              fontSize:11,fontWeight:800,fontFamily:'var(--font)',
            }}>{q==='strong'?'4G':q==='medium'?'3G':q==='weak'?'2G':'None'}</button>
          ))}
          {manualOverride && (
            <button onClick={()=>{ setManualOverride(false); setQuality(getNetworkQuality()); }} style={{
              padding:'5px 12px', borderRadius:20, cursor:'pointer',
              border:'1.5px solid var(--border)', background:'transparent',
              color:'var(--text3)', fontSize:11, fontWeight:800, fontFamily:'var(--font)',
            }}>↺ Auto</button>
          )}
        </div>
      </div>

      {/* Mode panels — each stays mounted, CSS visibility switches between them */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:20, padding:'28px' }}>
        <div style={{ display: quality==='strong' ? 'block' : 'none' }}><VideoPanel doctorName={doctorName}/></div>
        <div style={{ display: quality==='medium' ? 'block' : 'none' }}><AudioPanel doctorName={doctorName}/></div>
        <div style={{ display: quality==='weak'   ? 'block' : 'none' }}><ImagePanel patientName={patientName}/></div>
        <div style={{ display: quality==='none'   ? 'block' : 'none' }}><MeshPanel userName={patientName}/></div>
      </div>
    </div>
  );
}

function Btn(color) {
  return { padding:'12px 28px', background:color, color:'#0b0f18', border:'none', borderRadius:11, fontSize:14, fontWeight:800, boxShadow:`0 4px 16px ${color}55`, cursor:'pointer' };
}
