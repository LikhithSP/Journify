import { useState, useEffect } from 'react';
import type { JournalEntry } from '../types/journal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

/**
 * Custom hook for loading journal entries with improved error handling
 */
export function useEntriesLoader() {
  const { user } = useAuth();
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
        
        const { data, error: fetchError } = await supabase
          .from('journal_entries')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        
        if (!data || data.length === 0) {
          setAllEntries([]);
          setEntries([]);
          setAvailableTags([]);
        } else {
          setAllEntries(data);
          setEntries(data);
          
          const tags = new Set<string>();
          data.forEach((entry: any) => {
            if (entry.tags && entry.tags.length > 0) {
              entry.tags.forEach((tag: string) => tags.add(tag));
            }
          });
          setAvailableTags(Array.from(tags).sort());
        }
      } catch (err) {
        setError('Failed to load your journal entries. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadEntries();
  }, [user, retryCount]);

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