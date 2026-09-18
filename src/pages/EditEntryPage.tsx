import { useState, useEffect, useCallback, useRef } from 'react';
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
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';

import { 
  ArrowLeft, 
  Bold, 
  Italic, 
  List, 
  Heading1, 
  Heading2, 
  Heading3, 
  Code, 
  CheckSquare, 
  Smile, 
  Tag, 
  Link2, 
  Table as TableIcon, 
  Highlighter, 
  Minus, 
  Quote, 
  Check, 
  Cloud, 
  History, 
  Paperclip
} from 'lucide-react';
import type { JournalEntry } from '../types/journal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { SyncEngine } from '../services/syncEngine';
import { validateFileUpload, sanitizeUploadFileName } from '../lib/security';
import { DraftService } from '../services/draftService';
import type { VersionSnapshot } from '../services/draftService';
import SlashCommandMenu from '../components/SlashCommandMenu';
import VersionHistoryModal from '../components/VersionHistoryModal';

export default function EditEntryPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [title, setTitle] = useState<string>('');
  const [mood, setMood] = useState<'joyful' | 'peaceful' | 'sad' | 'angry' | 'anxious' | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [isPrivate, setIsPrivate] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState<string>('');

  // Auto-save sync status
  const [syncStatus, setSyncStatus] = useState<'idle' | 'typing' | 'saving' | 'saved' | 'error'>('saved');
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<string>('');
  const [recoveryAvailable, setRecoveryAvailable] = useState<boolean>(false);
  const [recoveredDraft, setRecoveredDraft] = useState<VersionSnapshot | null>(null);

  // Slash commands state
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashPosition, setSlashPosition] = useState({ top: 0, left: 0 });
  const [slashQuery, setSlashQuery] = useState('');

  // Version history modal state
  const [historyOpen, setHistoryOpen] = useState(false);
  const [versionSnapshots, setVersionSnapshots] = useState<VersionSnapshot[]>([]);

  // Attachments
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadedRef = useRef(false);

  // TipTap editor setup
  const editor = useEditor({
    extensions: [
      Document,
      Text,
      Paragraph,
      StarterKit.configure({
        document: false,
        paragraph: false,
        text: false,
        heading: false,
        bulletList: false,
        listItem: false,
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      BulletList,
      ListItem,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      TextStyle,
      Color,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 dark:text-blue-400 underline underline-offset-2',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full my-4 border border-gray-200 dark:border-gray-700',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-neutral-800 font-semibold p-2',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-200 dark:border-gray-700 p-2',
        },
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Placeholder.configure({
        placeholder: "Write your thoughts... Type '/' for commands",
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      const selection = editor.state.selection;
      const textBefore = editor.state.doc.textBetween(
        Math.max(0, selection.from - 20),
        selection.from,
        '\n'
      );

      const slashMatch = textBefore.match(/\/([a-zA-Z0-9]*)$/);
      if (slashMatch) {
        setSlashQuery(slashMatch[1]);
        const coords = editor.view.coordsAtPos(selection.from);
        setSlashPosition({
          top: coords.bottom + 8,
          left: Math.max(16, coords.left),
        });
        setSlashOpen(true);
      } else {
        setSlashOpen(false);
      }

      triggerAutoSave();
    },
  });

  // Fetch initial entry
  useEffect(() => {
    async function fetchEntry() {
      if (!id || !user) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('journal_entries')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Entry not found');

        setEntry(data);
        setTitle(data.title);
        setMood(data.mood || null);
        setTags(data.tags || []);
        setIsFavorite(data.is_favorite);
        setIsPrivate(data.is_private);

        if (editor) {
          editor.commands.setContent(data.content);
        }

        // Check if there is an unsaved local draft newer than server version
        const draft = DraftService.getDraft(id);
        if (draft && draft.content && draft.content !== data.content) {
          setRecoveryAvailable(true);
          setRecoveredDraft({
            id: 'edit_recovery',
            timestamp: draft.lastSavedAt,
            title: draft.title,
            content: draft.content,
            mood: draft.mood,
            tags: draft.tags,
            wordCount: draft.content.length,
          });
          setVersionSnapshots(draft.versionHistory || []);
        }

        isLoadedRef.current = true;
      } catch (err: any) {
        console.error('Error loading entry:', err);
        setError('Failed to load journal entry.');
      } finally {
        setLoading(false);
      }
    }

    fetchEntry();
  }, [id, user, editor]);

  // The central Auto-Save pipeline
  const triggerAutoSave = useCallback(() => {
    if (!isLoadedRef.current || !id || !user) return;

    setSyncStatus('typing');

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      const currentContent = editor?.getHTML() || '';
      const currentTitle = title.trim();

      // 1. Save local draft
      DraftService.saveDraft(id, {
        title: currentTitle,
        content: currentContent,
        mood,
        tags,
      });

      setSyncStatus('saving');

      // 2. Sync via SyncEngine: optimistic IndexedDB update + sync queue
      try {
        await SyncEngine.updateEntryOptimistic(user.id, id, {
          title: currentTitle || 'Untitled Entry',
          content: currentContent,
          mood,
          tags: tags.length > 0 ? tags : undefined,
          is_favorite: isFavorite,
          is_private: isPrivate,
        });

        setSyncStatus('saved');
        setLastSavedTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch (err) {
        console.error('Autosave error:', err);
        setSyncStatus('error');
      }
    }, 600);
  }, [id, user, title, editor, mood, tags, isFavorite, isPrivate]);

  useEffect(() => {
    if (isLoadedRef.current) {
      triggerAutoSave();
    }
  }, [title, mood, tags, isFavorite, isPrivate, triggerAutoSave]);

  const handleRestoreDraft = (snapshot: VersionSnapshot) => {
    setTitle(snapshot.title);
    if (snapshot.mood) setMood(snapshot.mood as any);
    if (snapshot.tags) setTags(snapshot.tags);
    if (editor) {
      editor.commands.setContent(snapshot.content);
    }
    setRecoveryAvailable(false);
    setSyncStatus('saved');
  };

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    const file = e.target.files[0];

    const validation = validateFileUpload(file, 10 * 1024 * 1024);
    if (!validation.valid) {
      alert(validation.error || 'Invalid file format');
      return;
    }

    setUploadingMedia(true);
    try {
      const sanitizedName = sanitizeUploadFileName(file.name);
      const filePath = `${user.id}/${sanitizedName}`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { contentType: file.type });

      if (!error && data) {
        const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(data.path);
        const url = publicData?.publicUrl;
        if (url && editor) {
          editor.chain().focus().setImage({ src: url }).run();
          triggerAutoSave();
        }
      }
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleInsertLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL:', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">{error || 'Entry not found'}</p>
        <button onClick={() => navigate(-1)} className="btn btn-primary text-xs">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto px-2 py-4 pb-20 relative"
    >
      {/* Top Floating Action Bar */}
      <div className="flex items-center justify-between mb-6 sticky top-2 z-30 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md py-2.5 px-4 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-sm">
        <button
          onClick={() => navigate(`/entry/${id}`)}
          className="flex items-center text-xs font-medium text-gray-500 hover:text-black dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={14} className="mr-1.5" />
          View Entry
        </button>

        {/* Auto-Save & Sync Status Indicator */}
        <div className="flex items-center space-x-3 text-xs">
          {syncStatus === 'saving' && (
            <span className="flex items-center text-gray-500">
              <Cloud size={14} className="mr-1.5 animate-pulse text-amber-500" />
              Saving changes...
            </span>
          )}
          {syncStatus === 'saved' && (
            <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-medium">
              <Check size={14} className="mr-1 stroke-[2.5]" />
              Saved {lastSavedTimestamp ? `at ${lastSavedTimestamp}` : ''}
            </span>
          )}
          {syncStatus === 'typing' && (
            <span className="flex items-center text-gray-400">
              <Cloud size={14} className="mr-1.5 opacity-60" />
              Unsaved changes
            </span>
          )}

          {/* Version History Button */}
          <button
            type="button"
            onClick={() => {
              const draft = DraftService.getDraft(id);
              setVersionSnapshots(draft?.versionHistory || []);
              setHistoryOpen(true);
            }}
            className="p-1.5 rounded-lg text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
            title="Version history and checkpoints"
          >
            <History size={16} />
          </button>

          <button
            type="button"
            onClick={() => navigate(`/entry/${id}`)}
            className="py-1 px-3 rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-90 transition shadow-sm"
          >
            Done
          </button>
        </div>
      </div>

      {/* Crash Recovery Draft Banner */}
      {recoveryAvailable && recoveredDraft && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs flex items-center justify-between">
          <div>
            <span className="font-semibold text-amber-900 dark:text-amber-200">
              Local draft with unsaved edits found
            </span>
            <p className="text-amber-700 dark:text-amber-300 text-[11px] mt-0.5">
              Saved locally at {new Date(recoveredDraft.timestamp).toLocaleTimeString()}.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleRestoreDraft(recoveredDraft)}
              className="px-2.5 py-1 rounded bg-amber-600 text-white font-medium hover:bg-amber-700 transition"
            >
              Restore Draft
            </button>
            <button
              onClick={() => {
                DraftService.clearDraft(id);
                setRecoveryAvailable(false);
              }}
              className="px-2.5 py-1 rounded border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Main Document Body */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 sm:p-10">
        <input
          type="text"
          placeholder="Untitled"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-3xl sm:text-4xl font-bold tracking-tight mb-6 bg-transparent border-0 focus:outline-none focus:ring-0 p-0 text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-700"
        />

        {/* Toolbar */}
        {editor && (
          <div className="flex flex-wrap items-center gap-1 pb-4 mb-6 border-b border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition ${
                editor.isActive('bold') ? 'bg-gray-200 dark:bg-neutral-700 text-black dark:text-white' : ''
              }`}
              title="Bold"
            >
              <Bold size={15} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition ${
                editor.isActive('italic') ? 'bg-gray-200 dark:bg-neutral-700 text-black dark:text-white' : ''
              }`}
              title="Italic"
            >
              <Italic size={15} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()}
              className={`p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition ${
                editor.isActive('highlight') ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200' : ''
              }`}
              title="Highlight"
            >
              <Highlighter size={15} />
            </button>

            <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1"></div>

            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition ${
                editor.isActive('heading', { level: 1 }) ? 'bg-gray-200 dark:bg-neutral-700 text-black dark:text-white' : ''
              }`}
              title="Heading 1"
            >
              <Heading1 size={15} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition ${
                editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 dark:bg-neutral-700 text-black dark:text-white' : ''
              }`}
              title="Heading 2"
            >
              <Heading2 size={15} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition ${
                editor.isActive('heading', { level: 3 }) ? 'bg-gray-200 dark:bg-neutral-700 text-black dark:text-white' : ''
              }`}
              title="Heading 3"
            >
              <Heading3 size={15} />
            </button>

            <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1"></div>

            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition ${
                editor.isActive('bulletList') ? 'bg-gray-200 dark:bg-neutral-700 text-black dark:text-white' : ''
              }`}
              title="Bullet list"
            >
              <List size={15} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              className={`p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition ${
                editor.isActive('taskList') ? 'bg-gray-200 dark:bg-neutral-700 text-black dark:text-white' : ''
              }`}
              title="Checklist"
            >
              <CheckSquare size={15} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition ${
                editor.isActive('blockquote') ? 'bg-gray-200 dark:bg-neutral-700 text-black dark:text-white' : ''
              }`}
              title="Quote"
            >
              <Quote size={15} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={`p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition ${
                editor.isActive('codeBlock') ? 'bg-gray-200 dark:bg-neutral-700 text-black dark:text-white' : ''
              }`}
              title="Code block"
            >
              <Code size={15} />
            </button>

            <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1"></div>

            <button
              onClick={handleInsertLink}
              className={`p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition ${
                editor.isActive('link') ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : ''
              }`}
              title="Link"
            >
              <Link2 size={15} />
            </button>
            <button
              onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
              title="Table"
            >
              <TableIcon size={15} />
            </button>
            <button
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
              title="Divider"
            >
              <Minus size={15} />
            </button>

            <label className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition cursor-pointer" title="Attachment">
              <input
                type="file"
                accept="image/jpeg, image/png, image/webp, image/gif"
                onChange={handleAttachmentUpload}
                className="hidden"
                disabled={uploadingMedia}
              />
              <Paperclip size={15} className={uploadingMedia ? 'animate-spin' : ''} />
            </label>
          </div>
        )}

        {/* TipTap Canvas */}
        <div className="min-h-[400px] prose prose-neutral dark:prose-invert max-w-none focus:outline-none text-[15px] leading-relaxed">
          <EditorContent editor={editor} />
        </div>

        {/* Slash Command Autocomplete Menu */}
        <SlashCommandMenu
          editor={editor}
          isOpen={slashOpen}
          onClose={() => setSlashOpen(false)}
          position={slashPosition}
          query={slashQuery}
        />

        {/* Metadata section */}
        <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-800 space-y-4">
          <div>
            <div className="flex items-center text-xs font-medium text-gray-500 mb-2">
              <Smile size={14} className="mr-1.5" />
              <span>Mood</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['joyful', 'peaceful', 'sad', 'angry', 'anxious'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMood(mood === m ? null : m)}
                  className={`px-3 py-1 rounded-full text-xs transition ${
                    mood === m
                      ? 'bg-black text-white dark:bg-white dark:text-black font-medium'
                      : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center text-xs font-medium text-gray-500 mb-2">
              <Tag size={14} className="mr-1.5" />
              <span>Tags</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1.5 hover:text-black dark:hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder="Add tag and press Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="text-xs px-2.5 py-1 bg-transparent border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
              />
            </div>
          </div>

          <div className="flex items-center space-x-6 pt-2">
            <label className="inline-flex items-center text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-gray-300 text-black dark:text-white focus:ring-0 mr-2"
              />
              Mark as favorite
            </label>
            <label className="inline-flex items-center text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-gray-300 text-black dark:text-white focus:ring-0 mr-2"
              />
              Strict private entry
            </label>
          </div>
        </div>
      </div>

      {/* Version History Modal */}
      <VersionHistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        versions={versionSnapshots}
        onRestore={handleRestoreDraft}
        currentTitle={title}
      />
    </motion.div>
  );
}
