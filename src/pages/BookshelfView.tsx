import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, BookOpen, Library, X, ChevronRight, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { JournalEntry, DiaryBook } from '../types/journal';

// Curated aesthetic fallback covers matching Image 1
const DEFAULT_COVERS = [
  {
    title: 'The Language of Letters',
    cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    color: '#e5e5e5',
    pattern: 'typography',
  },
  {
    title: 'Eye of Thought',
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    color: '#d4d4d8',
    pattern: 'abstract',
  },
  {
    title: 'The Shadow',
    cover: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80',
    color: '#f4f4f5',
    pattern: 'minimal',
  },
  {
    title: 'Puzzles of Mind',
    cover: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    color: '#fecdd3',
    pattern: 'modern',
  },
  {
    title: 'Mid-Century Modern',
    cover: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
    color: '#fed7aa',
    pattern: 'grid',
  },
  {
    title: 'Simplicity',
    cover: 'https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?auto=format&fit=crop&w=800&q=80',
    color: '#e0e7ff',
    pattern: 'botanical',
  },
];

// Months for the yearly spine design
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const SPINE_STYLES = [
  { bg: 'bg-[#18181b] text-white', accent: 'bg-indigo-500', name: 'Obsidian' },
  { bg: 'bg-[#fafafa] text-neutral-900 border-r border-neutral-300', accent: 'bg-red-500', name: 'Paper Mono' },
  { bg: 'bg-[#0f172a] text-sky-200', accent: 'bg-sky-400', name: 'Midnight' },
  { bg: 'bg-[#1e293b] text-slate-100', accent: 'bg-emerald-400', name: 'Slate' },
  { bg: 'bg-[#1c1917] text-amber-100', accent: 'bg-amber-500', name: 'Espresso' },
  { bg: 'bg-[#164e63] text-cyan-100', accent: 'bg-cyan-400', name: 'Oceanic' },
  { bg: 'bg-[#3b0764] text-purple-200', accent: 'bg-purple-400', name: 'Violet' },
  { bg: 'bg-[#831843] text-pink-100', accent: 'bg-pink-400', name: 'Crimson' },
  { bg: 'bg-[#14532d] text-emerald-100', accent: 'bg-emerald-400', name: 'Forest' },
  { bg: 'bg-[#0369a1] text-blue-100', accent: 'bg-sky-300', name: 'Cobalt' },
  { bg: 'bg-[#701a75] text-fuchsia-100', accent: 'bg-fuchsia-400', name: 'Orchid' },
  { bg: 'bg-[#09090b] text-zinc-300', accent: 'bg-zinc-100', name: 'Noir' },
];

export default function BookshelfView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shelfMode, setShelfMode] = useState<'diaries' | 'daily'>('diaries');
  const [books, setBooks] = useState<DiaryBook[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  // New Diary Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCover, setNewCover] = useState(DEFAULT_COVERS[0].cover);
  const [newSubtitle, setNewSubtitle] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Load books from localStorage / Supabase
  useEffect(() => {
    if (!user) return;
    loadShelfData();
  }, [user]);

  const loadShelfData = async () => {
    try {
      // Fetch journal entries
      const { data: entriesData } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (entriesData) setEntries(entriesData);

      // Load custom diary books from localStorage keyed to user
      const stored = localStorage.getItem(`journify_books_${user?.id}`);
      if (stored) {
        setBooks(JSON.parse(stored));
      } else {
        // Provide starter books matching Image 1
        const initialBooks: DiaryBook[] = [
          {
            id: 'book-1',
            user_id: user?.id || '',
            title: 'The Language of Letters',
            subtitle: 'Deep thoughts & typography',
            cover_url: DEFAULT_COVERS[0].cover,
            spine_color: '#18181b',
            category: 'custom',
            created_at: new Date().toISOString(),
          },
          {
            id: 'book-2',
            user_id: user?.id || '',
            title: 'Eye of Thought',
            subtitle: 'Visual reflections & musings',
            cover_url: DEFAULT_COVERS[1].cover,
            spine_color: '#27272a',
            category: 'custom',
            created_at: new Date().toISOString(),
          },
          {
            id: 'book-3',
            user_id: user?.id || '',
            title: 'The Shadow',
            subtitle: 'Midnight journaling',
            cover_url: DEFAULT_COVERS[2].cover,
            spine_color: '#09090b',
            category: 'custom',
            created_at: new Date().toISOString(),
          },
          {
            id: 'book-4',
            user_id: user?.id || '',
            title: 'Puzzles of Mind',
            subtitle: 'Reflections & solutions',
            cover_url: DEFAULT_COVERS[3].cover,
            spine_color: '#3f3f46',
            category: 'custom',
            created_at: new Date().toISOString(),
          },
          {
            id: 'book-5',
            user_id: user?.id || '',
            title: 'Mid-Century Design',
            subtitle: 'Creative sparks and ideas',
            cover_url: DEFAULT_COVERS[4].cover,
            spine_color: '#52525b',
            category: 'custom',
            created_at: new Date().toISOString(),
          },
          {
            id: 'book-6',
            user_id: user?.id || '',
            title: 'Simplicity',
            subtitle: 'Mindfulness & everyday zen',
            cover_url: DEFAULT_COVERS[5].cover,
            spine_color: '#18181b',
            category: 'custom',
            created_at: new Date().toISOString(),
          },
        ];
        setBooks(initialBooks);
        localStorage.setItem(`journify_books_${user?.id}`, JSON.stringify(initialBooks));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateBook = () => {
    if (!newTitle.trim() || !user) return;
    const newBook: DiaryBook = {
      id: `book-${Date.now()}`,
      user_id: user.id,
      title: newTitle.trim(),
      subtitle: newSubtitle.trim() || 'Custom Journal',
      cover_url: newCover,
      spine_color: '#18181b',
      category: 'custom',
      created_at: new Date().toISOString(),
    };
    const updated = [newBook, ...books];
    setBooks(updated);
    localStorage.setItem(`journify_books_${user.id}`, JSON.stringify(updated));
    setNewTitle('');
    setNewSubtitle('');
    setShowCreateModal(false);
  };

  const handleDeleteBook = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm('Delete this diary book? Entries inside will remain safe in your archive.')) return;
    const updated = books.filter(b => b.id !== id);
    setBooks(updated);
    if (user) localStorage.setItem(`journify_books_${user.id}`, JSON.stringify(updated));
  };

  // Group entries by month for the Daily Spines view
  const monthlyEntries = useMemo(() => {
    const map: Record<number, JournalEntry[]> = {};
    for (let i = 0; i < 12; i++) map[i] = [];
    entries.forEach(entry => {
      const d = new Date(entry.created_at);
      if (d.getFullYear() === selectedYear) {
        const m = d.getMonth();
        if (map[m]) map[m].push(entry);
      }
    });
    return map;
  }, [entries, selectedYear]);

  return (
    <div className="min-h-screen pb-24 text-neutral-900 dark:text-neutral-100 transition-colors">
      {/* Bookshelf Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
              The Library
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
              {shelfMode === 'diaries' ? `${books.length} Books` : `Year ${selectedYear}`}
            </span>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {shelfMode === 'diaries' 
              ? 'Your bespoke diaries on display. Add covers and keep writing page by page.' 
              : 'Daily journal volumes bound from January through December.'}
          </p>
        </div>

        {/* View Switcher & Action */}
        <div className="flex items-center gap-3">
          {/* Toggle between 3D Book Covers & Standing Spines */}
          <div className="inline-flex p-1 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <button
              onClick={() => setShelfMode('diaries')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                shelfMode === 'diaries'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Diaries Shelf</span>
            </button>
            <button
              onClick={() => setShelfMode('daily')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                shelfMode === 'daily'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Library className="w-3.5 h-3.5" />
              <span>Jan–Dec Spines</span>
            </button>
          </div>

          {shelfMode === 'diaries' ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="liquid-glass rounded-xl px-4 py-2 text-xs font-semibold text-neutral-900 dark:text-white hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
            >
              <Plus className="w-4 h-4" />
              <span>New Diary Book</span>
            </button>
          ) : (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 focus:outline-none"
            >
              {[2026, 2025, 2024, 2023].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* VIEW 1: DIARIES SHELVES (Front Covers on Ledges, matching Image 1) */}
      {shelfMode === 'diaries' && (
        <div className="space-y-16">
          {/* We group books in rows of 3 per shelf */}
          {Array.from({ length: Math.ceil(books.length / 3) }).map((_, shelfIndex) => {
            const shelfBooks = books.slice(shelfIndex * 3, shelfIndex * 3 + 3);
            return (
              <div key={shelfIndex} className="relative pt-6">
                {/* Books Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 px-4 sm:px-8 mb-[-4px] relative z-10">
                  {shelfBooks.map((book) => {
                    const bookEntriesCount = entries.filter(e => e.book_id === book.id || e.tags?.includes(book.title)).length;
                    return (
                      <div key={book.id} className="flex flex-col items-center group">
                        {/* 3D Book Container */}
                        <div 
                          onClick={() => navigate(`/app/book/${book.id}`)}
                          className="book-cover-3d relative w-56 sm:w-60 aspect-[1/1.4] cursor-pointer overflow-hidden rounded-md border border-black/10 dark:border-white/10"
                        >
                          {/* Spine Hinge 3D Effect */}
                          <div className="book-spine-hinge" />

                          {/* Cover Image / Art */}
                          <img
                            src={book.cover_url || DEFAULT_COVERS[0].cover}
                            alt={book.title}
                            className="w-full h-full object-cover select-none"
                          />

                          {/* Floating Cover Overlay Typography (Editorial Style like Image 1) */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20 p-5 flex flex-col justify-between pointer-events-none">
                            <div className="flex items-start justify-between">
                              <span className="text-[10px] tracking-widest uppercase font-mono text-white/80 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">
                                Journify Book
                              </span>
                              <button
                                onClick={(e) => handleDeleteBook(book.id, e)}
                                title="Delete Book"
                                className="pointer-events-auto p-1.5 rounded-full bg-black/50 text-white/70 hover:text-red-400 hover:bg-black/75 transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div>
                              <h3 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight drop-shadow-md">
                                {book.title}
                              </h3>
                              {book.subtitle && (
                                <p className="text-xs text-white/75 mt-1 font-sans line-clamp-1 drop-shadow-sm">
                                  {book.subtitle}
                                </p>
                              )}
                              <div className="mt-3 flex items-center justify-between text-[11px] text-white/60">
                                <span>{bookEntriesCount} pages written</span>
                                <span className="group-hover:text-white transition-colors flex items-center gap-0.5 font-medium">
                                  Open <ChevronRight className="w-3 h-3" />
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Title Underneath Ledge */}
                        <div className="text-center mt-6">
                          <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                            {book.title}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 3D Realistic Shelf Ledge beneath the books */}
                <div className="bookshelf-ledge w-full shadow-lg" />
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: JAN - DEC DAILY JOURNAL SHELF (Standing Spines, matching Image 2) */}
      {shelfMode === 'daily' && (
        <div className="mt-12">
          <div className="relative pt-8 pb-4">
            {/* Standing Books Spines Row */}
            <div className="flex items-end justify-center gap-2 sm:gap-4 px-4 overflow-x-auto pb-[-2px] relative z-10 scrollbar-none min-h-[380px]">
              {MONTHS.map((monthName, idx) => {
                const monthStyle = SPINE_STYLES[idx % SPINE_STYLES.length];
                const monthEntries = monthlyEntries[idx] || [];
                const pageCount = monthEntries.length;

                return (
                  <motion.div
                    key={monthName}
                    whileHover={{ y: -16, transition: { duration: 0.2 } }}
                    onClick={() => navigate(`/app/daily/${selectedYear}/${idx + 1}`)}
                    className={`standing-spine ${monthStyle.bg} w-14 sm:w-16 md:w-20 cursor-pointer h-72 sm:h-80 md:h-92 flex flex-col justify-between py-6 px-2 text-center rounded-t-md relative group border-t border-l border-white/20 select-none`}
                  >
                    {/* Top Spine Bookmark Accent */}
                    <div className="flex flex-col items-center">
                      <div className={`w-2 h-4 ${monthStyle.accent} rounded-b-sm mb-2 opacity-90 shadow-sm`} />
                      <span className="text-[10px] font-mono tracking-widest uppercase opacity-75">
                        {selectedYear}
                      </span>
                    </div>

                    {/* Vertical Month & Title (Editorial Spine Typography like Image 2) */}
                    <div className="flex-1 flex flex-col items-center justify-center my-4">
                      <div 
                        className="writing-vertical text-sm sm:text-base font-display font-bold tracking-[0.2em] uppercase transform rotate-180"
                        style={{ writingMode: 'vertical-rl' }}
                      >
                        {monthName}
                      </div>
                    </div>

                    {/* Bottom Volume Info */}
                    <div className="flex flex-col items-center text-[10px] opacity-75 font-mono">
                      <span className="font-semibold text-xs">{pageCount}</span>
                      <span className="text-[9px] uppercase">Entries</span>
                    </div>

                    {/* Subtle Spine Texture Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-black/30 pointer-events-none rounded-t-md" />
                  </motion.div>
                );
              })}
            </div>

            {/* Realistic Shelf Ledge under standing books */}
            <div className="bookshelf-ledge w-full mt-[-2px] shadow-2xl" />
          </div>

          <div className="mt-8 text-center text-xs text-neutral-500 dark:text-neutral-400">
            Tip: Click any month spine (e.g. <span className="font-semibold text-neutral-800 dark:text-neutral-200">Jan — Dec</span>) to write or browse daily entries for that volume.
          </div>
        </div>
      )}

      {/* Modal: Create New Diary Book */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-2xl font-bold">New Diary Book</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Book Title
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Morning Musings, Travel 2026..."
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Subtitle / Concept
                  </label>
                  <input
                    type="text"
                    value={newSubtitle}
                    onChange={(e) => setNewSubtitle(e.target.value)}
                    placeholder="e.g. Reflections on work and life"
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Choose Cover Artwork
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {DEFAULT_COVERS.map((c, i) => (
                      <div
                        key={i}
                        onClick={() => setNewCover(c.cover)}
                        className={`cursor-pointer rounded-lg overflow-hidden border-2 aspect-[1/1.3] relative transition-all ${
                          newCover === c.cover 
                            ? 'border-black dark:border-white ring-2 ring-black/20' 
                            : 'border-transparent opacity-75 hover:opacity-100'
                        }`}
                      >
                        <img src={c.cover} alt={c.title} className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 inset-x-1 text-[9px] bg-black/60 text-white px-1 py-0.5 rounded text-center truncate backdrop-blur-xs">
                          {c.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Or custom cover image URL
                  </label>
                  <input
                    type="url"
                    value={newCover}
                    onChange={(e) => setNewCover(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateBook}
                  disabled={!newTitle.trim()}
                  className="px-6 py-2 rounded-xl text-xs font-semibold bg-black text-white dark:bg-white dark:text-black hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  Create Book
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
