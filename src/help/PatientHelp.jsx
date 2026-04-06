import { useState } from 'react';
import { useLang } from '../context/LanguageContext';
import HelpCard from './HelpCard';

const TOPICS = [
  { key: 'snakeBite',   icon: '🐍', color: '#7c3aed', bg: '#f5f3ff' },
  { key: 'burns',       icon: '🔥', color: '#dc2626', bg: '#fef2f2' },
  { key: 'fever',       icon: '🌡️', color: '#c47d0a', bg: '#fffbeb' },
  { key: 'dehydration', icon: '💧', color: '#0369a1', bg: '#eff6ff' },
  { key: 'diarrhea',    icon: '🤢', color: '#0a8a6a', bg: '#f0fdf4' },
  { key: 'fracture',    icon: '🦴', color: '#6b46c1', bg: '#faf5ff' },
  { key: 'breathing',   icon: '🫁', color: '#0891b2', bg: '#ecfeff' },
];

export default function PatientHelp() {
  const { t } = useLang();
  const [search, setSearch] = useState('');

  const filtered = TOPICS.filter(tp =>
    t(tp.key).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Hero header */}
      <div style={{
        background: 'linear-gradient(135deg, #dc2626 0%, #7c3aed 100%)',
        borderRadius: 20, padding: '28px 28px 24px', marginBottom: 24, color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
          <div style={{ fontSize: 40 }}>🩹</div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{t('firstAidTitle')}</h1>
            <p style={{ fontSize: 13, margin: '4px 0 0', opacity: 0.85 }}>{t('firstAidSubtitle')}</p>
          </div>
        </div>
        {/* Offline badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: 'rgba(255,255,255,0.18)', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
          <span style={{ color: '#4ade80' }}>●</span> Works Offline
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none' }}>🔍</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search emergency topics..."
          style={{
            width: '100%', padding: '11px 14px 11px 42px',
            border: '1.5px solid var(--border)', borderRadius: 12,
            fontSize: 14, color: 'var(--text)', background: '#fff',
            fontFamily: 'var(--font)', outline: 'none', boxSizing: 'border-box',
          }}
          onFocus={e => e.target.style.borderColor = '#6b46c1'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </div>

      {/* Quick jump strip */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {TOPICS.map(tp => (
          <button key={tp.key}
            onClick={() => setSearch('')}
            style={{
              padding: '6px 12px', borderRadius: 99, fontSize: 13, fontWeight: 600,
              background: tp.bg, color: tp.color, border: `1px solid ${tp.color}30`,
              cursor: 'pointer', fontFamily: 'var(--font)', display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            {tp.icon} {t(tp.key)}
          </button>
        ))}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>No topics found</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {filtered.map(tp => (
            <HelpCard key={tp.key} topicKey={tp.key} icon={tp.icon} color={tp.color} bg={tp.bg} />
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <div style={{
        marginTop: 28,
        background: '#fffbeb', border: '1px solid #fde68a',
        borderRadius: 14, padding: '14px 18px',
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>⚕️</span>
        <p style={{ margin: 0, fontSize: 13, color: '#92400e', lineHeight: 1.55, fontWeight: 500 }}>
          {t('disclaimer')}
        </p>
      </div>
    </div>
  );
}
