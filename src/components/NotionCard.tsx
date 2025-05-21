import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Star, Tag } from 'lucide-react';
import type { JournalEntry } from '../types/journal';

interface NotionCardProps {
  entry: JournalEntry;
  viewType: 'grid' | 'list';
}

export default function NotionCard({ entry, viewType }: NotionCardProps) {
  const moodEmojis = {
    joyful: '😊',
    peaceful: '😌',
    sad: '😔',
    angry: '😠',
    anxious: '😰'
  };

  const moodEmoji = entry.mood ? moodEmojis[entry.mood as keyof typeof moodEmojis] || '📝' : '📝';
  
  return (
    <Link to={`/entry/${entry.id}`} className="block group">
      <div className={`notion-card ${viewType === 'list' ? 'flex items-start' : ''}`}>
        <div className={`${viewType === 'list' ? 'flex-1' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="w-5 h-5 rounded mr-2.5 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-xs">
                {moodEmoji}
              </div>
              <h3 className="font-medium text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {entry.title}
              </h3>
            </div>
            {entry.is_favorite && (
              <Star size={16} className="text-yellow-500 fill-yellow-500" />
            )}
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 pl-7">
            {format(new Date(entry.created_at), 'MMM d, yyyy')}
          </div>
          
          <div className="notion-text text-sm line-clamp-3 pl-7">
            {entry.content.replace(/<[^>]*>/g, '').substring(0, viewType === 'list' ? 160 : 100)}
            {entry.content.length > (viewType === 'list' ? 160 : 100) ? '...' : ''}
          </div>
          
          {(entry.tags && entry.tags.length > 0) && (
            <div className="mt-3 flex flex-wrap gap-1.5 pl-7">
              {entry.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700/60 rounded-full text-gray-600 dark:text-gray-300 flex items-center">
                  <Tag className="h-2.5 w-2.5 mr-1" />
                  {tag}
                </span>
              ))}
              {entry.tags.length > 3 && (
                <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700/60 rounded-full text-gray-600 dark:text-gray-300">
                  +{entry.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
