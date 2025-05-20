import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  Star, Clock, Plus, Calendar, Tag, SortAsc, SortDesc,
  Wifi, WifiOff, RefreshCw, Search, X, Smile, ArchiveX, FilterX
} from 'lucide-react';
import type { JournalEntry } from '../types/journal';
import { useAuth } from '../contexts/AuthContext';
import { useOfflineSync } from '../hooks/useOfflineSync';

export default function Dashboard() {
  const { user } = useAuth();
  const { 
    isOnline, 
    isSyncing, 
    pendingOperationsCount,
    fetchEntries,
    syncPendingOperations
  } = useOfflineSync();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [allEntries, setAllEntries] = useState<JournalEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [filterMood, setFilterMood] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  useEffect(() => {
    async function loadEntries() {
      if (!user) return;

      try {
        const { data, error } = await fetchEntries();
        
        if (error) throw error;
        
        // Store all entries for filtering
        setAllEntries(data);
        
        // Extract all unique tags for filtering
        const tags = new Set<string>();
        data.forEach(entry => {
          if (entry.tags && entry.tags.length > 0) {
            entry.tags.forEach(tag => tags.add(tag));
          }
        });
        setAvailableTags(Array.from(tags).sort());
        
      } catch (error) {
        console.error('Error fetching journal entries:', error);
        setError('Failed to load your journal entries. Please try again later.');
      }
    }

    loadEntries();
  }, [user, fetchEntries]);
  
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
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
    
    return filteredData;
  }, [allEntries, searchQuery, filterMood, filterTag, sortOrder]);
  
  // Update entries whenever filters change
  useEffect(() => {
    setEntries(filteredEntries);
  }, [filteredEntries]);

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
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

  if (entries.length === 0) {
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
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4">
        <div className="relative w-full md:w-96 mb-4 md:mb-0">
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
      </div>
      
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <h1 className="text-3xl font-title font-bold mr-3">Your Journal</h1>
          {/* Online/Offline Status */}
          {isOnline ? (
            <div className="flex items-center text-xs text-green-600 dark:text-green-400">
              <Wifi size={14} className="mr-1" />
              <span>Online</span>
            </div>
          ) : (
            <div className="flex items-center text-xs text-yellow-600 dark:text-yellow-400">
              <WifiOff size={14} className="mr-1" />
              <span>Offline</span>
              {pendingOperationsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                  {pendingOperationsCount}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {/* Sync button */}
          {isOnline && pendingOperationsCount > 0 && (
            <button 
              onClick={() => syncPendingOperations()}
              disabled={isSyncing}
              className="p-2 rounded-md bg-white dark:bg-gray-800 text-primary-700 dark:text-primary-300"
              title="Sync pending changes"
            >
              <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
            </button>
          )}
            <div className="flex items-center">
            <button 
              onClick={toggleSortOrder}
              className="p-2 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 mr-1"
              title={sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}
            >
              {sortOrder === 'desc' ? <SortDesc size={18} /> : <SortAsc size={18} />}
            </button>
          </div>
          <button
            onClick={toggleSortOrder}
            className="p-2 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            aria-label={`Sort by date ${sortOrder === 'desc' ? 'oldest first' : 'newest first'}`}
          >
            {sortOrder === 'desc' ? <SortDesc size={20} /> : <SortAsc size={20} />}
          </button>
          <Link
            to="/entry/new"
            className="btn btn-primary flex items-center"
          >
            <Plus size={16} className="mr-2" />
            <span>New Entry</span>
          </Link>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-4 flex items-center">
          <div className="rounded-full bg-blue-100 dark:bg-blue-900/20 p-3 mr-4">
            <Calendar size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Entries</p>
            <p className="text-2xl font-semibold">{entries.length}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center">
          <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3 mr-4">
            <Star size={20} className="text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Favorites</p>
            <p className="text-2xl font-semibold">
              {entries.filter(entry => entry.is_favorite).length}
            </p>
          </div>
        </div>
        <div className="card p-4 flex items-center">
          <div className="rounded-full bg-purple-100 dark:bg-purple-900/20 p-3 mr-4">
            <Tag size={20} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tags Used</p>
            <p className="text-2xl font-semibold">
              {Array.from(
                new Set(
                  entries.flatMap(entry => entry.tags || [])
                )
              ).length}
            </p>
          </div>
        </div>
        <div className="card p-4 flex items-center">
          <div className="rounded-full bg-amber-100 dark:bg-amber-900/20 p-3 mr-4">
            <Clock size={20} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">This Week</p>
            <p className="text-2xl font-semibold">
              {entries.filter(entry => {
                // Check if entry was created in the last 7 days
                const createdAt = new Date(entry.created_at);
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - createdAt.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 7;
              }).length}
            </p>
          </div>
        </div>      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <div className="mr-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Mood:</span>
        </div>
        
        {['joyful', 'peaceful', 'sad', 'angry', 'anxious'].map((mood) => (
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
        
        {availableTags.length > 0 && (
          <>
            <div className="ml-4 mr-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Tag:</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                  className={`flex items-center px-2 py-1 text-xs rounded-full 
                    ${filterTag === tag 
                      ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </button>
              ))}
            </div>
          </>
        )}
        
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

// Simple SVG placeholder for empty state
function BookPlaceholder({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
    </svg>
  );
}
