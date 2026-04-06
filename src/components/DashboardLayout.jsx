import { useState } from 'react';
import VoiceAssistant from './VoiceAssistant';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLang, LANGUAGES, isRTL } from '../context/LanguageContext';

const roleConfig = {
  patient: {
    colorRaw: '#0a8a6a',
    navKeys: ['prescriptions','reminders','consultDoctor','healthRecords','firstAidNav','videoCall'],
    navTabs: ['prescriptions','reminders','consult','health','firstaid','videocall'],
  },
  asha: {
    colorRaw: '#c47d0a',
    navKeys: ['registerPatient','vitalsAndTriage','patientList','consultation','aiSymptomChecker'],
    navTabs: ['register','vitals','patients','consultation','symptomchecker'],
  },
  doctor: {
    colorRaw: '#1a6fd4',
    navKeys: ['aiTriage','writePrescription','prescriptionHistory','consultation','videoCall'],
    navTabs: ['triage','prescribe','history','consultation','videocall'],
  },
  admin: {
    colorRaw: '#6b46c1',
    navKeys: [], navTabs: [],
  },
};

const ROLE_TITLE_KEYS = {
  asha: 'ashaTitle', doctor: 'doctorTitle', admin: 'adminTitle', patient: null,
};

export default function DashboardLayout({ children, title, role, activeTab, onTabChange }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { lang, changeLang, t } = useLang();
  const cfg = roleConfig[role] || roleConfig.patient;
  const [collapsed, setCollapsed] = useState(false);
  const [langOpen, setLangOpen]   = useState(false);
  const rtl = isRTL(lang);

  const handleLogout = () => { logout(); navigate('/login'); };
  const sideW = collapsed ? 64 : 240;

  const displayTitle = ROLE_TITLE_KEYS[role] ? t(ROLE_TITLE_KEYS[role]) : title;

  return (
    <>
    <div style={{ display:'flex', minHeight:'100vh', fontFamily:'var(--font)', direction: rtl ? 'rtl' : 'ltr' }}>

      {/* Sidebar */}
      <aside style={{
        width: sideW, minHeight:'100vh',
        background:'var(--surface)', borderRight:'1px solid var(--border)',
        display:'flex', flexDirection:'column',
        position:'fixed', top:0, [rtl?'right':'left']:0, bottom:0, zIndex:100,
        transition:'width .22s ease', overflow:'hidden',
      }}>
        {/* Brand */}
        <div style={{ padding: collapsed ? '18px 14px' : '20px 20px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10, minHeight:64 }}>
          <div style={{ width:34, height:34, borderRadius:8, flexShrink:0, background:cfg.colorRaw, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:14 }}>G</div>
          {!collapsed && (
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>GramHealth Lite</div>
              <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>{t(ROLE_TITLE_KEYS[role] || 'ashaTitle')}</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'12px 10px', display:'flex', flexDirection:'column', gap:2 }}>
          {cfg.navKeys.map((key, i) => {
            const tab    = cfg.navTabs[i];
            const active = activeTab === tab;
            return (
              <button key={tab} onClick={() => onTabChange?.(tab)}
                title={collapsed ? t(key) : undefined}
                style={{
                  display:'flex', alignItems:'center', gap:10,
                  padding: collapsed ? '10px' : '10px 12px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  borderRadius:8, border:'none',
                  background: active ? cfg.colorRaw + '15' : 'transparent',
                  color: active ? cfg.colorRaw : 'var(--text2)',
                  fontFamily:'var(--font)', fontSize:13, fontWeight: active ? 600 : 400,
                  cursor:'pointer', transition:'all .15s',
                  borderLeft: (!rtl && active) ? `3px solid ${cfg.colorRaw}` : '3px solid transparent',
                  borderRight: (rtl && active) ? `3px solid ${cfg.colorRaw}` : '3px solid transparent',
                }}
                onMouseEnter={e => { if(!active) e.currentTarget.style.background='var(--surface2)'; }}
                onMouseLeave={e => { if(!active) e.currentTarget.style.background='transparent'; }}
              >
                <span style={{ width:7, height:7, borderRadius:'50%', flexShrink:0, background: active ? cfg.colorRaw : 'var(--border2)', transition:'background .15s' }}/>
                {!collapsed && t(key)}
              </button>
            );
          })}
        </nav>

        {/* User card */}
        <div style={{ margin:'10px', padding: collapsed ? '10px' : '12px', background:'var(--surface2)', borderRadius:10, border:'1px solid var(--border)' }}>
          {!collapsed ? (
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:32, height:32, borderRadius:8, flexShrink:0, background:cfg.colorRaw+'20', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:cfg.colorRaw }}>
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex:1, overflow:'hidden' }}>
                <div style={{ fontSize:12, fontWeight:600, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.username}</div>
                <div style={{ fontSize:11, color:'var(--text3)', textTransform:'capitalize' }}>{user?.role}</div>
              </div>
              <button onClick={handleLogout} style={{ background:'none', border:'none', color:'var(--text3)', fontSize:12, padding:4, borderRadius:6, cursor:'pointer', fontFamily:'var(--font)' }}
                onMouseEnter={e=>e.currentTarget.style.color='var(--red)'}
                onMouseLeave={e=>e.currentTarget.style.color='var(--text3)'}>
                {t('logout')}
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} style={{ width:'100%', background:'none', border:'none', color:'var(--text3)', fontSize:12, padding:4, borderRadius:6, cursor:'pointer', fontFamily:'var(--font)' }}
              onMouseEnter={e=>e.currentTarget.style.color='var(--red)'}
              onMouseLeave={e=>e.currentTarget.style.color='var(--text3)'}>X</button>
          )}
        </div>

        {/* Collapse */}
        <button onClick={() => setCollapsed(c=>!c)} style={{ margin:'0 10px 10px', padding:'8px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text3)', fontSize:12, fontWeight:500, cursor:'pointer' }}
          onMouseEnter={e=>e.currentTarget.style.color='var(--text)'}
          onMouseLeave={e=>e.currentTarget.style.color='var(--text3)'}>
          {collapsed ? (rtl ? '<' : '>') : (rtl ? '> Collapse' : '< Collapse')}
        </button>
      </aside>

      {/* Main */}
      <div style={{ [rtl?'marginRight':'marginLeft']:sideW, flex:1, display:'flex', flexDirection:'column', minHeight:'100vh', transition:'margin .22s ease' }}>

        {/* Header */}
        <header style={{ height:64, background:'var(--surface)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', padding:'0 28px', position:'sticky', top:0, zIndex:50, gap:16 }}>
          <div style={{ fontSize:18, fontWeight:700, color:'var(--text)' }}>{displayTitle}</div>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:12 }}>
            <LiveClock />
            {/* Online indicator */}
            <div style={{ padding:'5px 12px', borderRadius:20, background:'var(--surface2)', border:'1px solid var(--border)', fontSize:12, color:'var(--text2)', fontWeight:500 }}>
              <span style={{ color: navigator.onLine ? 'var(--green)' : 'var(--red)' }}>●</span>
              {' '}{navigator.onLine ? 'Online' : 'Offline'}
            </div>
            {/* Language switcher */}
            <div style={{ position:'relative' }}>
              <button onClick={() => setLangOpen(o=>!o)} style={{ padding:'5px 12px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:20, fontSize:12, color:'var(--text2)', cursor:'pointer', fontFamily:'var(--font)', display:'flex', alignItems:'center', gap:6 }}>
                🌐 {LANGUAGES.find(l=>l.code===lang)?.label}
                <span style={{ fontSize:9, opacity:.6 }}>▼</span>
              </button>
              {langOpen && (
                <div style={{ position:'absolute', top:'calc(100% + 6px)', right:0, background:'#fff', border:'1px solid var(--border)', borderRadius:10, boxShadow:'0 8px 32px rgba(0,0,0,0.1)', zIndex:300, maxHeight:300, overflowY:'auto', display:'grid', gridTemplateColumns:'1fr 1fr', minWidth:260 }}
                  onMouseLeave={() => setLangOpen(false)}>
                  {LANGUAGES.map(lg => (
                    <button key={lg.code} onClick={() => { changeLang(lg.code); setLangOpen(false); }}
                      style={{ padding:'8px 13px', background: lang===lg.code ? '#f0fdf4' : 'transparent', border:'none', borderBottom:'1px solid #f1f4f8', fontSize:12, color: lang===lg.code ? '#0a8a6a' : 'var(--text)', textAlign: isRTL(lg.code) ? 'right' : 'left', cursor:'pointer', fontFamily:'inherit', fontWeight: lang===lg.code ? 600 : 400 }}>
                      {lg.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex:1, padding:'24px 28px', overflowY:'auto', background:'var(--bg)' }}>
          <div className="page-enter">{children}</div>
        </main>
      </div>
    </div>
    <VoiceAssistant onTabChange={onTabChange} role={role} />
  </>
  );
}

function LiveClock() {
  const [t, setT] = useState(new Date());
  useState(() => { const id = setInterval(()=>setT(new Date()),1000); return ()=>clearInterval(id); });
  return <div style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--text3)' }}>{t.toLocaleTimeString()} · {t.toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</div>;
}
