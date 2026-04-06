import { useNavigate } from 'react-router-dom';
export default function Unauthorized() {
  const nav = useNavigate();
  return (
    <div style={{ minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'var(--bg)',fontFamily:'var(--font)' }}>
      <div style={{ fontSize:64,marginBottom:16 }}>🚫</div>
      <div style={{ fontSize:24,fontWeight:800,color:'var(--text)',marginBottom:8 }}>Access Denied</div>
      <div style={{ fontSize:14,color:'var(--text3)',marginBottom:24 }}>You don't have permission to view this page.</div>
      <button onClick={()=>nav('/login')} style={{ padding:'12px 28px',background:'var(--teal)',color:'#0b0f18',border:'none',borderRadius:12,fontSize:14,fontWeight:800 }}>← Back to Login</button>
    </div>
  );
}
