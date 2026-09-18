import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  X, 
  Calendar, 
  Tag, 
  Paperclip, 
  Star, 
  Archive, 
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';
import { format } from 'date-fns';
import type { JournalEntry } from '../types/journal';

export interface SearchFilters {
  dateRange: 'all' | 'today' | 'this_week' | 'this_month' | 'this_year';
  mood: string | null;
  tag: string | null;
  wordCountRange: 'all' | 'short' | 'medium' | 'long'; // short: <100, medium: 100-500, long: >500
  hasAttachment: boolean | null; // null: all, true: only attachments
  favoritesOnly: boolean;
  archivedOnly: boolean;
}

const DEFAULT_FILTERS: SearchFilters = {
  dateRange: 'all',
  mood: null,
  tag: null,
  wordCountRange: 'all',
  hasAttachment: null,
  favoritesOnly: false,
  archivedOnly: false,
};

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
  availableTags: string[];
  availableMoods: string[];
}

export default function GlobalSearchModal({
  isOpen,
  onClose,
  entries,
  availableTags,
  availableMoods,
}: GlobalSearchModalProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setFilters(DEFAULT_FILTERS);
      setShowFilterPanel(false);
    }
  }, [isOpen]);

  // Keyboard navigation (Cmd+K / Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // The Multi-Vector Global Search Engine:
  // Evaluates query against: Title, Content, Tags, Mood, Date formatted strings
  const searchResults = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    const now = new Date();

    return entries.filter((entry) => {
      // 1. Text & Vector Matching
      if (normalizedQuery) {
        const titleMatch = entry.title.toLowerCase().includes(normalizedQuery);
        const contentMatch = entry.content.toLowerCase().includes(normalizedQuery);
        const tagMatch = entry.tags?.some((t) => t.toLowerCase().includes(normalizedQuery));
        const moodMatch = entry.mood?.toLowerCase().includes(normalizedQuery);
        
        let dateMatch = false;
        try {
          const formattedDate = format(new Date(entry.created_at), 'MMMM d, yyyy EEEE').toLowerCase();
          dateMatch = formattedDate.includes(normalizedQuery);
        } catch (e) {}

        if (!titleMatch && !contentMatch && !tagMatch && !moodMatch && !dateMatch) {
          return false;
        }
      }

      // 2. Date Filter
      if (filters.dateRange !== 'all') {
        const entryDate = new Date(entry.created_at);
        if (filters.dateRange === 'today') {
          const isToday =
            entryDate.getDate() === now.getDate() &&
            entryDate.getMonth() === now.getMonth() &&
            entryDate.getFullYear() === now.getFullYear();
          if (!isToday) return false;
        } else if (filters.dateRange === 'this_week') {
          const diffDays = (now.getTime() - entryDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 7) return false;
        } else if (filters.dateRange === 'this_month') {
          if (entryDate.getMonth() !== now.getMonth() || entryDate.getFullYear() !== now.getFullYear()) {
            return false;
          }
        } else if (filters.dateRange === 'this_year') {
          if (entryDate.getFullYear() !== now.getFullYear()) return false;
        }
      }

      // 3. Mood Filter
      if (filters.mood && entry.mood !== filters.mood) {
        return false;
      }

      // 4. Tag Filter
      if (filters.tag && (!entry.tags || !entry.tags.includes(filters.tag))) {
        return false;
      }

      // 5. Word Count Filter
      if (filters.wordCountRange !== 'all') {
        const wordCount = entry.content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
        if (filters.wordCountRange === 'short' && wordCount >= 100) return false;
        if (filters.wordCountRange === 'medium' && (wordCount < 100 || wordCount > 500)) return false;
        if (filters.wordCountRange === 'long' && wordCount <= 500) return false;
      }

      // 6. Has Attachment Filter
      if (filters.hasAttachment !== null) {
        const hasImg = (entry.images && entry.images.length > 0) || entry.content.includes('<img');
        if (filters.hasAttachment && !hasImg) return false;
        if (!filters.hasAttachment && hasImg) return false;
      }

      // 7. Favorites Filter
      if (filters.favoritesOnly && !entry.is_favorite) {
        return false;
      }

      // 8. Archived / Privacy Filter (Using is_private as private/archived indicator)
      if (filters.archivedOnly && !entry.is_private) {
        return false;
      }

      return true;
    });
  }, [entries, query, filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.dateRange !== 'all') count++;
    if (filters.mood) count++;
    if (filters.tag) count++;
    if (filters.wordCountRange !== 'all') count++;
    if (filters.hasAttachment !== null) count++;
    if (filters.favoritesOnly) count++;
    if (filters.archivedOnly) count++;
    return count;
  }, [filters]);

  const handleSelectEntry = (id: string) => {
    onClose();
    navigate(`/entry/${id}`);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar Input */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-gray-100 dark:border-gray-800">
          <Search size={18} className="text-gray-400 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across titles, thoughts, moods, dates, tags..."
            className="flex-1 text-sm bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 mr-1"
            >
              <X size={15} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
              showFilterPanel || activeFilterCount > 0
                ? 'bg-black text-white dark:bg-white dark:text-black border-transparent'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800'
            }`}
          >
            <SlidersHorizontal size={13} className="mr-1.5" />
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
        </div>

        {/* Expandable Power Filter Panel */}
        {showFilterPanel && (
          <div className="p-4 bg-gray-50/70 dark:bg-neutral-950/70 border-b border-gray-100 dark:border-gray-800 text-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Advanced Filters</span>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                  className="text-red-500 hover:text-red-600 flex items-center text-[11px]"
                >
                  <RotateCcw size={11} className="mr-1" /> Reset all
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Date Filter */}
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Date Period</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as any })}
                  className="w-full p-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-200"
                >
                  <option value="all">Any time</option>
                  <option value="today">Today</option>
                  <option value="this_week">Past 7 days</option>
                  <option value="this_month">This month</option>
                  <option value="this_year">This year</option>
                </select>
              </div>

              {/* Mood Filter */}
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Mood</label>
                <select
                  value={filters.mood || ''}
                  onChange={(e) => setFilters({ ...filters, mood: e.target.value || null })}
                  className="w-full p-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-200"
                >
                  <option value="">Any mood</option>
                  {availableMoods.map((m) => (
                    <option key={m} value={m}>
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tag Filter */}
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Tag</label>
                <select
                  value={filters.tag || ''}
                  onChange={(e) => setFilters({ ...filters, tag: e.target.value || null })}
                  className="w-full p-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-200"
                >
                  <option value="">Any tag</option>
                  {availableTags.map((t) => (
                    <option key={t} value={t}>
                      #{t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Word Count */}
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Word Count</label>
                <select
                  value={filters.wordCountRange}
                  onChange={(e) => setFilters({ ...filters, wordCountRange: e.target.value as any })}
                  className="w-full p-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-200"
                >
                  <option value="all">Any length</option>
                  <option value="short">Short (&lt; 100 words)</option>
                  <option value="medium">Medium (100–500)</option>
                  <option value="long">Long (&gt; 500 words)</option>
                </select>
              </div>
            </div>

            {/* Quick toggles */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <label className="flex items-center cursor-pointer select-none text-[11px] text-gray-600 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={filters.favoritesOnly}
                  onChange={(e) => setFilters({ ...filters, favoritesOnly: e.target.checked })}
                  className="h-3 w-3 mr-1.5 rounded border-gray-300"
                />
                <Star size={12} className="mr-1 text-amber-500 fill-amber-500" /> Favorites Only
              </label>

              <label className="flex items-center cursor-pointer select-none text-[11px] text-gray-600 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={filters.hasAttachment === true}
                  onChange={(e) => setFilters({ ...filters, hasAttachment: e.target.checked ? true : null })}
                  className="h-3 w-3 mr-1.5 rounded border-gray-300"
                />
                <Paperclip size={12} className="mr-1" /> Has Attachments
              </label>

              <label className="flex items-center cursor-pointer select-none text-[11px] text-gray-600 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={filters.archivedOnly}
                  onChange={(e) => setFilters({ ...filters, archivedOnly: e.target.checked })}
                  className="h-3 w-3 mr-1.5 rounded border-gray-300"
                />
                <Archive size={12} className="mr-1" /> Private / Archived
              </label>
            </div>
          </div>
        )}

        {/* Results Stream */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-gray-100 dark:divide-gray-800/60">
          {searchResults.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Search size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-xs">No entries match your search criteria.</p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Try searching for words like "college", "interview", "happy", or "AI project".
              </p>
            </div>
          ) : (
            searchResults.map((entry) => {
              const plainText = entry.content.replace(/<[^>]*>/g, ' ').slice(0, 160);
              const formattedDate = format(new Date(entry.created_at), 'MMM d, yyyy');

              return (
                <div
                  key={entry.id}
                  onClick={() => handleSelectEntry(entry.id)}
                  className="p-3.5 rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-800/80 cursor-pointer transition flex items-start justify-between gap-4 group"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {entry.title || 'Untitled Entry'}
                      </h4>
                      {entry.is_favorite && (
                        <Star size={12} className="text-amber-500 fill-amber-500 flex-shrink-0" />
                      )}
                      {entry.mood && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                          {entry.mood}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                      {plainText}
                    </p>

                    <div className="flex items-center space-x-3 text-[10px] text-gray-400 pt-1">
                      <span className="flex items-center">
                        <Calendar size={11} className="mr-1" /> {formattedDate}
                      </span>
                      {entry.tags && entry.tags.length > 0 && (
                        <span className="flex items-center space-x-1">
                          <Tag size={10} className="mr-0.5" />
                          {entry.tags.slice(0, 3).map((t) => (
                            <span key={t}>#{t}</span>
                          ))}
                        </span>
                      )}
                      {((entry.images && entry.images.length > 0) || entry.content.includes('<img')) && (
                        <span className="flex items-center text-emerald-600 dark:text-emerald-400">
                          <Paperclip size={10} className="mr-0.5" /> Media
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-gray-50 dark:bg-neutral-950 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-400">
          <span>
            Found <span className="font-semibold text-gray-700 dark:text-gray-300">{searchResults.length}</span> results
          </span>
          <div className="flex items-center space-x-2">
            <span>Press <kbd className="px-1 py-0.5 rounded bg-gray-200 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 font-mono text-[10px]">ESC</kbd> to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
