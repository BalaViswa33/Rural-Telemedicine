import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang, LANGUAGES, isRTL } from '../context/LanguageContext';


const roles = [
  { value:'patient', color:'#0a8a6a' },
  { value:'asha',    color:'#c47d0a' },
  { value:'doctor',  color:'#1a6fd4' },
  { value:'admin',   color:'#6b46c1' },
];

export default function Login() {
  const { lang, changeLang, t } = useLang();
  const [username, setUsername]   = useState('');
  const [password, setPassword]   = useState('');
  const [selectedRole, setRole]   = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [langOpen, setLangOpen]   = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Map local login keys to LanguageContext prefixed keys
  const l = (key) => {
    const map = {
      title:'loginTitle', sub:'loginSub', tagline:'loginTagline',
      signin:'loginSignin', selectRole:'loginSelectRole',
      patient:'loginPatient', patientSub:'loginPatientSub',
      asha:'loginAsha', ashaSub:'loginAshaSub',
      doctor:'loginDoctor', doctorSub:'loginDoctorSub',
      admin:'loginAdmin', adminSub:'loginAdminSub',
      username:'loginUsername', password:'loginPassword',
      userPh:'loginUserPh', passPh:'loginPassPh',
      submit:'loginSubmit', loading:'loginLoading',
      demo:'loginDemo', errorFill:'loginErrorFill', errorInvalid:'loginErrorInvalid',
    };
    return t(map[key] || key);
  };
  const rtl = isRTL(lang);
  const active = roles.find(r => r.value === selectedRole);
  const currentLang = LANGUAGES.find(x => x.code === lang);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password || !selectedRole) { setError(l('errorFill')); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const result = login({ username, password, role: selectedRole });
    setLoading(false);
    if (result.success) navigate(`/${selectedRole}`);
    else setError(l('errorInvalid'));
  };

  const inputStyle = {
    width:'100%', padding:'11px 14px',
    background:'#fff', border:'1.5px solid #dde2ea',
    borderRadius:9, fontSize:14, color:'#0f1623', outline:'none',
    fontFamily:'inherit', transition:'border-color .2s', boxSizing:'border-box',
    direction: rtl ? 'rtl' : 'ltr',
  };

  return (
    <div style={{
      minHeight:'100vh', display:'flex',
      fontFamily:"'Inter', sans-serif",
      background:'#f5f7fa',
      direction: rtl ? 'rtl' : 'ltr',
    }}>

      {/* Left branding panel */}
      <div style={{
        width:'42%', background:'#fff',
        borderRight:'1px solid #dde2ea',
        display:'flex', flexDirection:'column',
        justifyContent:'center', padding:'60px 52px',
      }}>
        {/* Logo */}
        <div style={{
          width:52, height:52, borderRadius:14,
          background: active?.color || '#0a8a6a',
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'#fff', fontWeight:800, fontSize:22, marginBottom:24,
          transition:'background .3s',
        }}>G</div>

        <h1 style={{ fontSize:34, fontWeight:800, color:'#0f1623', lineHeight:1.15, marginBottom:10 }}>
          {l('title')}<br/>
          <span style={{ color: active?.color || '#0a8a6a' }}>{l('sub')}</span>
        </h1>
        <p style={{ fontSize:14, color:'#4a5568', lineHeight:1.7, maxWidth:320, marginBottom:32 }}>
          {l('tagline')}
        </p>

        {/* Features */}
        {['Adaptive: video → audio → offline', 'IndexedDB offline-first sync', 'AI prescription parsing', 'Smart medicine reminders'].map((f,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background: active?.color || '#0a8a6a', flexShrink:0 }}/>
            <span style={{ fontSize:13, color:'#4a5568' }}>{f}</span>
          </div>
        ))}
      </div>

      {/* Right form */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 48px' }}>
        <div style={{ width:'100%', maxWidth:440 }}>

          {/* Language selector */}
          <div style={{ display:'flex', justifyContent: rtl ? 'flex-start' : 'flex-end', marginBottom:24, position:'relative' }}>
            <button
              onClick={() => setLangOpen(o => !o)}
              style={{
                padding:'7px 14px', background:'#fff', border:'1px solid #dde2ea',
                borderRadius:8, fontSize:13, color:'#4a5568', cursor:'pointer',
                display:'flex', alignItems:'center', gap:8, fontFamily:'inherit',
              }}>
              <span style={{ fontSize:15 }}>🌐</span>
              <span>{currentLang?.label}</span>
              <span style={{ fontSize:10, color:'#8896aa' }}>▼</span>
            </button>

            {langOpen && (
              <div style={{
                position:'absolute', top:'calc(100% + 6px)',
                [rtl ? 'left' : 'right']: 0,
                background:'#fff', border:'1px solid #dde2ea', borderRadius:10,
                boxShadow:'0 8px 32px rgba(0,0,0,0.1)',
                zIndex:200, maxHeight:320, overflowY:'auto',
                display:'grid', gridTemplateColumns:'1fr 1fr', minWidth:280,
              }}>
                {LANGUAGES.map(lg => (
                  <button key={lg.code}
                    onClick={() => { changeLang(lg.code); setLangOpen(false); }}
                    style={{
                      padding:'9px 14px', background: lang===lg.code ? '#f0fdf4' : 'transparent',
                      border:'none', borderBottom:'1px solid #f1f4f8',
                      fontSize:13, color: lang===lg.code ? '#0a8a6a' : '#0f1623',
                      textAlign: isRTL(lg.code) ? 'right' : 'left',
                      cursor:'pointer', fontFamily:'inherit', fontWeight: lang===lg.code ? 600 : 400,
                    }}>
                    {lg.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginBottom:28 }}>
            <h2 style={{ fontSize:24, fontWeight:800, color:'#0f1623', marginBottom:5 }}>{l('signin')}</h2>
            <p style={{ fontSize:13, color:'#8896aa' }}>{l('selectRole')}</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Role grid */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:24 }}>
              {roles.map(r => (
                <button type="button" key={r.value} onClick={() => setRole(r.value)}
                  style={{
                    padding:'12px 14px',
                    border:`1.5px solid ${selectedRole===r.value ? r.color : '#dde2ea'}`,
                    borderRadius:10,
                    background: selectedRole===r.value ? r.color+'12' : '#fff',
                    display:'flex', flexDirection:'column', alignItems:'flex-start',
                    textAlign: rtl ? 'right' : 'left',
                    transition:'all .15s', cursor:'pointer', fontFamily:'inherit',
                  }}>
                  <div style={{ fontSize:13, fontWeight:700, color: selectedRole===r.value ? r.color : '#0f1623', marginBottom:2 }}>
                    {l(r.value)}
                  </div>
                  <div style={{ fontSize:11, color:'#8896aa', lineHeight:1.4 }}>
                    {l(r.value + 'Sub')}
                  </div>
                </button>
              ))}
            </div>

            {/* Inputs */}
            <div style={{ display:'flex', flexDirection:'column', gap:13, marginBottom:18 }}>
              {[
                { key:'username', val:username, set:setUsername, type:'text'     },
                { key:'password', val:password, set:setPassword, type:'password' },
              ].map(({ key, val, set, type }) => (
                <div key={key}>
                  <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#8896aa', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                    {l(key)}
                  </label>
                  <input
                    type={type} value={val}
                    onChange={e => set(e.target.value)}
                    placeholder={l(key === 'username' ? 'userPh' : 'passPh')}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = active?.color || '#0a8a6a'}
                    onBlur={e  => e.target.style.borderColor = '#dde2ea'}
                  />
                </div>
              ))}
            </div>

            {error && (
              <div style={{ padding:'10px 13px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, color:'#dc2626', fontSize:13, marginBottom:14 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width:'100%', padding:'13px',
              background: active?.color || '#0a8a6a',
              color:'#fff', border:'none', borderRadius:9,
              fontSize:14, fontWeight:700, fontFamily:'inherit',
              opacity: loading ? 0.8 : 1, cursor: loading ? 'default' : 'pointer',
              transition:'background .3s',
            }}>
              {loading ? l('loading') : l('submit')}
            </button>
          </form>

          <p style={{ textAlign:'center', marginTop:16, fontSize:12, color:'#8896aa' }}>
            {l('demo')}
          </p>
        </div>
      </div>
    </div>
  );
}
