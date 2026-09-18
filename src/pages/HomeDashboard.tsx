import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, isToday, isYesterday, differenceInDays, subDays } from 'date-fns';
import {
  Plus, Mic, Flame,
  Calendar, Sparkles, Layers,
  ArrowUpRight, PenTool, Check
} from 'lucide-react';
import type { JournalEntry } from '../types/journal';
import { useAuth } from '../contexts/AuthContext';
import { useProfileInfo } from '../hooks/useProfileInfo';
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
    'What would you like to leave here?',
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
  // Rearrange top recent entries so the latest (index 0) is placed at the exact center of the fan deck
  // e.g., for 5 entries: [entry[3], entry[1], entry[0](latest), entry[2], entry[4]]
  // For 3 entries: [entry[1], entry[0](latest), entry[2]]
  const arrangeCenterLatest = (list: JournalEntry[]) => {
    if (list.length <= 1) return list;
    if (list.length === 2) return [list[1], list[0]];
    if (list.length === 3) return [list[1], list[0], list[2]];
    if (list.length === 4) return [list[2], list[1], list[0], list[3]];
    return [list[3], list[1], list[0], list[2], list[4]];
  };

  const fanCards = arrangeCenterLatest(entries.slice(0, displayCount));

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

// ─── Main Component: HomeDashboard ───────────────────────────────────────────

export default function HomeDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const profile = useProfileInfo(user?.id);

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [voiceOpen, setVoiceOpen] = useState(false);

  const displayName = profile?.name?.trim() || user?.email?.split('@')[0] || 'there';
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

  // Past 7 days streak track (chronological Mon-Sun / 6 days ago -> today)
  const pastWeekDays = Array.from({ length: 7 }).map((_, idx) => {
    const d = subDays(new Date(), 6 - idx);
    const dateStr = format(d, 'yyyy-MM-dd');
    const hasEntry = entries.some((e) => format(new Date(e.created_at), 'yyyy-MM-dd') === dateStr);
    return {
      date: d,
      dayLabel: format(d, 'EEE'),
      logged: hasEntry,
      isCurrentDay: isToday(d),
    };
  });

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

      {/* ── Cool Widgets Section: Write Your Journal Now (Quick Session) & Streak Tracker ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Write Your Journal Now Widget (Quick Session) - matching light and dark themes */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden rounded-2xl p-5 bg-white dark:bg-[#1c1c1c] border border-neutral-200/80 dark:border-[#2b2b2b] shadow-xs flex flex-col justify-between group hover:border-neutral-300 dark:hover:border-neutral-700 transition-all"
        >
          {/* Subtle Ambient Accent */}
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-violet-500/10 dark:bg-violet-500/15 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-white/10 border border-neutral-200 dark:border-white/10 flex items-center justify-center">
                  <PenTool size={15} className="text-neutral-700 dark:text-neutral-200" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-400">
                    Quick Session
                  </h3>
                  <p className="text-xs font-medium text-neutral-900 dark:text-neutral-200">
                    Write Your Journal Now
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-white/10">
                Daily Focus
              </span>
            </div>

            {/* Journal Visual Feature replacing Today's Inspiration box */}
            <div className="my-2 p-3 rounded-xl bg-neutral-50/80 dark:bg-white/5 border border-neutral-200/70 dark:border-white/5 flex items-center gap-3.5">
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 flex items-center justify-center">
                <img
                  src="https://cdn.iconscout.com/icon/premium/png-512-thumb/journal-icon-svg-download-png-11795154.png"
                  alt="Journal Illustration"
                  className="w-full h-full object-contain drop-shadow-md hover:scale-105 transition-transform duration-300 dark:invert dark:brightness-200"
                  loading="lazy"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 mb-0.5">
                  <span>Capture Today's Moments</span>
                </div>
                <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed line-clamp-2">
                  Take a few calm moments to write your thoughts, gratitude, or reflections.
                </p>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-3 mt-2 flex items-center gap-2">
            <button
              onClick={() => navigate('/entry/new')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:opacity-90 transition shadow-xs group-hover:scale-[1.01]"
            >
              <Plus size={14} />
              <span>Start Writing</span>
            </button>
            <button
              onClick={() => setVoiceOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/15 text-neutral-800 dark:text-white border border-neutral-200 dark:border-white/10 transition"
              title="Speak your reflection"
            >
              <Mic size={13} className="text-rose-500 dark:text-rose-400" />
              <span>Voice</span>
            </button>
          </div>
        </motion.div>

        {/* Streak & Consistency Widget */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08 }}
          className="relative overflow-hidden rounded-2xl p-5 bg-white dark:bg-[#1c1c1c] border border-neutral-200/80 dark:border-[#2b2b2b] shadow-xs flex flex-col justify-between group hover:border-neutral-300 dark:hover:border-neutral-700 transition-all"
        >
          {/* Subtle Ambient Background Glow */}
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

          <div>
            {/* Top row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center">
                  <Flame size={16} className={streak > 0 ? "text-amber-500 fill-amber-500 animate-pulse" : "text-neutral-400"} />
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Streak Tracker
                  </h3>
                  <p className="text-xs font-medium text-neutral-900 dark:text-neutral-200">
                    {streak > 0 ? `${streak} Day Momentum` : 'Ready to start'}
                  </p>
                </div>
              </div>

              {/* Total Notes Count inside Streak Widget */}
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-[#252525] border border-neutral-200/80 dark:border-[#333] text-neutral-700 dark:text-neutral-300 text-[11px] font-mono font-semibold">
                <span>{totalEntries}</span>
                <span className="font-sans font-normal text-[10px] text-neutral-400">notes</span>
              </div>
            </div>

            {/* Streak Counter & Weekly Pulse */}
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-950 dark:text-neutral-50 font-mono">
                {streak}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {streak === 1 ? 'day recorded in a row' : 'consecutive days logged'}
              </span>
            </div>

            {/* 7-Day Mini Dots Track */}
            <div className="flex items-center justify-between gap-1.5 pt-2 pb-1">
              {pastWeekDays.map((item) => (
                <div key={item.dayLabel} className="flex flex-col items-center gap-1.5 flex-1">
                  <div
                    className={`w-full h-8 rounded-lg flex items-center justify-center text-[10px] font-mono transition-all ${
                      item.logged
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-bold shadow-xs'
                        : item.isCurrentDay
                        ? 'border-2 border-dashed border-neutral-400 dark:border-neutral-600 bg-neutral-100/50 dark:bg-neutral-800/40 text-neutral-500 dark:text-neutral-400'
                        : 'bg-neutral-100 dark:bg-neutral-800/50 text-neutral-400 dark:text-neutral-600'
                    }`}
                    title={`${item.dayLabel}: ${item.logged ? 'Logged' : 'No entry'}`}
                  >
                    {item.logged ? <Check size={12} strokeWidth={3} /> : null}
                  </div>
                  <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500">
                    {item.dayLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-neutral-200 dark:border-neutral-700/80 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>{writtenToday ? '🔥 Logged for today!' : '⚡ Write today to keep streak.'}</span>
            <Link to="/calendar" className="font-medium text-neutral-800 dark:text-neutral-200 hover:underline inline-flex items-center gap-0.5">
              History <ArrowUpRight size={11} />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* ── Fan Spread Recent Journal Showcase (placed below both widgets) ── */}
      {fanEntries.length > 0 && (
        <FanSpreadSection
          entries={fanEntries}
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
