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
    <div className="max-w-5xl mx-auto py-4 px-2 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center">
            <CalendarIcon className="mr-2.5 h-6 w-6 text-black dark:text-white" />
            Calendar & Timeline
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Navigate your thoughts through time. Review moods, tags, and word counts per day.
          </p>
        </div>

        {/* Global Streak Counter */}
        <div className="flex items-center space-x-3">
          {loading && (
            <span className="text-[11px] text-gray-400 animate-pulse">Syncing dates...</span>
          )}
          <div className="flex items-center px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 text-xs font-semibold">
            <Flame size={16} className="mr-1.5 text-orange-500 fill-orange-500 animate-bounce" />
            <span>{currentStreak}-day streak</span>
          </div>

          <button
            onClick={() => navigate('/entry/new')}
            className="flex items-center px-3 py-1.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-90 transition shadow-sm"
          >
            <Plus size={14} className="mr-1" />
            <span>New Entry</span>
          </button>
        </div>
      </div>

      {/* Main Calendar Card */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-6 space-y-6">
        {/* Month Selector Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <button
              onClick={() => {
                setCurrentMonth(new Date());
                setSelectedDate(new Date());
              }}
              className="px-2 py-0.5 rounded text-[11px] font-medium text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
            >
              Today
            </button>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-600 dark:text-gray-300 transition"
              title="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-600 dark:text-gray-300 transition"
              title="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Days of Week Header (M T W T F S S) */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-gray-400 dark:text-gray-500">
          <div>M</div>
          <div>T</div>
          <div>W</div>
          <div>T</div>
          <div>F</div>
          <div>S</div>
          <div>S</div>
        </div>

        {/* Calendar Day Grid */}
        <div className="grid grid-cols-7 gap-2">
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
                className={`min-h-[85px] sm:min-h-[100px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  !isCurrentMonth
                    ? 'opacity-30 border-transparent hover:border-gray-200 dark:hover:border-gray-800'
                    : isSelected
                    ? 'border-black dark:border-white ring-1 ring-black dark:ring-white bg-gray-50/80 dark:bg-neutral-800/80 shadow-sm'
                    : hasEntries
                    ? 'border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600 bg-white dark:bg-neutral-900'
                    : 'border-gray-100 dark:border-gray-850 hover:bg-gray-50 dark:hover:bg-neutral-850'
                }`}
              >
                {/* Day Number and Today Indicator */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold flex items-center justify-center rounded-full w-5 h-5 ${
                      isCurrentDay
                        ? 'bg-black text-white dark:bg-white dark:text-black font-bold'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>

                  {hasEntries && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  )}
                </div>

                {/* Day Metadata (Mood, Words, Tags) */}
                {hasEntries ? (
                  <div className="mt-1 space-y-1">
                    <div className="flex items-center justify-between">
                      {mood && (
                        <span
                          className={`text-[11px] px-1.5 py-0.2 rounded-md border font-medium flex items-center ${
                            MOOD_COLORS[mood] || 'bg-gray-100 text-gray-800'
                          }`}
                          title={`Mood: ${mood}`}
                        >
                          <span className="mr-0.5">{MOOD_EMOJIS[mood] || '📝'}</span>
                          <span className="capitalize text-[10px] hidden sm:inline">{mood}</span>
                        </span>
                      )}

                      <span className="text-[10px] text-gray-400 font-mono">
                        {totalWords}w
                      </span>
                    </div>

                    {/* Tag badge preview */}
                    {primaryEntry?.tags && primaryEntry.tags.length > 0 && (
                      <div className="hidden sm:flex items-center space-x-1 text-[9px] text-gray-500 overflow-hidden">
                        <Tag size={9} className="flex-shrink-0" />
                        <span className="truncate">#{primaryEntry.tags[0]}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[10px] text-gray-300 dark:text-gray-700"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Timeline Details */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-6 space-y-4">
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
            className="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-neutral-800 text-xs font-medium transition"
          >
            <Plus size={13} className="mr-1" />
            Write on this day
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
          <div className="space-y-3">
            {selectedDayEntries.map((entry) => {
              const plainText = entry.content.replace(/<[^>]*>/g, ' ').slice(0, 180);
              const wordCount = entry.content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;

              return (
                <div
                  key={entry.id}
                  onClick={() => navigate(`/entry/${entry.id}`)}
                  className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white bg-gray-50/50 dark:bg-neutral-850/50 cursor-pointer transition flex items-start justify-between gap-4 group"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {entry.title || 'Untitled Entry'}
                      </h4>
                      {entry.mood && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 flex items-center">
                          <span className="mr-1">{MOOD_EMOJIS[entry.mood] || '📝'}</span>
                          <span className="capitalize">{entry.mood}</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                      {plainText}
                    </p>

                    <div className="flex items-center space-x-3 text-[11px] text-gray-400 pt-1">
                      <span className="flex items-center">
                        <Clock size={11} className="mr-1" /> {format(new Date(entry.created_at), 'h:mm a')}
                      </span>
                      <span>• {wordCount} words</span>
                      {entry.tags && entry.tags.length > 0 && (
                        <span className="flex items-center space-x-1">
                          <Tag size={11} className="mr-0.5" />
                          {entry.tags.map((t) => (
                            <span key={t}>#{t}</span>
                          ))}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-2 text-gray-400 group-hover:text-black dark:group-hover:text-white transition">
                    <ArrowRight size={16} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
