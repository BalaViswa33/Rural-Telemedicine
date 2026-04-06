import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

// ─── Network type constants ────────────────────────────────────────────────────
export const NETWORK_TYPES = { FOUR_G: '4G', THREE_G: '3G', TWO_G: '2G', NONE: 'None' };

export const NETWORK_META = {
  '4G':   { label: '4G',   mode: 'Video Mode',             color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.35)'  },
  '3G':   { label: '3G',   mode: 'Audio Mode',             color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)' },
  '2G':   { label: '2G',   mode: 'Store-and-Forward Mode', color: '#eab308', bg: 'rgba(234,179,8,0.12)',  border: 'rgba(234,179,8,0.35)'  },
  'None': { label: 'None', mode: 'Offline Save Mode',      color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.35)'  },
};

// ─── IndexedDB helpers (DB v2 adds 'consultations' store) ────────────────────
const DB_NAME    = 'HealthSystemDB';
const DB_VERSION = 2;
const CS         = 'consultations'; // store name

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror   = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const idb = e.target.result;
      if (!idb.objectStoreNames.contains(CS)) {
        const s = idb.createObjectStore(CS, { keyPath: 'id' });
        s.createIndex('synced',    'synced',    { unique: false });
        s.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}

export async function saveConsultation(entry) {
  const idb = await openDB();
  const rec = { ...entry, id: `cns_${Date.now()}_${Math.random().toString(36).substr(2,8)}`, synced: false, createdAt: new Date().toISOString() };
  return new Promise((res, rej) => {
    const r = idb.transaction([CS], 'readwrite').objectStore(CS).add(rec);
    r.onsuccess = () => { idb.close(); res(rec); };
    r.onerror   = () => { idb.close(); rej(r.error); };
  });
}

export async function getUnsyncedConsultations() {
  const idb = await openDB();
  return new Promise((res, rej) => {
    const r = idb.transaction([CS], 'readonly').objectStore(CS).index('synced').getAll(false);
    r.onsuccess = () => { idb.close(); res(r.result); };
    r.onerror   = () => { idb.close(); rej(r.error); };
  });
}

async function markSynced(id) {
  const idb = await openDB();
  return new Promise((res, rej) => {
    const store = idb.transaction([CS], 'readwrite').objectStore(CS);
    const get   = store.get(id);
    get.onsuccess = () => {
      const put = store.put({ ...get.result, synced: true, syncedAt: new Date().toISOString() });
      put.onsuccess = () => { idb.close(); res(); };
      put.onerror   = () => { idb.close(); rej(put.error); };
    };
    get.onerror = () => { idb.close(); rej(get.error); };
  });
}

// ─── Mock API ─────────────────────────────────────────────────────────────────
async function mockSyncAPI(entries) {
  await new Promise(r => setTimeout(r, 900 + Math.random() * 700));
  console.log('[MockAPI] Synced', entries.length, 'consultations:', entries);
  return { ok: true };
}

// ─── Context ──────────────────────────────────────────────────────────────────
const NetworkContext = createContext(null);

export function NetworkProvider({ children }) {
  const [network,      setNetwork]      = useState(NETWORK_TYPES.FOUR_G);
  const [syncStatus,   setSyncStatus]   = useState('idle'); // idle|syncing|success|error
  const [syncMessage,  setSyncMessage]  = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const prevRef = useRef(NETWORK_TYPES.FOUR_G);

  const refreshPending = useCallback(async () => {
    try { setPendingCount((await getUnsyncedConsultations()).length); } catch {}
  }, []);

  useEffect(() => { refreshPending(); }, [refreshPending]);

  const triggerSync = useCallback(async () => {
    try {
      const list = await getUnsyncedConsultations();
      if (!list.length) return;
      setSyncStatus('syncing');
      setSyncMessage(`Syncing ${list.length} offline consultation(s)…`);
      await mockSyncAPI(list);
      for (const e of list) await markSynced(e.id);
      await refreshPending();
      setSyncStatus('success');
      setSyncMessage(`✅ ${list.length} consultation(s) synced successfully!`);
      setTimeout(() => { setSyncStatus('idle'); setSyncMessage(''); }, 4500);
    } catch {
      setSyncStatus('error');
      setSyncMessage('❌ Sync failed. Will retry on next connection.');
      setTimeout(() => { setSyncStatus('idle'); setSyncMessage(''); }, 5000);
    }
  }, [refreshPending]);

  // Auto-sync on None → any transition
  useEffect(() => {
    if (prevRef.current === NETWORK_TYPES.NONE && network !== NETWORK_TYPES.NONE) triggerSync();
    prevRef.current = network;
  }, [network, triggerSync]);

  const value = { network, setNetwork, networkMeta: NETWORK_META[network], syncStatus, syncMessage, pendingCount, refreshPending, saveConsultation, getUnsyncedConsultations };

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

export function useNetwork() {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error('useNetwork must be used inside <NetworkProvider>');
  return ctx;
}
