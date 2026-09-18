import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Flame, 
  Tag, 
  Clock, 
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday 
} from 'date-fns';
import type { JournalEntry } from '../types/journal';
import { useAuth } from '../contexts/AuthContext';
import { SyncEngine } from '../services/syncEngine';
import { OfflineDB } from '../services/offlineDB';

const MOOD_EMOJIS: Record<string, string> = {
  joyful: '😊',
  peaceful: '😌',
  sad: '😔',
  angry: '😠',
  anxious: '😰',
};

const MOOD_COLORS: Record<string, string> = {
  joyful: 'bg-amber-400 text-amber-950 border-amber-300',
  peaceful: 'bg-emerald-400 text-emerald-950 border-emerald-300',
  sad: 'bg-blue-400 text-blue-950 border-blue-300',
  angry: 'bg-red-400 text-red-950 border-red-300',
  anxious: 'bg-purple-400 text-purple-950 border-purple-300',
};

export default function CalendarPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(2026, 8, 1)); // Default Sept 2026 or current
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Load entries via SyncEngine / OfflineDB
  useEffect(() => {
    async function loadEntries() {
      if (!user) return;
      setLoading(true);
      try {
        const data = await SyncEngine.pullServerEntries(user.id);
        setEntries(data);
      } catch (e) {
        const local = await OfflineDB.getAllEntries(user.id);
        setEntries(local);
      } finally {
        setLoading(false);
      }
    }
    loadEntries();
  }, [user]);

  // Compute month days grid starting from Monday (weekStartsOn: 1)
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Map entries by date string (yyyy-MM-dd)
  const entriesByDate = useMemo(() => {
    const map = new Map<string, JournalEntry[]>();
    entries.forEach((entry) => {
      const dateKey = format(new Date(entry.created_at), 'yyyy-MM-dd');
      const list = map.get(dateKey) || [];
      list.push(entry);
      map.set(dateKey, list);
    });
    return map;
  }, [entries]);

  // Calculate overall streak
  const currentStreak = useMemo(() => {
    let streak = 0;
    let checkDate = new Date();
    // Check if wrote today or yesterday
    const todayKey = format(checkDate, 'yyyy-MM-dd');
    const wroteToday = entriesByDate.has(todayKey);

    if (!wroteToday) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (entriesByDate.has(format(checkDate, 'yyyy-MM-dd'))) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return streak;
  }, [entriesByDate]);

  // Entries for the currently selected date
  const selectedDateKey = format(selectedDate, 'yyyy-MM-dd');
  const selectedDayEntries = entriesByDate.get(selectedDateKey) || [];

  return (
    <div className="max-w-7xl mx-auto py-2 px-1 sm:px-2 space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center">
            <CalendarIcon className="mr-2 h-5 w-5 text-black dark:text-white" />
            Calendar & Timeline
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Navigate your thoughts through time. Review moods, tags, and word counts per day.
          </p>
        </div>

        {/* Global Streak Counter & Quick Action */}
        <div className="flex items-center space-x-2.5">
          {loading && (
            <span className="text-[11px] text-gray-400 animate-pulse">Syncing dates...</span>
          )}
          <div className="flex items-center px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 text-xs font-semibold">
            <Flame size={14} className="mr-1 text-orange-500 fill-orange-500 animate-bounce" />
            <span>{currentStreak}-day streak</span>
          </div>

          <button
            onClick={() => navigate('/entry/new')}
            className="flex items-center px-3 py-1 rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-90 transition shadow-xs"
          >
            <Plus size={13} className="mr-1" />
            <span>New Entry</span>
          </button>
        </div>
      </div>

      {/* Side-by-Side Grid Container on Desktop (PC view) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 xl:gap-5 items-start">
        {/* Main Calendar Card (Left Column) */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white dark:bg-neutral-900 border border-gray-200/90 dark:border-gray-800 rounded-2xl shadow-xs p-4 sm:p-5 space-y-3.5">
          {/* Month Selector Bar */}
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <button
                onClick={() => {
                  setCurrentMonth(new Date());
                  setSelectedDate(new Date());
                }}
                className="px-2 py-0.5 rounded-md text-[11px] font-medium text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
              >
                Today
              </button>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-1 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-600 dark:text-gray-300 transition"
                title="Previous month"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-1 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-600 dark:text-gray-300 transition"
                title="Next month"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          {/* Days of Week Header (M T W T F S S) */}
          <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold text-gray-400 dark:text-gray-500">
            <div>M</div>
            <div>T</div>
            <div>W</div>
            <div>T</div>
            <div>F</div>
            <div>S</div>
            <div>S</div>
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayEntries = entriesByDate.get(dateKey) || [];
              const hasEntries = dayEntries.length > 0;
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isCurrentDay = isToday(day);

              // Primary mood and word count
              const primaryEntry = dayEntries[0];
              const mood = primaryEntry?.mood;
              const totalWords = dayEntries.reduce((acc, curr) => {
                const words = curr.content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
                return acc + words;
              }, 0);

              return (
                <div
                  key={dateKey}
                  onClick={() => setSelectedDate(day)}
                  className={`relative h-[64px] sm:h-[72px] p-1.5 rounded-xl border transition-all duration-150 cursor-pointer flex flex-col justify-between select-none ${
                    !isCurrentMonth
                      ? 'opacity-25 border-transparent hover:border-gray-200/60 dark:hover:border-gray-800'
                      : isSelected
                      ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-900/[0.04] dark:bg-white/[0.07] ring-2 ring-neutral-900/15 dark:ring-white/25 shadow-sm scale-[1.02] z-10'
                      : hasEntries
                      ? 'border-gray-200/80 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600 bg-white dark:bg-neutral-900/90'
                      : 'border-gray-100/90 dark:border-gray-850 hover:bg-gray-50 dark:hover:bg-neutral-850/60'
                  }`}
                >
                  {/* Top Row: Day Number and Entry Indicator */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] font-semibold flex items-center justify-center rounded-full transition-all ${
                        isSelected
                          ? 'w-5 h-5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold shadow-xs'
                          : isCurrentDay
                          ? 'w-5 h-5 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white font-bold ring-1 ring-neutral-400 dark:ring-neutral-500'
                          : 'text-gray-700 dark:text-gray-300 px-0.5'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>

                    {hasEntries && (
                      <span className="flex items-center gap-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-500 ring-2 ring-emerald-300 dark:ring-emerald-700' : 'bg-emerald-500'}`} />
                        {dayEntries.length > 1 && (
                          <span className="text-[9px] font-mono text-gray-400 dark:text-gray-500 leading-none">
                            {dayEntries.length}
                          </span>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Day Metadata (Mood badge & Word count) */}
                  {hasEntries ? (
                    <div className="flex items-center justify-between text-[10px] gap-1 overflow-hidden">
                      {mood ? (
                        <span
                          className={`text-[10px] px-1 py-0.2 rounded border font-medium flex items-center truncate max-w-[65px] ${
                            MOOD_COLORS[mood] || 'bg-gray-100 text-gray-800'
                          }`}
                          title={`Mood: ${mood}`}
                        >
                          <span className="mr-0.5">{MOOD_EMOJIS[mood] || '📝'}</span>
                          <span className="capitalize text-[9px] hidden sm:inline truncate">{mood}</span>
                        </span>
                      ) : (
                        <span />
                      )}

                      <span className="text-[9px] text-gray-400 font-mono flex-shrink-0">
                        {totalWords}w
                      </span>
                    </div>
                  ) : (
                    <div className="h-2"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Timeline Details (Right Column on PC) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-4 lg:sticky lg:top-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-xs">
                {format(selectedDate, 'dd')}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Timeline for {format(selectedDate, 'MMMM d, yyyy')}
                </h3>
                <p className="text-[11px] text-gray-500">
                  {selectedDayEntries.length === 1
                    ? '1 entry documented'
                    : `${selectedDayEntries.length} entries documented`}
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/entry/new')}
              className="inline-flex items-center px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-neutral-800 text-xs font-medium transition"
            >
              <Plus size={13} className="mr-1" />
              Write
            </button>
          </div>

          {/* Entries Stream for selected date */}
          {selectedDayEntries.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
              <BookOpen size={28} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-xs text-gray-500 dark:text-gray-400">No journal entry recorded for this day.</p>
              <button
                onClick={() => navigate('/entry/new')}
                className="mt-3 inline-flex items-center text-xs font-semibold text-black dark:text-white hover:underline"
              >
                Start writing now <ArrowRight size={12} className="ml-1" />
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              {selectedDayEntries.map((entry) => {
                const plainText = entry.content.replace(/<[^>]*>/g, ' ').slice(0, 180);
                const wordCount = entry.content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;

                return (
                  <div
                    key={entry.id}
                    onClick={() => navigate(`/entry/${entry.id}`)}
                    className="p-4 rounded-xl border border-gray-200 dark:border-neutral-750 hover:border-black dark:hover:border-neutral-400 bg-white dark:bg-[#1a1a1c] hover:bg-gray-50/80 dark:hover:bg-[#222226] cursor-pointer transition-all shadow-xs flex items-start justify-between gap-4 group"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {entry.title || 'Untitled Entry'}
                        </h4>
                        {entry.mood && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800/90 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 flex items-center shadow-2xs">
                            <span className="mr-1">{MOOD_EMOJIS[entry.mood] || '📝'}</span>
                            <span className="capitalize">{entry.mood}</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-600 dark:text-neutral-300 line-clamp-3 leading-relaxed font-normal">
                        {plainText}
                      </p>

                      <div className="flex items-center flex-wrap gap-2.5 text-[11px] text-gray-500 dark:text-neutral-400 pt-1">
                        <span className="flex items-center text-gray-600 dark:text-neutral-400 font-mono">
                          <Clock size={11} className="mr-1 text-gray-400 dark:text-neutral-500" /> {format(new Date(entry.created_at), 'h:mm a')}
                        </span>
                        <span>•</span>
                        <span className="font-mono">{wordCount} words</span>
                        {entry.tags && entry.tags.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="flex items-center space-x-1">
                              <Tag size={11} className="mr-0.5 text-gray-400 dark:text-neutral-500" />
                              {entry.tags.map((t) => (
                                <span key={t} className="bg-gray-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-[10px] text-gray-700 dark:text-neutral-300 font-mono">
                                  #{t}
                                </span>
                              ))}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="p-1.5 text-gray-400 group-hover:text-black dark:group-hover:text-white transition flex-shrink-0">
                      <ArrowRight size={16} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
