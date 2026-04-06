// src/consultation/ConsultationInbox.jsx
// Doctor inbox — shows 2G image submissions (IndexedDB) + None mesh messages (localStorage).
// Doctor can reply to both. Replies go back via BroadcastChannel so patient sees them live.

import { useState, useEffect, useCallback, useRef } from 'react';
import { onMeshMessage, getMeshHistory, sendMeshMessage } from '../utils/network';

// ── IndexedDB: open at the SAME version (2) that NetworkAwareConsult uses ────
function openDB() {
  return new Promise((res, rej) => {
    const req = indexedDB.open('HealthSystemDB', 2);
    req.onerror   = () => rej(req.error);
    req.onsuccess = () => res(req.result);
    req.onupgradeneeded = (e) => {
      const idb = e.target.result;
      if (!idb.objectStoreNames.contains('consultations')) {
        const s = idb.createObjectStore('consultations', { keyPath: 'id' });
        s.createIndex('synced',    'synced',    { unique: false });
        s.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}

async function getAllConsultations() {
  const idb = await openDB();
  return new Promise((res, rej) => {
    const r = idb.transaction(['consultations'], 'readonly').objectStore('consultations').getAll();
    r.onsuccess = () => { idb.close(); res(r.result); };
    r.onerror   = () => { idb.close(); rej(r.error); };
  });
}

// ── Replies stored in localStorage (simple, no extra DB version needed) ──────
const REPLIES_KEY = 'doctorReplies';

function loadReplies() {
  try { return JSON.parse(localStorage.getItem(REPLIES_KEY) || '{}'); } catch { return {}; }
}
function persistReply(id, text) {
  const all = loadReplies();
  all[id] = { text, repliedAt: new Date().toISOString() };
  localStorage.setItem(REPLIES_KEY, JSON.stringify(all));
  return all[id];
}

// ── Component ────────────────────────────────────────────────────────────────
export default function ConsultationInbox() {
  const [consultations, setConsultations] = useState([]); // 2G image records from IndexedDB
  const [meshMessages,  setMeshMessages]  = useState([]); // None-mode text messages
  const [replies,       setReplies]       = useState(loadReplies());
  const [drafts,        setDrafts]        = useState({});
  const [expanded,      setExpanded]      = useState(null);
  const [filter,        setFilter]        = useState('all');
  const [loading,       setLoading]       = useState(true);
  const bottomRefs = useRef({});

  // ── Load 2G image consultations from IndexedDB ───────────────────────────
  const loadConsultations = useCallback(async () => {
    setLoading(true);
    try {
      const all = await getAllConsultations();
      const sorted = all
        .filter(c => c.networkMode === '2G' || c.imageData) // 2G submissions
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setConsultations(sorted);
    } catch (e) {
      console.error('Failed to load consultations:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Load None-mode mesh messages from localStorage ───────────────────────
  const loadMesh = useCallback(() => {
    const history = getMeshHistory().filter(m => m.from !== 'Doctor'); // only patient messages
    setMeshMessages(history);
  }, []);

  useEffect(() => {
    loadConsultations();
    loadMesh();

    // Live: listen for new mesh messages from patient
    const unsub = onMeshMessage((msg) => {
      if (msg.from !== 'Doctor') {
        setMeshMessages(prev => {
          // avoid duplicates
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    });
    return unsub;
  }, [loadConsultations, loadMesh]);

  // Auto-scroll mesh thread when expanded
  useEffect(() => {
    if (expanded && bottomRefs.current[expanded]) {
      bottomRefs.current[expanded].scrollIntoView({ behavior: 'smooth' });
    }
  }, [expanded, meshMessages]);

  // ── Reply to a 2G consultation (stored locally, shown in inbox) ──────────
  function handleReply2G(id) {
    const text = drafts[id]?.trim();
    if (!text) return;
    const saved = persistReply(id, text);
    setReplies(r => ({ ...r, [id]: saved }));
    setDrafts(d => { const n = { ...d }; delete n[id]; return n; });
  }

  // ── Reply to a None mesh message (sent via BroadcastChannel → patient sees it live) ─
  function handleReplyMesh(patientName, threadKey) {
    const text = drafts[threadKey]?.trim();
    if (!text) return;

    // Send via BroadcastChannel so patient's MeshPanel receives it immediately
    sendMeshMessage({ from: 'Doctor', to: patientName || 'Patient', text });

    // Also save as a reply in localStorage for the inbox display
    const saved = persistReply(threadKey, text);
    setReplies(r => ({ ...r, [threadKey]: saved }));
    setDrafts(d => { const n = { ...d }; delete n[threadKey]; return n; });
  }

  // ── Group mesh messages by patient ───────────────────────────────────────
  const meshThreads = meshMessages.reduce((acc, msg) => {
    const key = msg.from || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(msg);
    return acc;
  }, {});

  // ── Filter ────────────────────────────────────────────────────────────────
  const show2G   = filter === 'all' || filter === '2G';
  const showNone = filter === 'all' || filter === 'None';

  const total2G   = consultations.length;
  const totalNone = Object.keys(meshThreads).length;

  return (
    <div style={{ fontFamily: 'var(--font, sans-serif)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text, #1e293b)' }}>📥 Consultation Inbox</div>
          <div style={{ fontSize: 12, color: 'var(--text3, #94a3b8)', marginTop: 2 }}>
            {total2G} image submission{total2G !== 1 ? 's' : ''} · {totalNone} offline thread{totalNone !== 1 ? 's' : ''}
          </div>
        </div>
        <button onClick={() => { loadConsultations(); loadMesh(); }} style={btnSmall}>🔄 Refresh</button>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['all', `All (${total2G + totalNone})`], ['2G', `📡 2G Images (${total2G})`], ['None', `🔴 Offline Messages (${totalNone})`]].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            padding: '6px 14px', borderRadius: 20, border: 'none', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
            background: filter === val ? '#1a6fd4' : 'var(--surface2, #f1f5f9)',
            color: filter === val ? '#fff' : 'var(--text2, #475569)',
          }}>
            {label}
          </button>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>Loading…</div>}

      {!loading && total2G + totalNone === 0 && (
        <div style={{ textAlign: 'center', padding: 60, background: 'var(--surface, #fff)', borderRadius: 16, border: '1px solid var(--border, #e2e8f0)' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>No consultations yet</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>
            Patients on 2G (image) or No signal (text) will appear here
          </div>
        </div>
      )}

      {/* ── 2G IMAGE CONSULTATIONS ─────────────────────────────────────────── */}
      {show2G && consultations.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <SectionHead>📡 2G — Image Submissions</SectionHead>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {consultations.map(c => {
              const isOpen  = expanded === c.id;
              const replied = replies[c.id];
              return (
                <div key={c.id} style={cardStyle(isOpen, '#eab308')}>
                  {/* Card header */}
                  <div onClick={() => setExpanded(isOpen ? null : c.id)} style={cardHeader}>
                    <div style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'rgba(234,179,8,0.1)', color: '#eab308', border: '1px solid rgba(234,179,8,0.3)', flexShrink: 0 }}>
                      📡 2G
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{c.patientName || 'Patient'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description || '(no description)'}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {c.imageData && <Badge color="#1a6fd4" bg="#eff6ff" border="#bfdbfe">📷 Image</Badge>}
                      {replied    && <Badge color="#16a34a" bg="#f0fdf4" border="#bbf7d0">✓ Replied</Badge>}
                      <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'right', fontFamily: 'var(--mono)' }}>
                        {fmtDate(c.createdAt)}
                      </div>
                      <Chevron open={isOpen} />
                    </div>
                  </div>

                  {/* Expanded */}
                  {isOpen && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: 18 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: c.imageData ? '1fr 1fr' : '1fr', gap: 18 }}>
                        {c.imageData && (
                          <div>
                            <Label>📷 Patient Photo</Label>
                            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
                              <img src={c.imageData} alt={c.imageName || 'photo'} style={{ width: '100%', display: 'block', maxHeight: 280, objectFit: 'contain', background: '#0f172a' }} />
                            </div>
                            {c.imageName && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 5 }}>📎 {c.imageName}</div>}
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                          <div>
                            <Label>📝 Patient Message</Label>
                            <div style={msgBox}>{c.description || '(no description provided)'}</div>
                          </div>
                          {replied ? (
                            <div>
                              <Label>✅ Your Reply</Label>
                              <div style={{ ...msgBox, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' }}>{replied.text}</div>
                              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Sent {fmtDate(replied.repliedAt)}</div>
                              <button onClick={() => setReplies(r => { const n = {...r}; delete n[c.id]; return n; })} style={{ ...btnSmall, marginTop: 6 }}>✏️ Edit</button>
                            </div>
                          ) : (
                            <div>
                              <Label>💬 Reply to Patient</Label>
                              <textarea rows={4} value={drafts[c.id] || ''} onChange={e => setDrafts(d => ({ ...d, [c.id]: e.target.value }))} placeholder="Type your medical response…" style={textareaStyle}
                                onFocus={e => e.target.style.borderColor = '#1a6fd4'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                              <button onClick={() => handleReply2G(c.id)} disabled={!drafts[c.id]?.trim()} style={replyBtn(!!drafts[c.id]?.trim())}>
                                📤 Send Reply
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── NONE / OFFLINE MESH MESSAGES ───────────────────────────────────── */}
      {showNone && Object.keys(meshThreads).length > 0 && (
        <div>
          <SectionHead>🔴 Offline — Text Messages</SectionHead>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(meshThreads).map(([patientName, msgs]) => {
              const threadKey = `mesh_${patientName}`;
              const isOpen    = expanded === threadKey;
              const replied   = replies[threadKey];
              const lastMsg   = msgs[msgs.length - 1];

              // Collect full thread (patient msgs + doctor replies from localStorage)
              const meshHistory = getMeshHistory().filter(m =>
                (m.from === patientName && m.to === 'Doctor') ||
                (m.from === 'Doctor' && m.to === patientName)
              );

              return (
                <div key={threadKey} style={cardStyle(isOpen, '#ef4444')}>
                  {/* Card header */}
                  <div onClick={() => setExpanded(isOpen ? null : threadKey)} style={cardHeader}>
                    <div style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', flexShrink: 0 }}>
                      🔴 Offline
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{patientName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {msgs.length} message{msgs.length !== 1 ? 's' : ''} · {lastMsg?.text}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {replied && <Badge color="#16a34a" bg="#f0fdf4" border="#bbf7d0">✓ Replied</Badge>}
                      <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{fmtDate(lastMsg?.timestamp)}</div>
                      <Chevron open={isOpen} />
                    </div>
                  </div>

                  {/* Expanded thread */}
                  {isOpen && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <Label>💬 Conversation</Label>

                      {/* Chat thread */}
                      <div style={{ background: 'var(--surface2, #f8fafc)', borderRadius: 12, padding: 12, maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {meshHistory.map((m, i) => {
                          const isDoctor = m.from === 'Doctor';
                          return (
                            <div key={m.id || i} style={{ display: 'flex', justifyContent: isDoctor ? 'flex-end' : 'flex-start' }}>
                              <div style={{
                                maxWidth: '75%', padding: '9px 13px', fontSize: 13, lineHeight: 1.5,
                                background: isDoctor ? '#1a6fd4' : '#fff',
                                color: isDoctor ? '#fff' : 'var(--text)',
                                borderRadius: isDoctor ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                                border: isDoctor ? 'none' : '1px solid var(--border)',
                              }}>
                                <div style={{ fontSize: 10, opacity: 0.65, marginBottom: 3, fontWeight: 600 }}>
                                  {isDoctor ? 'You (Doctor)' : m.from}
                                </div>
                                {m.text}
                                <div style={{ fontSize: 10, opacity: 0.5, marginTop: 4, textAlign: 'right', fontFamily: 'var(--mono)' }}>
                                  {m.timestamp ? new Date(m.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={el => bottomRefs.current[threadKey] = el} />
                      </div>

                      {/* Reply box */}
                      <div>
                        <Label>✏️ Reply to {patientName}</Label>
                        <textarea
                          rows={3}
                          value={drafts[threadKey] || ''}
                          onChange={e => setDrafts(d => ({ ...d, [threadKey]: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReplyMesh(patientName, threadKey); }}}
                          placeholder={`Reply to ${patientName}… (Enter to send)`}
                          style={textareaStyle}
                          onFocus={e => e.target.style.borderColor = '#ef4444'}
                          onBlur={e  => e.target.style.borderColor = 'var(--border)'}
                        />
                        <button onClick={() => handleReplyMesh(patientName, threadKey)} disabled={!drafts[threadKey]?.trim()} style={replyBtn(!!drafts[threadKey]?.trim(), '#ef4444')}>
                          📤 Send Reply
                        </button>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
                          💡 Reply sent via BroadcastChannel — patient sees it instantly if their tab is open
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Small components ─────────────────────────────────────────────────────────
function SectionHead({ children }) {
  return <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{children}</div>;
}
function Label({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{children}</div>;
}
function Badge({ children, color, bg, border }) {
  return <span style={{ fontSize: 11, fontWeight: 600, color, background: bg, border: `1px solid ${border}`, padding: '2px 8px', borderRadius: 20 }}>{children}</span>;
}
function Chevron({ open }) {
  return <span style={{ color: 'var(--text3)', fontSize: 14, display: 'inline-block', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>;
}
function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
}

// ── Styles ────────────────────────────────────────────────────────────────────
const cardStyle = (open, accent) => ({
  background: 'var(--surface, #fff)',
  border: `1.5px solid ${open ? accent : 'var(--border, #e2e8f0)'}`,
  borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.2s',
});
const cardHeader = {
  padding: '14px 18px', cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 12,
};
const msgBox = {
  background: 'var(--surface2, #f8fafc)', border: '1px solid var(--border)',
  borderRadius: 10, padding: '10px 14px', fontSize: 14,
  color: 'var(--text)', lineHeight: 1.6,
};
const textareaStyle = {
  width: '100%', padding: '10px 12px', boxSizing: 'border-box',
  background: '#fff', border: '1.5px solid var(--border)',
  borderRadius: 10, fontSize: 13, color: 'var(--text)',
  fontFamily: 'var(--font, sans-serif)', resize: 'vertical',
  lineHeight: 1.6, outline: 'none', transition: 'border-color 0.2s',
};
const replyBtn = (active, color = '#1a6fd4') => ({
  marginTop: 8, padding: '10px 20px',
  background: active ? color : 'var(--surface2)',
  color: active ? '#fff' : 'var(--text3)',
  border: 'none', borderRadius: 8,
  fontSize: 13, fontWeight: 700,
  cursor: active ? 'pointer' : 'not-allowed',
  fontFamily: 'inherit',
});
const btnSmall = {
  padding: '6px 14px', background: '#eff6ff', border: '1px solid #bfdbfe',
  borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#1a6fd4',
  cursor: 'pointer', fontFamily: 'inherit',
};
