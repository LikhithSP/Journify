import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, isToday, isYesterday } from 'date-fns';
import { BookOpen, Clock } from 'lucide-react';
import type { JournalEntry } from '../types/journal';
import { useAuth } from '../contexts/AuthContext';
import { SyncEngine } from '../services/syncEngine';
import { OfflineDB } from '../services/offlineDB';

// ─── Helpers & Constants ──────────────────────────────────────────────────────

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

// ─── Masonry Journal Grid ─────────────────────────────────────────────────────

function MasonryGrid({
  entries,
  onSelect,
}: {
  entries: JournalEntry[];
  onSelect: (id: string) => void;
}) {
  if (entries.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-gray-400 dark:text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
            All Entries
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#222] text-gray-600 dark:text-gray-400 font-mono">
            {entries.length}
          </span>
        </div>
      </div>

      {/* Row-wise Responsive Grid (Left-to-right, row-by-row, latest first) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {entries.map((entry, idx) => {
          const mood = entry.mood ? MOOD_MAP[entry.mood] : null;
          const excerpt = stripHtml(entry.content);
          const words = excerpt ? excerpt.split(' ').filter(Boolean).length : 0;

          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(idx * 0.025, 0.25) }}
              className="h-full"
            >
              <div
                onClick={() => onSelect(entry.id)}
                className="group relative rounded-xl p-4 cursor-pointer h-full flex flex-col justify-between
                  bg-white dark:bg-[#1e1e1e]
                  border border-neutral-200/80 dark:border-[#2a2a2a]
                  hover:border-neutral-400 dark:hover:border-neutral-600
                  shadow-xs hover:shadow-md transition-all duration-200"
              >
                <div>
                  {/* Card Top Row: Date + Mood */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 font-mono">
                      {formatEntryDate(entry.created_at)}
                    </span>
                    {mood ? (
                      <span
                        className={`px-1.5 py-0.5 rounded text-xs flex items-center gap-1 font-medium ${mood.bg} ${mood.text} border ${mood.border}`}
                      >
                        <span>{mood.emoji}</span>
                        <span className="capitalize text-[10px] hidden sm:inline">{entry.mood}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-neutral-400 font-mono flex items-center gap-1">
                        <Clock size={10} />
                        {words}w
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm leading-snug mb-1.5 group-hover:text-black dark:group-hover:text-white transition-colors">
                    {entry.title || 'Untitled'}
                  </h3>

                  {/* Excerpt Body */}
                  {excerpt ? (
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal line-clamp-4">
                      {excerpt}
                    </p>
                  ) : (
                    <p className="text-xs italic text-neutral-300 dark:text-neutral-600">
                      Empty entry
                    </p>
                  )}
                </div>

                {/* Tags and footer */}
                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800/80">
                    {entry.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-[#252525] px-1.5 py-0.5 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-6 h-6 border-2 border-neutral-300 dark:border-neutral-700 border-t-neutral-900 dark:border-t-white rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {sortedEntries.length > 0 ? (
        <MasonryGrid
          entries={sortedEntries}
          onSelect={(id) => navigate(`/entry/${id}`)}
        />
      ) : (
        <div className="text-center py-20 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50/50 dark:bg-[#1b1b1b]/50">
          <div className="text-4xl mb-3">📖</div>
          <h2 className="font-semibold text-base text-neutral-800 dark:text-neutral-200 mb-1">
            No entries found
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
            You don't have any journal entries yet.
          </p>
        </div>
      )}
    </div>
  );
}
