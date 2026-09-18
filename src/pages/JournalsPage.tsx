import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, isToday, isYesterday } from 'date-fns';
import { BookOpen, Clock, Sparkles, Image as ImageIcon, ArrowUpRight, Search, X, Calendar } from 'lucide-react';
import type { JournalEntry } from '../types/journal';
import { useAuth } from '../contexts/AuthContext';
import { SyncEngine } from '../services/syncEngine';
import { OfflineDB } from '../services/offlineDB';

// ─── Helpers & Constants ──────────────────────────────────────────────────────

const TOP_JOURNAL_BANNER_GIF = 'https://i.pinimg.com/originals/0a/ac/a8/0aaca86b5e95ebc6f06ebf60937b026d.gif';

const MOOD_MAP: Record<string, { bg: string; text: string; emoji: string; border: string }> = {
  joyful:   { bg: 'bg-amber-50 dark:bg-amber-950/30',   text: 'text-amber-700 dark:text-amber-300',   emoji: '😊', border: 'border-amber-200 dark:border-amber-900/50' },
  peaceful: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-300', emoji: '😌', border: 'border-emerald-200 dark:border-emerald-900/50' },
  sad:      { bg: 'bg-sky-50 dark:bg-sky-950/30',         text: 'text-sky-700 dark:text-sky-300',         emoji: '😔', border: 'border-sky-200 dark:border-sky-900/50' },
  angry:    { bg: 'bg-rose-50 dark:bg-rose-950/30',       text: 'text-rose-700 dark:text-rose-300',       emoji: '😠', border: 'border-rose-200 dark:border-rose-900/50' },
  anxious:  { bg: 'bg-violet-50 dark:bg-violet-950/30',   text: 'text-violet-700 dark:text-violet-300',   emoji: '😰', border: 'border-violet-200 dark:border-violet-900/50' },
};

function formatEntryDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d, yyyy');
}

function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Extracts first image URL from images array or embedded <img> in HTML content
 */
function extractFirstImage(entry: JournalEntry): string | null {
  if (entry.images && Array.isArray(entry.images) && entry.images.length > 0 && entry.images[0]) {
    return entry.images[0];
  }
  if (entry.content) {
    const match = /<img[^>]+src=["']([^"']+)["']/i.exec(entry.content);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

// ─── Uneven Multi-Column Masonry Journal Grid ─────────────────────────────────

function MasonryGrid({
  entries,
  searchQuery,
  onSearchChange,
  onSelect,
}: {
  entries: JournalEntry[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Subheading + Rounded Search Bar Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200/80 dark:border-neutral-800">
        {/* Left: Section Subheading */}
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-gray-400 dark:text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
            All Entries
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#222] text-gray-600 dark:text-gray-400 font-mono">
            {entries.length}
          </span>
        </div>

        {/* Right: Rounded Search Bar next to Subheading */}
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search entries by title, notes, tags..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-850/90 border border-neutral-200 dark:border-neutral-700/80 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-500 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Round-Robin Masonry Columns: Ensures entries flow left-to-right across columns so the next oldest appears right next to each other, not stacked below */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
        {[0, 1, 2].map((colIndex) => {
          // Filter entries for this specific column: round-robin distribution (0, 3, 6... for col 0; 1, 4, 7... for col 1; 2, 5, 8... for col 2)
          const columnEntries = entries.filter((_, i) => i % 3 === colIndex);

          return (
            <div key={colIndex} className="flex flex-col gap-4">
              {columnEntries.map((entry) => {
                const globalIndex = entries.findIndex((e) => e.id === entry.id);
                const mood = entry.mood ? MOOD_MAP[entry.mood] : null;
                const excerpt = stripHtml(entry.content);
                const words = excerpt ? excerpt.split(' ').filter(Boolean).length : 0;
                const attachedImage = extractFirstImage(entry);

                // Organic uneven height variations based on content & image
                const isFeatured = globalIndex % 5 === 0 && !attachedImage;

                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(globalIndex * 0.03, 0.3) }}
                  >
                    <div
                      onClick={() => onSelect(entry.id)}
                      className="group relative rounded-2xl overflow-hidden cursor-pointer flex flex-col justify-between
                        bg-white dark:bg-[#1a1a1c]
                        border border-neutral-200/90 dark:border-neutral-800/90
                        hover:border-neutral-400 dark:hover:border-neutral-600
                        shadow-xs hover:shadow-xl dark:hover:shadow-black/40 transition-all duration-300"
                    >
                      {/* Attached or Embedded Image Preview */}
                      {attachedImage && (
                        <div className="relative w-full h-44 sm:h-48 overflow-hidden bg-neutral-100 dark:bg-neutral-850 border-b border-neutral-100 dark:border-neutral-800/80">
                          <img
                            src={attachedImage}
                            alt={entry.title || 'Journal attachment'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                            loading="lazy"
                          />
                        </div>
                      )}

                      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                        <div>
                          {/* Card Top Row: Date + Mood */}
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 font-mono tracking-tight">
                              {formatEntryDate(entry.created_at)}
                            </span>
                            {mood ? (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] flex items-center gap-1 font-medium ${mood.bg} ${mood.text} border ${mood.border} shadow-2xs`}
                              >
                                <span>{mood.emoji}</span>
                                <span className="capitalize text-[10px]">{entry.mood}</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-neutral-400 font-mono flex items-center gap-1">
                                <Clock size={10} />
                                {words}w
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-base leading-snug mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {entry.title || 'Untitled'}
                          </h3>

                          {/* Excerpt Body: Uneven line clamping based on content and image presence */}
                          {excerpt ? (
                            <p className={`text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-normal ${
                              attachedImage 
                                ? 'line-clamp-2' 
                                : isFeatured 
                                ? 'line-clamp-6 text-sm' 
                                : 'line-clamp-4'
                            }`}>
                              {excerpt}
                            </p>
                          ) : (
                            <p className="text-xs italic text-neutral-300 dark:text-neutral-600">
                              Empty entry
                            </p>
                          )}
                        </div>

                        {/* Card Bottom: Tags and Footer */}
                        <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
                          <div className="flex flex-wrap gap-1 items-center overflow-hidden">
                            {entry.tags && entry.tags.length > 0 ? (
                              entry.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[10px] text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded font-mono"
                                >
                                  #{tag}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
                                {words} words
                              </span>
                            )}
                          </div>

                          <ArrowUpRight
                            size={14}
                            className="text-neutral-400 group-hover:text-black dark:group-hover:text-white transition-colors flex-shrink-0 ml-2"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component: JournalsPage ───────────────────────────────────────────

export default function JournalsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get('tab') === 'favorites' ? 'favorites' : 'all';

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);
      try {
        const data = await SyncEngine.pullServerEntries(user.id);
        setEntries(data);
      } catch {
        try {
          const local = await OfflineDB.getAllEntries(user.id);
          setEntries(local);
        } catch { /* silently fail */ }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, location.key]);

  const sortedEntries = entries
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const favoriteEntries = sortedEntries.filter((e) => e.is_favorite);
  const baseEntries = activeTab === 'favorites' ? favoriteEntries : sortedEntries;

  // Filter based on the sub-heading search query
  const displayedEntries = searchQuery.trim()
    ? baseEntries.filter((e) => {
        const query = searchQuery.toLowerCase();
        const titleMatch = e.title?.toLowerCase().includes(query);
        const contentMatch = stripHtml(e.content || '').toLowerCase().includes(query);
        const tagMatch = e.tags?.some((t) => t.toLowerCase().includes(query));
        const moodMatch = e.mood?.toLowerCase().includes(query);
        return titleMatch || contentMatch || tagMatch || moodMatch;
      })
    : baseEntries;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-600 animate-ping" />
        <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono">Loading journals...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 select-none pt-14 lg:pt-0">
      
      {/* ── Top Atmospheric Banner GIF (Clean Professional Fade) ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative w-full h-44 sm:h-56 md:h-64 rounded-3xl overflow-hidden border border-neutral-200/80 dark:border-neutral-800 shadow-sm"
      >
        <img
          src={TOP_JOURNAL_BANNER_GIF}
          alt="Journal sanctuary atmosphere"
          className="w-full h-full object-cover object-center"
        />
        {/* Artistic Gradient Overlay for Clean Text Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end p-6 sm:p-8">
          <div className="flex items-center gap-2 text-white/80 text-xs font-semibold tracking-wider uppercase mb-1">
            <Sparkles size={14} className="text-amber-400" />
            <span>Journal Vault & Archive</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {activeTab === 'favorites' ? 'Favorite Reflections' : 'All Journals & Reflections'}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-200/90 mt-1 max-w-xl font-normal">
            {activeTab === 'favorites'
              ? 'Your cherished starred entries and most precious moments collected together.'
              : 'Your sacred sanctuary of continuous thoughts, moments, and attached memories preserved across time.'}
          </p>
        </div>
      </motion.div>

      {/* ── Tab Switcher Filter ── */}
      <div className="flex items-center justify-between gap-3 border-b border-neutral-200/80 dark:border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/journals')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <BookOpen size={14} />
            <span>All Journals</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeTab === 'all' ? 'bg-white/20 dark:bg-black/20' : 'bg-neutral-200 dark:bg-neutral-800'
            }`}>
              {sortedEntries.length}
            </span>
          </button>

          <button
            onClick={() => navigate('/journals?tab=favorites')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'favorites'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <span className="text-amber-400">★</span>
            <span>Favorites</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeTab === 'favorites' ? 'bg-white/20' : 'bg-neutral-200 dark:bg-neutral-800'
            }`}>
              {favoriteEntries.length}
            </span>
          </button>
        </div>
      </div>

      {/* ── Uneven Multi-Column Masonry Journal Grid ── */}
      {baseEntries.length > 0 ? (
        displayedEntries.length > 0 ? (
          <MasonryGrid
            entries={displayedEntries}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelect={(id) => navigate(`/entry/${id}`)}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-gray-400 dark:text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                  All Entries
                </h2>
              </div>
              <div className="relative w-full sm:w-72">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search entries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-850/90 border border-neutral-200 dark:border-neutral-700/80 text-xs text-neutral-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                >
                  <X size={13} />
                </button>
              </div>
            </div>
            <div className="text-center py-16 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50/50 dark:bg-[#1b1b1b]/50">
              <Search size={28} className="mx-auto text-neutral-400 mb-2 opacity-60" />
              <h3 className="font-semibold text-sm text-neutral-800 dark:text-neutral-200 mb-1">
                No matching entries found
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                No entries match your search query "{searchQuery}". Try a different keyword or clear the search.
              </p>
            </div>
          </div>
        )
      ) : (
        <div className="text-center py-20 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50/50 dark:bg-[#1b1b1b]/50">
          <div className="text-4xl mb-3">{activeTab === 'favorites' ? '⭐' : '📖'}</div>
          <h2 className="font-semibold text-base text-neutral-800 dark:text-neutral-200 mb-1">
            {activeTab === 'favorites' ? 'No favorite entries yet' : 'No entries found'}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
            {activeTab === 'favorites'
              ? 'Click the star icon while viewing any journal entry to pin it here.'
              : "You don't have any journal entries yet. Start writing your first note today!"}
          </p>
        </div>
      )}
    </div>
  );
}

