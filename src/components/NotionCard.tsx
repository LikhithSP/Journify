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
  
  // Pick a random cover image from the provided URLs if no image is present
  const fallbackImages = [
    'https://haystudio.space/wp-content/uploads/2020/08/120Cover203-scaled.jpg',
    'https://i.pinimg.com/736x/b3/d3/f4/b3d3f45a63ce53889454de86c9fea9d0.jpg',
    'https://shopee.sg/blog/wp-content/uploads/2019/01/bullet-journal-ideas-bujo.jpg',
  ];
  const randomFallback = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
  
  return (
    <Link to={`/entry/${entry.id}`} className="block group">
      <div className={`notion-card rounded-xl overflow-hidden shadow-lg bg-gray-50 dark:bg-[rgb(44,44,44)] border border-gray-200 dark:border-gray-700 transition-transform hover:scale-[1.025] hover:shadow-xl duration-150 ${viewType === 'list' ? 'flex items-start' : ''}`}
        style={{ minHeight: viewType === 'grid' ? 220 : undefined }}>
        {/* Image placeholder or cover */}
        {entry.images && entry.images.length > 0 && entry.images[0] ? (
          <img
            src={entry.images[0]}
            alt="Journal cover"
            className="w-full h-32 object-cover object-center border-b border-gray-200 dark:border-gray-700 bg-gray-200 dark:bg-gray-700"
          />
        ) : (
          <img
            src={randomFallback}
            alt="Journal cover"
            className="w-full h-32 object-cover object-center border-b border-gray-200 dark:border-gray-700 bg-gray-200 dark:bg-gray-700"
          />
        )}
        <div className="p-4 flex-1 flex flex-col">
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
            {format(new Date(entry.created_at), 'PPP')}
          </div>
          <div className="notion-text text-sm line-clamp-3 pl-7 mb-2">
            {entry.content.replace(/<[^>]*>/g, '').substring(0, viewType === 'list' ? 160 : 100)}
            {entry.content.length > (viewType === 'list' ? 160 : 100) ? '...' : ''}
          </div>
          {(entry.tags && entry.tags.length > 0) && (
            <div className="mt-auto flex flex-wrap gap-1.5 pl-7">
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
