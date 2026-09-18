import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Trash2, 
  Edit, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  Image as ImageIcon,
  BookOpen,
  Tag,
  Sparkles
} from 'lucide-react';
import type { JournalEntry } from '../types/journal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { sanitizeHtml } from '../lib/security';

const MOOD_MAP: Record<string, { bg: string; text: string; emoji: string }> = {
  joyful:   { bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800', text: 'Joyful', emoji: '😊' },
  peaceful: { bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', text: 'Peaceful', emoji: '😌' },
  sad:      { bg: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800', text: 'Sad', emoji: '😔' },
  angry:    { bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800', text: 'Angry', emoji: '😠' },
  anxious:  { bg: 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800', text: 'Anxious', emoji: '😰' },
};

export default function EntryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [spreadIndex, setSpreadIndex] = useState(0);

  useEffect(() => {
    async function fetchEntry() {
      if (!id || !user) return;

      try {
        const { data, error } = await supabase
          .from('journal_entries')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Entry not found');

        setEntry(data as JournalEntry);
      } catch (error) {
        console.error(error);
        setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      }
    }

    if (user) fetchEntry();
  }, [id, user]);

  const handleDelete = async () => {
    if (!user) return;
    if (!window.confirm('Are you sure you want to delete this journal entry? This action cannot be undone.')) return;

    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      navigate('/', { replace: true });
    } catch (error) {
      console.error(error);
      setError(error instanceof Error ? error.message : 'Failed to delete the entry');
      setIsDeleting(false);
    }
  };

  const toggleFavorite = async () => {
    if (!entry || !user) return;
    
    try {
      const updatedIsFavorite = !entry.is_favorite;
      setEntry({
        ...entry,
        is_favorite: updatedIsFavorite
      });
      
      const { error } = await supabase
        .from('journal_entries')
        .update({ is_favorite: updatedIsFavorite })
        .eq('id', entry.id)
        .eq('user_id', user.id);
        
      if (error) {
        setEntry({
          ...entry,
          is_favorite: !updatedIsFavorite
        });
        throw error;
      }
    } catch (error) {
      console.error(error);
      setError(error instanceof Error ? error.message : 'Failed to update favorite status');
    }
  };

  // Extract embedded images from HTML content or attachments
  const extractedImages = useMemo(() => {
    if (!entry) return [];
    const imgs: string[] = [];
    if (entry.images && Array.isArray(entry.images)) {
      imgs.push(...entry.images);
    }
    const regex = /<img[^>]+src=["']([^"']+)["']/gi;
    let match;
    while ((match = regex.exec(entry.content || '')) !== null) {
      if (match[1] && !imgs.includes(match[1])) {
        imgs.push(match[1]);
      }
    }
    return imgs;
  }, [entry]);

  // Break content into pages for pagination/flipping
  const contentPages = useMemo(() => {
    if (!entry || !entry.content) return ['<p class="text-neutral-400 italic">No notes recorded on this page.</p>'];

    // Clean inline images from text flow so they appear on the visual page
    const textWithoutImgs = entry.content.replace(/<img[^>]*>/gi, '');

    // Split paragraphs into chunks that fit comfortably on a book page
    const pMatches = textWithoutImgs.match(/<p>.*?<\/p>|<h2>.*?<\/h2>|<h3>.*?<\/h3>|<ul>.*?<\/ul>|<ol>.*?<\/ol>|<blockquote>.*?<\/blockquote>|<pre>.*?<\/pre>/gis);

    if (!pMatches || pMatches.length === 0) {
      // Fallback: chunk by character length if no tags
      const raw = textWithoutImgs.trim();
      if (!raw) return ['<p class="text-neutral-400 italic">Empty page.</p>'];
      const chunkSize = 650;
      const chunks: string[] = [];
      for (let i = 0; i < raw.length; i += chunkSize) {
        chunks.push(`<p>${raw.slice(i, i + chunkSize)}</p>`);
      }
      return chunks;
    }

    const pages: string[] = [];
    let currentPage = '';
    let currentLen = 0;
    const MAX_PAGE_LEN = 600;

    for (const block of pMatches) {
      const blockTextLen = block.replace(/<[^>]*>/g, '').length;
      if (currentLen + blockTextLen > MAX_PAGE_LEN && currentPage) {
        pages.push(currentPage);
        currentPage = block;
        currentLen = blockTextLen;
      } else {
        currentPage += block;
        currentLen += blockTextLen;
      }
    }

    if (currentPage) {
      pages.push(currentPage);
    }

    return pages.length > 0 ? pages : ['<p class="text-neutral-400 italic">Empty page.</p>'];
  }, [entry]);

  const totalSpreads = contentPages.length;

  const handleNextPage = () => {
    if (spreadIndex < totalSpreads - 1) {
      setSpreadIndex((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (spreadIndex > 0) {
      setSpreadIndex((prev) => prev - 1);
    }
  };

  // Keyboard navigation for page turning (Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        handleNextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        handlePrevPage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [spreadIndex, totalSpreads]);

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <button 
          onClick={() => navigate('/')} 
          className="mb-6 flex items-center text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <ArrowLeft size={16} className="mr-1" />
          <span>Back to journal</span>
        </button>
        
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-xl text-xs">
          <h2 className="font-semibold text-red-700 dark:text-red-400 mb-1">Error</h2>
          <p className="text-red-600 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const entryDate = new Date(entry.created_at);
  const moodInfo = entry.mood ? MOOD_MAP[entry.mood] : null;
  const currentImage = extractedImages[spreadIndex % (extractedImages.length || 1)] || null;

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 pb-20 select-none">
      
      {/* ── Top Bar Controls ── */}
      <div className="flex items-center justify-between gap-4 mb-5">
        {/* Back and Page navigation */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/journals')} 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Back to journals</span>
          </button>

          {/* Book Page Turner Controller */}
          <div className="flex items-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-1.5 py-1 text-xs">
            <button
              onClick={handlePrevPage}
              disabled={spreadIndex === 0}
              className="p-1 rounded text-neutral-500 hover:text-black dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Previous Page (Left Arrow)"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-2.5 font-mono text-[11px] text-neutral-600 dark:text-neutral-400 font-medium whitespace-nowrap">
              Page {spreadIndex + 1} of {totalSpreads}
            </span>
            <button
              onClick={handleNextPage}
              disabled={spreadIndex >= totalSpreads - 1}
              className="p-1 rounded text-neutral-500 hover:text-black dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Next Page (Right Arrow)"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleFavorite} 
            className={`p-2 rounded-lg border transition ${
              entry.is_favorite 
                ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' 
                : 'text-neutral-500 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
            aria-label={entry.is_favorite ? "Remove from favorites" : "Add to favorites"}
            title="Favorite"
          >
            <Star size={15} className={entry.is_favorite ? "fill-amber-500" : ""} />
          </button>

          <button 
            onClick={() => navigate(`/entry/${id}/edit`)} 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition shadow-xs"
          >
            <Edit size={13} />
            <span>Edit This Page</span>
          </button>

          <button 
            onClick={handleDelete} 
            disabled={isDeleting}
            className="p-2 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-40 transition"
            title="Delete Entry"
          >
            {isDeleting ? (
              <span className="inline-block h-3.5 w-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Trash2 size={15} />
            )}
          </button>
        </div>
      </div>

      {/* ── THE BOOK CONTAINER (Two-Page Spread Design) ── */}
      <div className="relative w-full rounded-2xl md:rounded-[28px] p-2 sm:p-4 md:p-6 bg-neutral-100 dark:bg-[#121214] border border-neutral-200/90 dark:border-[#242428] shadow-2xl shadow-black/10 dark:shadow-black/50">
        
        {/* Book Outer Spine Depth Effects */}
        <div className="relative rounded-xl md:rounded-[20px] bg-white dark:bg-[#18181b] border border-neutral-200 dark:border-[#2c2c32] shadow-inner overflow-hidden flex flex-col md:flex-row min-h-[560px] md:min-h-[620px]">
          
          {/* Middle Spine Shadow Groove for PC */}
          <div className="hidden md:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[30px] z-20 pointer-events-none bg-gradient-to-r from-black/[0.07] via-black/[0.18] to-black/[0.07] dark:from-black/40 dark:via-black/70 dark:to-black/40" />

          {/* ── LEFT PAGE: Written Text Content ── */}
          <div className="flex-1 p-6 sm:p-8 md:p-10 flex flex-col justify-between relative border-b md:border-b-0 md:border-r border-neutral-100 dark:border-[#27272a] bg-gradient-to-br from-white via-neutral-50/40 to-neutral-100/20 dark:from-[#18181b] dark:via-[#19191d] dark:to-[#161619]">
            
            {/* Left Page Header */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-4 pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <span>{format(entryDate, 'MMMM yyyy')}</span>
                <span>SPREAD #{spreadIndex + 1}</span>
              </div>

              {/* Date & Mood Pills */}
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700/80">
                  {format(entryDate, 'EEEE, MMMM d')}
                </span>
                {moodInfo && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${moodInfo.bg}`}>
                    <span>{moodInfo.emoji}</span>
                    <span>{moodInfo.text}</span>
                  </span>
                )}
              </div>

              {/* Entry Title */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-6 leading-tight">
                {entry.title || 'Untitled Note'}
              </h1>

              {/* Page Content with Book Animation */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`text-page-${spreadIndex}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="prose prose-neutral dark:prose-invert max-w-none text-neutral-800 dark:text-neutral-200 text-sm sm:text-base leading-relaxed font-serif"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(contentPages[spreadIndex]) }}
                />
              </AnimatePresence>
            </div>

            {/* Left Page Footer */}
            <div className="pt-6 mt-8 border-t border-neutral-100 dark:border-neutral-850 flex items-center justify-between text-[11px] font-mono text-neutral-400 dark:text-neutral-500">
              <span>Volume: {format(entryDate, 'MMMM')}</span>
              <span>Page {(spreadIndex * 2) + 1}</span>
            </div>
          </div>

          {/* ── RIGHT PAGE: Media Polaroid, Tags, & Visual Showcase ── */}
          <div className="flex-1 p-6 sm:p-8 md:p-10 flex flex-col justify-between relative bg-gradient-to-bl from-white via-neutral-50/40 to-neutral-100/20 dark:from-[#18181b] dark:via-[#19191d] dark:to-[#161619]">
            
            {/* Right Page Header */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-4 pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <span>{format(entryDate, 'MMM d, yyyy · h:mm a')}</span>
                <span>PAGE #{(spreadIndex * 2) + 2}</span>
              </div>

              {/* Tags Section */}
              {entry.tags && entry.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mb-6">
                  {entry.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700/60"
                    >
                      <Tag size={10} className="text-neutral-400" />
                      <span>#{tag}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Centerpiece: Polaroid Photo or Memory Keepsake Plate */}
              <div className="flex flex-col items-center justify-center my-6 sm:my-8">
                <AnimatePresence mode="wait">
                  {currentImage ? (
                    <motion.div
                      key={`img-${spreadIndex}`}
                      initial={{ opacity: 0, rotate: -2, scale: 0.94 }}
                      animate={{ opacity: 1, rotate: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.94 }}
                      transition={{ duration: 0.3 }}
                      className="relative w-full max-w-[280px] sm:max-w-[320px] bg-white dark:bg-[#202024] p-3 pb-5 rounded-xl shadow-xl shadow-black/15 dark:shadow-black/60 border border-neutral-200 dark:border-neutral-700 hover:rotate-0 transition-transform duration-300"
                    >
                      {/* Decorative Gold Tape on Top */}
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-16 h-5 bg-amber-200/70 dark:bg-amber-300/30 backdrop-blur-xs rounded-xs rotate-[-1deg] border border-amber-300/40 shadow-xs z-10" />

                      <div className="w-full h-52 sm:h-60 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                        <img
                          src={currentImage}
                          alt="Journal memory attachment"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="mt-3 text-center">
                        <span className="text-xs font-serif italic text-neutral-600 dark:text-neutral-300 font-medium">
                          Memories & Moments
                        </span>
                      </div>
                    </motion.div>
                  ) : (
                    /* Default Book Keepsake Polaroid Frame */
                    <motion.div
                      key="no-img"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative w-full max-w-[270px] sm:max-w-[300px] bg-white dark:bg-[#202024] p-3 pb-5 rounded-xl shadow-lg shadow-black/10 dark:shadow-black/50 border border-neutral-200 dark:border-neutral-700"
                    >
                      {/* Decorative Tape */}
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-16 h-5 bg-amber-200/70 dark:bg-amber-300/30 backdrop-blur-xs rounded-xs rotate-[1deg] border border-amber-300/40 shadow-xs z-10" />

                      <div className="w-full h-44 sm:h-52 rounded-lg bg-neutral-50 dark:bg-neutral-850 border border-dashed border-neutral-200 dark:border-neutral-700/80 flex flex-col items-center justify-center text-center p-4">
                        <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 dark:text-neutral-500 mb-2">
                          <BookOpen size={22} />
                        </div>
                        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                          Memories & Notes
                        </span>
                        <p className="text-[11px] text-neutral-400 mt-1">
                          A quiet space reserved for your reflections.
                        </p>
                      </div>

                      <div className="mt-3 text-center">
                        <button
                          onClick={() => navigate(`/entry/${id}/edit`)}
                          className="text-[11px] text-neutral-500 hover:text-black dark:hover:text-white underline transition"
                        >
                          Add photos, stickers & thoughts to this page
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right Page Footer */}
            <div className="pt-6 mt-8 border-t border-neutral-100 dark:border-neutral-850 flex items-center justify-between text-[11px] font-mono text-neutral-400 dark:text-neutral-500">
              <span>Journify Volume Spread</span>
              <span>Page {(spreadIndex * 2) + 2}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

