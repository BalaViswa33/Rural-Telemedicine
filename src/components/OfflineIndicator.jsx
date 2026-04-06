import { useState, useEffect } from 'react';
import { getNetworkQuality, getNetworkInfo } from '../utils/network';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline]  = useState(navigator.onLine);
  const [show,     setShow]      = useState(false);
  const [quality,  setQuality]   = useState(getNetworkQuality());
  const refresh = () => setQuality(getNetworkQuality());

  useEffect(() => {
    const online  = () => { setIsOnline(true);  setShow(true); refresh(); setTimeout(()=>setShow(false),3500); };
    const offline = () => { setIsOnline(false); setShow(true); refresh(); };
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    const conn = navigator.connection||navigator.mozConnection||navigator.webkitConnection;
    if (conn) conn.addEventListener('change', refresh);
    if (!navigator.onLine) setShow(true);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
      if (conn) conn.removeEventListener('change', refresh);
    };
  }, []);

  const info = getNetworkInfo(quality);
  if (!show && isOnline) return null;

  return (
    <div style={{
      position:'fixed', top:20, left:'50%', transform:'translateX(-50%)',
      zIndex:9999,
      background:isOnline ? info.color : '#f5a623',
      color: isOnline ? '#0b0f18' : '#0b0f18',
      borderRadius:30, padding:'9px 20px',
      fontSize:13, fontWeight:800,
      fontFamily:'var(--font)',
      display:'flex', alignItems:'center', gap:10,
      boxShadow:'0 8px 32px rgba(0,0,0,0.4)',
      animation:'slideDown .3s ease-out',
      whiteSpace:'nowrap',
    }}>
      {isOnline ? info.icon : '📡'}
      {isOnline ? info.label : 'Offline — data saved locally'}
      {!isOnline && <span style={{ width:8,height:8,borderRadius:'50%',background:'rgba(0,0,0,0.4)',animation:'pulse 1.5s infinite',display:'inline-block' }}/>}
      <style>{`
        @keyframes slideDown { from{opacity:0;transform:translateX(-50%) translateY(-10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
      `}</style>
    </div>
  );
}
