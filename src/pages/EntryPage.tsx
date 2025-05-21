import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { ArrowLeft, Trash2, Edit, Star, Calendar, Clock } from 'lucide-react';
import type { JournalEntry } from '../types/journal';
import { useAuth } from '../contexts/AuthContext';
import { useOfflineSync } from '../hooks/useOfflineSync.fixed';

export default function EntryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchEntries, deleteEntry, updateEntry } = useOfflineSync();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function fetchEntry() {
      if (!id || !user) return;

      try {
        // Get the single entry by ID
        const { data, error } = await fetchEntries(id);

        if (error) {
          throw new Error(`Error fetching entry: ${error.message}`);
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

    fetchEntry();
  }, [id, user, fetchEntries]);
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this journal entry? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      const { error } = await deleteEntry(id!);

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
    if (!entry) return;
    
    try {
      const updatedIsFavorite = !entry.is_favorite;
      
      // Optimistically update UI
      setEntry({
        ...entry,
        is_favorite: updatedIsFavorite
      });
      
      // Update in database
      const { error } = await updateEntry(entry.id, { is_favorite: updatedIsFavorite });
        
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

        {/* Entry content */}
        <div 
          className="prose prose-lg dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: entry.content }}
        />

        {/* Location and weather would appear here */}
        
      </div>
    </motion.div>
  );
}
