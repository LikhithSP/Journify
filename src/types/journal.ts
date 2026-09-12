export interface JournalEntry {
  id: string;
  user_id: string;
  title: string;
  content: string;
  mood?: 'joyful' | 'peaceful' | 'sad' | 'angry' | 'anxious' | null;
  tags?: string[];
  created_at: string;
  updated_at: string;
  is_favorite: boolean;
  is_private: boolean;
  location?: {
    name?: string;
    latitude?: number;
    longitude?: number;
  } | null;
  weather?: {
    condition?: string;
    temperature?: number;
    icon?: string;
  } | null;
  images?: string[];
  folder_id?: string | null;
  book_id?: string | null;
}

export interface DiaryBook {
  id: string;
  user_id: string;
  title: string;
  subtitle?: string;
  cover_url?: string;
  spine_color?: string;
  spine_pattern?: 'grid' | 'typography' | 'modern' | 'abstract' | 'minimal' | 'botanical' | 'gradient';
  category?: 'custom' | 'yearly';
  year?: number;
  created_at: string;
  updated_at?: string;
}

export interface JournalEntryFormData {
  title: string;
  content: string;
  mood?: 'joyful' | 'peaceful' | 'sad' | 'angry' | 'anxious' | null;
  tags?: string[];
  is_favorite: boolean;
  is_private: boolean;
  location?: {
    name?: string;
    latitude?: number;
    longitude?: number;
  } | null;
  weather?: {
    condition?: string;
    temperature?: number;
    icon?: string;
  } | null;
  images?: string[];
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
}

export interface UserProfile {
  id: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  settings: {
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    notification_preferences?: {
      email: boolean;
      push: boolean;
    };
  };
}

export interface JournalStats {
  totalEntries: number;
  streak: number;
  thisWeek: number;
  thisMonth: number;
  byMood: Record<string, number>;
  byTag: Record<string, number>;
  wordCount: number;
}
