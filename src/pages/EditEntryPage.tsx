import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Document from '@tiptap/extension-document';
import Text from '@tiptap/extension-text';
import Paragraph from '@tiptap/extension-paragraph';
import Heading from '@tiptap/extension-heading';
import BulletList from '@tiptap/extension-bullet-list';
import ListItem from '@tiptap/extension-list-item';
import Image from '@tiptap/extension-image';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { ArrowLeft, Bold, Italic, List, Heading1, Heading2, Code, Image as ImageIcon, CheckSquare, Smile, Tag, Loader } from 'lucide-react';
import type { JournalEntry, JournalEntryFormData } from '../types/journal';
import { useAuth } from '../contexts/AuthContext';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { supabase } from '../lib/supabase';

export default function EditEntryPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { updateEntry, isOnline } = useOfflineSync();
  
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [title, setTitle] = useState<string>('');
  const [mood, setMood] = useState<'joyful' | 'peaceful' | 'sad' | 'angry' | 'anxious' | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [isPrivate, setIsPrivate] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState<string>('');
  
  // TipTap editor setup
  const editor = useEditor({
    extensions: [
      Document,
      Text,
      Paragraph,
      StarterKit,
      Heading.configure({
        levels: [1, 2, 3],
      }),
      BulletList,
      ListItem,
      Image,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      TextStyle,
      Color,
    ],
    content: '',
    autofocus: false,
  });
  
  // Fetch the entry data on mount
  useEffect(() => {
    async function fetchEntry() {
      if (!id || !user) return;
      
      try {
        setLoading(true);
        
        // Try to get from local storage first when offline
        let entryData: JournalEntry | null = null;
        
        if (!isOnline) {
          const localEntries = localStorage.getItem('offlineEntries');
          if (localEntries) {
            const entries = JSON.parse(localEntries) as JournalEntry[];
            entryData = entries.find(e => e.id === id) || null;
          }
        }
        
        // If not found locally or online, fetch from Supabase
        if (!entryData && isOnline) {
          const { data, error } = await supabase
            .from('journal_entries')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();
          
          if (error) throw error;
          entryData = data;
        }
        
        if (!entryData) {
          throw new Error('Entry not found');
        }
        
        // Populate form fields
        setEntry(entryData);
        setTitle(entryData.title);
        setMood(entryData.mood || null);
        setTags(entryData.tags || []);
        setIsFavorite(entryData.is_favorite);
        setIsPrivate(entryData.is_private);
        
        // Set editor content
        if (editor) {
          editor.commands.setContent(entryData.content);
        }
        
      } catch (err) {
        console.error('Error fetching entry:', err);
        setError('Failed to load journal entry. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchEntry();
  }, [id, user, isOnline, editor]);
  
  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    
    if (!tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
    }
    
    setTagInput('');
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editor || !user || !id) return;
    
    try {
      setSaving(true);
      
      const editorContent = editor.getHTML();
      
      if (!title.trim()) {
        setError('Title is required');
        return;
      }
      
      const updatedEntry: JournalEntryFormData = {
        title: title.trim(),
        content: editorContent,
        mood,
        tags,
        is_favorite: isFavorite,
        is_private: isPrivate,
      };
      
      const { error } = await updateEntry(id, updatedEntry);
      
      if (error) throw error;
      
      navigate(`/entry/${id}`);
    } catch (err) {
      console.error('Error updating entry:', err);
      setError('Failed to update journal entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <div className="animate-pulse-slow">
          <Loader className="w-16 h-16 animate-spin text-primary-500" />
        </div>
      </div>
    );
  }
  
  if (error || !entry) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 mb-4">{error || 'Entry not found'}</p>
        <button 
          onClick={() => navigate(-1)} 
          className="btn btn-primary"
        >
          Go Back
        </button>
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto p-4 max-w-4xl"
    >
      <div className="mb-6 flex justify-between items-center">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center text-gray-600 dark:text-gray-300 hover:text-primary-500"
        >
          <ArrowLeft size={20} className="mr-1" />
          <span>Back</span>
        </button>
        
        <h1 className="text-2xl font-bold text-center">Edit Journal Entry</h1>
        
        <div className="w-20"></div> {/* Empty div for flex spacing */}
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block mb-2 text-sm font-medium">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input w-full"
            placeholder="Give your entry a title"
            required
          />
        </div>
        
        <div>
          <label className="block mb-2 text-sm font-medium">How are you feeling?</label>
          <div className="flex flex-wrap gap-3">
            {['joyful', 'peaceful', 'sad', 'angry', 'anxious'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMood(m as any)}
                className={`px-4 py-2 rounded-full text-white transition-transform 
                ${mood === m ? 'ring-2 ring-offset-2 scale-110' : 'opacity-70 hover:opacity-100'} 
                ${m === 'joyful' ? 'bg-mood-joyful' : ''}
                ${m === 'peaceful' ? 'bg-mood-peaceful' : ''}
                ${m === 'sad' ? 'bg-mood-sad' : ''}
                ${m === 'angry' ? 'bg-mood-angry' : ''}
                ${m === 'anxious' ? 'bg-mood-anxious' : ''}`}
              >
                <span className="flex items-center">
                  <Smile size={18} className="mr-2" />
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </span>
              </button>
            ))}
            
            {mood && (
              <button
                type="button"
                onClick={() => setMood(null)}
                className="px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        
        <div>
          <label className="block mb-2 text-sm font-medium">Tags</label>
          <div className="flex items-center">
            <div className="relative flex-grow">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="input w-full pr-10"
                placeholder="Add tags (press Enter)"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <Tag size={18} className="text-gray-400" />
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddTag}
              className="ml-2 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
            >
              Add
            </button>
          </div>
          
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <div key={tag} className="inline-flex items-center bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                  <span className="mr-1 text-sm">{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-gray-500 hover:text-red-500"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div>
          <label className="block mb-2 text-sm font-medium">Content</label>
          {editor && (
            <div className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-800 p-2 border-b border-gray-300 dark:border-gray-700 flex flex-wrap gap-2">
                <button
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={`p-2 rounded ${editor.isActive('bold') ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800'}`}
                  title="Bold"
                >
                  <Bold size={18} />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={`p-2 rounded ${editor.isActive('italic') ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800'}`}
                  title="Italic"
                >
                  <Italic size={18} />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                  className={`p-2 rounded ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800'}`}
                  title="Heading 1"
                >
                  <Heading1 size={18} />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={`p-2 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800'}`}
                  title="Heading 2"
                >
                  <Heading2 size={18} />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  className={`p-2 rounded ${editor.isActive('bulletList') ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800'}`}
                  title="Bullet List"
                >
                  <List size={18} />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleTaskList().run()}
                  className={`p-2 rounded ${editor.isActive('taskList') ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800'}`}
                  title="Task List"
                >
                  <CheckSquare size={18} />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                  className={`p-2 rounded ${editor.isActive('codeBlock') ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800'}`}
                  title="Code Block"
                >
                  <Code size={18} />
                </button>
                <button
                  onClick={() => {
                    const url = window.prompt('Enter image URL')
                    if (url) {
                      editor.chain().focus().setImage({ src: url }).run()
                    }
                  }}
                  className="p-2 rounded bg-gray-100 dark:bg-gray-800"
                  title="Insert Image"
                >
                  <ImageIcon size={18} />
                </button>
              </div>
              
              <EditorContent 
                editor={editor} 
                className="prose dark:prose-invert max-w-none p-4 min-h-[300px] focus:outline-none" 
              />
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-4 mt-4">
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isFavorite}
              onChange={() => setIsFavorite(!isFavorite)}
              className="sr-only peer"
            />
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-500"></div>
            <span className="ms-3 text-sm font-medium">Mark as favorite</span>
          </label>
          
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={() => setIsPrivate(!isPrivate)}
              className="sr-only peer"
            />
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-500"></div>
            <span className="ms-3 text-sm font-medium">Private entry</span>
          </label>
        </div>
        
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
            disabled={saving}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="btn btn-primary px-6 py-2 flex items-center"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader size={18} className="animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
