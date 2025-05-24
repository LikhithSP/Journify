import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, Tag, Search, X, Smile, ArchiveX, FilterX
} from 'lucide-react';
import type { JournalEntry } from '../types/journal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import EmptyState from '../components/EmptyState';
import NotionCard from '../components/NotionCard';

export default function Dashboard() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [allEntries, setAllEntries] = useState<JournalEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filterMood, setFilterMood] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const lastFetchRef = useRef(0);

  useEffect(() => {
    async function loadEntries() {
      if (!user) return;
      const now = Date.now();
      // Only allow fetch if at least 10ms passed since last fetch
      if (now - lastFetchRef.current < 10) return;
      lastFetchRef.current = now;
      setLoading(true);
      try {
        // Direct Supabase API call to fetch entries
        const { data, error } = await supabase
          .from('journal_entries')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        const journalEntries = data as JournalEntry[];
        setAllEntries(journalEntries);
        const tags = new Set<string>();
        journalEntries.forEach(entry => {
          if (entry.tags && entry.tags.length > 0) {
            entry.tags.forEach((tag: string) => tags.add(tag));
          }
        });
        setAvailableTags(Array.from(tags).sort());
        setError(null);
      } catch (error) {
        console.error('Error fetching journal entries:', error);
        setError('Failed to load your journal entries. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadEntries();
  }, [user, location.key]);
  
  // Compute available moods from allEntries
  const availableMoods = useMemo(() => {
    const moods = new Set<string>();
    allEntries.forEach(entry => {
      if (entry.mood) moods.add(entry.mood);
    });
    return Array.from(moods);
  }, [allEntries]);
  
  // Filter and sort entries based on filters
  const filteredEntries = useMemo(() => {
    let filteredData = [...allEntries];
    
    // Apply search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredData = filteredData.filter(entry => 
        entry.title.toLowerCase().includes(query) || 
        entry.content.toLowerCase().includes(query) ||
        (entry.tags && entry.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }
    
    // Apply mood filter
    if (filterMood) {
      filteredData = filteredData.filter(entry => entry.mood === filterMood);
    }
    
    // Apply tag filter
    if (filterTag) {
      filteredData = filteredData.filter(entry => 
        entry.tags && entry.tags.includes(filterTag)
      );
    }
    
    // Apply sorting
    filteredData.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });
    
    return filteredData;
  }, [allEntries, searchQuery, filterMood, filterTag]);
  
  // Update entries whenever filters change
  useEffect(() => {
    setEntries(filteredEntries);
  }, [filteredEntries]);

  // Animation variants for list items
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 5 },
    visible: { opacity: 1, y: 0 }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-10">
        <div className="text-red-600 dark:text-red-400 mb-4">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-lg font-medium mb-2">Oops! Something went wrong</p>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="btn btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!loading && entries.length === 0) {
    return (
      <EmptyState 
        title="Your journal is empty"
        description="Start documenting your thoughts, ideas, and memorable moments"
        ctaText="Create your first entry"
        ctaLink="/entry/new"
        icon={<BookPlaceholder className="w-20 h-20" />}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 py-4 border-b border-gray-200 dark:border-gray-800 gap-4">
        <h1 className="notion-page-title text-4xl font-semibold text-gray-800 dark:text-gray-100">Journal</h1>
        <div className="flex items-center space-x-3 flex-wrap gap-2">
          <Link
            to="/entry/new"
            className="notion-button flex items-center bg-black text-white dark:bg-white dark:text-black px-4 py-1.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={14} className="mr-1.5" />
            <span>New Entry</span>
          </Link>
        </div>
      </div>
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-8 flex-wrap">
        <div className="relative flex-grow max-w-lg mb-2 md:mb-0">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entries..."
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 border-none rounded-md focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 focus:bg-white dark:focus:bg-gray-700 transition-all"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="h-4 w-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
            </button>
          )}
        </div>
        {/* Mood filters */}
        <div className="flex flex-wrap gap-2">
          {availableMoods.map((mood) => (
            <button
              key={mood}
              onClick={() => setFilterMood(filterMood === mood ? null : mood)}
              className={`flex items-center px-3 py-1 text-xs rounded-full transition-colors ${
                filterMood === mood 
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium' 
                  : 'bg-gray-100 dark:bg-gray-800/70 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Smile className="h-3 w-3 mr-1.5" />
              {mood.charAt(0).toUpperCase() + mood.slice(1)}
            </button>
          ))}
        </div>
        {/* Tag filters */}
        <div className="flex flex-wrap gap-2">
          {availableTags.length > 0 && availableTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setFilterTag(filterTag === tag ? null : tag)}
              className={`flex items-center px-3 py-1 text-xs rounded-full transition-colors ${
                filterTag === tag 
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium' 
                  : 'bg-gray-100 dark:bg-gray-800/70 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Tag className="h-3 w-3 mr-1.5" />
              {tag}
            </button>
          ))}
        </div>
        {/* Clear filters */}
        {(filterMood || filterTag || searchQuery) && (
          <button
            onClick={() => {
              setFilterMood(null);
              setFilterTag(null);
              setSearchQuery('');
            }}
            className="flex items-center px-3 py-1 text-xs rounded-full bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <FilterX className="h-3 w-3 mr-1.5" />
            Clear all
          </button>
        )}
      </div>
      {/* No results message */}
      {entries.length === 0 && (filterMood || filterTag || searchQuery) && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-gray-300 dark:text-gray-600 mb-6">
            <ArchiveX size={40} />
          </div>
          <h3 className="text-xl font-medium mb-3 text-gray-800 dark:text-gray-200">No matching entries found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
            Try adjusting your search or filters to find what you're looking for.
          </p>
          <button 
            onClick={() => {
              setFilterMood(null);
              setFilterTag(null);
              setSearchQuery('');
            }}
            className="px-4 py-1.5 rounded-md bg-black text-white dark:bg-white dark:text-black text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Clear filters
          </button>
        </div>
      )}
      {/* Journal Entries List */}
      {entries.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col space-y-3"
        >
          {entries.map((entry) => (
            <motion.div key={entry.id} variants={itemVariants}>
              <NotionCard entry={entry} viewType="list" />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

// Simple SVG placeholder for empty state
function BookPlaceholder({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
    </svg>
  );
}
