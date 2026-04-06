import { useState, useRef, useEffect } from 'react';

export default function AudioCall({ onEnd, patientName }) {
  const [phase,   setPhase]   = useState('idle');
  const [elapsed, setElapsed] = useState(0);
  const [muted,   setMuted]   = useState(false);
  const streamRef = useRef(null);
  const timerRef  = useRef(null);

  const startCall = async () => {
    setPhase('connecting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      setTimeout(() => {
        setPhase('connected');
        timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
      }, 1400);
    } catch {
      alert('Microphone permission is required for audio calls.');
      setPhase('idle');
    }
  };

  const endCall = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    clearInterval(timerRef.current);
    onEnd?.();
  };

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => { t.enabled = muted; });
      setMuted(m => !m);
    }
  };

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    clearInterval(timerRef.current);
  }, []);

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;

  /* ── idle ── */
  if (phase === 'idle') return (
    <div style={{ textAlign:'center', padding:'40px 0' }}>
      <div style={{ fontSize:56, marginBottom:16 }}>📞</div>
      <div style={{ fontSize:16, fontWeight:700, color:'var(--text)', marginBottom:6 }}>
        Start Audio Consultation
      </div>
      <div style={{ fontSize:13, color:'var(--text3)', marginBottom:6 }}>
        3G network — audio only for {patientName || 'patient'}
      </div>
      <div style={{ display:'inline-block', padding:'4px 12px', borderRadius:20, background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.3)', color:'#3b82f6', fontSize:12, fontWeight:700, marginBottom:24 }}>
        ℹ️ Move to 4G / WiFi to enable video
      </div>
      <br />
      <button onClick={startCall} style={btn('#3b82f6')}>📞 Start Audio Call</button>
    </div>
  );

  /* ── connecting ── */
  if (phase === 'connecting') return (
    <div style={{ textAlign:'center', padding:'40px 0' }}>
      <Spinner color="#3b82f6" />
      <div style={{ fontSize:14, color:'var(--text3)', marginTop:16 }}>Connecting audio…</div>
    </div>
  );

  /* ── connected ── */
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ width:10, height:10, borderRadius:'50%', background:'#3b82f6', display:'inline-block', animation:'consultPulse 1.5s infinite' }} />
          <span style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>Audio · {fmt(elapsed)}</span>
        </div>
        <button onClick={endCall} style={btn('#ef4444', true)}>📵 End</button>
      </div>

      {/* Doctor card + waveform */}
      <div style={{ background:'var(--surface2)', border:'1.5px solid rgba(59,130,246,0.3)', borderRadius:18, padding:'32px', textAlign:'center', marginBottom:20 }}>
        <div style={{ fontSize:56, marginBottom:10 }}>👨‍⚕️</div>
        <div style={{ fontSize:16, fontWeight:800, color:'var(--text)', marginBottom:4 }}>Doctor</div>
        <div style={{ fontSize:13, color:'#3b82f6', fontWeight:600, marginBottom:20 }}>
          🔊 Connected
        </div>
        {/* Animated waveform bars */}
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'center', gap:5, height:48 }}>
          {[...Array(12)].map((_, i) => (
            <div key={i} style={{
              width: 5, borderRadius: 3,
              background: muted ? 'var(--surface3)' : '#3b82f6',
              animation: muted ? 'none' : `waveBar ${0.6 + (i % 5) * 0.18}s ease-in-out ${(i * 0.08) % 0.5}s infinite alternate`,
              minHeight: 4,
            }} />
          ))}
        </div>
        {muted && <div style={{ fontSize:12, color:'var(--text3)', marginTop:8 }}>🔇 Microphone muted</div>}
      </div>

      {/* Controls */}
      <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
        <button onClick={toggleMute} style={{
          padding:'10px 20px', borderRadius:10, border:'1px solid var(--border2)',
          background: muted ? 'rgba(239,68,68,0.12)' : 'var(--surface2)',
          color: muted ? '#ef4444' : 'var(--text2)',
          fontSize:13, fontWeight:700, fontFamily:'var(--font)',
        }}>
          {muted ? '🔇 Unmute' : '🎤 Mute'}
        </button>
        <button style={{ padding:'10px 20px', borderRadius:10, border:'1px solid var(--border2)', background:'var(--surface2)', color:'var(--text2)', fontSize:13, fontWeight:700, fontFamily:'var(--font)' }}>
          💬 Chat
        </button>
      </div>

      <style>{`
        @keyframes consultPulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes waveBar { from{height:6px} to{height:36px} }
      `}</style>
    </div>
  );
}

function btn(color, small) {
  return { padding: small ? '9px 18px' : '13px 28px', background: color, color:'#fff', border:'none', borderRadius:11, fontSize: small ? 13 : 14, fontWeight:800, fontFamily:'var(--font)', cursor:'pointer' };
}

function Spinner({ color }) {
  return <div style={{ width:44, height:44, border:`4px solid ${color}33`, borderTopColor:color, borderRadius:'50%', margin:'0 auto', animation:'spin 1s linear infinite' }} />;
}
