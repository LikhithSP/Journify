import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { ArrowLeft, Trash2, Edit, Star, Calendar, Clock } from 'lucide-react';
import type { JournalEntry } from '../types/journal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function EntryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error('Entry not found');
        }

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

      if (error) {
        throw error;
      }

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
      
      // Optimistically update UI
      setEntry({
        ...entry,
        is_favorite: updatedIsFavorite
      });
      
      // Update in database
      const { error } = await supabase
        .from('journal_entries')
        .update({ is_favorite: updatedIsFavorite })
        .eq('id', entry.id)
        .eq('user_id', user.id);
        
      if (error) {
        // Revert on error
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
  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate('/')} 
          className="mb-6 flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <ArrowLeft size={18} className="mr-1" />
          <span>Back to journal</span>
        </button>
        
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-md">
          <h2 className="text-lg font-medium text-red-700 dark:text-red-400 mb-2">Error</h2>
          <p className="text-red-600 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!entry) {
    return null; // Should not happen, but TypeScript safety
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <button 
          onClick={() => navigate('/')} 
          className="mb-4 md:mb-0 flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <ArrowLeft size={18} className="mr-1" />
          <span>Back to journal</span>
        </button>
          <div className="flex items-center space-x-2">
          <button 
            onClick={toggleFavorite} 
            className={`p-2 rounded-full ${
              entry.is_favorite 
                ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' 
                : 'text-gray-500 bg-gray-100 dark:bg-gray-800'
            }`}
            aria-label={entry.is_favorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Star size={18} className={entry.is_favorite ? "fill-amber-500" : ""} />
          </button>
          <button 
            onClick={() => navigate(`/entry/${id}/edit`)} 
            className="p-2 rounded-full text-blue-500 bg-blue-50 dark:bg-blue-900/20"
            aria-label="Edit entry"
          >
            <Edit size={18} />
          </button>
          <button 
            onClick={handleDelete} 
            disabled={isDeleting}
            className="p-2 rounded-full text-red-500 bg-red-50 dark:bg-red-900/20 disabled:opacity-50"
            aria-label="Delete entry"
          >
            {isDeleting ? (
              <span className="inline-block h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Trash2 size={18} />
            )}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-4">
            <div className="flex items-center">
              <Calendar size={14} className="mr-1" />
              <span>{format(new Date(entry.created_at), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex items-center">
              <Clock size={14} className="mr-1" />
              <span>{format(new Date(entry.created_at), 'h:mm a')}</span>
            </div>
            {entry.mood && (
              <span className={`px-2 py-1 rounded-full text-xs ${
                entry.mood === 'joyful' ? 'bg-mood-joyful/10 text-mood-joyful' :
                entry.mood === 'peaceful' ? 'bg-mood-peaceful/10 text-mood-peaceful' :
                entry.mood === 'sad' ? 'bg-mood-sad/10 text-mood-sad' :
                entry.mood === 'angry' ? 'bg-mood-angry/10 text-mood-angry' :
                'bg-mood-anxious/10 text-mood-anxious'
              }`}>
                {entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}
              </span>
            )}
          </div>
        </div>

        <h1 className="text-3xl font-semibold mb-6">{entry.title}</h1>

        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {entry.tags.map((tag) => (
              <span 
                key={tag} 
                className="px-3 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Entry content: Check if scrapbook elements or classic HTML */}
        {(() => {
          let scrapbookElements: any[] | null = null;
          if (entry.content && entry.content.trim().startsWith('[')) {
            try {
              const parsed = JSON.parse(entry.content);
              if (Array.isArray(parsed)) {
                scrapbookElements = parsed;
              }
            } catch {
              scrapbookElements = null;
            }
          }

          if (scrapbookElements) {
            return (
              <div className="mt-6">
                {/* Journal Spread View Matching Physical Notebook */}
                <div className="relative w-full aspect-[16/10] min-h-[580px] rounded-2xl bg-[#111113] border border-white/10 shadow-2xl overflow-hidden">
                  {/* Spine Crease */}
                  <div className="journal-center-spine" />

                  {/* Header Stamps */}
                  <div className="absolute top-4 left-6 right-6 flex items-center justify-between text-[11px] font-mono tracking-widest text-neutral-400 uppercase pointer-events-none z-10">
                    <div className="w-1/2 pr-6 flex justify-between">
                      <span>{format(new Date(entry.created_at), 'MMM yyyy').toUpperCase()}</span>
                      <span>JOURNIFY SPREAD</span>
                    </div>
                    <div className="w-1/2 pl-8 flex justify-between">
                      <span>PAGE 1 - 2</span>
                      <span>@{user?.user_metadata?.full_name || 'JOURNIFY'}</span>
                    </div>
                  </div>

                  {/* Elements Display */}
                  {scrapbookElements.map((elem) => {
                    return (
                      <div
                        key={elem.id}
                        style={{
                          left: `${elem.x}%`,
                          top: `${elem.y}%`,
                          width: elem.width ? `${elem.width}px` : undefined,
                          transform: `rotate(${elem.rotation || 0}deg)`,
                          fontFamily: elem.fontFamily || "'Patrick Hand', cursive",
                        }}
                        className="absolute select-text z-30 transition-transform hover:scale-[1.02] duration-150"
                      >
                        {/* Washi Tape Accent */}
                        {(elem.type === 'sticky' || elem.type === 'image') && (
                          <div className="washi-tape absolute -top-3 left-1/2 -translate-x-1/2 w-14 h-4 -rotate-2 rounded-xs pointer-events-none z-40" />
                        )}

                        {/* 1. TEXT BLOCK */}
                        {elem.type === 'text' && (
                          <div 
                            style={{ 
                              fontSize: `${elem.fontSize || 22}px`,
                              width: elem.width ? `${elem.width}px` : undefined,
                              minWidth: '180px',
                              maxWidth: '520px'
                            }}
                            className="p-3 text-neutral-900 dark:text-neutral-100 leading-relaxed whitespace-pre-wrap font-inherit select-text"
                          >
                            {elem.content}
                          </div>
                        )}

                        {/* 2. STICKY NOTE */}
                        {elem.type === 'sticky' && (
                          <div
                            style={{ 
                              backgroundColor: elem.color || '#fef08a',
                              width: elem.width ? `${elem.width}px` : undefined,
                            }}
                            className="p-5 w-56 sm:w-64 shadow-xl rounded-xs text-neutral-900 text-base leading-snug whitespace-pre-wrap font-inherit select-text"
                          >
                            {elem.content}
                          </div>
                        )}

                        {/* 3. POLAROID PICTURE */}
                        {elem.type === 'image' && (
                          <div className="polaroid-card w-44 sm:w-56 shadow-2xl">
                            <img
                              src={elem.content}
                              alt="Journal Pic"
                              className="w-full aspect-[4/3] object-cover rounded-xs"
                            />
                            <div className="mt-2.5 text-center text-[11px] text-neutral-500 font-mono tracking-tight">
                              memories.jpg
                            </div>
                          </div>
                        )}

                        {/* 4. STICKER EMOJI */}
                        {elem.type === 'sticker' && (
                          <div 
                            style={{ fontSize: `${elem.fontSize || 40}px` }}
                            className="filter drop-shadow-md p-1 select-none"
                          >
                            {elem.content}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }

          return (
            <div 
              className="prose prose-lg dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: entry.content }}
            />
          );
        })()}

        {/* Location and weather would appear here */}
        
      </div>
    </motion.div>
  );
}
