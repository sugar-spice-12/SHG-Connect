// IndexedDB Database Layer for Offline-First Scalable Storage
// Supports thousands of records with efficient querying

const DB_NAME = 'shg_connect_db';
const DB_VERSION = 1;

export interface DBSchema {
  members: IDBObjectStore;
  transactions: IDBObjectStore;
  meetings: IDBObjectStore;
  loans: IDBObjectStore;
  syncQueue: IDBObjectStore;
}

export type StoreName = 'members' | 'transactions' | 'meetings' | 'loans' | 'syncQueue';

export interface SyncQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  store: StoreName;
  data: any;
  timestamp: number;
  retries: number;
}

class Database {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Members store with indexes
        if (!db.objectStoreNames.contains('members')) {
          const membersStore = db.createObjectStore('members', { keyPath: 'id' });
          membersStore.createIndex('name', 'name', { unique: false });
          membersStore.createIndex('role', 'role', { unique: false });
          membersStore.createIndex('lastActive', 'lastActive', { unique: false });
          membersStore.createIndex('savingsBalance', 'savingsBalance', { unique: false });
        }

        // Transactions store with indexes for efficient querying
        if (!db.objectStoreNames.contains('transactions')) {
          const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
          txStore.createIndex('memberId', 'memberId', { unique: false });
          txStore.createIndex('type', 'type', { unique: false });
          txStore.createIndex('timestamp', 'timestamp', { unique: false });
          txStore.createIndex('date', 'date', { unique: false });
          txStore.createIndex('meetingId', 'meetingId', { unique: false });
          txStore.createIndex('loanId', 'loanId', { unique: false });
        }

        // Meetings store
        if (!db.objectStoreNames.contains('meetings')) {
          const meetingsStore = db.createObjectStore('meetings', { keyPath: 'id' });
          meetingsStore.createIndex('date', 'date', { unique: false });
        }

        // Loans store with indexes
        if (!db.objectStoreNames.contains('loans')) {
          const loansStore = db.createObjectStore('loans', { keyPath: 'id' });
          loansStore.createIndex('memberId', 'memberId', { unique: false });
          loansStore.createIndex('status', 'status', { unique: false });
          loansStore.createIndex('startDate', 'startDate', { unique: false });
        }

        // Sync queue for offline operations
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('store', 'store', { unique: false });
        }
      };
    });

    return this.dbPromise;
  }

  // Generic CRUD operations
  async getAll<T>(storeName: StoreName): Promise<T[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getById<T>(storeName: StoreName, id: string): Promise<T | undefined> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async put<T extends { id: string }>(storeName: StoreName, data: T, addToSyncQueue = true): Promise<T> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(data);
      
      request.onsuccess = async () => {
        if (addToSyncQueue) {
          await this.addToSyncQueue('update', storeName, data);
        }
        resolve(data);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async add<T extends { id: string }>(storeName: StoreName, data: T, addToSyncQueue = true): Promise<T> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.add(data);
      
      request.onsuccess = async () => {
        if (addToSyncQueue) {
          await this.addToSyncQueue('create', storeName, data);
        }
        resolve(data);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: StoreName, id: string, addToSyncQueue = true): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.delete(id);
      
      request.onsuccess = async () => {
        if (addToSyncQueue) {
          await this.addToSyncQueue('delete', storeName, { id });
        }
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Bulk operations for better performance
  async bulkPut<T extends { id: string }>(storeName: StoreName, items: T[]): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      
      items.forEach(item => store.put(item));
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async bulkDelete(storeName: StoreName, ids: string[]): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      
      ids.forEach(id => store.delete(id));
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // Paginated queries for large datasets
  async getPaginated<T>(
    storeName: StoreName,
    options: {
      page?: number;
      pageSize?: number;
      indexName?: string;
      direction?: IDBCursorDirection;
    } = {}
  ): Promise<{ data: T[]; total: number; hasMore: boolean }> {
    const { page = 1, pageSize = 20, indexName, direction = 'prev' } = options;
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const source = indexName ? store.index(indexName) : store;
      
      const countRequest = store.count();
      const results: T[] = [];
      let skipped = 0;
      const skip = (page - 1) * pageSize;
      
      countRequest.onsuccess = () => {
        const total = countRequest.result;
        const cursorRequest = source.openCursor(null, direction);
        
        cursorRequest.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          
          if (cursor) {
            if (skipped < skip) {
              skipped++;
              cursor.continue();
            } else if (results.length < pageSize) {
              results.push(cursor.value);
              cursor.continue();
            } else {
              resolve({
                data: results,
                total,
                hasMore: skip + results.length < total
              });
            }
          } else {
            resolve({
              data: results,
              total,
              hasMore: false
            });
          }
        };
        
        cursorRequest.onerror = () => reject(cursorRequest.error);
      };
      
      countRequest.onerror = () => reject(countRequest.error);
    });
  }

  // Query by index
  async getByIndex<T>(
    storeName: StoreName,
    indexName: string,
    value: IDBValidKey
  ): Promise<T[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Range queries for date-based filtering
  async getByRange<T>(
    storeName: StoreName,
    indexName: string,
    lower: IDBValidKey,
    upper: IDBValidKey
  ): Promise<T[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const index = store.index(indexName);
      const range = IDBKeyRange.bound(lower, upper);
      const request = index.getAll(range);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Sync queue management
  private async addToSyncQueue(
    operation: SyncQueueItem['operation'],
    store: StoreName,
    data: any
  ): Promise<void> {
    const item: SyncQueueItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      operation,
      store,
      data,
      timestamp: Date.now(),
      retries: 0
    };
    
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('syncQueue', 'readwrite');
      const syncStore = tx.objectStore('syncQueue');
      const request = syncStore.add(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    return this.getAll<SyncQueueItem>('syncQueue');
  }

  async clearSyncQueue(): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('syncQueue', 'readwrite');
      const store = tx.objectStore('syncQueue');
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    return this.delete('syncQueue', id, false);
  }

  // Clear all data (for logout)
  async clearAll(): Promise<void> {
    const db = await this.init();
    const storeNames: StoreName[] = ['members', 'transactions', 'meetings', 'loans', 'syncQueue'];
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeNames, 'readwrite');
      storeNames.forEach(name => tx.objectStore(name).clear());
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // Get statistics efficiently
  async getStats(): Promise<{
    memberCount: number;
    transactionCount: number;
    meetingCount: number;
    loanCount: number;
    pendingSyncCount: number;
  }> {
    const db = await this.init();
    const storeNames: StoreName[] = ['members', 'transactions', 'meetings', 'loans', 'syncQueue'];
    
    const counts = await Promise.all(
      storeNames.map(name => 
        new Promise<number>((resolve, reject) => {
          const tx = db.transaction(name, 'readonly');
          const request = tx.objectStore(name).count();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        })
      )
    );

    return {
      memberCount: counts[0],
      transactionCount: counts[1],
      meetingCount: counts[2],
      loanCount: counts[3],
      pendingSyncCount: counts[4]
    };
  }
}

// Singleton instance
export const db = new Database();

// Initialize on import
db.init().catch(console.error);
