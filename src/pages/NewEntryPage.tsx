import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  CloudOff, 
  History, 
  Paperclip, 
  Sparkles,
  Mic,
  X,
  Plus,
  Trash2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { SyncEngine } from '../services/syncEngine';
import { validateFileUpload, sanitizeUploadFileName } from '../lib/security';
import { DraftService } from '../services/draftService';
import type { VersionSnapshot } from '../services/draftService';
import SlashCommandMenu from '../components/SlashCommandMenu';
import VersionHistoryModal from '../components/VersionHistoryModal';
import VoiceJournalModal from '../components/VoiceJournalModal';
import type { JournalEntryFormData } from '../types/journal';

export default function NewEntryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const voiceState = (location.state as any)?.voiceData;

  const [title, setTitle] = useState<string>(() => voiceState?.title || '');
  const [mood, setMood] = useState<'joyful' | 'peaceful' | 'sad' | 'angry' | 'anxious' | null>(() => voiceState?.mood || null);
  const [tags, setTags] = useState<string[]>(() => voiceState?.tags || []);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [isPrivate, setIsPrivate] = useState<boolean>(true);
  const [tagInput, setTagInput] = useState<string>('');
  
  // Auto-save sync status: 'idle' | 'typing' | 'saving' | 'saved' | 'error'
  const [syncStatus, setSyncStatus] = useState<'idle' | 'typing' | 'saving' | 'saved' | 'error'>('saved');
  const [persistedEntryId, setPersistedEntryId] = useState<string | null>(null);
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

  // Voice Journaling modal state
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);

  // File attachments state
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Debounce timers
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  // TipTap editor configuration
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
        placeholder: "Write your thoughts... Type '/' for blocks and commands",
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      // Trigger Slash command detector
      const selection = editor.state.selection;
      const textBefore = editor.state.doc.textBetween(
        Math.max(0, selection.from - 20),
        selection.from,
        '\n'
      );

      const slashMatch = textBefore.match(/\/([a-zA-Z0-9]*)$/);
      if (slashMatch) {
        const query = slashMatch[1];
        setSlashQuery(query);

        // Get coordinates for popup
        const coords = editor.view.coordsAtPos(selection.from);
        setSlashPosition({
          top: coords.bottom + 8,
          left: Math.max(16, coords.left),
        });
        setSlashOpen(true);
      } else {
        setSlashOpen(false);
      }

      // Trigger auto-save cycle
      triggerAutoSave();
    },
  });

  // Check for voice navigation or crash recovery / stored drafts on mount
  useEffect(() => {
    if (voiceState) {
      if (voiceState.title) setTitle(voiceState.title);
      if (voiceState.mood) setMood(voiceState.mood);
      if (voiceState.tags) setTags(voiceState.tags);
      if (editor && voiceState.contentHtml) {
        editor.commands.setContent(voiceState.contentHtml);
      }
      return;
    }

    const draft = DraftService.getDraft('new');
    if (draft && (draft.title || draft.content)) {
      // Immediately populate state
      if (draft.title) setTitle(draft.title);
      if (draft.mood) setMood(draft.mood as any);
      if (draft.tags && Array.isArray(draft.tags)) setTags(draft.tags);
      if (editor && draft.content) {
        editor.commands.setContent(draft.content);
      }

      setRecoveryAvailable(true);
      setRecoveredDraft({
        id: 'draft_recovery',
        timestamp: draft.lastSavedAt,
        title: draft.title,
        content: draft.content,
        mood: draft.mood,
        tags: draft.tags,
        wordCount: draft.content.length,
      });
      setVersionSnapshots(draft.versionHistory || []);
    }
  }, [editor, voiceState]);

  // Restore recovered draft
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

  // The central Auto-Save pipeline:
  // User types -> Local draft immediately -> Debounce 600ms -> Sync server -> Mark "✓ Saved"
  const triggerAutoSave = useCallback(() => {
    setSyncStatus('typing');

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      if (!user) return;

      const currentContent = editor?.getHTML() || '';
      const currentTitle = title.trim();

      // Don't auto-save completely empty documents to database yet, only local draft
      DraftService.saveDraft(persistedEntryId || 'new', {
        title: currentTitle,
        content: currentContent,
        mood,
        tags,
      });

      if (!currentTitle && (!currentContent || currentContent === '<p></p>')) {
        setSyncStatus('saved');
        return;
      }

      setSyncStatus('saving');

      try {
        const payload: JournalEntryFormData = {
          title: currentTitle || 'Untitled Entry',
          content: currentContent,
          mood,
          tags: tags.length > 0 ? tags : undefined,
          is_favorite: isFavorite,
          is_private: isPrivate,
        };

        if (persistedEntryId) {
          // Update via SyncEngine: stores in IndexedDB, enqueues sync, syncs if online
          await SyncEngine.updateEntryOptimistic(user.id, persistedEntryId, payload);
        } else {
          // Create via SyncEngine: stores in IndexedDB, enqueues sync, syncs if online
          const created = await SyncEngine.createEntryOptimistic(user.id, payload);
          setPersistedEntryId(created.id);
          DraftService.saveDraft(created.id, {
            title: currentTitle,
            content: currentContent,
            mood,
            tags,
          });
        }

        setSyncStatus('saved');
        setLastSavedTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch (err) {
        console.error('Auto-save error:', err);
        setSyncStatus('error');
      }
    }, 600); // 600ms debounce
  }, [user, title, editor, mood, tags, isFavorite, isPrivate, persistedEntryId]);

  // Trigger autosave on metadata updates
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    triggerAutoSave();
  }, [title, mood, tags, isFavorite, isPrivate, triggerAutoSave]);

  // Unsaved changes browser prompt
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (syncStatus === 'typing' || syncStatus === 'saving') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [syncStatus]);

  // Attachment upload (MIME check + storage upload + link insertion)
  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    const file = e.target.files[0];

    const validation = validateFileUpload(file, 10 * 1024 * 1024);
    if (!validation.valid) {
      alert(validation.error || 'Invalid file');
      return;
    }

    setUploadingMedia(true);
    try {
      const sanitizedName = sanitizeUploadFileName(file.name);
      const filePath = `${user.id}/${sanitizedName}`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { contentType: file.type });

      if (error) throw error;

      if (data) {
        const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(data.path);
        const url = publicData?.publicUrl;
        if (url && editor) {
          editor.chain().focus().setImage({ src: url }).run();
          triggerAutoSave();
        }
      }
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploadingMedia(false);
    }
  };

  // Link Popover/Modal State
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const openLinkModal = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href || '';
    setLinkUrl(previousUrl);
    setLinkModalOpen(true);
  };

  const handleApplyLink = () => {
    if (!editor) return;
    if (linkUrl.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      let finalUrl = linkUrl.trim();
      if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = `https://${finalUrl}`;
      }
      editor.chain().focus().extendMarkRange('link').setLink({ href: finalUrl }).run();
    }
    setLinkModalOpen(false);
  };

  const handleRemoveLink = () => {
    if (editor) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    }
    setLinkModalOpen(false);
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

  // Manual Done / Close button: flushes save immediately before navigating
  const handleDone = async () => {
    if (!user) {
      navigate('/');
      return;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    const currentContent = editor?.getHTML() || '';
    const currentTitle = title.trim();

    // If empty entry with no previous record, just return to dashboard
    if (!persistedEntryId && !currentTitle && (!currentContent || currentContent === '<p></p>')) {
      navigate('/');
      return;
    }

    try {
      setSyncStatus('saving');
      const payload: JournalEntryFormData = {
        title: currentTitle || 'Untitled Entry',
        content: currentContent,
        mood,
        tags: tags.length > 0 ? tags : undefined,
        is_favorite: isFavorite,
        is_private: isPrivate,
      };

      let targetId = persistedEntryId;
      if (targetId) {
        await SyncEngine.updateEntryOptimistic(user.id, targetId, payload);
      } else {
        const created = await SyncEngine.createEntryOptimistic(user.id, payload);
        targetId = created.id;
        setPersistedEntryId(created.id);
      }

      DraftService.clearDraft(targetId || 'new');
      DraftService.clearDraft('new');
      navigate(`/entry/${targetId}`);
    } catch (err) {
      console.error('Error saving on done:', err);
      if (persistedEntryId) {
        navigate(`/entry/${persistedEntryId}`);
      } else {
        navigate('/');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto px-2 py-4 pb-20 relative"
    >
      {/* Top Floating Action Bar */}
      <div className="flex items-center justify-between mb-6 sticky top-2 z-30 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md py-2.5 px-4 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-sm">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-xs font-medium text-gray-500 hover:text-black dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={14} className="mr-1.5" />
          Dashboard
        </button>

        {/* Auto-Save & Sync Status Indicator */}
        <div className="flex items-center space-x-3 text-xs">
          <AnimatePresence mode="wait">
            {syncStatus === 'saving' && (
              <motion.span
                key="saving"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center text-gray-500"
              >
                <Cloud size={14} className="mr-1.5 animate-pulse text-amber-500" />
                Saving draft...
              </motion.span>
            )}
            {syncStatus === 'saved' && (
              <motion.span
                key="saved"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center text-emerald-600 dark:text-emerald-400 font-medium"
              >
                <Check size={14} className="mr-1 stroke-[2.5]" />
                Saved {lastSavedTimestamp ? `at ${lastSavedTimestamp}` : ''}
              </motion.span>
            )}
            {syncStatus === 'typing' && (
              <motion.span
                key="typing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center text-gray-400"
              >
                <Cloud size={14} className="mr-1.5 opacity-60" />
                Draft saved locally
              </motion.span>
            )}
            {syncStatus === 'error' && (
              <motion.span
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center text-red-500 font-medium"
              >
                <CloudOff size={14} className="mr-1.5" />
                Sync offline
              </motion.span>
            )}
          </AnimatePresence>

          {/* Voice Journaling Button */}
          <button
            type="button"
            onClick={() => setVoiceModalOpen(true)}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 text-xs font-semibold transition"
            title="Voice Journaling (Speech-to-text)"
          >
            <Mic size={14} className="animate-pulse" />
            <span className="hidden sm:inline">Voice Note</span>
          </button>

          {/* Version History Button */}
          <button
            type="button"
            onClick={() => {
              const draft = DraftService.getDraft(persistedEntryId || 'new');
              setVersionSnapshots(draft?.versionHistory || []);
              setHistoryOpen(true);
            }}
            className="p-1.5 rounded-lg text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
            title="Version history and backups"
          >
            <History size={16} />
          </button>

          <button
            type="button"
            onClick={handleDone}
            className="py-1 px-3 rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-90 transition shadow-sm"
          >
            Done
          </button>
        </div>
      </div>

      {/* Crash Recovery Banner */}
      {recoveryAvailable && recoveredDraft && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs flex items-center justify-between"
        >
          <div className="flex items-center space-x-2.5">
            <Sparkles size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div>
              <span className="font-semibold text-amber-900 dark:text-amber-200">
                Crash recovery draft detected
              </span>
              <p className="text-amber-700 dark:text-amber-300 text-[11px] mt-0.5">
                We found an unsaved session from {new Date(recoveredDraft.timestamp).toLocaleTimeString()}.
              </p>
            </div>
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
                DraftService.clearDraft('new');
                setRecoveryAvailable(false);
              }}
              className="px-2.5 py-1 rounded border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition"
            >
              Discard
            </button>
          </div>
        </motion.div>
      )}

      {/* Main Document Body */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 sm:p-10">
        {/* Title Input */}
        <input
          type="text"
          placeholder="Untitled"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-3xl sm:text-4xl font-bold tracking-tight mb-6 bg-transparent border-0 focus:outline-none focus:ring-0 p-0 text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-700"
        />

        {/* Notion-style Action Toolbar (Horizontally scrollable with touch momentum on mobile) */}
        {editor && (
          <div className="flex items-center gap-1 pb-4 mb-6 border-b border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1.5 flex-shrink-0 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition ${
                editor.isActive('bold') ? 'bg-gray-200 dark:bg-neutral-700 text-black dark:text-white' : ''
              }`}
              title="Bold (Cmd+B)"
            >
              <Bold size={15} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition ${
                editor.isActive('italic') ? 'bg-gray-200 dark:bg-neutral-700 text-black dark:text-white' : ''
              }`}
              title="Italic (Cmd+I)"
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
              title="Quote callout"
            >
              <Quote size={15} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={`p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition ${
                editor.isActive('codeBlock') ? 'bg-gray-200 dark:bg-neutral-700 text-black dark:text-white' : ''
              }`}
              title="Code Block"
            >
              <Code size={15} />
            </button>

            <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1"></div>

            <button
              onClick={openLinkModal}
              className={`p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition ${
                editor.isActive('link') ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : ''
              }`}
              title="Insert / Edit Link"
            >
              <Link2 size={15} />
            </button>
            <button
              onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
              className={`p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition ${
                editor.isActive('table') ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400' : ''
              }`}
              title="Insert 3x3 Table"
            >
              <TableIcon size={15} />
            </button>
            <button
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
              title="Horizontal Divider"
            >
              <Minus size={15} />
            </button>

            {/* Secure file attachment upload (Restricted strictly to image files) */}
            <label className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition cursor-pointer" title="Upload Image Attachment">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleAttachmentUpload}
                className="hidden"
                disabled={uploadingMedia}
              />
              <Paperclip size={15} className={uploadingMedia ? 'animate-spin' : ''} />
            </label>

            {/* Voice Dictation button */}
            <button
              type="button"
              onClick={() => setVoiceModalOpen(true)}
              className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 transition"
              title="Dictate with Voice (Speech to Text)"
            >
              <Mic size={15} />
            </button>
          </div>
        )}

        {/* Contextual Table Controls Toolbar (shown when cursor is inside any table) */}
        {editor && editor.isActive('table') && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center flex-wrap gap-1.5 p-2 mb-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 text-xs text-purple-900 dark:text-purple-200"
          >
            <span className="font-semibold px-1 text-[11px] text-purple-700 dark:text-purple-300 flex items-center">
              <TableIcon size={12} className="mr-1" /> Table (3x3 default):
            </span>
            <button
              type="button"
              onClick={() => editor.chain().focus().addRowAfter().run()}
              className="px-2 py-1 bg-white dark:bg-neutral-800 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-md border border-purple-200 dark:border-purple-800 text-[11px] font-medium transition flex items-center gap-1"
            >
              <Plus size={11} /> Add Row
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteRow().run()}
              className="px-2 py-1 bg-white dark:bg-neutral-800 hover:bg-red-50 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 rounded-md border border-red-200 dark:border-red-900/40 text-[11px] font-medium transition flex items-center gap-1"
            >
              <Trash2 size={11} /> Delete Row
            </button>
            <div className="h-3.5 w-[1px] bg-purple-200 dark:bg-purple-800 mx-0.5"></div>
            <button
              type="button"
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              className="px-2 py-1 bg-white dark:bg-neutral-800 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-md border border-purple-200 dark:border-purple-800 text-[11px] font-medium transition flex items-center gap-1"
            >
              <Plus size={11} /> Add Column
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteColumn().run()}
              className="px-2 py-1 bg-white dark:bg-neutral-800 hover:bg-red-50 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 rounded-md border border-red-200 dark:border-red-900/40 text-[11px] font-medium transition flex items-center gap-1"
            >
              <Trash2 size={11} /> Delete Column
            </button>
            <div className="h-3.5 w-[1px] bg-purple-200 dark:bg-purple-800 mx-0.5"></div>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteTable().run()}
              className="px-2 py-1 bg-red-100 dark:bg-red-950/70 hover:bg-red-200 dark:hover:bg-red-900 text-red-700 dark:text-red-300 rounded-md border border-red-300 dark:border-red-800 text-[11px] font-semibold transition flex items-center gap-1"
            >
              <Trash2 size={11} /> Delete Table
            </button>
          </motion.div>
        )}

        {/* Embedded Link Modal / Dialog UI */}
        <AnimatePresence>
          {linkModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl max-w-md w-full p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Link2 size={18} className="text-blue-600 dark:text-blue-400" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Insert or Edit Link</h3>
                  </div>
                  <button
                    onClick={() => setLinkModalOpen(false)}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Web URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyLink();
                        }
                      }}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    {editor?.isActive('link') ? (
                      <button
                        type="button"
                        onClick={handleRemoveLink}
                        className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 font-medium"
                      >
                        Remove Link
                      </button>
                    ) : <span />}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setLinkModalOpen(false)}
                        className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyLink}
                        className="px-3 py-1.5 text-xs font-medium bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-90 transition shadow-sm"
                      >
                        Apply Link
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* TipTap Rich Text Canvas */}
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

        {/* Metadata section (Moods, Tags) */}
        <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-800 space-y-4">
          {/* Mood Selector with Emojis */}
          <div>
            <div className="flex items-center text-xs font-medium text-gray-500 mb-2">
              <Smile size={14} className="mr-1.5" />
              <span>Mood</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: 'joyful', label: 'Joyful', emoji: '😊' },
                  { id: 'peaceful', label: 'Peaceful', emoji: '😌' },
                  { id: 'sad', label: 'Sad', emoji: '😔' },
                  { id: 'angry', label: 'Angry', emoji: '😠' },
                  { id: 'anxious', label: 'Anxious', emoji: '😰' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMood(mood === item.id ? null : item.id)}
                  className={`px-3 py-1.5 rounded-full text-xs transition flex items-center gap-1.5 ${
                    mood === item.id
                      ? 'bg-black text-white dark:bg-white dark:text-black font-medium shadow-sm'
                      : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  <span>{item.emoji}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
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

      {/* Voice Journaling Modal */}
      <VoiceJournalModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onApplyToEditor={(voiceData) => {
          if (voiceData.title) {
            setTitle(voiceData.title);
          }
          if (voiceData.mood !== undefined) {
            setMood(voiceData.mood);
          }
          if (voiceData.tags && voiceData.tags.length > 0) {
            setTags(voiceData.tags);
          }
          if (editor && voiceData.contentHtml) {
            const currentContent = editor.getHTML();
            if (currentContent && currentContent !== '<p></p>') {
              editor.commands.setContent(currentContent + voiceData.contentHtml);
            } else {
              editor.commands.setContent(voiceData.contentHtml);
            }
          }
          triggerAutoSave();
        }}
      />
    </motion.div>
  );
}
