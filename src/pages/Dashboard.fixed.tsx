import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  Star, Plus, Calendar, Tag, ArchiveX, FilterX, Smile, Wifi, WifiOff, RefreshCw, Search, X
} from 'lucide-react';
import type { JournalEntry } from '../types/journal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const { user } = useAuth();
  
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [allEntries, setAllEntries] = useState<JournalEntry[]>([]);
  const [filterMood, setFilterMood] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEntries() {
      if (!user) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('journal_entries')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const journalEntries = data as JournalEntry[];
        setAllEntries(journalEntries);
        
        // Extract all unique tags for filtering
        const tags = new Set<string>();
        journalEntries.forEach(entry => {
          if (entry.tags && entry.tags.length > 0) {
            entry.tags.forEach((tag: string) => tags.add(tag));
          }
        });
        setAvailableTags(Array.from(tags).sort());
        
      } catch (error) {
        console.error('Error fetching journal entries:', error);
      } finally {
        setLoading(false);
      }
    }

    loadEntries();
  }, [user]);
  
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
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="animate-pulse-slow">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your journal...</p>
      </div>
    );
  }

  if (allEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <div className="text-primary-500 mb-4">
          <BookPlaceholder className="w-24 h-24" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Your journal is empty</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">
          Start documenting your thoughts, ideas, and memorable moments
        </p>
        <Link to="/entry/new" className="btn btn-primary inline-flex items-center">
          <Plus size={18} className="mr-2" />
          Create Your First Entry
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 py-4 border-b border-gray-200 dark:border-gray-800 gap-4">
        <h1 className="text-3xl font-title font-bold mr-3">Your Journal</h1>
        <div className="flex items-center space-x-3 flex-wrap gap-2">
          {/* Online/Offline Status */}
          {true ? (
            <div className="flex items-center text-xs text-green-600 dark:text-green-400">
              <Wifi size={14} className="mr-1" />
              <span>Online</span>
            </div>
          ) : (
            <div className="flex items-center text-xs text-yellow-600 dark:text-yellow-400">
              <WifiOff size={14} className="mr-1" />
              <span>Offline</span>
              {0 > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                  {0}
                </span>
              )}
            </div>
          )}
          {/* Sync button */}
          {true && 0 > 0 && (
            <button 
              onClick={() => {}}
              disabled={false}
              className="p-2 rounded-md bg-white dark:bg-gray-800 text-primary-700 dark:text-primary-300"
              title="Sync pending changes"
            >
              <RefreshCw size={18} className={false ? "animate-spin" : ""} />
            </button>
          )}
          <div className="flex items-center">
          </div>
          <Link
            to="/entry/new"
            className="btn btn-primary flex items-center"
          >
            <Plus size={16} className="mr-2" />
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
            className="input w-full pl-10"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        {/* Mood filters */}
        <div className="flex flex-wrap gap-2">
          {availableMoods.map((mood) => (
            <button
              key={mood}
              onClick={() => setFilterMood(filterMood === mood ? null : mood)}
              className={`flex items-center px-2 py-1 text-xs rounded-full 
                ${filterMood === mood 
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 border border-primary-300 dark:border-primary-700' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
            >
              <Smile className="h-3 w-3 mr-1" />
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
              className={`flex items-center px-2 py-1 text-xs rounded-full ${
                filterTag === tag 
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Tag className="h-3 w-3 mr-1" />
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
            className="flex items-center ml-2 px-2 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
          >
            <FilterX className="h-3 w-3 mr-1" />
            Clear all filters
          </button>
        )}
      </div>
      {/* No results message */}
      {entries.length === 0 && (filterMood || filterTag || searchQuery) && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-gray-400 mb-4">
            <ArchiveX size={48} />
          </div>
          <h3 className="text-xl font-medium mb-2">No matching entries found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4 text-center max-w-md">
            Try adjusting your search or filters to find what you're looking for.
          </p>
          <button 
            onClick={() => {
              setFilterMood(null);
              setFilterTag(null);
              setSearchQuery('');
            }}
            className="btn btn-primary"
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
          className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        >
          {entries.map((entry) => (
            <motion.div key={entry.id} variants={itemVariants} className="card">
              <Link to={`/entry/${entry.id}`} className="block">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold line-clamp-1">{entry.title}</h3>
                    {entry.is_favorite && (
                      <Star size={16} className="text-amber-500 fill-amber-500" />
                    )}
                  </div>
                  <div className="prose prose-sm dark:prose-invert line-clamp-3 mb-4 text-gray-600 dark:text-gray-300">
                    {/* This would ideally be a sanitized HTML preview of the content */}
                    {entry.content.replace(/<[^>]*>/g, '').substring(0, 150)}
                    {entry.content.length > 150 ? '...' : ''}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Calendar size={14} className="mr-1" />
                      <span>{format(new Date(entry.created_at), 'MMM d, yyyy')}</span>
                    </div>
                    {entry.mood && (
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        entry.mood === 'joyful' ? 'bg-mood-joyful/10 text-mood-joyful' :
                        entry.mood === 'peaceful' ? 'bg-mood-peaceful/10 text-mood-peaceful' :
                        entry.mood === 'sad' ? 'bg-mood-sad/10 text-mood-sad' :
                        entry.mood === 'angry' ? 'bg-mood-angry/10 text-mood-angry' :
                        'bg-mood-anxious/10 text-mood-anxious'
                      }`}>
                        {entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

// Add BookPlaceholder definition for empty state
function BookPlaceholder({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
    </svg>
  );
}
