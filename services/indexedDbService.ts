import { AppData, Transaction } from '../types';

const DB_NAME = 'FinanceLocalDB';
const DB_VERSION = 1;
const STORE_META = 'meta';
const STORE_TRANSACTIONS = 'transactions';
const STORE_ACCOUNTS = 'accounts';
const STORE_CATEGORIES = 'categories';
const STORE_STAGING = 'importStaging';
const DATA_KEY = 'appData';

export interface StagingItem {
  id: string;
  transaction: Transaction;
  possibleDuplicate: boolean;
}

const openDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_META)) db.createObjectStore(STORE_META);
      if (!db.objectStoreNames.contains(STORE_TRANSACTIONS)) db.createObjectStore(STORE_TRANSACTIONS, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORE_ACCOUNTS)) db.createObjectStore(STORE_ACCOUNTS, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORE_CATEGORIES)) db.createObjectStore(STORE_CATEGORIES, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORE_STAGING)) db.createObjectStore(STORE_STAGING, { keyPath: 'id' });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const runTx = async <T>(
  stores: string[],
  mode: IDBTransactionMode,
  executor: (tx: IDBTransaction) => Promise<T>
): Promise<T> => {
  const db = await openDb();
  try {
    const tx = db.transaction(stores, mode);
    const result = await executor(tx);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error);
      tx.onerror = () => reject(tx.error);
    });
    return result;
  } finally {
    db.close();
  }
};

const reqToPromise = <T>(request: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

export const migrateLocalStorageToIndexedDb = async (fallbackData: AppData): Promise<AppData> => {
  const legacyRaw = localStorage.getItem('finances_local_v3') || localStorage.getItem('finances_local_v2');
  const parsed = legacyRaw ? (JSON.parse(legacyRaw) as AppData) : fallbackData;

  await saveAppDataToIndexedDb(parsed);
  localStorage.removeItem('finances_local_v2');
  return parsed;
};

export const loadAppDataFromIndexedDb = async (): Promise<AppData | null> => {
  return runTx([STORE_META], 'readonly', async (tx) => {
    const store = tx.objectStore(STORE_META);
    const value = await reqToPromise(store.get(DATA_KEY));
    return (value as AppData) || null;
  });
};

export const saveAppDataToIndexedDb = async (data: AppData): Promise<void> => {
  await runTx([STORE_META, STORE_TRANSACTIONS, STORE_ACCOUNTS, STORE_CATEGORIES], 'readwrite', async (tx) => {
    tx.objectStore(STORE_META).put(data, DATA_KEY);

    const txStore = tx.objectStore(STORE_TRANSACTIONS);
    txStore.clear();
    data.transactions.forEach((item) => txStore.put(item));

    const accStore = tx.objectStore(STORE_ACCOUNTS);
    accStore.clear();
    data.accounts.forEach((item) => accStore.put(item));

    const catStore = tx.objectStore(STORE_CATEGORIES);
    catStore.clear();
    data.categories.forEach((item) => catStore.put(item));

    return undefined;
  });
};

export const stageImportItems = async (items: StagingItem[]): Promise<void> => {
  await runTx([STORE_STAGING], 'readwrite', async (tx) => {
    const store = tx.objectStore(STORE_STAGING);
    store.clear();
    items.forEach((item) => store.put(item));
    return undefined;
  });
};

export const loadStagedItems = async (): Promise<StagingItem[]> => {
  return runTx([STORE_STAGING], 'readonly', async (tx) => {
    const store = tx.objectStore(STORE_STAGING);
    return (await reqToPromise(store.getAll())) as unknown as StagingItem[];
  });
};
