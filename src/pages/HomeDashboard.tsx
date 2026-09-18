import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, isToday, isYesterday, differenceInDays } from 'date-fns';
import {
  Plus, Mic, Flame, BookOpen,
  Calendar, ChevronRight, Sparkles, Layers,
  Clock, ArrowUpRight
} from 'lucide-react';
import type { JournalEntry } from '../types/journal';
import { useAuth } from '../contexts/AuthContext';
import { SyncEngine } from '../services/syncEngine';
import { OfflineDB } from '../services/offlineDB';
import VoiceJournalModal from '../components/VoiceJournalModal';
import { DraftService } from '../services/draftService';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting(name: string) {
  const hour = new Date().getHours();
  const timeGreeting =
    hour < 5 ? 'Still up,' :
    hour < 12 ? 'Good morning,' :
    hour < 17 ? 'Good afternoon,' :
    hour < 21 ? 'Good evening,' :
    'Good night,';
  return `${timeGreeting} ${name}`;
}

function getWritingPrompt() {
  const prompts = [
    'What made you smile today?',
    'What are you grateful for right now?',
    'Describe a moment that surprised you.',
    'What would you tell your younger self today?',
    'What are you looking forward to?',
    'What challenged you today?',
    'What did you learn recently?',
    "What's on your mind?",
  ];
  const dayIndex = new Date().getDay();
  return prompts[dayIndex % prompts.length];
}

function calcStreak(entries: JournalEntry[]): number {
  if (!entries.length) return 0;
  const sortedDates = entries
    .map((e) => format(new Date(e.created_at), 'yyyy-MM-dd'))
    .sort()
    .reverse();
  const unique = [...new Set(sortedDates)];

  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (const dateStr of unique) {
    const d = new Date(dateStr);
    const diff = differenceInDays(cursor, d);
    if (diff === 0 || diff === 1) {
      streak++;
      cursor = d;
    } else {
      break;
    }
  }
  return streak;
}

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



// ─── Fan Spread Showcase ──────────────────────────────────────────────────────

function FanSpreadSection({
  entries,
  onSelect,
}: {
  entries: JournalEntry[];
  onSelect: (id: string) => void;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (entries.length === 0) return null;

  const displayCount = Math.min(entries.length, 5);
  const fanCards = entries.slice(0, displayCount);

  // Center alignment offset mapping based on actual cards count
  const getFanTransform = (i: number, total: number) => {
    // Center card index
    const center = (total - 1) / 2;
    const offset = i - center;
    const baseRot = offset * 7;
    const baseX = offset * 65;
    const baseY = Math.abs(offset) * 8;
    const baseZ = total - Math.abs(offset);
    return { rot: baseRot, x: baseX, y: baseY, z: Math.round(baseZ) };
  };

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={15} className="text-gray-400 dark:text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
            Recent Showcase
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#222] text-gray-600 dark:text-gray-400 font-mono">
            {entries.length}
          </span>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Hover to inspect · Click to read
        </p>
      </div>

      {/* Fan Spread Deck Container */}
      <div className="relative w-full h-[290px] sm:h-[310px] flex items-center justify-center overflow-visible select-none py-4">
        {fanCards.map((entry, i) => {
          const cfg = getFanTransform(i, displayCount);
          const isHovered = hoveredIndex === i;
          const isAnyHovered = hoveredIndex !== null;
          const mood = entry.mood ? MOOD_MAP[entry.mood] : null;
          const excerpt = stripHtml(entry.content);

          return (
            <motion.div
              key={entry.id}
              onClick={() => onSelect(entry.id)}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="absolute cursor-pointer"
              style={{
                transformOrigin: '50% 120%',
                zIndex: isHovered ? 40 : cfg.z,
              }}
              animate={{
                rotate: isHovered ? 0 : isAnyHovered ? cfg.rot * 1.3 : cfg.rot,
                x: isHovered ? cfg.x * 1.1 : isAnyHovered ? cfg.x * 1.25 : cfg.x,
                y: isHovered ? -34 : isAnyHovered ? cfg.y + 4 : cfg.y,
                scale: isHovered ? 1.08 : isAnyHovered ? 0.96 : 1,
              }}
              transition={{
                type: 'spring',
                stiffness: 350,
                damping: 24,
              }}
            >
              <div
                className={`w-[220px] sm:w-[250px] h-[230px] rounded-xl p-4 flex flex-col justify-between
                  bg-white dark:bg-[#1e1e1e]
                  border transition-all duration-200
                  ${isHovered 
                    ? 'border-neutral-900/30 dark:border-neutral-400/40 shadow-2xl shadow-black/15 dark:shadow-black/60 ring-2 ring-black/5 dark:ring-white/10' 
                    : 'border-neutral-200/80 dark:border-[#2e2e2e] shadow-md shadow-black/5 dark:shadow-black/30'
                  }`}
              >
                {/* Card Top / Header */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 font-mono">
                      {formatEntryDate(entry.created_at)}
                    </span>
                    {mood && (
                      <span
                        className="text-base flex-shrink-0"
                        title={entry.mood || undefined}
                      >
                        {mood.emoji}
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm leading-snug line-clamp-2">
                    {entry.title || 'Untitled note'}
                  </h3>
                </div>

                {/* Excerpt */}
                <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-4 leading-relaxed my-2 font-normal">
                  {excerpt || <span className="italic text-neutral-300 dark:text-neutral-600">Empty page</span>}
                </p>

                {/* Card Footer */}
                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1 overflow-hidden">
                    {entry.tags && entry.tags.length > 0 ? (
                      <span className="text-[10px] text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded truncate max-w-[130px]">
                        #{entry.tags[0]}
                        {entry.tags.length > 1 && ` +${entry.tags.length - 1}`}
                      </span>
                    ) : (
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                        {excerpt ? excerpt.split(' ').filter(Boolean).length : 0} words
                      </span>
                    )}
                  </div>
                  <ArrowUpRight
                    size={13}
                    className={`text-neutral-400 transition-colors ${
                      isHovered ? 'text-black dark:text-white' : ''
                    }`}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
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
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={15} className="text-gray-400 dark:text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
            All Entries
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#222] text-gray-600 dark:text-gray-400 font-mono">
            {entries.length}
          </span>
        </div>
        <Link
          to="/journals"
          className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors group font-medium"
        >
          Browse full archive
          <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Masonry Container via CSS columns */}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-3.5 [column-fill:_balance]">
        {entries.map((entry, idx) => {
          const mood = entry.mood ? MOOD_MAP[entry.mood] : null;
          const excerpt = stripHtml(entry.content);
          const words = excerpt ? excerpt.split(' ').filter(Boolean).length : 0;
          // Varying max-length so the masonry looks authentic and dynamic
          const maxExcerpt = (idx % 3 === 0) ? 280 : (idx % 2 === 0) ? 140 : 190;
          const isShort = excerpt.length < 80;

          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(idx * 0.03, 0.3) }}
              className="break-inside-avoid mb-3.5"
            >
              <div
                onClick={() => onSelect(entry.id)}
                className="group relative rounded-xl p-4 cursor-pointer
                  bg-white dark:bg-[#1e1e1e]
                  border border-neutral-200/80 dark:border-[#2a2a2a]
                  hover:border-neutral-400 dark:hover:border-neutral-600
                  shadow-xs hover:shadow-md transition-all duration-200"
              >
                {/* Card Top Row: Mood emoji / Icon + Date */}
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
                  <p className={`text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal ${isShort ? 'line-clamp-2' : 'line-clamp-5'}`}>
                    {excerpt.slice(0, maxExcerpt)}
                    {excerpt.length > maxExcerpt ? '…' : ''}
                  </p>
                ) : (
                  <p className="text-xs italic text-neutral-300 dark:text-neutral-600">
                    Empty entry
                  </p>
                )}

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

// ─── Main Component: HomeDashboard ───────────────────────────────────────────

export default function HomeDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [voiceOpen, setVoiceOpen] = useState(false);

  const displayName = user?.email?.split('@')[0] ?? 'there';
  const greeting = getGreeting(displayName);
  const prompt = getWritingPrompt();

  // ── Data loading ──
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

  // ── Stats ──
  const streak = calcStreak(entries);
  const totalEntries = entries.length;
  const thisWeek = entries.filter((e) => differenceInDays(new Date(), new Date(e.created_at)) <= 7).length;
  const writtenToday = entries.some((e) => isToday(new Date(e.created_at)));

  // Sorted latest first
  const sortedEntries = entries
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Fan spread entries (top 5 recent)
  const fanEntries = sortedEntries.slice(0, 5);

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
    <div className="max-w-5xl mx-auto space-y-7 pb-20">

      {/* ── Notion-style Clean Header ── */}
      <div className="border-b border-neutral-200/80 dark:border-neutral-800 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 dark:text-neutral-500 mb-1">
              <span>{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Flame size={12} className={streak > 0 ? 'text-amber-500' : 'text-neutral-400'} />
                {streak} day streak
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2.5">
              <span>{greeting}</span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-500/80 flex-shrink-0" />
              <span>{writtenToday ? "You've recorded today. Keep your momentum going!" : prompt}</span>
            </p>
          </div>

          {/* Clean Action Toolbar */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => setVoiceOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#202020] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-[#282828] transition-colors"
            >
              <Mic size={13} className="text-rose-500" />
              <span>Voice</span>
            </button>
            <Link
              to="/calendar"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#202020] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-[#282828] transition-colors"
            >
              <Calendar size={13} className="text-violet-500" />
              <span>Calendar</span>
            </Link>
            <Link
              to="/entry/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-opacity shadow-xs"
            >
              <Plus size={14} />
              <span>New Entry</span>
            </Link>
          </div>
        </div>

        {/* Notion Minimal Inline Stat Bar */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-850 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200">{totalEntries}</span>
            <span>total notes</span>
          </div>
          <div className="text-neutral-300 dark:text-neutral-700">|</div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200">{thisWeek}</span>
            <span>this week</span>
          </div>
          <div className="text-neutral-300 dark:text-neutral-700">|</div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200">{streak}</span>
            <span>streak days</span>
          </div>
          <div className="text-neutral-300 dark:text-neutral-700">|</div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${writtenToday ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            <span>{writtenToday ? 'Logged today' : 'Needs daily entry'}</span>
          </div>
        </div>
      </div>

      {/* ── Empty State ── */}
      {!loading && entries.length === 0 && (
        <div className="text-center py-20 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50/50 dark:bg-[#1b1b1b]/50">
          <div className="text-4xl mb-3">📓</div>
          <h2 className="font-semibold text-base text-neutral-800 dark:text-neutral-200 mb-1">
            Your personal workspace is ready
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-5 max-w-sm mx-auto">
            Write notes, track reflections, record voice memos, or organize your life.
          </p>
          <Link
            to="/entry/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg font-medium text-xs hover:opacity-90 transition-opacity"
          >
            <Plus size={13} />
            Create your first entry
          </Link>
        </div>
      )}

      {/* ── Fan Spread Recent Journal Showcase ── */}
      {fanEntries.length > 0 && (
        <FanSpreadSection
          entries={fanEntries}
          onSelect={(id) => navigate(`/entry/${id}`)}
        />
      )}

      {/* ── Masonry Grid of All Journal Entries ── */}
      {sortedEntries.length > 0 && (
        <MasonryGrid
          entries={sortedEntries}
          onSelect={(id) => navigate(`/entry/${id}`)}
        />
      )}

      {/* ── Voice Journal Modal ── */}
      <VoiceJournalModal
        isOpen={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        onApplyToEditor={(voiceData) => {
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
