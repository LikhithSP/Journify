import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  Plus, Search, X, Calendar as CalendarIcon, Mic,
  LayoutGrid, List as ListIcon, ChevronDown, CheckCircle2,
  Smile, Tag, FilterX, ArchiveX
} from 'lucide-react';
import type { JournalEntry } from '../types/journal';
import { useAuth } from '../contexts/AuthContext';
import { SyncEngine } from '../services/syncEngine';
import { OfflineDB } from '../services/offlineDB';
import EmptyState from '../components/EmptyState';
import NotionCard from '../components/NotionCard';
import VoiceJournalModal from '../components/VoiceJournalModal';
import { DraftService } from '../services/draftService';
import { useNavigate, useOutletContext } from 'react-router-dom';

const PAGE_SIZE = 9; // Paginate entries in chunks of 9

// Add prop to pass drag state setter to NotionCard
export default function Dashboard({ setDraggedJournalId: propSetDraggedJournalId }: { setDraggedJournalId?: (id: string | null) => void } = {}) {
  const outletCtx = useOutletContext<{ setDraggedJournalId?: (id: string | null) => void }>() || {};
  const setDraggedJournalId = propSetDraggedJournalId || outletCtx.setDraggedJournalId;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [allEntries, setAllEntries] = useState<JournalEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filterMood, setFilterMood] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const [infiniteScrollEnabled, setInfiniteScrollEnabled] = useState<boolean>(true);
  const location = useLocation();
  const lastFetchRef = useRef(0);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadEntries() {
      if (!user) return;
      const now = Date.now();
      if (now - lastFetchRef.current < 10) return;
      lastFetchRef.current = now;
      setLoading(true);
      try {
        // Pull entries via SyncEngine: serves from Supabase if online, IndexedDB if offline
        const journalEntries = await SyncEngine.pullServerEntries(user.id);
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
        // Secondary fallback to IndexedDB
        try {
          const offlineEntries = await OfflineDB.getAllEntries(user.id);
          setAllEntries(offlineEntries);
        } catch (e) {
          setError('Failed to load your journal entries. Please try again later.');
        }
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
    
    // Apply search query filter across title, content, tags, mood, and formatted date
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredData = filteredData.filter(entry => {
        const titleMatch = entry.title.toLowerCase().includes(query);
        const contentMatch = entry.content.toLowerCase().includes(query);
        const tagMatch = entry.tags && entry.tags.some(tag => tag.toLowerCase().includes(query));
        const moodMatch = entry.mood && entry.mood.toLowerCase().includes(query);
        let dateMatch = false;
        try {
          const dateStr = format(new Date(entry.created_at), 'MMMM d, yyyy EEEE').toLowerCase();
          dateMatch = dateStr.includes(query);
        } catch (e) {}
        return titleMatch || contentMatch || tagMatch || moodMatch || dateMatch;
      });
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
  
  // Sliced paginated entries for high performance rendering
  const paginatedEntries = useMemo(() => {
    return filteredEntries.slice(0, visibleCount);
  }, [filteredEntries, visibleCount]);

  const hasMore = visibleCount < filteredEntries.length;

  // Load next chunk
  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredEntries.length));
  }, [filteredEntries.length]);

  // Reset pagination when search or filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, filterMood, filterTag]);

  // IntersectionObserver for seamless Infinite Scrolling
  useEffect(() => {
    if (!infiniteScrollEnabled || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          handleLoadMore();
        }
      },
      { root: null, rootMargin: '250px', threshold: 0.1 }
    );

    const target = loadMoreSentinelRef.current;
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [infiniteScrollEnabled, hasMore, handleLoadMore]);

  // Animation variants for list items
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04
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

  if (!loading && allEntries.length === 0) {
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
    <div className="max-w-5xl mx-auto px-2 min-h-screen dark:bg-[rgb(23,23,23)] bg-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 py-4 border-b border-gray-200 dark:border-gray-800 gap-4">
        <h1 className="notion-page-title text-4xl font-semibold text-gray-800 dark:text-gray-100">My Journals</h1>
        <div className="flex items-center space-x-3 flex-wrap gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-neutral-800 rounded-md p-0.5 border border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-neutral-700 text-black dark:text-white shadow-xs'
                  : 'text-gray-500 hover:text-black dark:hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-neutral-700 text-black dark:text-white shadow-xs'
                  : 'text-gray-500 hover:text-black dark:hover:text-white'
              }`}
              title="List View"
            >
              <ListIcon size={14} />
            </button>
          </div>

          <button
            onClick={() => setVoiceModalOpen(true)}
            className="notion-button flex items-center bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 px-3 py-1.5 rounded-md text-sm font-medium transition"
            title="Record Voice Journal"
          >
            <Mic size={14} className="mr-1.5 animate-pulse" />
            <span>Voice Journal</span>
          </button>

          <Link
            to="/calendar"
            className="notion-button flex items-center bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-gray-200 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-neutral-700 transition"
          >
            <CalendarIcon size={14} className="mr-1.5" />
            <span>Calendar & Timeline</span>
          </Link>

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
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-8 flex-wrap dark:bg-[rgb(23,23,23)]">
        <div className="relative flex-grow max-w-lg mb-2 md:mb-0">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entries..."
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-100 dark:bg-[rgb(23,23,23)] border-none rounded-md focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 focus:bg-white dark:focus:bg-[rgb(23,23,23)] transition-all text-gray-900 dark:text-gray-100"
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
                  ? 'bg-gray-200 dark:bg-[rgb(23,23,23)] text-gray-800 dark:text-gray-100 font-medium' 
                  : 'bg-gray-100 dark:bg-[rgb(23,23,23)] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[rgb(23,23,23)]'
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
                  ? 'bg-gray-200 dark:bg-[rgb(23,23,23)] text-gray-800 dark:text-gray-100 font-medium' 
                  : 'bg-gray-100 dark:bg-[rgb(23,23,23)] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[rgb(23,23,23)]'
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
            className="flex items-center px-3 py-1 text-xs rounded-full bg-red-50 dark:bg-[rgb(23,23,23)] text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-[rgb(23,23,23)] transition-colors"
          >
            <FilterX className="h-3 w-3 mr-1.5" />
            Clear all
          </button>
        )}
      </div>
      {/* No results message */}
      {filteredEntries.length === 0 && (filterMood || filterTag || searchQuery) && (
        <div className="flex flex-col items-center justify-center py-16 text-center dark:bg-[rgb(23,23,23)]">
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
      {/* Journal Entries List (Paginated & Infinite Scrolling) */}
      {paginatedEntries.length > 0 && (
        <div className="space-y-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 dark:bg-[rgb(23,23,23)]'
                : 'flex flex-col space-y-3 dark:bg-[rgb(23,23,23)]'
            }
          >
            {paginatedEntries.map((entry) => (
              <motion.div key={entry.id} variants={itemVariants}>
                <NotionCard
                  entry={entry}
                  viewType={viewMode}
                  draggable
                  onDragStart={() => setDraggedJournalId && setDraggedJournalId(entry.id)}
                  onDragEnd={() => setDraggedJournalId && setDraggedJournalId(null)}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Pagination & Infinite Scrolling Sentinel */}
          <div className="py-6 flex flex-col items-center justify-center space-y-3">
            {hasMore ? (
              <>
                <div ref={loadMoreSentinelRef} className="h-4 w-full" />
                <button
                  type="button"
                  onClick={handleLoadMore}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-700 text-xs font-semibold text-gray-800 dark:text-gray-200 transition shadow-xs"
                >
                  <span>Load more entries</span>
                  <ChevronDown size={14} />
                </button>
                <div className="flex items-center space-x-2 text-[11px] text-gray-400">
                  <span>Showing {paginatedEntries.length} of {filteredEntries.length} entries</span>
                  <span>•</span>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={infiniteScrollEnabled}
                      onChange={(e) => setInfiniteScrollEnabled(e.target.checked)}
                      className="h-3 w-3 rounded text-black dark:text-white mr-1"
                    />
                    <span>Auto-scroll</span>
                  </label>
                </div>
              </>
            ) : filteredEntries.length > PAGE_SIZE ? (
              <div className="flex items-center space-x-1.5 text-xs text-gray-400 py-4">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span>All {filteredEntries.length} entries loaded</span>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Voice Journaling Modal */}
      <VoiceJournalModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onApplyToEditor={(voiceData) => {
          // Pre-save draft in DraftService so NewEntryPage loads it directly
          DraftService.saveDraft('new', {
            title: voiceData.title || '',
            content: voiceData.contentHtml || '<p></p>',
            mood: voiceData.mood || null,
            tags: voiceData.tags || [],
          });
          navigate('/entry/new');
        }}
      />
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
