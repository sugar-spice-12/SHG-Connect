// Sync Manager - Handles background synchronization with Supabase
// Implements retry logic, conflict resolution, and batch operations

import { db, SyncQueueItem, StoreName } from './database';
import { supabase } from '../src/supabase';

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  conflicts: SyncConflict[];
}

export interface SyncConflict {
  id: string;
  store: StoreName;
  localData: any;
  serverData: any;
  timestamp: number;
}

class SyncManager {
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(status: SyncStatus) => void> = new Set();
  private maxRetries = 3;
  private batchSize = 50;

  // Sync status
  private status: SyncStatus = {
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSynced: null,
    pendingCount: 0,
    error: null
  };

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    
    // Listen for service worker sync messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SYNC_REQUESTED') {
          this.sync();
        }
      });
    }
  }

  // Start automatic sync
  startAutoSync(intervalMs: number = 30000) {
    this.stopAutoSync();
    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.sync();
      }
    }, intervalMs);
    
    // Initial sync
    if (navigator.onLine) {
      this.sync();
    }
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Subscribe to sync status changes
  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    listener(this.status);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.status));
  }

  private updateStatus(updates: Partial<SyncStatus>) {
    this.status = { ...this.status, ...updates };
    this.notifyListeners();
  }

  private handleOnline() {
    this.updateStatus({ isOnline: true, error: null });
    this.sync();
    
    // Request background sync if available
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(registration => {
        (registration as any).sync.register('sync-data');
      });
    }
  }

  private handleOffline() {
    this.updateStatus({ isOnline: false });
  }

  // Main sync function
  async sync(): Promise<SyncResult> {
    if (this.isSyncing || !navigator.onLine) {
      return { success: false, synced: 0, failed: 0, conflicts: [] };
    }

    this.isSyncing = true;
    this.updateStatus({ isSyncing: true, error: null });

    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      conflicts: []
    };

    try {
      // Get pending operations
      const queue = await db.getSyncQueue();
      this.updateStatus({ pendingCount: queue.length });

      if (queue.length === 0) {
        this.updateStatus({ 
          isSyncing: false, 
          lastSynced: new Date(),
          pendingCount: 0 
        });
        this.isSyncing = false;
        return result;
      }

      // Process in batches
      const batches = this.chunkArray(queue, this.batchSize);
      
      for (const batch of batches) {
        const batchResults = await Promise.allSettled(
          batch.map(item => this.processQueueItem(item))
        );

        for (let i = 0; i < batchResults.length; i++) {
          const batchResult = batchResults[i];
          const item = batch[i];

          if (batchResult.status === 'fulfilled') {
            if (batchResult.value.success) {
              result.synced++;
              await db.removeSyncQueueItem(item.id);
            } else if (batchResult.value.conflict) {
              result.conflicts.push(batchResult.value.conflict);
            } else {
              result.failed++;
              // Increment retry count
              if (item.retries < this.maxRetries) {
                await db.put('syncQueue', { ...item, retries: item.retries + 1 }, false);
              } else {
                // Max retries reached, remove from queue
                await db.removeSyncQueueItem(item.id);
                result.failed++;
              }
            }
          } else {
            result.failed++;
          }
        }
      }

      // Update status
      const remainingQueue = await db.getSyncQueue();
      this.updateStatus({
        isSyncing: false,
        lastSynced: new Date(),
        pendingCount: remainingQueue.length
      });

      result.success = result.failed === 0 && result.conflicts.length === 0;

    } catch (error) {
      console.error('Sync error:', error);
      this.updateStatus({
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Sync failed'
      });
      result.success = false;
    }

    this.isSyncing = false;
    return result;
  }

  // Process individual queue item
  private async processQueueItem(item: SyncQueueItem): Promise<{
    success: boolean;
    conflict?: SyncConflict;
  }> {
    const tableName = this.getTableName(item.store);
    if (!tableName) {
      return { success: false };
    }

    try {
      switch (item.operation) {
        case 'create':
          return await this.handleCreate(tableName, item);
        
        case 'update':
          return await this.handleUpdate(tableName, item);
        
        case 'delete':
          return await this.handleDelete(tableName, item);
        
        default:
          return { success: false };
      }
    } catch (error) {
      console.error(`Error processing ${item.operation} for ${item.store}:`, error);
      return { success: false };
    }
  }

  private async handleCreate(tableName: string, item: SyncQueueItem): Promise<{ success: boolean }> {
    const { error } = await supabase
      .from(tableName)
      .insert(this.prepareForServer(item.data));

    if (error) {
      // Check if it's a duplicate key error
      if (error.code === '23505') {
        // Record already exists, try update instead
        return this.handleUpdate(tableName, item);
      }
      console.error('Create error:', error);
      return { success: false };
    }

    return { success: true };
  }

  private async handleUpdate(tableName: string, item: SyncQueueItem): Promise<{
    success: boolean;
    conflict?: SyncConflict;
  }> {
    // First, check for conflicts
    const { data: serverData, error: fetchError } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', item.data.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Fetch error:', fetchError);
      return { success: false };
    }

    // Check for conflict (server data is newer)
    if (serverData && serverData.updated_at) {
      const serverTime = new Date(serverData.updated_at).getTime();
      if (serverTime > item.timestamp) {
        return {
          success: false,
          conflict: {
            id: item.data.id,
            store: item.store,
            localData: item.data,
            serverData,
            timestamp: item.timestamp
          }
        };
      }
    }

    // Perform update
    const { error } = await supabase
      .from(tableName)
      .upsert(this.prepareForServer(item.data));

    if (error) {
      console.error('Update error:', error);
      return { success: false };
    }

    return { success: true };
  }

  private async handleDelete(tableName: string, item: SyncQueueItem): Promise<{ success: boolean }> {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', item.data.id);

    if (error && error.code !== 'PGRST116') {
      console.error('Delete error:', error);
      return { success: false };
    }

    return { success: true };
  }

  // Pull data from server
  async pullFromServer(store: StoreName): Promise<any[]> {
    const tableName = this.getTableName(store);
    if (!tableName) return [];

    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Pull error:', error);
        return [];
      }

      // Store in IndexedDB
      if (data && data.length > 0) {
        await db.bulkPut(store, data.map(item => this.prepareForLocal(item)));
      }

      return data || [];
    } catch (error) {
      console.error('Pull error:', error);
      return [];
    }
  }

  // Resolve conflict
  async resolveConflict(conflict: SyncConflict, strategy: 'local' | 'server'): Promise<boolean> {
    try {
      if (strategy === 'local') {
        // Push local data to server
        const tableName = this.getTableName(conflict.store);
        if (!tableName) return false;

        const { error } = await supabase
          .from(tableName)
          .upsert(this.prepareForServer(conflict.localData));

        if (error) {
          console.error('Conflict resolution error:', error);
          return false;
        }
      } else {
        // Use server data locally
        await db.put(conflict.store, this.prepareForLocal(conflict.serverData), false);
      }

      return true;
    } catch (error) {
      console.error('Conflict resolution error:', error);
      return false;
    }
  }

  // Helper functions
  private getTableName(store: StoreName): string | null {
    const mapping: Record<StoreName, string> = {
      members: 'members',
      transactions: 'transactions',
      meetings: 'meetings',
      loans: 'loans',
      syncQueue: '' // Not synced
    };
    return mapping[store] || null;
  }

  private prepareForServer(data: any): any {
    const prepared = { ...data };
    prepared.updated_at = new Date().toISOString();
    if (!prepared.created_at) {
      prepared.created_at = prepared.updated_at;
    }
    return prepared;
  }

  private prepareForLocal(data: any): any {
    return { ...data };
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // Get current status
  getStatus(): SyncStatus {
    return { ...this.status };
  }
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSynced: Date | null;
  pendingCount: number;
  error: string | null;
}

// Singleton instance
export const syncManager = new SyncManager();
