import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { ArrowLeft, Bold, Italic, List, Heading1, Heading2, Code, Image as ImageIcon, CheckSquare, Smile, Tag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { JournalEntryFormData } from '../types/journal';

export default function NewEntryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState<string>('');
  const [mood, setMood] = useState<'joyful' | 'peaceful' | 'sad' | 'angry' | 'anxious' | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [isPrivate, setIsPrivate] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
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
  });

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = async () => {
    if (!user) {
      setError('User authentication is required');
      return;
    }

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!editor?.getHTML() || editor.getHTML() === '<p></p>') {
      setError('Entry content is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const newEntry: JournalEntryFormData = {
        title: title.trim(),
        content: editor.getHTML(),
        mood,
        tags: tags.length > 0 ? tags : undefined,
        is_favorite: isFavorite,
        is_private: isPrivate,
      };

      const { data, error } = await supabase
        .from('journal_entries')
        .insert([{ ...newEntry, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      // Navigate to the appropriate page
      if (data) {
        navigate(`/entry/${data.id}`);
      } else {
        navigate('/');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save entry');
      setSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <ArrowLeft size={18} className="mr-1" />
          <span>Cancel</span>
        </button>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? (
              <>
                <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                Saving...
              </>
            ) : (
              'Save Entry'
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-6">
        {/* Title input */}
        <input
          type="text"
          placeholder="Entry Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full text-3xl font-semibold mb-4 bg-transparent border-0 focus:outline-none focus:ring-0 p-0"
        />

        {/* Mood selector */}
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <Smile size={18} className="mr-2 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">How are you feeling?</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['joyful', 'peaceful', 'sad', 'angry', 'anxious'] as const).map((moodOption) => (
              <button
                key={moodOption}
                className={`px-3 py-1 rounded-full text-sm ${
                  mood === moodOption 
                    ? `bg-mood-${moodOption}/20 text-mood-${moodOption} border-2 border-mood-${moodOption}`
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
                onClick={() => setMood(mood === moodOption ? null : moodOption)}
              >
                {moodOption.charAt(0).toUpperCase() + moodOption.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <Tag size={18} className="mr-2 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Tags</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map((tag) => (
              <div 
                key={tag} 
                className="flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm"
              >
                <span>{tag}</span>
                <button 
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="flex">
            <input
              type="text"
              placeholder="Add a tag..."
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              className="input text-sm flex-1"
            />
            <button 
              onClick={handleAddTag}
              className="ml-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md"
            >
              Add
            </button>
          </div>
        </div>

        {/* Editor menu bar */}
        {editor && (
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4 flex flex-wrap items-center gap-1">
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
        )}

        {/* TipTap editor */}
        <div className="min-h-[300px] prose prose-lg dark:prose-invert max-w-none focus:outline-none">
          <EditorContent editor={editor} />
        </div>
        
        {/* Entry options */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isFavorite}
                onChange={() => setIsFavorite(!isFavorite)}
                className="mr-2 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-300">Mark as favorite</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={() => setIsPrivate(!isPrivate)}
                className="mr-2 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-300">Private entry</span>
            </label>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
