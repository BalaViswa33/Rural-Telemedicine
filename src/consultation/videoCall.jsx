import { useState, useRef, useEffect } from 'react';

export default function VideoCall({ onEnd, patientName }) {
  const [phase,     setPhase]   = useState('idle');
  const [elapsed,   setElapsed] = useState(0);
  const [muted,     setMuted]   = useState(false);
  const [camOff,    setCamOff]  = useState(false);
  const [netStatus, setNet]     = useState('ok');
  const [error,     setError]   = useState(null);

  const videoRef  = useRef(null);
  const streamRef = useRef(null);
  const timerRef  = useRef(null);

  // Network monitoring
  useEffect(() => {
    const check = () => {
      if (!navigator.onLine) { setNet('offline'); return; }
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (conn && (conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g' || conn.downlink < 0.5)) {
        setNet('low');
      } else {
        setNet('ok');
      }
    };
    check();
    window.addEventListener('online',  check);
    window.addEventListener('offline', check);
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) conn.addEventListener('change', check);
    const t = setInterval(check, 3000);
    return () => {
      window.removeEventListener('online',  check);
      window.removeEventListener('offline', check);
      if (conn) conn.removeEventListener('change', check);
      clearInterval(t);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    clearInterval(timerRef.current);
  }, []);

  // Attach stream whenever it changes — videoRef is always mounted
  const attachStream = (stream) => {
    const vid = videoRef.current;
    if (!vid || !stream) return;
    vid.srcObject = stream;
    vid.play().catch(() => {});
  };

  const startCall = async () => {
    if (streamRef.current) return;
    setError(null);
    setPhase('connecting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      attachStream(stream);           // videoRef.current is valid here — element is always in DOM
      setPhase('connected');
      timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    } catch (err) {
      const msg =
        err.name === 'NotAllowedError'  ? 'Camera/microphone permission denied. Please allow access in your browser settings and try again.' :
        err.name === 'NotFoundError'    ? 'No camera found on this device.' :
        err.name === 'NotReadableError' ? 'Camera is already in use by another application.' :
                                          'Could not access camera: ' + err.message;
      setError(msg);
      setPhase('idle');
    }
  };

  const endCall = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    clearInterval(timerRef.current);
    setPhase('idle');
    setElapsed(0);
    setMuted(false);
    setCamOff(false);
    onEnd?.();
  };

  const toggleMute = () => {
    const next = !muted;
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = !next; });
    setMuted(next);
  };

  const toggleCam = () => {
    const next = !camOff;
    streamRef.current?.getVideoTracks().forEach(t => { t.enabled = !next; });
    setCamOff(next);
  };

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;

  const connected = phase === 'connected';

  return (
    <div style={{ fontFamily:'var(--font)' }}>

      {/* ── VIDEO ELEMENT — always in DOM so ref is always valid ─────── */}
      <div style={{
        display:      connected ? 'grid' : 'none',
        gridTemplateColumns: '1fr 1fr',
        gap: 12, marginBottom: 14,
      }}>
        {/* Local cam */}
        <div style={{ position:'relative', borderRadius:12, overflow:'hidden', background:'#111', aspectRatio:'4/3' }}>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{
              width:'100%', height:'100%',
              objectFit:'cover', display:'block',
              transform:'scaleX(-1)',
              filter: camOff ? 'brightness(0)' : 'none',
              transition:'filter .2s',
            }}
          />
          {camOff && (
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'#111' }}>
              <span style={{ fontSize:13, color:'#888', fontWeight:500 }}>Camera off</span>
            </div>
          )}
          <div style={badge('left')}>You</div>
        </div>

        {/* Remote placeholder */}
        <div style={{ position:'relative', borderRadius:12, overflow:'hidden', background:'#f1f4f8', aspectRatio:'4/3', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', border:'1px solid var(--border)' }}>
          <div style={{ width:56, height:56, borderRadius:'50%', background:'#1a6fd4', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:22, fontWeight:700, marginBottom:8 }}>
            {(patientName || 'P')[0].toUpperCase()}
          </div>
          <div style={{ fontSize:13, color:'var(--text3)', fontWeight:500 }}>{patientName || 'Patient'}</div>
          <span style={{ position:'absolute', top:10, right:10, width:8, height:8, borderRadius:'50%', background:'#22c55e' }}/>
          <div style={badge('right')}>{patientName || 'Patient'}</div>
        </div>
      </div>

      {/* ── IDLE ──────────────────────────────────────────────────────── */}
      {phase === 'idle' && (
        <div style={{ textAlign:'center', padding:'32px 16px' }}>
          <div style={{ fontSize:15, fontWeight:700, color:'var(--text)', marginBottom:6 }}>
            Start Video Consultation
          </div>
          <div style={{ fontSize:13, color:'var(--text3)', marginBottom:20 }}>
            with {patientName || 'patient'}
          </div>

          {error && (
            <div style={{ margin:'0 auto 18px', maxWidth:380, padding:'11px 16px', borderRadius:9, background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', fontSize:13, textAlign:'left' }}>
              {error}
            </div>
          )}

          {netStatus !== 'ok' && (
            <div style={{ margin:'0 auto 18px', maxWidth:380, padding:'10px 16px', borderRadius:9,
              background: netStatus==='offline' ? '#fef2f2' : '#fffbeb',
              border: `1px solid ${netStatus==='offline' ? '#fecaca' : '#fde68a'}`,
              color:  netStatus==='offline' ? '#dc2626' : '#b45309',
              fontSize:13, textAlign:'left',
            }}>
              {netStatus==='offline' ? 'No internet connection — reconnect before starting a call.' : 'Weak signal — call quality may be low.'}
            </div>
          )}

          <div style={{ fontSize:12, color:'#16a34a', marginBottom:22, padding:'8px 16px', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, display:'inline-block' }}>
            Your browser will ask for camera & microphone permission — click Allow
          </div>
          <br/>
          <button
            onClick={startCall}
            disabled={netStatus === 'offline'}
            style={{
              padding:'12px 32px', borderRadius:9, border:'none',
              background: netStatus==='offline' ? '#9ca3af' : '#22c55e',
              color:'#fff', fontSize:14, fontWeight:700, cursor: netStatus==='offline' ? 'not-allowed' : 'pointer',
            }}>
            {netStatus==='offline' ? 'No Connection' : 'Start Video Call'}
          </button>
        </div>
      )}

      {/* ── CONNECTING ────────────────────────────────────────────────── */}
      {phase === 'connecting' && (
        <div style={{ textAlign:'center', padding:'40px 0' }}>
          <Spinner/>
          <div style={{ fontSize:14, color:'var(--text3)', marginTop:16 }}>Starting camera...</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:6 }}>Allow camera & microphone if prompted</div>
        </div>
      )}

      {/* ── CONNECTED — controls ──────────────────────────────────────── */}
      {connected && (
        <>
          {netStatus !== 'ok' && (
            <div style={{ marginBottom:12, padding:'10px 14px', borderRadius:9,
              background: netStatus==='offline' ? '#fef2f2' : '#fffbeb',
              border:`1px solid ${netStatus==='offline' ? '#fecaca' : '#fde68a'}`,
              color: netStatus==='offline' ? '#dc2626' : '#b45309',
              fontSize:13,
            }}>
              {netStatus==='offline' ? 'Connection lost — your camera is still on.' : 'Weak signal — video quality reduced.'}
            </div>
          )}

          {/* Timer + end */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:'#22c55e', display:'inline-block', animation:'pulse 1.5s infinite' }}/>
              <span style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>Live · {fmt(elapsed)}</span>
            </div>
            <button onClick={endCall} style={{ padding:'8px 18px', background:'#dc2626', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>
              End Call
            </button>
          </div>

          {/* Controls */}
          <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
            <CtrlBtn active={muted}   onClick={toggleMute}  label={muted   ? 'Unmute'     : 'Mute'}       />
            <CtrlBtn active={camOff}  onClick={toggleCam}   label={camOff  ? 'Camera On'  : 'Camera Off'} />
          </div>
        </>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  );
}

function CtrlBtn({ onClick, label, active }) {
  return (
    <button onClick={onClick} style={{
      padding:'9px 20px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer',
      fontFamily:'var(--font)', border:'1px solid var(--border)',
      background: active ? '#fef2f2' : 'var(--surface2)',
      color:      active ? '#dc2626' : 'var(--text2)',
      transition:'all .15s',
    }}>{label}</button>
  );
}

function badge(side) {
  return {
    position:'absolute', bottom:8, [side==='left'?'left':'right']:8,
    background:'rgba(0,0,0,0.5)', color:'#fff',
    fontSize:11, padding:'3px 9px', borderRadius:6,
  };
}

function Spinner() {
  return (
    <div style={{
      width:40, height:40, borderRadius:'50%',
      border:'4px solid #dcfce7', borderTopColor:'#22c55e',
      margin:'0 auto', animation:'spin 1s linear infinite',
    }}/>
  );
}
