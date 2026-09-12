import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { JournalEntry, DiaryBook } from '../types/journal';
import NotionCard from '../components/NotionCard';

export default function BookPagesView() {
  const { bookId, year, month } = useParams<{ bookId?: string; year?: string; month?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [book, setBook] = useState<DiaryBook | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

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
          .order('created_at', { ascending: false });

        setEntries(data || []);
      } else if (bookId) {
        // Custom Diary Book
        const stored = localStorage.getItem(`journify_books_${user?.id}`);
        if (stored) {
          const list: DiaryBook[] = JSON.parse(stored);
          const current = list.find(b => b.id === bookId);
          if (current) setBook(current);
        }

        // Fetch entries tagged or linked to this book
        const { data } = await supabase
          .from('journal_entries')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false });

        if (data) {
          // Filter either by book_id or matching tag
          const filtered = data.filter(e => e.book_id === bookId || (book && e.tags?.includes(book.title)));
          setEntries(filtered);
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

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 min-h-screen text-neutral-900 dark:text-neutral-100">
      {/* Top Header Back Navigation */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <button
          onClick={() => navigate('/app/library')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Shelf</span>
        </button>

        <button
          onClick={handleWriteNewPage}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Write in this Book</span>
        </button>
      </div>

      {/* Book Presentation Banner */}
      <div className="mb-12 p-6 sm:p-8 rounded-3xl bg-neutral-100/80 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center gap-6 shadow-sm">
        {/* Book Cover Thumbnail */}
        <div className="book-cover-3d w-28 sm:w-32 aspect-[1/1.4] overflow-hidden rounded-md flex-shrink-0 shadow-md">
          <div className="book-spine-hinge" />
          <img
            src={book?.cover_url || (isDailyMonth ? 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80' : 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80')}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Book Meta */}
        <div className="flex-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 mb-2">
            {isDailyMonth ? `Daily Journal • ${year}` : 'Custom Diary'}
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {isDailyMonth ? `${currentMonthName} ${year}` : (book?.title || 'Diary')}
          </h1>
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

      {/* Pages List */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">
            Pages in this Book
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-20 text-neutral-400">Loading pages...</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 p-8 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800">
            <BookOpen className="w-10 h-10 mx-auto text-neutral-400 mb-3" />
            <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">This book has no pages yet</h3>
            <p className="text-xs text-neutral-500 mt-1 mb-5">Open your quill and write your first entry for this journal.</p>
            <button
              onClick={handleWriteNewPage}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-black text-white dark:bg-white dark:text-black hover:opacity-90"
            >
              Write First Page
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {entries.map((entry) => (
              <NotionCard key={entry.id} entry={entry} viewType="grid" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
