// IndexedDB utility — version 2 (adds consultations store)

const DB_NAME    = 'HealthSystemDB';
const DB_VERSION = 2;               // Must match or exceed whatever the browser has

const STORES = {
  PATIENTS:      'patients',
  VITALS:        'vitals',
  PRESCRIPTIONS: 'prescriptions',
  CONSULTATIONS: 'consultations',
};

class DatabaseManager {
  constructor() {
    this.db          = null;
    this._initPromise = null;
  }

  init() {
    if (this._initPromise) return this._initPromise;

    this._initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        this._initPromise = null;
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.db.onclose = () => { this.db = null; this._initPromise = null; };
        this.db.onerror = (e) => console.error('IndexedDB error:', e.target.error);
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db  = event.target.result;
        const txn = event.target.transaction;

        const ensureStore = (name, keyPath, indexes = []) => {
          let store;
          if (!db.objectStoreNames.contains(name)) {
            store = db.createObjectStore(name, { keyPath });
          } else {
            store = txn.objectStore(name);
          }
          indexes.forEach(({ idx, unique }) => {
            if (!store.indexNames.contains(idx)) {
              store.createIndex(idx, idx, { unique: !!unique });
            }
          });
        };

        ensureStore('patients',      'id', [{ idx:'synced' }, { idx:'createdAt' }]);
        ensureStore('vitals',        'id', [{ idx:'patientId' }, { idx:'synced' }, { idx:'createdAt' }]);
        ensureStore('prescriptions', 'id', [{ idx:'patientId' }, { idx:'synced' }, { idx:'createdAt' }]);
        ensureStore('consultations', 'id', [{ idx:'patientId' }, { idx:'synced' }, { idx:'createdAt' }]);

        txn.onerror = () => {
          this._initPromise = null;
          reject(txn.error);
        };
      };
    });

    return this._initPromise;
  }

  _requireDb() {
    if (!this.db) throw new Error('Database not initialized. Call db.init() first.');
  }

  add(storeName, data) {
    this._requireDb();
    return new Promise((resolve, reject) => {
      const txn   = this.db.transaction([storeName], 'readwrite');
      const store = txn.objectStore(storeName);
      const record = {
        ...data,
        synced:    false,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      store.add(record);
      txn.oncomplete = () => resolve(record);
      txn.onerror    = () => reject(txn.error);
      txn.onabort    = () => reject(txn.error ?? new Error('Transaction aborted'));
    });
  }

  update(storeName, data) {
    this._requireDb();
    return new Promise((resolve, reject) => {
      const txn   = this.db.transaction([storeName], 'readwrite');
      const store = txn.objectStore(storeName);
      const record = { ...data, updatedAt: new Date().toISOString() };
      store.put(record);
      txn.oncomplete = () => resolve(record);
      txn.onerror    = () => reject(txn.error);
      txn.onabort    = () => reject(txn.error ?? new Error('Transaction aborted'));
    });
  }

  getAll(storeName) {
    this._requireDb();
    return new Promise((resolve, reject) => {
      const txn  = this.db.transaction([storeName], 'readonly');
      const req  = txn.objectStore(storeName).getAll();
      req.onsuccess = () => resolve(req.result ?? []);
      req.onerror   = () => reject(req.error);
    });
  }

  getById(storeName, id) {
    this._requireDb();
    return new Promise((resolve, reject) => {
      const txn = this.db.transaction([storeName], 'readonly');
      const req = txn.objectStore(storeName).get(id);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror   = () => reject(req.error);
    });
  }

  getByIndex(storeName, indexName, value) {
    this._requireDb();
    return new Promise((resolve, reject) => {
      const txn   = this.db.transaction([storeName], 'readonly');
      const index = txn.objectStore(storeName).index(indexName);
      const req   = index.getAll(value);
      req.onsuccess = () => resolve(req.result ?? []);
      req.onerror   = () => reject(req.error);
    });
  }

  getUnsynced(storeName) {
    return this.getByIndex(storeName, 'synced', false);
  }

  async markAsSynced(storeName, id) {
    const item = await this.getById(storeName, id);
    if (item) {
      await this.update(storeName, { ...item, synced: true, syncedAt: new Date().toISOString() });
    }
  }

  delete(storeName, id) {
    this._requireDb();
    return new Promise((resolve, reject) => {
      const txn = this.db.transaction([storeName], 'readwrite');
      txn.objectStore(storeName).delete(id);
      txn.oncomplete = () => resolve();
      txn.onerror    = () => reject(txn.error);
      txn.onabort    = () => reject(txn.error ?? new Error('Transaction aborted'));
    });
  }

  clear(storeName) {
    this._requireDb();
    return new Promise((resolve, reject) => {
      const txn = this.db.transaction([storeName], 'readwrite');
      txn.objectStore(storeName).clear();
      txn.oncomplete = () => resolve();
      txn.onerror    = () => reject(txn.error);
      txn.onabort    = () => reject(txn.error ?? new Error('Transaction aborted'));
    });
  }
}

const db = new DatabaseManager();
export { db, STORES };
