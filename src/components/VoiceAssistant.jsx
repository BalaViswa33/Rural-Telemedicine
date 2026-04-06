// src/components/VoiceAssistant.jsx
// Browser-only Voice Assistant — no external APIs, no paid services.
// Uses Web Speech API: SpeechRecognition (listen) + SpeechSynthesis (speak).

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ─────────────────────────────────────────────────────────────────────────────
// COMMAND MAP  — keywords → { tab, route, reply{} }
// Each reply key is an ISO language code prefix (en, hi, ta, te, ml)
// ─────────────────────────────────────────────────────────────────────────────
const COMMANDS = [
  {
    keywords: {
      en: ['call doctor','video call','start call','call','video'],
      hi: ['डॉक्टर को कॉल','वीडियो कॉल','कॉल करो','कॉल'],
      ta: ['டாக்டரை அழை','வீடியோ அழைப்பு','அழை'],
      te: ['డాక్టర్ కి కాల్','వీడియో కాల్','కాల్'],
      ml: ['ഡോക്ടറെ വിളിക്കൂ','വീഡിയോ കോൾ','കോൾ'],
    },
    tab: 'videocall',
    reply: {
      en: 'Opening video call.',
      hi: 'वीडियो कॉल खोल रहा हूँ।',
      ta: 'வீடியோ அழைப்பை திறக்கிறேன்.',
      te: 'వీడియో కాల్ తెరుస్తున్నాను.',
      ml: 'വീഡിയോ കോൾ തുറക്കുന്നു.',
    },
  },
  {
    keywords: {
      en: ['prescription','medicine','my medicine','my prescription'],
      hi: ['दवाई','नुस्खा','प्रिस्क्रिप्शन','दवा'],
      ta: ['மருந்து','பரிந்துரை','மருத்துவம்'],
      te: ['మందు','ప్రిస్క్రిప్షన్','ఔషధం'],
      ml: ['മരുന്ന്','പ്രിസ്ക്രിപ്ഷൻ','ഔഷധം'],
    },
    tab: 'prescriptions',
    reply: {
      en: 'Opening prescriptions.',
      hi: 'नुस्खे खोल रहा हूँ।',
      ta: 'மருந்துச் சீட்டுகளை திறக்கிறேன்.',
      te: 'మందు చీటీలు తెరుస్తున్నాను.',
      ml: 'പ്രിസ്ക്രിപ്ഷനുകൾ തുറക്കുന്നു.',
    },
  },
  {
    keywords: {
      en: ['reminder','reminders','medicine reminder','alarm'],
      hi: ['रिमाइंडर','याद दिलाओ','दवाई याद'],
      ta: ['நினைவூட்டல்','நினைவுபடுத்து'],
      te: ['రిమైండర్','గుర్తుచేయి'],
      ml: ['റിമൈൻഡർ','ഓർമ്മിപ്പിക്കൂ'],
    },
    tab: 'reminders',
    reply: {
      en: 'Opening reminders.',
      hi: 'रिमाइंडर खोल रहा हूँ।',
      ta: 'நினைவூட்டல்களை திறக்கிறேன்.',
      te: 'రిమైండర్లు తెరుస్తున్నాను.',
      ml: 'റിമൈൻഡറുകൾ തുറക്കുന്നു.',
    },
  },
  {
    keywords: {
      en: ['dashboard','home','go home','main'],
      hi: ['होम','डैशबोर्ड','मुख्य'],
      ta: ['முகப்பு','டாஷ்போர்ட்'],
      te: ['హోం','డాష్‌బోర్డ్'],
      ml: ['ഹോം','ഡാഷ്ബോർഡ്'],
    },
    tab: 'prescriptions', // default first tab
    reply: {
      en: 'Going to dashboard.',
      hi: 'डैशबोर्ड पर जा रहा हूँ।',
      ta: 'முகப்புக்கு செல்கிறேன்.',
      te: 'డాష్‌బోర్డ్ కి వెళుతున్నాను.',
      ml: 'ഡാഷ്ബോർഡിലേക്ക് പോകുന്നു.',
    },
  },
  {
    keywords: {
      en: ['consult','consult doctor','consultation'],
      hi: ['परामर्श','सलाह','डॉक्टर से मिलो'],
      ta: ['ஆலோசனை','கலந்தாய்வு'],
      te: ['సంప్రదింపు','సలహా'],
      ml: ['കൂടിയാലോചന','ഉപദേശം'],
    },
    tab: 'consult',
    reply: {
      en: 'Opening consultation.',
      hi: 'परामर्श खोल रहा हूँ।',
      ta: 'ஆலோசனையை திறக்கிறேன்.',
      te: 'సంప్రదింపులు తెరుస్తున్నాను.',
      ml: 'കൂടിയാലോചന തുറക്കുന്നു.',
    },
  },
  {
    keywords: {
      en: ['logout','log out','sign out','exit'],
      hi: ['लॉगआउट','बाहर निकलो','साइन आउट'],
      ta: ['வெளியேறு','லாக் அவுட்'],
      te: ['లాగ్ అవుట్','నిష్క్రమించు'],
      ml: ['ലോഗൗട്ട്','പുറത്തുകടക്കൂ'],
    },
    action: 'logout',
    reply: {
      en: 'Logging you out.',
      hi: 'लॉगआउट हो रहा हूँ।',
      ta: 'வெளியேறுகிறேன்.',
      te: 'లాగ్ అవుట్ అవుతున్నాను.',
      ml: 'ലോഗൗട്ട് ചെയ്യുന്നു.',
    },
  },
  {
    keywords: {
      en: ['first aid','emergency','help','sos'],
      hi: ['प्राथमिक चिकित्सा','आपातकाल','मदद'],
      ta: ['முதலுதவி','அவசரம்','உதவி'],
      te: ['ప్రథమ చికిత్స','అత్యవసరం','సహాయం'],
      ml: ['ഒന്നാം സഹായം','അടിയന്തര','സഹായം'],
    },
    tab: 'firstaid',
    reply: {
      en: 'Opening first aid guide.',
      hi: 'प्राथमिक चिकित्सा गाइड खोल रहा हूँ।',
      ta: 'முதலுதவி வழிகாட்டியை திறக்கிறேன்.',
      te: 'ప్రథమ చికిత్స గైడ్ తెరుస్తున్నాను.',
      ml: 'ഒന്നാം സഹായ ഗൈഡ് തുറക്കുന്നു.',
    },
  },
];

// Fallback replies when nothing matched
const FALLBACK = {
  en: "Sorry, I didn't understand. Try: call doctor, prescriptions, reminders, logout.",
  hi: 'माफ़ करें, समझ नहीं आया। कहें: डॉक्टर को कॉल, दवाई, रिमाइंडर, लॉगआउट।',
  ta: 'மன்னிக்கவும், புரியவில்லை. சொல்லுங்கள்: டாக்டரை அழை, மருந்து, நினைவூட்டல்.',
  te: 'క్షమించండి, అర్థం కాలేదు. చెప్పండి: డాక్టర్ కి కాల్, మందు, రిమైండర్.',
  ml: 'ക്ഷമിക്കണം, മനസ്സിലായില്ല. പറയൂ: ഡോക്ടറെ വിളിക്കൂ, മരുന്ന്, റിമൈൻഡർ.',
};

// Greeting on first open
const GREETING = {
  en: 'Hello! How can I help you today?',
  hi: 'नमस्ते! मैं आपकी कैसे मदद कर सकता हूँ?',
  ta: 'வணக்கம்! நான் உங்களுக்கு எப்படி உதவலாம்?',
  te: 'నమస్కారం! నేను మీకు ఎలా సహాయం చేయగలను?',
  ml: 'നമസ്കാരം! ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കണം?',
};

// ─────────────────────────────────────────────────────────────────────────────
// Detect language from BCP-47 code (e.g. "hi-IN" → "hi")
// ─────────────────────────────────────────────────────────────────────────────
function detectLang(bcp47) {
  const base = (bcp47 || 'en').split('-')[0].toLowerCase();
  return ['hi','ta','te','ml'].includes(base) ? base : 'en';
}

// Match spoken text against command keywords
function matchCommand(text, detectedLang) {
  const lower = text.toLowerCase().trim();
  for (const cmd of COMMANDS) {
    // check detected language first, then English as fallback
    const langs = [detectedLang, 'en'];
    for (const l of langs) {
      const kws = cmd.keywords[l] || [];
      if (kws.some(kw => lower.includes(kw.toLowerCase()))) {
        return cmd;
      }
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// Props:
//   onTabChange(tab)  — same handler passed to DashboardLayout
//   role              — 'patient' | 'doctor' | 'asha' | 'admin'
// ─────────────────────────────────────────────────────────────────────────────
export default function VoiceAssistant({ onTabChange, role }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [open, setOpen]         = useState(false);
  const [listening, setListen]  = useState(false);
  const [transcript, setTrans]  = useState('');
  const [response, setResponse] = useState('');
  const [detLang, setDetLang]   = useState('en');
  const [pulse, setPulse]       = useState(false);
  const [history, setHistory]   = useState([]);   // [{who,text}]

  const recogRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  const supported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  // ── speak ────────────────────────────────────────────────────────────────
  const speak = useCallback((text, lang) => {
    synthRef.current.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    // map lang code → BCP-47 for synthesis
    const map = { en:'en-IN', hi:'hi-IN', ta:'ta-IN', te:'te-IN', ml:'ml-IN' };
    utt.lang = map[lang] || 'en-IN';
    utt.rate = 0.95;
    synthRef.current.speak(utt);
  }, []);

  // ── handle recognised text ───────────────────────────────────────────────
  const handleCommand = useCallback((text, lang) => {
    setHistory(h => [...h, { who: 'user', text }]);
    const cmd = matchCommand(text, lang);

    let reply;
    if (cmd) {
      reply = cmd.reply[lang] || cmd.reply.en;

      if (cmd.action === 'logout') {
        speak(reply, lang);
        setTimeout(() => { logout(); navigate('/login'); }, 1200);
      } else if (cmd.tab) {
        speak(reply, lang);
        setOpen(false);
        onTabChange?.(cmd.tab);
      }
    } else {
      reply = FALLBACK[lang] || FALLBACK.en;
      speak(reply, lang);
    }

    setResponse(reply);
    setHistory(h => [...h, { who: 'bot', text: reply }]);
  }, [speak, logout, navigate, onTabChange]);

  // ── start listening ──────────────────────────────────────────────────────
  const startListen = useCallback(() => {
    if (!supported) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r  = new SR();
    recogRef.current = r;

    r.continuous      = false;
    r.interimResults  = true;
    r.lang            = ''; // empty = browser auto-detect from system language

    r.onstart  = () => { setListen(true); setPulse(true); setTrans(''); };
    r.onend    = () => { setListen(false); setPulse(false); };

    r.onresult = (e) => {
      const result  = e.results[e.results.length - 1];
      const text    = result[0].transcript;
      const lang    = detectLang(r.lang || navigator.language);
      setTrans(text);
      setDetLang(lang);
      if (result.isFinal) handleCommand(text, lang);
    };

    r.onerror = (e) => {
      setListen(false); setPulse(false);
      if (e.error !== 'aborted') setResponse('Mic error: ' + e.error);
    };

    r.start();
  }, [supported, handleCommand]);

  const stopListen = useCallback(() => {
    recogRef.current?.stop();
  }, []);

  // greet on open
  useEffect(() => {
    if (open && history.length === 0) {
      const lang = detectLang(navigator.language);
      const g = GREETING[lang] || GREETING.en;
      setResponse(g);
      setHistory([{ who: 'bot', text: g }]);
      speak(g, lang);
    }
  }, [open]);

  // cleanup on unmount
  useEffect(() => () => { recogRef.current?.abort(); synthRef.current.cancel(); }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER — floating button + panel
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Voice Assistant"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 500,
          width: 52,
          height: 52,
          borderRadius: '50%',
          border: 'none',
          background: open ? '#ef4444' : '#0a8a6a',
          color: '#fff',
          fontSize: 22,
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s, transform 0.2s',
          transform: open ? 'rotate(45deg)' : 'none',
        }}
      >
        {open ? '✕' : '🎤'}
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position: 'fixed',
          bottom: 86,
          right: 24,
          zIndex: 499,
          width: 320,
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          fontFamily: 'sans-serif',
        }}>

          {/* Header */}
          <div style={{ background: '#0a8a6a', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>🎤</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Voice Assistant</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>
                {!supported ? 'Not supported in this browser' : listening ? 'Listening…' : 'Tap mic to speak'}
              </div>
            </div>
            <div style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: 20 }}>
              {detLang.toUpperCase()}
            </div>
          </div>

          {/* Chat history */}
          <div style={{ maxHeight: 220, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.map((msg, i) => (
              <div key={i} style={{
                alignSelf: msg.who === 'user' ? 'flex-end' : 'flex-start',
                background: msg.who === 'user' ? '#0a8a6a' : '#f1f5f9',
                color: msg.who === 'user' ? '#fff' : '#1e293b',
                padding: '7px 11px',
                borderRadius: msg.who === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                fontSize: 12,
                maxWidth: '85%',
                lineHeight: 1.4,
              }}>
                {msg.text}
              </div>
            ))}
            {/* Live transcript while listening */}
            {listening && transcript && (
              <div style={{ alignSelf: 'flex-end', background: 'rgba(10,138,106,0.15)', color: '#0a8a6a', padding: '7px 11px', borderRadius: '12px 12px 2px 12px', fontSize: 12, maxWidth: '85%', fontStyle: 'italic' }}>
                {transcript}…
              </div>
            )}
          </div>

          {/* Mic button */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <button
              onMouseDown={startListen}
              onMouseUp={stopListen}
              onTouchStart={startListen}
              onTouchEnd={stopListen}
              disabled={!supported}
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                border: 'none',
                background: listening ? '#ef4444' : '#0a8a6a',
                color: '#fff',
                fontSize: 22,
                cursor: supported ? 'pointer' : 'not-allowed',
                boxShadow: listening ? '0 0 0 8px rgba(239,68,68,0.2)' : '0 2px 10px rgba(10,138,106,0.3)',
                transition: 'all 0.2s',
                animation: pulse ? 'va-pulse 1s infinite' : 'none',
              }}
            >
              {listening ? '⏹' : '🎤'}
            </button>
            <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>
              {supported
                ? 'Hold to speak · Release to process'
                : 'Web Speech API not supported in this browser'}
            </p>

            {/* Quick command chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
              {['Call Doctor','Prescriptions','Reminders','Logout'].map(cmd => (
                <button key={cmd}
                  onClick={() => handleCommand(cmd, 'en')}
                  style={{ padding: '4px 10px', borderRadius: 20, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 11, color: '#475569', cursor: 'pointer' }}
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pulse keyframe injected once */}
      <style>{`
        @keyframes va-pulse {
          0%   { box-shadow: 0 0 0 0   rgba(239,68,68,0.4); }
          70%  { box-shadow: 0 0 0 12px rgba(239,68,68,0);   }
          100% { box-shadow: 0 0 0 0   rgba(239,68,68,0);   }
        }
      `}</style>
    </>
  );
}
