import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, BookOpen, Edit3, X, Upload, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import type { JournalEntry, DiaryBook } from '../types/journal';
import type { CanvasElement } from './EditEntryPage';

// Curated aesthetic fallback covers
const DEFAULT_COVERS = [
  {
    title: 'The Language of Letters',
    cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Eye of Thought',
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'The Shadow',
    cover: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Puzzles of Mind',
    cover: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Mid-Century Modern',
    cover: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Simplicity',
    cover: 'https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?auto=format&fit=crop&w=800&q=80',
  },
];

export default function BookPagesView() {
  const { bookId, year, month } = useParams<{ bookId?: string; year?: string; month?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [book, setBook] = useState<DiaryBook | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [flipDirection, setFlipDirection] = useState<1 | -1>(1);

  const goToNextPage = () => {
    if (currentPageIndex < entries.length - 1) {
      setFlipDirection(1);
      setCurrentPageIndex(prev => prev + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPageIndex > 0) {
      setFlipDirection(-1);
      setCurrentPageIndex(prev => prev - 1);
    }
  };

  // Edit Diary Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editCover, setEditCover] = useState('');
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const handleEditFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setEditCover(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Month names
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const isDailyMonth = Boolean(year && month);
  const currentMonthName = isDailyMonth ? MONTHS[Number(month) - 1] : '';

  useEffect(() => {
    if (!user) return;
    loadBookAndPages();
  }, [user, bookId, year, month]);

  const loadBookAndPages = async () => {
    setLoading(true);
    try {
      if (isDailyMonth) {
        // Daily journal by Year and Month
        const startDate = new Date(Number(year), Number(month) - 1, 1).toISOString();
        const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59).toISOString();

        const { data } = await supabase
          .from('journal_entries')
          .select('*')
          .eq('user_id', user?.id)
          .gte('created_at', startDate)
          .lte('created_at', endDate)
          .order('created_at', { ascending: true });

        const sorted = data || [];
        setEntries(sorted);
        // Default to the latest written page (e.g. 27 of 27)
        if (sorted.length > 0) {
          setCurrentPageIndex(sorted.length - 1);
        }
      } else if (bookId) {
        // Custom Diary Book
        let currentBookTitle: string | undefined;
        const stored = localStorage.getItem(`journify_books_${user?.id}`);
        if (stored) {
          const list: DiaryBook[] = JSON.parse(stored);
          const current = list.find(b => b.id === bookId);
          if (current) {
            setBook(current);
            currentBookTitle = current.title;
          }
        }

        // Fetch entries tagged or linked to this book in chronological order (earliest = page 1, latest = last page)
        const { data } = await supabase
          .from('journal_entries')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: true });

        if (data) {
          // Filter either by book_id or matching tag
          const filtered = data.filter(e => e.book_id === bookId || (currentBookTitle && e.tags?.includes(currentBookTitle)));
          setEntries(filtered);
          // Default to the latest written page (e.g. Page 27 of 27)
          if (filtered.length > 0) {
            setCurrentPageIndex(filtered.length - 1);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleWriteNewPage = () => {
    // Navigate to new entry with prefilled tag or book state
    navigate('/app/entry/new', {
      state: {
        bookId: bookId,
        bookTitle: book?.title,
        defaultDate: isDailyMonth ? `${year}-${String(month).padStart(2, '0')}-01` : undefined,
      }
    });
  };

  const handleSaveBookEdit = () => {
    if (!book || !editTitle.trim() || !user) return;
    const stored = localStorage.getItem(`journify_books_${user.id}`);
    if (stored) {
      const list: DiaryBook[] = JSON.parse(stored);
      const updated = list.map(b => {
        if (b.id === book.id) {
          return {
            ...b,
            title: editTitle.trim(),
            subtitle: editSubtitle.trim(),
            cover_url: editCover,
          };
        }
        return b;
      });
      localStorage.setItem(`journify_books_${user.id}`, JSON.stringify(updated));
    }

    setBook(prev => prev ? {
      ...prev,
      title: editTitle.trim(),
      subtitle: editSubtitle.trim(),
      cover_url: editCover,
    } : null);

    setShowEditModal(false);
  };

  const [deletingPage, setDeletingPage] = useState(false);
  const handleDeleteCurrentPage = async () => {
    if (!currentEntry || !user) return;
    if (!window.confirm('Delete this page spread from your diary? This cannot be undone.')) return;
    try {
      setDeletingPage(true);
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', currentEntry.id)
        .eq('user_id', user.id);

      if (error) throw error;

      const remaining = entries.filter(e => e.id !== currentEntry.id);
      setEntries(remaining);
      if (currentPageIndex >= remaining.length && remaining.length > 0) {
        setCurrentPageIndex(remaining.length - 1);
      }
    } catch (err) {
      console.error('Delete page error:', err);
      alert('Failed to delete page');
    } finally {
      setDeletingPage(false);
    }
  };

  // Current Entry selected for the open double spread
  const currentEntry = entries[currentPageIndex] || entries[0] || null;

  // Parse content of current entry (whether scrapbook JSON elements, dual page text, or plain text)
  const { currentEntryParsedText, currentEntryParsedLeftText, currentEntryCanvasElements } = useMemo(() => {
    if (!currentEntry) return { currentEntryParsedText: '', currentEntryParsedLeftText: '', currentEntryCanvasElements: [] as CanvasElement[] };

    const stripHtml = (str: string) => {
      return str
        .replace(/<br\s*[\/]?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<[^>]*>/g, '')
        .trim();
    };

    try {
      if (currentEntry.content && currentEntry.content.trim().startsWith('[')) {
        const parsed = JSON.parse(currentEntry.content);
        if (Array.isArray(parsed)) {
          const textElem = parsed.find((e: CanvasElement) => e.type === 'text' && e.id !== 'left-journal-text');
          const leftElem = parsed.find((e: CanvasElement) => e.type === 'text' && e.id === 'left-journal-text');
          const visualElems = parsed.filter((e: CanvasElement) => e.type !== 'text');
          return {
            currentEntryParsedText: textElem?.content ? stripHtml(textElem.content) : 'A quiet page of memories and reflections.',
            currentEntryParsedLeftText: leftElem?.content ? stripHtml(leftElem.content) : '',
            currentEntryCanvasElements: visualElems as CanvasElement[],
          };
        }
      }
    } catch {
      // fallback to plain text
    }

    return {
      currentEntryParsedText: currentEntry.content ? stripHtml(currentEntry.content) : 'A quiet page of memories and reflections.',
      currentEntryParsedLeftText: '',
      currentEntryCanvasElements: [] as CanvasElement[],
    };
  }, [currentEntry]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 min-h-screen text-neutral-900 dark:text-neutral-100">
      {/* Top Header Back Navigation */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <button
          onClick={() => {
            if (isDailyMonth) {
              navigate(`/app/library?tab=daily&year=${year}`);
            } else {
              navigate('/app/library');
            }
          }}
          className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isDailyMonth ? 'Back to Spines' : 'Back to Shelf'}</span>
        </button>

        <div className="flex items-center gap-2">
          {book && !isDailyMonth && (
            <button
              onClick={() => {
                setEditTitle(book.title);
                setEditSubtitle(book.subtitle || '');
                setEditCover(book.cover_url || '');
                setShowEditModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Cover & Title</span>
            </button>
          )}

          <button
            onClick={handleWriteNewPage}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Write in this Book</span>
          </button>
        </div>
      </div>

      {/* Book Presentation Banner */}
      <div className="mb-12 p-6 sm:p-8 rounded-3xl bg-neutral-100/80 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center gap-6 shadow-sm">
        {/* Book Cover Thumbnail */}
        <div 
          onClick={() => {
            if (book && !isDailyMonth) {
              setEditTitle(book.title);
              setEditSubtitle(book.subtitle || '');
              setEditCover(book.cover_url || '');
              setShowEditModal(true);
            }
          }}
          className={`book-cover-3d w-28 sm:w-32 aspect-[1/1.4] overflow-hidden rounded-md flex-shrink-0 shadow-md ${book && !isDailyMonth ? 'cursor-pointer hover:ring-2 hover:ring-black dark:hover:ring-white transition-all group' : ''}`}
          title={book && !isDailyMonth ? "Click to change cover artwork" : undefined}
        >
          <div className="book-spine-hinge" />
          <img
            src={book?.cover_url || (isDailyMonth ? 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80' : 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80')}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Book Meta */}
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
              {isDailyMonth ? `Daily Journal • ${year}` : 'Custom Diary'}
            </span>
            {book && !isDailyMonth && (
              <button
                onClick={() => {
                  setEditTitle(book.title);
                  setEditSubtitle(book.subtitle || '');
                  setEditCover(book.cover_url || '');
                  setShowEditModal(true);
                }}
                className="text-[11px] text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 transition-colors"
              >
                <Edit3 className="w-3 h-3" /> Edit
              </button>
            )}
          </div>
          {isDailyMonth ? (
            <div className="flex items-center justify-center sm:justify-start gap-3 my-1">
              <button
                onClick={() => navigate(`/app/daily/${Number(year) - 1}/${month}`)}
                className="p-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-neutral-700 dark:text-neutral-300 transition-colors"
                title={`Go to ${currentMonthName} ${Number(year) - 1}`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
                {currentMonthName} {year}
              </h1>

              <button
                onClick={() => navigate(`/app/daily/${Number(year) + 1}/${month}`)}
                className="p-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-neutral-700 dark:text-neutral-300 transition-colors"
                title={`Go to ${currentMonthName} ${Number(year) + 1}`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
              {book?.title || 'Diary'}
            </h1>
          )}
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-xl">
            {isDailyMonth 
              ? `All journal reflections recorded during ${currentMonthName} ${year}.`
              : (book?.subtitle || 'Turn the pages to read your thoughts and reflections.')}
          </p>

          <div className="mt-4 flex items-center justify-center sm:justify-start gap-4 text-xs text-neutral-600 dark:text-neutral-400">
            <span>{entries.length} {entries.length === 1 ? 'Page' : 'Pages'} Written</span>
            <span>•</span>
            <span>Created {isDailyMonth ? year : (book ? new Date(book.created_at).toLocaleDateString() : '')}</span>
          </div>
        </div>
      </div>

      {/* REALISTIC OPEN BOOK DESIGN VIEW */}
      <div className="mt-6">
        {loading ? (
          <div className="text-center py-20 text-neutral-400">Opening journal...</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 p-8 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800">
            <BookOpen className="w-10 h-10 mx-auto text-neutral-400 mb-3" />
            <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">This book has no pages written yet</h3>
            <p className="text-xs text-neutral-500 mt-1 mb-5">Open your quill and write your first entry for this journal.</p>
            <button
              onClick={handleWriteNewPage}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-black text-white dark:bg-white dark:text-black hover:opacity-90"
            >
              Write First Page
            </button>
          </div>
        ) : (
          <div>
            {/* Book Spread Navigation & Controls */}
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPageIndex === 0}
                  className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 disabled:opacity-30 hover:scale-105 active:scale-95 transition-all text-neutral-700 dark:text-neutral-300"
                  title="Previous Page Spread"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-neutral-600 dark:text-neutral-400 font-semibold px-2">
                  Page {currentPageIndex + 1} of {entries.length}
                </span>
                <button
                  onClick={goToNextPage}
                  disabled={currentPageIndex >= entries.length - 1}
                  className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 disabled:opacity-30 hover:scale-105 active:scale-95 transition-all text-neutral-700 dark:text-neutral-300"
                  title="Next Page Spread"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {currentEntry && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleWriteNewPage}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 transition-all shadow-sm"
                    title="Write next page in this book"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Next Page & Write</span>
                  </button>
                  <button
                    onClick={() => navigate(`/app/entry/${currentEntry.id}/edit`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 transition-all shadow-sm"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit This Page</span>
                  </button>
                  <button
                    onClick={handleDeleteCurrentPage}
                    disabled={deletingPage}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 transition-all shadow-sm disabled:opacity-50"
                    title="Delete current page"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{deletingPage ? 'Deleting...' : 'Delete Page'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Realistic Open Book Double-Page Spread with Smooth Page Turn Animation */}
            <div className="relative max-w-5xl mx-auto my-4 perspective-[2000px]">
              {/* Stacked Paper Pages Edge Effect on Left & Right */}
              <div className="absolute -left-4 top-3 bottom-3 w-6 bg-neutral-200 dark:bg-neutral-800 rounded-l-xl opacity-60 shadow-md pointer-events-none transform -rotate-1 z-0" />
              <div className="absolute -left-2 top-1.5 bottom-1.5 w-4 bg-neutral-100 dark:bg-neutral-700 rounded-l-xl opacity-80 shadow-sm pointer-events-none transform -rotate-0.5 z-0" />
              <div className="absolute -right-4 top-3 bottom-3 w-6 bg-neutral-200 dark:bg-neutral-800 rounded-r-xl opacity-60 shadow-md pointer-events-none transform rotate-1 z-0" />
              <div className="absolute -right-2 top-1.5 bottom-1.5 w-4 bg-neutral-100 dark:bg-neutral-700 rounded-r-xl opacity-80 shadow-sm pointer-events-none transform rotate-0.5 z-0" />

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={currentPageIndex}
                  initial={{ 
                    opacity: 0.6, 
                    // Next page: comes from the right (flips from right to left).
                    // Back page: comes from the left (flips from left to right).
                    rotateY: flipDirection > 0 ? -35 : 35,
                    x: flipDirection > 0 ? 50 : -50,
                    scale: 0.98,
                    transformOrigin: flipDirection > 0 ? 'right center' : 'left center'
                  }}
                  animate={{ 
                    opacity: 1, 
                    rotateY: 0,
                    x: 0, 
                    scale: 1,
                    transition: { 
                      duration: 0.4, 
                      ease: [0.22, 1, 0.36, 1] 
                    }
                  }}
                  exit={{ 
                    opacity: 0.2, 
                    // Next page exiting: turns towards the left (right-to-left turn).
                    // Back page exiting: turns towards the right (left-to-right turn).
                    rotateY: flipDirection > 0 ? 35 : -35,
                    x: flipDirection > 0 ? -50 : 50,
                    scale: 0.98,
                    transformOrigin: flipDirection > 0 ? 'left center' : 'right center',
                    transition: { 
                      duration: 0.32, 
                      ease: [0.4, 0, 0.6, 1] 
                    }
                  }}
                  style={{ transformStyle: 'preserve-3d' }}
                  className="open-journal-spread w-full aspect-[16/10] sm:aspect-[16/9.5] min-h-[540px] relative overflow-hidden flex flex-col md:flex-row bg-[#111113] border border-white/10 p-6 sm:p-10 shadow-2xl z-10"
                >
                  {/* Center Valley / Spine Crease */}
                  <div className="journal-center-spine" />

                  {/* Left Page Stamp & Meta */}
                  <div className="absolute top-4 left-8 right-8 flex items-center justify-between text-[10px] font-mono tracking-widest text-neutral-400 uppercase pointer-events-none z-10">
                    <div className="w-1/2 pr-6 flex justify-between">
                      <span>{isDailyMonth ? `${currentMonthName} ${year}` : (book?.title || 'JOURNIFY')}</span>
                      <span>SPREAD {currentPageIndex + 1}</span>
                    </div>
                    <div className="w-1/2 pl-8 flex justify-between">
                      <span>{currentEntry ? new Date(currentEntry.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
                      <span>PAGE #{currentPageIndex + 1}</span>
                    </div>
                  </div>

                {/* LEFT PAGE SPREAD: Left Written Text OR Scrapbook Memories / Sticky Notes */}
                <div className="w-full md:w-1/2 pr-0 md:pr-10 pt-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-black/5 dark:border-white/5 relative">
                  {currentEntryParsedLeftText ? (
                    /* Written content on Left Page */
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="inline-block px-2.5 py-1 rounded-md bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 font-mono text-xs mb-3">
                          {currentEntry ? new Date(currentEntry.created_at).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : ''} • Left Page
                        </div>
                        <div className="text-sm sm:text-base leading-relaxed text-neutral-800 dark:text-neutral-200 font-serif">
                          <MarkdownRenderer content={currentEntryParsedLeftText} />
                        </div>
                      </div>

                      {/* Universal stickers floating over left page if any */}
                      {currentEntryCanvasElements.filter(e => e.type === 'sticker').length > 0 && (
                        <div className="absolute inset-0 pointer-events-none">
                          {currentEntryCanvasElements.filter(e => e.type === 'sticker').map((elem) => (
                            <div
                              key={elem.id}
                              style={{
                                left: `${elem.x}%`,
                                top: `${elem.y}%`,
                                transform: `rotate(${elem.rotation || 0}deg)`,
                              }}
                              className="absolute select-none z-20"
                            >
                              <span style={{ fontSize: `${elem.fontSize || 38}px` }} className="filter drop-shadow-md">
                                {elem.content}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Scrapbook or Empty Placeholder on Left Page */
                    <div className="relative h-full flex flex-col justify-center items-center">
                      {currentEntryCanvasElements.length > 0 ? (
                        <div className="relative w-full h-[360px] rounded-xl overflow-hidden bg-black/[0.01] dark:bg-white/[0.01]">
                          {currentEntryCanvasElements.map((elem) => (
                            <div
                              key={elem.id}
                              style={{
                                left: `${elem.x}%`,
                                top: `${elem.y}%`,
                                transform: `rotate(${elem.rotation || 0}deg)`,
                                fontFamily: elem.fontFamily || "'Patrick Hand', cursive",
                              }}
                              className="absolute pointer-events-none select-none z-20"
                            >
                              {elem.type === 'sticky' && (
                                <div
                                  style={{ 
                                    backgroundColor: elem.color || '#fef08a',
                                    width: elem.width ? `${elem.width}px` : '180px',
                                    fontSize: `${elem.fontSize || 13}px`,
                                  }}
                                  className="p-3.5 rounded shadow-md text-neutral-900 font-handwriting leading-snug"
                                >
                                  <div className="washi-tape absolute -top-2.5 left-1/2 -translate-x-1/2 w-12 h-3.5 -rotate-2" />
                                  <div className="whitespace-pre-wrap">{elem.content}</div>
                                </div>
                              )}
                              {elem.type === 'image' && (
                                <div className="polaroid-card w-40 sm:w-44 transform hover:scale-105 transition-transform shadow-md">
                                  <div className="washi-tape absolute -top-2.5 left-1/2 -translate-x-1/2 w-14 h-3.5 -rotate-2" />
                                  <img src={elem.content} alt="Memory" className="w-full h-28 object-cover rounded" />
                                </div>
                              )}
                              {elem.type === 'sticker' && (
                                <span style={{ fontSize: `${elem.fontSize || 38}px` }} className="filter drop-shadow-md">
                                  {elem.content}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* Polaroid placeholder on left */
                        <div className="flex flex-col items-center justify-center p-6 text-center">
                          <div className="polaroid-card w-52 mb-4 transform -rotate-2 shadow-lg">
                            <div className="washi-tape absolute -top-2.5 left-1/2 -translate-x-1/2 w-14 h-3.5 -rotate-3" />
                            <div className="w-full h-36 bg-neutral-100 dark:bg-neutral-800 rounded flex items-center justify-center text-neutral-400">
                              <BookOpen className="w-8 h-8 opacity-40" />
                            </div>
                            <p className="text-[11px] font-handwriting text-neutral-600 mt-2 text-center">
                              Memories & Notes
                            </p>
                          </div>
                          <button
                            onClick={() => currentEntry && navigate(`/app/entry/${currentEntry.id}/edit`)}
                            className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white underline underline-offset-4 transition-colors"
                          >
                            Add photos, notes or write on this page
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Left Page Bottom Footer Stamp */}
                  <div className="pt-6 mt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs text-neutral-400 font-mono">
                    <span>Journify {currentEntryParsedLeftText ? 'Written Page' : 'Scrapbook'}</span>
                    <span>Page {currentPageIndex * 2 + 1}</span>
                  </div>
                </div>

                {/* RIGHT PAGE SPREAD: Clean Journal Writing, Date, Mood & Text */}
                <div className="w-full md:w-1/2 pl-0 md:pl-10 pt-6 flex flex-col justify-between relative">
                  <div>
                    {/* Date badge */}
                    <div className="inline-block px-2.5 py-1 rounded-md bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 font-mono text-xs mb-3">
                      {currentEntry ? new Date(currentEntry.created_at).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : ''}
                    </div>

                    {/* Title */}
                    <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white leading-tight mb-4">
                      {currentEntry?.title || 'Untitled Entry'}
                    </h2>

                    {/* Mood / Emotion Accent */}
                    {currentEntry?.mood && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 mb-4">
                        <span>Mood:</span>
                        <span className="font-semibold capitalize">{currentEntry.mood}</span>
                      </div>
                    )}

                    {/* Journal Text Content (with full Markdown support) */}
                    <div className="text-sm sm:text-base leading-relaxed text-neutral-800 dark:text-neutral-200 font-serif">
                      <MarkdownRenderer content={currentEntryParsedText} />
                    </div>
                  </div>

                  {/* Right Page Bottom Footer Stamp */}
                  <div className="pt-6 mt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs text-neutral-400 font-mono">
                    <span>Volume: {isDailyMonth ? `${currentMonthName}` : (book?.title || 'Personal')}</span>
                    <span>Page {currentPageIndex * 2 + 2}</span>
                  </div>
                </div>

                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* Edit Diary Modal */}
      <AnimatePresence>
        {showEditModal && (
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
                  <h3 className="font-display text-2xl font-bold">Edit Diary Cover & Title</h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    Update the title or select a fresh cover artwork.
                  </p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Scrollable Body */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Book Title
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="e.g. The Language of Letters"
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
                    value={editSubtitle}
                    onChange={(e) => setEditSubtitle(e.target.value)}
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
                        onClick={() => setEditCover(c.cover)}
                        className={`cursor-pointer rounded-lg overflow-hidden border-2 aspect-[1/1.3] relative transition-all ${
                          editCover === c.cover 
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
                    ref={editFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleEditFileUpload}
                    className="hidden"
                  />
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 transition-colors shadow-sm"
                    >
                      <Upload className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Choose Computer File</span>
                    </button>
                    {editCover && (
                      <div className="flex items-center gap-2">
                        <img
                          src={editCover}
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
                    value={editCover.startsWith('data:') ? '' : editCover}
                    onChange={(e) => setEditCover(e.target.value)}
                    placeholder={editCover.startsWith('data:') ? 'Custom file uploaded' : 'https://images.unsplash.com/...'}
                    className="w-full px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Modal Sticky Footer */}
              <div className="p-6 pt-3 pb-5 border-t border-neutral-150 dark:border-neutral-800 flex justify-end gap-3 flex-shrink-0 bg-neutral-50/80 dark:bg-neutral-900/80 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveBookEdit}
                  disabled={!editTitle.trim()}
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-black text-white dark:bg-white dark:text-black hover:opacity-90 disabled:opacity-50 transition-opacity shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
