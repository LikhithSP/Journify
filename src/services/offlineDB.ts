/**
 * IndexedDB Local Storage Layer
 * Database: journify_offline_db (Version 1)
 * Stores:
 * - 'entries': cached and local-created journal entries
 * - 'sync_queue': operations to be executed when back online
 * - 'folders': local folders
 */

import type { JournalEntry } from '../types/journal';

const DB_NAME = 'journify_offline_db';
const DB_VERSION = 1;

export interface SyncQueueItem {
  id: string; // unique operation id
  entityId: string; // journal entry id
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  payload?: any;
  timestamp: string;
  retryCount: number;
  lastError?: string;
}

export class OfflineDB {
  private static dbPromise: Promise<IDBDatabase> | null = null;

  public static async getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store 1: Journal Entries
        if (!db.objectStoreNames.contains('entries')) {
          const entryStore = db.createObjectStore('entries', { keyPath: 'id' });
          entryStore.createIndex('user_id', 'user_id', { unique: false });
          entryStore.createIndex('created_at', 'created_at', { unique: false });
          entryStore.createIndex('sync_status', 'sync_status', { unique: false });
        }

        // Store 2: Sync Queue
        if (!db.objectStoreNames.contains('sync_queue')) {
          const queueStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
          queueStore.createIndex('entityId', 'entityId', { unique: false });
        }

        // Store 3: Folders
        if (!db.objectStoreNames.contains('folders')) {
          const folderStore = db.createObjectStore('folders', { keyPath: 'id' });
          folderStore.createIndex('user_id', 'user_id', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        this.dbPromise = null;
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  // --- Entries Store Methods ---

  public static async getAllEntries(userId: string): Promise<JournalEntry[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('entries', 'readonly');
      const store = tx.objectStore('entries');
      const index = store.index('user_id');
      const request = index.getAll(userId);

      request.onsuccess = () => {
        const results = (request.result || []) as (JournalEntry & { sync_status?: string })[];
        // Sort descending by created_at
        results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  public static async getEntryById(id: string): Promise<JournalEntry | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('entries', 'readonly');
      const store = tx.objectStore('entries');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  public static async putEntry(entry: JournalEntry & { sync_status?: 'synced' | 'pending' | 'conflict' }): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('entries', 'readwrite');
      const store = tx.objectStore('entries');
      const request = store.put(entry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public static async putEntriesBatch(entries: JournalEntry[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('entries', 'readwrite');
      const store = tx.objectStore('entries');
      entries.forEach((entry) => {
        store.put({ ...entry, sync_status: 'synced' });
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  public static async deleteEntry(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('entries', 'readwrite');
      const store = tx.objectStore('entries');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --- Sync Queue Methods ---

  public static async enqueueOperation(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<SyncQueueItem> {
    const db = await this.getDB();
    const queueItem: SyncQueueItem = {
      ...item,
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readwrite');
      const store = tx.objectStore('sync_queue');
      const request = store.put(queueItem);

      request.onsuccess = () => resolve(queueItem);
      request.onerror = () => reject(request.error);
    });
  }

  public static async getQueue(): Promise<SyncQueueItem[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readonly');
      const store = tx.objectStore('sync_queue');
      const request = store.getAll();

      request.onsuccess = () => {
        const items = (request.result || []) as SyncQueueItem[];
        items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  }

  public static async dequeueOperation(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readwrite');
      const store = tx.objectStore('sync_queue');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public static async updateQueueItem(item: SyncQueueItem): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readwrite');
      const store = tx.objectStore('sync_queue');
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
