import { AppBackup, DiscardRecord, Product, Settings } from '../types';

const DB_NAME = 'satak-io-local-db';
const DB_VERSION = 1;
const STORE_NAME = 'state';
const STATE_KEY = 'main';

export type PersistedState = {
  products: Product[];
  discardRecords: DiscardRecord[];
  settings: Settings;
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB não está disponível neste navegador.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Erro ao abrir banco local.'));
  });
}

function runTransaction<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDatabase().then(db => new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const request = operation(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Erro ao acessar banco local.'));
    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error('Erro na transação do banco local.'));
    };
  }));
}

export async function loadLocalState(): Promise<PersistedState | null> {
  try {
    const state = await runTransaction<PersistedState | undefined>('readonly', store => store.get(STATE_KEY));
    return state || null;
  } catch {
    return null;
  }
}

export async function saveLocalState(state: PersistedState): Promise<void> {
  try {
    await runTransaction<IDBValidKey>('readwrite', store => store.put(state, STATE_KEY));
  } catch {
    localStorage.setItem('satak-io-fallback-state', JSON.stringify(state));
  }
}

export async function clearLocalState(): Promise<void> {
  try {
    await runTransaction<undefined>('readwrite', store => store.delete(STATE_KEY));
  } catch {
    localStorage.removeItem('satak-io-fallback-state');
  }
}

export function loadFallbackState(): PersistedState | null {
  try {
    const raw = localStorage.getItem('satak-io-fallback-state');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function buildBackup(state: PersistedState): AppBackup {
  return {
    app: 'SATAK.IO',
    version: 1,
    exportedAt: new Date().toISOString(),
    products: state.products,
    discardRecords: state.discardRecords,
    settings: state.settings,
  };
}
