import { useState, useCallback } from 'react';
import { useLang, LANG_VOICE } from '../context/LanguageContext';

const SECTION_STYLE = {
  do:       { bg:'#f0fdf4', border:'#bbf7d0', iconBg:'#dcfce7', icon:'✅', labelKey:'whatToDo',      textColor:'#15803d' },
  dont:     { bg:'#fef2f2', border:'#fecaca', iconBg:'#fee2e2', icon:'🚫', labelKey:'whatNotToDo',  textColor:'#dc2626' },
  hospital: { bg:'#eff6ff', border:'#bfdbfe', iconBg:'#dbeafe', icon:'🏥', labelKey:'goToHospital', textColor:'#1d4ed8' },
  warning:  { bg:'#fffbeb', border:'#fde68a', iconBg:'#fef3c7', icon:'⚠️', labelKey:'warningSigns', textColor:'#b45309' },
};

function Section({ type, items, t }) {
  const s = SECTION_STYLE[type];
  if (!items || items.length === 0) return null;
  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{s.icon}</div>
        <span style={{ fontSize: 12, fontWeight: 700, color: s.textColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t(s.labelKey)}</span>
      </div>
      <ul style={{ margin: 0, padding: '0 0 0 4px', listStyle: 'none', display: 'grid', gap: 6 }}>
        {items.map((item, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14, color: '#374151', lineHeight: 1.5 }}>
            <span style={{ color: s.textColor, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>›</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function HelpCard({ topicKey, icon, color, bg }) {
  const { t, lang, speak } = useLang();
  const [expanded, setExpanded] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const doItems      = t(`${topicKey}_do`);
  const dontItems    = t(`${topicKey}_dont`);
  const hospitalItems= t(`${topicKey}_hospital`);
  const warningItems = t(`${topicKey}_warning`);

  // Build full text for TTS
  const buildSpeakText = useCallback(() => {
    const arr = (x) => Array.isArray(x) ? x.join('. ') : '';
    const doLabel       = t('whatToDo');
    const dontLabel     = t('whatNotToDo');
    const hospitalLabel = t('goToHospital');
    const warningLabel  = t('warningSigns');
    return [
      t(topicKey) + '.',
      doLabel + ': ' + arr(doItems) + '.',
      dontLabel + ': ' + arr(dontItems) + '.',
      hospitalLabel + ': ' + arr(hospitalItems) + '.',
      warningLabel + ': ' + arr(warningItems) + '.',
    ].join(' ');
  }, [t, topicKey, doItems, dontItems, hospitalItems, warningItems]);

  const handleSpeak = (e) => {
    e.stopPropagation();
    if (speaking) {
      window.speechSynthesis?.cancel();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    speak(buildSpeakText(), { lang: LANG_VOICE[lang] || 'en-IN' });
    // Reset button after estimated read time
    const wordCount = buildSpeakText().split(' ').length;
    const ms = Math.max(4000, wordCount * 400);
    setTimeout(() => setSpeaking(false), ms);
  };

  return (
    <div style={{
      background: '#fff',
      border: `1.5px solid ${expanded ? color : 'var(--border)'}`,
      borderRadius: 16,
      overflow: 'hidden',
      transition: 'all .2s ease',
      boxShadow: expanded ? `0 4px 20px ${color}20` : 'none',
    }}>
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', background: expanded ? bg : '#fff',
          border: 'none', padding: '18px 20px',
          display: 'flex', alignItems: 'center', gap: 14,
          cursor: 'pointer', textAlign: 'left',
          transition: 'background .2s',
        }}
      >
        <div style={{
          width: 52, height: 52, borderRadius: 14, flexShrink: 0,
          background: expanded ? '#fff' : bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, transition: 'all .2s',
          boxShadow: expanded ? `0 2px 10px ${color}30` : 'none',
        }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: expanded ? color : 'var(--text)' }}>
            {t(topicKey)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
            {expanded ? 'Tap to collapse' : 'Tap to view first aid steps'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Voice button */}
          <button
            onClick={handleSpeak}
            style={{
              padding: '7px 13px', borderRadius: 10,
              background: speaking ? color : 'transparent',
              border: `1.5px solid ${speaking ? color : 'var(--border)'}`,
              color: speaking ? '#fff' : 'var(--text2)',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)',
              display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
              transition: 'all .15s',
            }}
          >
            {speaking ? t('voiceStop') : t('voiceRead')}
          </button>
          {/* Expand chevron */}
          <span style={{ fontSize: 18, color: 'var(--text3)', transition: 'transform .2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>⌄</span>
        </div>
      </button>

      {/* Expandable content */}
      {expanded && (
        <div style={{ padding: '4px 20px 20px', borderTop: `1px solid ${color}30` }}>
          <Section type="do"       items={doItems}       t={t} />
          <Section type="dont"     items={dontItems}     t={t} />
          <Section type="hospital" items={hospitalItems} t={t} />
          <Section type="warning"  items={warningItems}  t={t} />
        </div>
      )}
    </div>
  );
}
