import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, BookOpen, Library, X, Trash2, Edit3, Upload, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
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
  const [searchParams] = useSearchParams();

  const initialTab = searchParams.get('tab') === 'daily' ? 'daily' : 'diaries';
  const initialYear = Number(searchParams.get('year')) || new Date().getFullYear();

  const [shelfMode, setShelfMode] = useState<'diaries' | 'daily'>(initialTab);
  const [books, setBooks] = useState<DiaryBook[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  // New / Edit Diary Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBook, setEditingBook] = useState<DiaryBook | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newCover, setNewCover] = useState(DEFAULT_COVERS[0].cover);
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag and drop reordering state
  const [draggedBookId, setDraggedBookId] = useState<string | null>(null);
  const [dropTargetBookId, setDropTargetBookId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, bookId: string) => {
    e.dataTransfer.setData('text/plain', bookId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedBookId(bookId);
  };

  const handleDragOver = (e: React.DragEvent, bookId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dropTargetBookId !== bookId) {
      setDropTargetBookId(bookId);
    }
  };

  const handleDragLeave = (_e: React.DragEvent) => {
    // optional reset if leaving container
  };

  const handleDrop = (e: React.DragEvent, targetBookId: string) => {
    e.preventDefault();
    const sourceBookId = e.dataTransfer.getData('text/plain') || draggedBookId;
    if (!sourceBookId || sourceBookId === targetBookId) {
      setDraggedBookId(null);
      setDropTargetBookId(null);
      return;
    }

    const sourceIndex = books.findIndex(b => b.id === sourceBookId);
    const targetIndex = books.findIndex(b => b.id === targetBookId);

    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggedBookId(null);
      setDropTargetBookId(null);
      return;
    }

    const reordered = [...books];
    const [movedBook] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, movedBook);

    setBooks(reordered);
    if (user) {
      localStorage.setItem(`journify_books_${user.id}`, JSON.stringify(reordered));
    }

    setDraggedBookId(null);
    setDropTargetBookId(null);
  };

  const handleDragEnd = () => {
    setDraggedBookId(null);
    setDropTargetBookId(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setNewCover(result);
      }
    };
    reader.readAsDataURL(file);
  };

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

  const handleOpenCreate = () => {
    setEditingBook(null);
    setNewTitle('');
    setNewSubtitle('');
    setNewCover(DEFAULT_COVERS[0].cover);
    setShowCreateModal(true);
  };

  const handleOpenEdit = (book: DiaryBook, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingBook(book);
    setNewTitle(book.title);
    setNewSubtitle(book.subtitle || '');
    setNewCover(book.cover_url || DEFAULT_COVERS[0].cover);
    setShowCreateModal(true);
  };

  const handleSaveBook = () => {
    if (!newTitle.trim() || !user) return;

    if (editingBook) {
      // Update existing book
      const updated = books.map(b => {
        if (b.id === editingBook.id) {
          return {
            ...b,
            title: newTitle.trim(),
            subtitle: newSubtitle.trim(),
            cover_url: newCover,
          };
        }
        return b;
      });
      setBooks(updated);
      localStorage.setItem(`journify_books_${user.id}`, JSON.stringify(updated));
    } else {
      // Create new book
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
    }

    setNewTitle('');
    setNewSubtitle('');
    setEditingBook(null);
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
    <div className="w-full pb-16 text-neutral-900 dark:text-neutral-100 transition-colors">
      {/* Bookshelf Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
              The Library
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
              {shelfMode === 'diaries' ? `${books.length} Books` : `Year ${selectedYear}`}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {shelfMode === 'diaries' 
              ? 'Your bespoke diaries on display. Drag books to rearrange shelf order.' 
              : 'Monthly journal volumes bound from January through December.'}
          </p>
        </div>

        {/* View Switcher & Action */}
        <div className="flex items-center gap-2.5">
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
              <span>Journals</span>
            </button>
          </div>

          {shelfMode === 'diaries' ? (
            <button
              onClick={handleOpenCreate}
              className="rounded-xl px-4 py-2 text-xs font-semibold bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>New Diary Book</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-1">
              <button
                onClick={() => setSelectedYear(prev => prev - 1)}
                className="p-1 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors"
                title="Previous Year"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-transparent border-none text-neutral-900 dark:text-white focus:outline-none cursor-pointer"
              >
                {Array.from({ length: 10 }).map((_, i) => {
                  const y = new Date().getFullYear() + 2 - i;
                  return <option key={y} value={y} className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">{y}</option>;
                })}
              </select>

              <button
                onClick={() => setSelectedYear(prev => prev + 1)}
                className="p-1 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors"
                title="Next Year"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* VIEW 1: DIARIES SHELVES (Front Covers on Ledges, matching Image 1) */}
      {shelfMode === 'diaries' && (
        <div className="space-y-16 mt-12 sm:mt-16 pt-2">
          {/* We group books in rows of 3 per shelf */}
          {Array.from({ length: Math.ceil(books.length / 3) }).map((_, shelfIndex) => {
            const shelfBooks = books.slice(shelfIndex * 3, shelfIndex * 3 + 3);
            return (
              <div key={shelfIndex} className="relative pt-4">
                {/* Books Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 px-4 sm:px-8 mb-[-4px] relative z-10">
                  {shelfBooks.map((book) => {
                    const isDragging = draggedBookId === book.id;
                    const isDropTarget = dropTargetBookId === book.id;

                    return (
                      <div
                        key={book.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, book.id)}
                        onDragOver={(e) => handleDragOver(e, book.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, book.id)}
                        onDragEnd={handleDragEnd}
                        className={`flex flex-col items-center group transition-all duration-200 cursor-grab active:cursor-grabbing ${
                          isDragging ? 'opacity-40 scale-95' : 'opacity-100'
                        } ${
                          isDropTarget ? 'scale-105 ring-2 ring-indigo-500 rounded-lg shadow-2xl' : ''
                        }`}
                      >
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
                            className="w-full h-full object-cover select-none pointer-events-none"
                          />

                          {/* Floating Cover Overlay Typography (Editorial Style like Image 1) */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20 p-5 flex flex-col justify-between pointer-events-none">
                            <div className="flex items-start justify-between">
                              {/* Drag Reorder Hint Indicator */}
                              <div
                                title="Drag to reorder shelf"
                                className="pointer-events-auto p-1.5 rounded-full bg-black/60 text-white/70 hover:text-white hover:bg-black/90 transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100 flex items-center justify-center cursor-grab active:cursor-grabbing"
                              >
                                <GripVertical className="w-3.5 h-3.5" />
                              </div>

                              <div className="flex items-center gap-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  draggable={false}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onClick={(e) => handleOpenEdit(book, e)}
                                  title="Edit Title & Cover"
                                  className="pointer-events-auto p-1.5 rounded-full bg-black/60 text-white/90 hover:text-white hover:bg-black/90 active:scale-95 transition-all z-20 cursor-pointer shadow-md"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  draggable={false}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onClick={(e) => handleDeleteBook(book.id, e)}
                                  title="Delete Book"
                                  className="pointer-events-auto p-1.5 rounded-full bg-black/60 text-white/70 hover:text-red-400 hover:bg-black/90 active:scale-95 transition-all z-20 cursor-pointer shadow-md"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div>
                              <h3 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight drop-shadow-md">
                                {book.title}
                              </h3>
                              {book.subtitle && (
                                <p className="text-xs text-white/75 mt-1 font-sans line-clamp-2 drop-shadow-sm">
                                  {book.subtitle}
                                </p>
                              )}
                            </div>
                          </div>
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
        <div className="mt-4">
          <div className="relative pt-6 pb-2">
            {/* Standing Books Spines Row */}
            <div className="flex items-end justify-center gap-2 sm:gap-4 px-4 pt-6 pb-0 overflow-visible relative z-10 min-h-[350px]">
              {MONTHS.map((monthName, idx) => {
                const monthStyle = SPINE_STYLES[idx % SPINE_STYLES.length];
                const monthEntries = monthlyEntries[idx] || [];
                const pageCount = monthEntries.length;

                return (
                  <motion.div
                    key={monthName}
                    whileHover={{ y: -16, transition: { duration: 0.2, ease: 'easeOut' } }}
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

      {/* Modal: Create or Edit Diary Book */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg max-h-[90vh] flex flex-col bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white my-auto overflow-hidden"
            >
              {/* Modal Sticky Header */}
              <div className="flex items-center justify-between p-6 pb-4 border-b border-neutral-150 dark:border-neutral-800 flex-shrink-0">
                <div>
                  <h3 className="font-display text-2xl font-bold">
                    {editingBook ? 'Edit Diary Cover & Title' : 'New Diary Book'}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    {editingBook ? 'Update the book title, subtitle, or artwork cover.' : 'Add a new bespoke journal to your library.'}
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Modal Content */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain">
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

                {/* Upload from Computer Files */}
                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                    Upload Custom Cover from Your Computer
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 transition-colors shadow-sm"
                    >
                      <Upload className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Choose Computer File</span>
                    </button>
                    {newCover && (
                      <div className="flex items-center gap-2">
                        <img
                          src={newCover}
                          alt="Cover Preview"
                          className="w-8 h-10 object-cover rounded-sm border border-neutral-300 dark:border-neutral-700 shadow-sm"
                        />
                        <span className="text-[11px] text-neutral-500 font-mono">Current preview</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-1">
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Or paste image URL
                  </label>
                  <input
                    type="url"
                    value={newCover.startsWith('data:') ? '' : newCover}
                    onChange={(e) => setNewCover(e.target.value)}
                    placeholder={newCover.startsWith('data:') ? 'Custom file uploaded' : 'https://images.unsplash.com/...'}
                    className="w-full px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Modal Sticky Footer */}
              <div className="p-6 pt-3 pb-5 border-t border-neutral-150 dark:border-neutral-800 flex justify-end gap-3 flex-shrink-0 bg-neutral-50/80 dark:bg-neutral-900/80 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveBook}
                  disabled={!newTitle.trim()}
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-black text-white dark:bg-white dark:text-black hover:opacity-90 disabled:opacity-50 transition-opacity shadow-md"
                >
                  {editingBook ? 'Save Changes' : 'Create Book'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
