import { useState, useEffect } from 'react';
import type { JournalEntry } from '../types/journal';
import { useAuth } from '../contexts/AuthContext';
import { useOfflineSync } from './useOfflineSync';

/**
 * Custom hook for loading journal entries with improved error handling
 */
export function useEntriesLoader() {
  const { user } = useAuth();
  const { fetchEntries, isOnline } = useOfflineSync();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [allEntries, setAllEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [retryCount, setRetryCount] = useState(0);

  // Load entries
  useEffect(() => {
    async function loadEntries() {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);
        
        const { data, error: fetchError } = await fetchEntries();
        
        if (fetchError) {
          console.error('Error fetching journal entries:', fetchError);
          throw new Error(fetchError.message || 'Failed to load entries');
        }
        
        if (!data || data.length === 0) {
          // If we're online and got no data, this might be normal (empty journal)
          // If offline, we might just not have cached data
          setAllEntries([]);
          setEntries([]);
          setAvailableTags([]);
        } else {
          // Store all entries for filtering
          setAllEntries(data);
          setEntries(data);
          
          // Extract all unique tags for filtering
          const tags = new Set<string>();
          data.forEach(entry => {
            if (entry.tags && entry.tags.length > 0) {
              entry.tags.forEach(tag => tags.add(tag));
            }
          });
          setAvailableTags(Array.from(tags).sort());
        }
      } catch (err) {
        console.error('Error in loadEntries:', err);
        const errorMessage = err instanceof Error 
          ? err.message 
          : 'Failed to load your journal entries';
        
        setError(`${errorMessage}. ${!isOnline ? 'You are currently offline.' : 'Please try again later.'}`);
      } finally {
        setLoading(false);
      }
    }

    loadEntries();
  }, [user, fetchEntries, retryCount, isOnline]);

  // Function to retry loading
  const retryLoading = () => {
    setRetryCount(prev => prev + 1);
  };

  return {
    entries,
    allEntries,
    setEntries,
    setAllEntries,
    loading,
    error,
    availableTags,
    retryLoading
  };
}