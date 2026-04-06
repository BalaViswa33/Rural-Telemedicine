// src/call/SimpleCall.jsx
// No backend needed — uses BroadcastChannel to signal between browser tabs.
// Patient tab clicks "Call Doctor" → Doctor tab sees modal → Doctor accepts → WebRTC video starts.

import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";

const CHANNEL_NAME = "telemedicine_call";
const ICE_SERVERS  = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

export default function SimpleCall() {
  const { user } = useAuth();
  const isDoctor  = user?.role === "doctor";
  const isPatient = user?.role === "patient";

  const channel   = useRef(null);
  const pc        = useRef(null);
  const localStream = useRef(null);

  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);

  const [callState, setCallState]       = useState("idle");
  const [incomingFrom, setIncomingFrom] = useState(null);
  const [error, setError]               = useState("");

  useEffect(() => {
    const ch = new BroadcastChannel(CHANNEL_NAME);
    channel.current = ch;

    ch.onmessage = async (e) => {
      const msg = e.data;

      if (msg.type === "call_request" && isDoctor) {
        setIncomingFrom(msg.patientName);
        setCallState("incoming");
      }

      if (msg.type === "call_accepted" && isPatient) {
        await startWebRTC_Caller();
      }

      if (msg.type === "webrtc_answer" && isPatient && pc.current) {
        await pc.current.setRemoteDescription(new RTCSessionDescription(msg.answer));
        setCallState("in-call");
      }

      if (msg.type === "webrtc_offer" && isDoctor && pc.current) {
        await pc.current.setRemoteDescription(new RTCSessionDescription(msg.offer));
        const answer = await pc.current.createAnswer();
        await pc.current.setLocalDescription(answer);
        channel.current.postMessage({ type: "webrtc_answer", answer });
        setCallState("in-call");
      }

      if (msg.type === "ice_candidate" && pc.current) {
        if ((isDoctor && msg.from === "patient") || (isPatient && msg.from === "doctor")) {
          try { await pc.current.addIceCandidate(new RTCIceCandidate(msg.candidate)); } catch {}
        }
      }

      if (msg.type === "call_ended") {
        cleanup();
      }
    };

    return () => { ch.close(); };
  }, [user]);

  function createPC() {
    const myRole = isPatient ? "patient" : "doctor";
    const p = new RTCPeerConnection(ICE_SERVERS);
    p.onicecandidate = ({ candidate }) => {
      if (candidate) channel.current.postMessage({ type: "ice_candidate", candidate, from: myRole });
    };
    p.ontrack = (e) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
    };
    pc.current = p;
    return p;
  }

  async function getMedia() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStream.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  }

  function handleCallDoctor() {
    setError("");
    channel.current.postMessage({ type: "call_request", patientName: user.username });
    setCallState("calling");
  }

  async function startWebRTC_Caller() {
    try {
      const stream = await getMedia();
      const p = createPC();
      stream.getTracks().forEach(t => p.addTrack(t, stream));
      const offer = await p.createOffer();
      await p.setLocalDescription(offer);
      channel.current.postMessage({ type: "webrtc_offer", offer });
    } catch (e) {
      setError("Camera/mic error: " + e.message);
      setCallState("idle");
    }
  }

  async function handleAccept() {
    setError("");
    try {
      const stream = await getMedia();
      createPC();
      stream.getTracks().forEach(t => pc.current.addTrack(t, stream));
      channel.current.postMessage({ type: "call_accepted" });
      setIncomingFrom(null);
      setCallState("calling");
    } catch (e) {
      setError("Camera/mic error: " + e.message);
      setCallState("idle");
    }
  }

  function handleEndCall() {
    channel.current.postMessage({ type: "call_ended" });
    cleanup();
  }

  function cleanup() {
    if (localStream.current) { localStream.current.getTracks().forEach(t => t.stop()); localStream.current = null; }
    if (pc.current) { pc.current.close(); pc.current = null; }
    if (localVideoRef.current)  localVideoRef.current.srcObject  = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setCallState("idle");
    setIncomingFrom(null);
  }

  return (
    <div style={s.wrap}>
      <h2 style={s.title}>
        📹 Video Call &nbsp;
        <span style={s.role}>({isPatient ? "Patient" : "Doctor"}: {user?.username})</span>
      </h2>

      {error && <div style={s.error}>{error}</div>}

      {callState === "incoming" && incomingFrom && (
        <div style={s.backdrop}>
          <div style={s.modal}>
            <div style={s.modalIcon}>📞</div>
            <div style={s.modalTitle}>Incoming Call</div>
            <div style={s.modalSub}>from Patient: <strong>{incomingFrom}</strong></div>
            <button style={s.acceptBtn} onClick={handleAccept}>✅ Accept</button>
          </div>
        </div>
      )}

      <div style={s.videos}>
        <div style={s.videoBox}>
          <div style={s.videoLabel}>You</div>
          <video ref={localVideoRef}  autoPlay muted playsInline style={s.video} />
        </div>
        <div style={s.videoBox}>
          <div style={s.videoLabel}>Remote</div>
          <video ref={remoteVideoRef} autoPlay playsInline style={s.video} />
        </div>
      </div>

      <div style={s.controls}>
        {isPatient && callState === "idle" && (
          <button style={s.callBtn} onClick={handleCallDoctor}>📞 Call Doctor</button>
        )}
        {callState === "calling" && <p style={s.status}>⏳ Connecting…</p>}
        {callState === "in-call" && (
          <button style={s.endBtn} onClick={handleEndCall}>📴 End Call</button>
        )}
        {isDoctor && callState === "idle" && (
          <p style={s.status}>🩺 Waiting for a patient to call…</p>
        )}
      </div>

      {callState === "in-call" && (
        <p style={{ ...s.status, color: "#22c55e", marginTop: 10 }}>🟢 Call connected</p>
      )}
    </div>
  );
}

const s = {
  wrap:       { fontFamily:"sans-serif", padding:24, maxWidth:860, margin:"0 auto" },
  title:      { fontSize:22, marginBottom:16, color:"var(--text, #1e293b)" },
  role:       { fontSize:14, color:"#64748b", fontWeight:400 },
  error:      { background:"#fee2e2", border:"1px solid #f87171", borderRadius:8, padding:"10px 14px", marginBottom:16, color:"#991b1b", fontSize:14 },
  videos:     { display:"flex", gap:16, marginBottom:20, flexWrap:"wrap" },
  videoBox:   { flex:1, minWidth:280, background:"#0f172a", borderRadius:12, overflow:"hidden", textAlign:"center" },
  videoLabel: { color:"#94a3b8", fontSize:11, margin:"8px 0 4px", textTransform:"uppercase", letterSpacing:"0.05em" },
  video:      { width:"100%", height:240, objectFit:"cover", display:"block", background:"#1e293b" },
  controls:   { display:"flex", alignItems:"center", gap:12 },
  callBtn:    { background:"#3b82f6", color:"#fff", border:"none", borderRadius:8, padding:"10px 24px", fontSize:15, cursor:"pointer", fontWeight:700 },
  endBtn:     { background:"#ef4444", color:"#fff", border:"none", borderRadius:8, padding:"10px 24px", fontSize:15, cursor:"pointer", fontWeight:700 },
  status:     { fontSize:14, color:"#64748b" },
  backdrop:   { position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 },
  modal:      { background:"#fff", borderRadius:16, padding:"36px 44px", textAlign:"center", boxShadow:"0 8px 32px rgba(0,0,0,0.2)", minWidth:280 },
  modalIcon:  { fontSize:52, marginBottom:8 },
  modalTitle: { fontSize:22, fontWeight:800, color:"#1e293b", marginBottom:6 },
  modalSub:   { fontSize:15, color:"#475569", marginBottom:28 },
  acceptBtn:  { background:"#22c55e", color:"#fff", border:"none", borderRadius:8, padding:"12px 32px", fontSize:16, fontWeight:700, cursor:"pointer" },
};
