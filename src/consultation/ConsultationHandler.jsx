import { useState } from 'react';
import { useNetwork, NETWORK_TYPES, NETWORK_META } from '../network/networkContext.jsx';
import VideoCall       from './videoCall';
import AudioCall       from './audioCall';
import StoreAndForward from './storeAndForward';

/* ─────────────────────────────────────────────────────────────────────────────
   ConsultationHandler
   Props:
     patientName : string  — name of the patient being consulted
     patientId   : string  — id of the patient
     role        : 'asha' | 'doctor'   (patients cannot initiate)
─────────────────────────────────────────────────────────────────────────────── */
export default function ConsultationHandler({ patientName, patientId, role }) {
  const { network, setNetwork, networkMeta, syncStatus, syncMessage, pendingCount } = useNetwork();
  const [started, setStarted] = useState(false);

  // Patient role guard
  if (role === 'patient') {
    return (
      <div style={infoBox('#f59e0b')}>
        🔒 Consultation can only be initiated by ASHA workers or Doctors.
      </div>
    );
  }

  const meta = networkMeta;

  return (
    <div>
      {/* ── Sync status toast ── */}
      {syncStatus !== 'idle' && (
        <div style={{
          padding: '12px 18px', borderRadius: 12, marginBottom: 16,
          background: syncStatus === 'syncing' ? 'rgba(59,130,246,0.1)' : syncStatus === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${syncStatus === 'syncing' ? 'rgba(59,130,246,0.3)' : syncStatus === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
          color: syncStatus === 'syncing' ? '#3b82f6' : syncStatus === 'success' ? '#22c55e' : '#ef4444',
          fontWeight: 600,
        }}>
          {syncStatus === 'syncing' && <span style={{ width:14, height:14, border:'2px solid currentColor', borderTopColor:'transparent', borderRadius:'50%', display:'inline-block', animation:'spin 0.8s linear infinite' }} />}
          {syncMessage}
        </div>
      )}

      {/* ── Top bar: network selector + badge ── */}
      <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap', marginBottom:20 }}>
        {/* Network selector dropdown */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:12, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Network</span>
          <select
            value={network}
            onChange={e => { setNetwork(e.target.value); }}
            style={{
              padding:'8px 14px', borderRadius:10,
              background:'var(--surface2)', border:'1.5px solid var(--border)',
              color:'var(--text)', fontSize:13, fontWeight:700,
              fontFamily:'var(--font)', outline:'none', cursor:'pointer',
            }}
          >
            {Object.values(NETWORK_TYPES).map(n => (
              <option key={n} value={n}>
                {n === '4G' ? '📶' : n === '3G' ? '📶' : n === '2G' ? '📡' : '❌'} {n}
              </option>
            ))}
          </select>
        </div>

        {/* Colour-coded badge */}
        <NetworkBadge meta={meta} />

        {/* Mode label */}
        <div style={{ padding:'6px 14px', borderRadius:20, background:'var(--surface2)', border:'1px solid var(--border)', fontSize:12, fontWeight:700, color:'var(--text2)' }}>
          {meta.mode}
        </div>

        {/* Pending offline count */}
        {pendingCount > 0 && (
          <div style={{ marginLeft:'auto', padding:'6px 14px', borderRadius:20, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', fontSize:12, fontWeight:700, color:'#ef4444' }}>
            📴 {pendingCount} offline {pendingCount === 1 ? 'entry' : 'entries'} pending sync
          </div>
        )}
      </div>

      {/* ── Network info banner ── */}
      <div style={{
        padding:'14px 18px', borderRadius:14, marginBottom:20,
        background: meta.bg, border:`1px solid ${meta.border}`,
        display:'flex', alignItems:'center', gap:12,
      }}>
        <NetworkIcon network={network} />
        <div>
          <div style={{ fontSize:14, fontWeight:800, color: meta.color }}>{meta.mode}</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>
            {network === '4G' && 'Strong signal — full HD video consultation available.'}
            {network === '3G' && 'Medium signal — audio-only to conserve bandwidth.'}
            {network === '2G' && 'Weak signal — upload a photo and description for async review.'}
            {network === 'None' && 'No connection — describe the issue and it will sync automatically when internet returns.'}
          </div>
        </div>
      </div>

      {/* ── Patient context bar ── */}
      {(patientName || patientId) && (
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'var(--surface2)', borderRadius:10, border:'1px solid var(--border)', marginBottom:18 }}>
          <span style={{ fontSize:20 }}>🧑‍⚕️</span>
          <div style={{ fontSize:13, color:'var(--text2)' }}>
            Consulting for: <span style={{ fontWeight:700, color:'var(--text)' }}>{patientName || patientId}</span>
          </div>
        </div>
      )}

      {/* ── Consultation panel ── keep all panels mounted so video stream survives network switches ── */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:20, padding:'28px' }}>

        {/* 4G — Video */}
        <div style={{ display: network === '4G' ? 'block' : 'none' }}>
          {!started ? (
            <div style={{ textAlign:'center', padding:'24px 0' }}>
              <div style={{ fontSize:52, marginBottom:12 }}>🎥</div>
              <div style={{ fontSize:16, fontWeight:700, color:'var(--text)', marginBottom:6 }}>Ready to video call</div>
              <div style={{ fontSize:13, color:'var(--text3)', marginBottom:24 }}>HD video + audio via getUserMedia</div>
              <button onClick={() => setStarted(true)} style={{ padding:'14px 32px', background:'#22c55e', color:'#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:800, fontFamily:'var(--font)', boxShadow:'0 4px 18px rgba(34,197,94,0.35)', cursor:'pointer' }}>
                📹 Start Video Consultation
              </button>
            </div>
          ) : (
            <VideoCall patientName={patientName} onEnd={() => setStarted(false)} />
          )}
        </div>

        {/* 3G — Audio */}
        <div style={{ display: network === '3G' ? 'block' : 'none' }}>
          {!started ? (
            <div style={{ textAlign:'center', padding:'24px 0' }}>
              <div style={{ fontSize:52, marginBottom:12 }}>📞</div>
              <div style={{ fontSize:16, fontWeight:700, color:'var(--text)', marginBottom:6 }}>Ready to audio call</div>
              <div style={{ fontSize:13, color:'var(--text3)', marginBottom:24 }}>Audio-only call · video disabled on 3G</div>
              <button onClick={() => setStarted(true)} style={{ padding:'14px 32px', background:'#3b82f6', color:'#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:800, fontFamily:'var(--font)', boxShadow:'0 4px 18px rgba(59,130,246,0.35)', cursor:'pointer' }}>
                📞 Start Audio Consultation
              </button>
            </div>
          ) : (
            <AudioCall patientName={patientName} onEnd={() => setStarted(false)} />
          )}
        </div>

        {/* 2G / None — Store and Forward */}
        <div style={{ display: (network === '2G' || network === 'None') ? 'block' : 'none' }}>
          <StoreAndForward mode={network} patientName={patientName} patientId={patientId} />
        </div>

      </div>
    </div>
  );
}

/* ── Sub-components ── */

function NetworkBadge({ meta }) {
  return (
    <div style={{
      display:'inline-flex', alignItems:'center', gap:7,
      padding:'6px 14px', borderRadius:20,
      background: meta.bg, border:`1.5px solid ${meta.border}`,
    }}>
      <span style={{ width:8, height:8, borderRadius:'50%', background:meta.color, animation:'consultPulse 1.5s infinite', display:'inline-block' }} />
      <span style={{ fontSize:12, fontWeight:800, color:meta.color, letterSpacing:'0.06em' }}>{meta.label}</span>
      <style>{`@keyframes consultPulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  );
}

function NetworkIcon({ network }) {
  const icons = { '4G':'📶', '3G':'📶', '2G':'📡', 'None':'❌' };
  return <span style={{ fontSize:28, flexShrink:0 }}>{icons[network]}</span>;
}

function infoBox(color) {
  return {
    padding:'16px 20px', borderRadius:14,
    background:`${color}12`, border:`1px solid ${color}44`,
    fontSize:14, fontWeight:600, color,
  };
}
