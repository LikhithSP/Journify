import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { JournalEntry, JournalEntryFormData } from '../types/journal';
import { useAuth } from '../contexts/AuthContext';

interface UseOfflineSyncOptions {
  enabled?: boolean;
}

interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  data?: JournalEntryFormData;
  entryId?: string;
  timestamp: number;
}

export function useOfflineSync({ enabled = true }: UseOfflineSyncOptions = {}) {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingOperations, setPendingOperations] = useState<PendingOperation[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(
    Number(localStorage.getItem('journify-last-sync')) || null
  );

  // Handle online/offline status
  useEffect(() => {
    if (!enabled) return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load pending operations from localStorage
    const storedOperations = localStorage.getItem('journify-pending-operations');
    if (storedOperations) {
      setPendingOperations(JSON.parse(storedOperations));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enabled]);

  // Save pending operations to localStorage whenever they change
  useEffect(() => {
    if (pendingOperations.length > 0) {
      localStorage.setItem('journify-pending-operations', JSON.stringify(pendingOperations));
    } else {
      localStorage.removeItem('journify-pending-operations');
    }
  }, [pendingOperations]);

  // Sync when online
  useEffect(() => {
    if (isOnline && pendingOperations.length > 0 && user && enabled) {
      syncPendingOperations();
    }
  }, [isOnline, pendingOperations, user, enabled]);

  // Function to create a new entry (works both online and offline)
  const createEntry = async (data: JournalEntryFormData): Promise<{ data: JournalEntry | null; error: Error | null }> => {
    if (!user) return { data: null, error: new Error('User is not authenticated') };

    // Generate a temporary ID for offline use
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    if (!isOnline) {
      // Store in pending operations
      const newOperation: PendingOperation = {
        id: tempId,
        type: 'create',
        data,
        timestamp: Date.now()
      };

      // Add to pending operations
      setPendingOperations(prev => [...prev, newOperation]);

      // Create a temporary entry object for immediate UI feedback
      const tempEntry: JournalEntry = {
        id: tempId,
        user_id: user.id,
        title: data.title,
        content: data.content,
        mood: data.mood || null,
        tags: data.tags || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_favorite: data.is_favorite,
        is_private: data.is_private,
        location: data.location || null,
        weather: data.weather || null,
        images: data.images || []
      };

      // Store in local storage for offline access
      const offlineEntries = JSON.parse(localStorage.getItem('journify-offline-entries') || '[]');
      localStorage.setItem('journify-offline-entries', JSON.stringify([...offlineEntries, tempEntry]));

      return { data: tempEntry, error: null };
    }

    // If online, send directly to Supabase
    try {
      const { data: newEntry, error } = await supabase
        .from('journal_entries')
        .insert([{ ...data, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      // Update last sync time
      const now = Date.now();
      localStorage.setItem('journify-last-sync', now.toString());
      setLastSyncTime(now);

      return { data: newEntry as JournalEntry, error: null };
    } catch (error) {
      console.error('Error creating entry:', error);
      return { data: null, error: error as Error };
    }
  };

  // Function to update an existing entry
  const updateEntry = async (id: string, data: Partial<JournalEntryFormData>): Promise<{ data: JournalEntry | null; error: Error | null }> => {
    if (!user) return { data: null, error: new Error('User is not authenticated') };

    // Check if it's a temporary ID
    const isTemp = id.startsWith('temp_');

    if (!isOnline || isTemp) {
      // For offline updates or updates to entries created while offline
      const newOperation: PendingOperation = {
        id: `update_${Date.now()}`,
        type: 'update',
        data: data as JournalEntryFormData,
        entryId: id,
        timestamp: Date.now()
      };

      setPendingOperations(prev => [...prev, newOperation]);

      // Update the entry in local storage
      const offlineEntries = JSON.parse(localStorage.getItem('journify-offline-entries') || '[]');
      const updatedEntries = offlineEntries.map((entry: JournalEntry) => {
        if (entry.id === id) {
          return { ...entry, ...data, updated_at: new Date().toISOString() };
        }
        return entry;
      });

      localStorage.setItem('journify-offline-entries', JSON.stringify(updatedEntries));
      
      // Find the updated entry for return
      const updatedEntry = updatedEntries.find((entry: JournalEntry) => entry.id === id);
      return { data: updatedEntry || null, error: null };
    }

    // If online, update directly in Supabase
    try {
      const { data: updatedEntry, error } = await supabase
        .from('journal_entries')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Update last sync time
      const now = Date.now();
      localStorage.setItem('journify-last-sync', now.toString());
      setLastSyncTime(now);

      return { data: updatedEntry as JournalEntry, error: null };
    } catch (error) {
      console.error('Error updating entry:', error);
      return { data: null, error: error as Error };
    }
  };

  // Function to delete an entry
  const deleteEntry = async (id: string): Promise<{ error: Error | null }> => {
    if (!user) return { error: new Error('User is not authenticated') };

    // Check if it's a temporary ID
    const isTemp = id.startsWith('temp_');

    if (!isOnline || isTemp) {
      // For offline deletes or deletes of entries created while offline
      const newOperation: PendingOperation = {
        id: `delete_${Date.now()}`,
        type: 'delete',
        entryId: id,
        timestamp: Date.now()
      };

      setPendingOperations(prev => [...prev, newOperation]);

      // Remove from local storage
      const offlineEntries = JSON.parse(localStorage.getItem('journify-offline-entries') || '[]');
      const filteredEntries = offlineEntries.filter((entry: JournalEntry) => entry.id !== id);
      localStorage.setItem('journify-offline-entries', JSON.stringify(filteredEntries));

      return { error: null };
    }

    // If online, delete directly from Supabase
    try {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update last sync time
      const now = Date.now();
      localStorage.setItem('journify-last-sync', now.toString());
      setLastSyncTime(now);

      return { error: null };
    } catch (error) {
      console.error('Error deleting entry:', error);
      return { error: error as Error };
    }
  };

  // Function to fetch entries (combines online and offline data)
  const fetchEntries = async (): Promise<{ data: JournalEntry[]; error: Error | null }> => {
    if (!user) return { data: [], error: new Error('User is not authenticated') };

    try {
      let onlineEntries: JournalEntry[] = [];
      let error = null;

      // If online, fetch from Supabase
      if (isOnline) {
        const { data, error: fetchError } = await supabase
          .from('journal_entries')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchError) {
          error = fetchError;
        } else {
          onlineEntries = data as JournalEntry[];
          
          // Update last sync time
          const now = Date.now();
          localStorage.setItem('journify-last-sync', now.toString());
          setLastSyncTime(now);
          
          // Cache entries for offline use
          localStorage.setItem('journify-cached-entries', JSON.stringify(onlineEntries));
        }
      } else {
        // Use cached entries from last sync if available
        const cachedEntries = localStorage.getItem('journify-cached-entries');
        if (cachedEntries) {
          onlineEntries = JSON.parse(cachedEntries);
        }
      }

      // Get offline entries (created while offline)
      const offlineEntriesStr = localStorage.getItem('journify-offline-entries');
      const offlineEntries = offlineEntriesStr ? JSON.parse(offlineEntriesStr) : [];

      // Combine and deduplicate entries (giving priority to offline changes)
      // const onlineEntriesMap = new Map(onlineEntries.map(entry => [entry.id, entry]));
      // const offlineEntriesMap = new Map(offlineEntries.map((entry: JournalEntry) => [entry.id, entry]));
      // Start with online entries
      const combinedEntries = [...onlineEntries];
      
      // Add or override with offline entries
      offlineEntries.forEach((entry: JournalEntry) => {
        const existingIndex = combinedEntries.findIndex(e => e.id === entry.id);
        if (existingIndex >= 0) {
          combinedEntries[existingIndex] = entry;
        } else {
          combinedEntries.push(entry);
        }
      });
      
      // Sort by creation date (newest first)
      combinedEntries.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return { data: combinedEntries, error };
    } catch (error) {
      console.error('Error fetching entries:', error);
      return { data: [], error: error as Error };
    }
  };

  // Function to sync pending operations when back online
  const syncPendingOperations = async (): Promise<void> => {
    if (!user || !isOnline || pendingOperations.length === 0) return;

    setIsSyncing(true);

    try {
      // Sort operations by timestamp to process in order
      const sortedOperations = [...pendingOperations].sort((a, b) => a.timestamp - b.timestamp);
      const completedOperations: string[] = [];
      const failedOperations: string[] = [];

      // Process each pending operation
      for (const operation of sortedOperations) {
        try {
          if (operation.type === 'create' && operation.data) {
            // Handle create operations
            const { error } = await supabase
              .from('journal_entries')
              .insert([{ ...operation.data, user_id: user.id }]);

            if (error) throw error;
            completedOperations.push(operation.id);

          } else if (operation.type === 'update' && operation.entryId && operation.data) {
            // For temporary entries that need to be created first
            if (operation.entryId.startsWith('temp_')) {
              // Find the corresponding create operation
              const createOp = sortedOperations.find(
                op => op.type === 'create' && op.id === operation.entryId
              );

              if (createOp && createOp.data) {
                // Merge the create and update data
                const mergedData = { ...createOp.data, ...operation.data };
                
                // Insert as new entry instead of update
                const { error } = await supabase
                  .from('journal_entries')
                  .insert([{ ...mergedData, user_id: user.id }]);

                if (error) throw error;
                
                // Mark both operations as completed
                completedOperations.push(operation.id);
                completedOperations.push(createOp.id);
              }
            } else {
              // Regular update
              const { error } = await supabase
                .from('journal_entries')
                .update(operation.data)
                .eq('id', operation.entryId)
                .eq('user_id', user.id);

              if (error) throw error;
              completedOperations.push(operation.id);
            }
          } else if (operation.type === 'delete' && operation.entryId) {
            // Skip deletes of temporary entries that were never created in the database
            if (operation.entryId.startsWith('temp_')) {
              completedOperations.push(operation.id);
              // Also mark the create operation as completed
              const createOp = sortedOperations.find(
                op => op.type === 'create' && op.id === operation.entryId
              );
              if (createOp) completedOperations.push(createOp.id);
            } else {
              // Regular delete
              const { error } = await supabase
                .from('journal_entries')
                .delete()
                .eq('id', operation.entryId)
                .eq('user_id', user.id);

              if (error) throw error;
              completedOperations.push(operation.id);
            }
          }
        } catch (error) {
          console.error(`Error syncing operation ${operation.id}:`, error);
          failedOperations.push(operation.id);
        }
      }

      // Remove completed operations
      setPendingOperations(prev => 
        prev.filter(op => !completedOperations.includes(op.id))
      );

      // Clear offline entries after successful sync
      if (failedOperations.length === 0) {
        localStorage.removeItem('journify-offline-entries');
      }

      // Update last sync time
      const now = Date.now();
      localStorage.setItem('journify-last-sync', now.toString());
      setLastSyncTime(now);

      // Refetch and update cached entries
      const { data } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) {
        localStorage.setItem('journify-cached-entries', JSON.stringify(data));
      }

    } catch (error) {
      console.error('Error during sync:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Manual sync function
  const manualSync = async (): Promise<void> => {
    if (isOnline && user) {
      await syncPendingOperations();
    }
  };

  return {
    isOnline,
    isSyncing,
    lastSyncTime,
    pendingOperationsCount: pendingOperations.length,
    createEntry,
    updateEntry,
    deleteEntry,
    fetchEntries,
    syncPendingOperations: manualSync
  };
}
