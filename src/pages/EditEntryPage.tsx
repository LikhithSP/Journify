import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Save, Image as ImageIcon, StickyNote, 
  Trash2, RotateCw, Check, ZoomIn, ZoomOut, Sparkles,
  ChevronLeft, ChevronRight, Plus, Eye, Edit3, Heading1, Heading2,
  Bold, Italic, List, Quote, Code, PenLine
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

// Scrapbook Canvas Element Interface
export interface CanvasElement {
  id: string;
  type: 'text' | 'image' | 'sticker' | 'sticky';
  x: number; // percentage (0 - 100) on page spread
  y: number; // percentage (0 - 100) on page spread
  width?: number; // px or percentage
  height?: number;
  rotation?: number; // degrees (-30 to +30)
  content: string; // text string, sticker emoji, or image URL
  color?: string; // for sticky notes or font colors
  fontFamily?: string;
  fontSize?: number;
}

// Preset scrapbooking stickers matching aesthetic
const STICKERS = [
  '⭐', '✨', '💖', '☕', '🌿', '🌸', '🎀', '🎧', '📸', '🧸', '💭', '📝', '🥑', '🌙', '🎨'
];

// Preset aesthetic scrapbooking sample images
const SAMPLE_PICS = [
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
];

const MOODS = ['calm', 'happy', 'focused', 'reflective', 'creative', 'grateful', 'tired'];

export default function EditEntryPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [title, setTitle] = useState<string>('My Journal Spread');
  const [journalText, setJournalText] = useState<string>('');
  const [mood, setMood] = useState<string>('calm');
  const [entryDate, setEntryDate] = useState<string>(new Date().toISOString());
  const [saving, setSaving] = useState(false);

  // Left Page Mode: 'scrapbook' (photos + sticky notes) or 'write' (dual-page writing)
  const [leftPageMode, setLeftPageMode] = useState<'scrapbook' | 'write'>('scrapbook');
  const [leftPageText, setLeftPageText] = useState<string>('');
  const [leftPreviewMarkdown, setLeftPreviewMarkdown] = useState(false);
  const leftTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Markdown toggle and textarea ref
  const [previewMarkdown, setPreviewMarkdown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Multi-page navigation within current book / month
  const [siblingEntries, setSiblingEntries] = useState<Array<{ id: string; title: string; created_at: string }>>([]);
  const [currentEntryIndex, setCurrentEntryIndex] = useState<number>(-1);
  const [entryBookInfo, setEntryBookInfo] = useState<{ bookId?: string; bookTitle?: string } | null>(null);

  // Scrapbook Visual Elements (Sticky notes, photos on Left Page, and stickers anywhere)
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Dragging state
  const spreadRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragElementIdRef = useRef<string | null>(null);
  const dragStartPosRef = useRef<{ mouseX: number; mouseY: number; elemX: number; elemY: number }>({ mouseX: 0, mouseY: 0, elemX: 0, elemY: 0 });

  // Custom Image URL input modal
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);

  // Clean html tags helper
  const cleanHtml = (str: string) => {
    return str
      .replace(/<br\s*[\/]?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]*>/g, '')
      .trim();
  };

  // Load entry
  useEffect(() => {
    async function loadEntry() {
      if (!id || !user) return;
      try {
        const { data, error } = await supabase
          .from('journal_entries')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        if (data) {
          setTitle(data.title || 'Untitled Entry');
          setMood(data.mood || 'reflective');
          if (data.created_at) setEntryDate(data.created_at);

          try {
            if (data.content && data.content.trim().startsWith('[')) {
              const parsed = JSON.parse(data.content);
              if (Array.isArray(parsed)) {
                // Find primary text element for right page
                const textElem = parsed.find((e: CanvasElement) => e.type === 'text' && e.id !== 'left-journal-text');
                if (textElem && textElem.content) {
                  setJournalText(cleanHtml(textElem.content));
                }

                // Find left page text if author wrote in the left page
                const leftElem = parsed.find((e: CanvasElement) => e.type === 'text' && e.id === 'left-journal-text');
                if (leftElem && leftElem.content) {
                  setLeftPageText(cleanHtml(leftElem.content));
                  setLeftPageMode('write');
                }

                // Visual scrapbook elements for canvas (excluding text elements)
                const visualElems = parsed.filter((e: CanvasElement) => e.type !== 'text');
                setElements(visualElems);
              }
            } else {
              // Standard journal entry: content goes into the right-hand writing area
              setJournalText(cleanHtml(data.content || ''));
              // Default scrapbook starter items on the left page
              const defaultVisuals: CanvasElement[] = [];
              if (data.images && data.images.length > 0) {
                defaultVisuals.push({
                  id: 'elem-img-1',
                  type: 'image',
                  x: 10,
                  y: 20,
                  content: data.images[0],
                  rotation: -2,
                });
              } else {
                defaultVisuals.push({
                  id: 'elem-img-1',
                  type: 'image',
                  x: 10,
                  y: 20,
                  content: SAMPLE_PICS[0],
                  rotation: -2,
                });
              }
              defaultVisuals.push({
                id: 'elem-sticky-1',
                type: 'sticky',
                x: 12,
                y: 56,
                width: 200,
                content: "Memories & Highlights:\n• Coffee in the morning ☕\n• Deep reflection\n• Productive moments",
                color: '#fef08a',
                fontSize: 14,
                rotation: 2,
              });
              defaultVisuals.push({
                id: 'elem-sticker-1',
                type: 'sticker',
                x: 38,
                y: 12,
                content: '✨',
                fontSize: 36,
                rotation: 12,
              });
              setElements(defaultVisuals);
            }
          } catch (e) {
            console.error('Parse error:', e);
            setJournalText(cleanHtml(data.content || ''));
          }
          // Determine book or month context to load siblings
          const bookTag = data.tags && data.tags.length > 0 ? data.tags[0] : undefined;
          setEntryBookInfo({ bookId: data.book_id, bookTitle: bookTag });

          // Fetch siblings
          let siblingQuery = supabase
            .from('journal_entries')
            .select('id, title, created_at, tags, book_id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });

          if (data.book_id) {
            siblingQuery = siblingQuery.eq('book_id', data.book_id);
          } else if (data.created_at) {
            const d = new Date(data.created_at);
            const startMonth = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
            const endMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();
            siblingQuery = siblingQuery.gte('created_at', startMonth).lte('created_at', endMonth);
          }

          const { data: siblings } = await siblingQuery;
          if (siblings && siblings.length > 0) {
            setSiblingEntries(siblings);
            const idx = siblings.findIndex(s => s.id === id);
            setCurrentEntryIndex(idx !== -1 ? idx : 0);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadEntry();
  }, [id, user]);

  // Insert markdown helper into textarea
  const insertMarkdown = (prefix: string, suffix: string = '', defaultPlaceholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = journalText.substring(start, end) || defaultPlaceholder;

    const replacement = `${prefix}${selected}${suffix}`;
    const newText = journalText.substring(0, start) + replacement + journalText.substring(end);
    setJournalText(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 10);
  };

  // Insert markdown helper for left textarea
  const insertLeftMarkdown = (prefix: string, suffix: string = '', defaultPlaceholder: string = '') => {
    const textarea = leftTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = leftPageText.substring(start, end) || defaultPlaceholder;

    const replacement = `${prefix}${selected}${suffix}`;
    const newText = leftPageText.substring(0, start) + replacement + leftPageText.substring(end);
    setLeftPageText(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 10);
  };

  // Helper to compile all elements (including right and left page text)
  const compileSpreadElements = () => {
    const textElements: CanvasElement[] = [];

    // 1. Right Page primary text
    textElements.push({
      id: 'main-journal-text',
      type: 'text',
      x: 52,
      y: 10,
      content: journalText,
      fontSize: 16,
      fontFamily: "'Playfair Display', serif",
    });

    // 2. Left Page text if writing mode is active and text is entered
    if (leftPageMode === 'write' || leftPageText.trim().length > 0) {
      textElements.push({
        id: 'left-journal-text',
        type: 'text',
        x: 6,
        y: 10,
        content: leftPageText,
        fontSize: 16,
        fontFamily: "'Playfair Display', serif",
      });
    }

    // 3. Scrapbook elements (filter out text elements and scrapbook items if in write mode)
    const visualElements = leftPageMode === 'write'
      ? elements.filter(e => e.type === 'sticker') // Keep universal stickers if any
      : elements.filter(e => e.type !== 'text');

    return [...textElements, ...visualElements];
  };

  // Helper to save current page changes quietly before switching pages
  const saveCurrentChanges = async () => {
    if (!id || !user) return;
    try {
      const allElements = compileSpreadElements();
      await supabase
        .from('journal_entries')
        .update({
          title,
          mood,
          content: JSON.stringify(allElements),
          images: elements.filter(e => e.type === 'image').map(e => e.content),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);
    } catch (e) {
      console.error('Silent autosave error:', e);
    }
  };

  // Save changes
  const handleSave = async () => {
    if (!id || !user) return;
    try {
      setSaving(true);

      const allElements = compileSpreadElements();

      const { error } = await supabase
        .from('journal_entries')
        .update({
          title,
          mood,
          content: JSON.stringify(allElements),
          images: elements.filter(e => e.type === 'image').map(e => e.content),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      navigate(-1);
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save page spread');
    } finally {
      setSaving(false);
    }
  };

  // Add a sticky note (placed by default on the Left scrapbook page: x between 4% and 26%)
  const addStickyNote = (color = '#fef08a') => {
    const newElem: CanvasElement = {
      id: `sticky-${Date.now()}`,
      type: 'sticky',
      x: 6 + Math.floor(Math.random() * 16),
      y: 20 + Math.floor(Math.random() * 30),
      width: 200,
      content: 'Quick note or memory...\n• Highlight\n• Thought',
      color: color,
      fontSize: 14,
      fontFamily: "'Caveat', cursive",
      rotation: Math.floor(Math.random() * 8) - 4,
    };
    setElements([...elements, newElem]);
    setSelectedId(newElem.id);
  };

  // Add an image (placed by default on the Left scrapbook page: x between 4% and 24%)
  const addImage = (url: string) => {
    if (!url) return;
    const newElem: CanvasElement = {
      id: `img-${Date.now()}`,
      type: 'image',
      x: 8 + Math.floor(Math.random() * 15),
      y: 15 + Math.floor(Math.random() * 25),
      content: url,
      rotation: Math.floor(Math.random() * 8) - 4,
    };
    setElements([...elements, newElem]);
    setSelectedId(newElem.id);
    setShowImageInput(false);
    setCustomImageUrl('');
  };

  // Add sticker emoji (can be placed anywhere across either page)
  const addSticker = (sticker: string) => {
    const newElem: CanvasElement = {
      id: `sticker-${Date.now()}`,
      type: 'sticker',
      x: 10 + Math.floor(Math.random() * 75), // Anywhere on left or right
      y: 15 + Math.floor(Math.random() * 60),
      content: sticker,
      fontSize: 38,
      rotation: Math.floor(Math.random() * 24) - 12,
    };
    setElements([...elements, newElem]);
    setSelectedId(newElem.id);
  };

  // Delete selected element
  const deleteSelected = () => {
    if (!selectedId) return;
    setElements(elements.filter(e => e.id !== selectedId));
    setSelectedId(null);
  };

  // Rotate selected element
  const rotateSelected = () => {
    if (!selectedId) return;
    setElements(elements.map(e => {
      if (e.id === selectedId) {
        return { ...e, rotation: ((e.rotation || 0) + 5) % 360 };
      }
      return e;
    }));
  };

  // Adjust font size of selected sticky note
  const changeSelectedFontSize = (delta: number) => {
    if (!selectedId) return;
    setElements(elements.map(e => {
      if (e.id === selectedId) {
        const currentSize = e.fontSize || 16;
        const newSize = Math.max(12, Math.min(36, currentSize + delta));
        return { ...e, fontSize: newSize };
      }
      return e;
    }));
  };

  // Adjust width of selected sticky note
  const changeSelectedWidth = (delta: number) => {
    if (!selectedId) return;
    setElements(elements.map(e => {
      if (e.id === selectedId) {
        const currentW = e.width || 200;
        const newW = Math.max(150, Math.min(260, currentW + delta));
        return { ...e, width: newW };
      }
      return e;
    }));
  };

  // Delete current page
  const [deletingPage, setDeletingPage] = useState(false);
  const handleDeleteCurrentPage = async () => {
    if (!id || !user) return;
    if (!window.confirm('Are you sure you want to delete this journal page? This action cannot be undone.')) return;
    try {
      setDeletingPage(true);
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;

      // Navigate to sibling page or back to book/library
      if (siblingEntries.length > 1) {
        const nextIdx = currentEntryIndex > 0 ? currentEntryIndex - 1 : 1;
        const target = siblingEntries[nextIdx];
        if (target && target.id !== id) {
          navigate(`/app/entry/${target.id}/edit`, { replace: true });
          return;
        }
      }

      if (entryBookInfo?.bookId) {
        navigate(`/app/book/${entryBookInfo.bookId}`, { replace: true });
      } else {
        navigate(-1);
      }
    } catch (err) {
      console.error('Failed to delete page:', err);
      alert('Failed to delete page');
    } finally {
      setDeletingPage(false);
    }
  };

  // Drag and Drop handler
  const handleMouseDown = (e: React.MouseEvent, elem: CanvasElement) => {
    e.stopPropagation();
    setSelectedId(elem.id);

    const target = e.target as HTMLElement;
    if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.tagName === 'BUTTON') {
      return;
    }

    isDraggingRef.current = true;
    dragElementIdRef.current = elem.id;
    dragStartPosRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      elemX: elem.x,
      elemY: elem.y,
    };
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !dragElementIdRef.current || !spreadRef.current) return;
      const rect = spreadRef.current.getBoundingClientRect();
      const deltaX = ((e.clientX - dragStartPosRef.current.mouseX) / rect.width) * 100;
      const deltaY = ((e.clientY - dragStartPosRef.current.mouseY) / rect.height) * 100;

      const draggingElement = elements.find(el => el.id === dragElementIdRef.current);
      
      // Stickers can go anywhere (2% to 92%); photos/sticky notes stay on left page (2% to 36%)
      const maxX = draggingElement?.type === 'sticker' ? 92 : 36;

      const newX = Math.max(2, Math.min(maxX, dragStartPosRef.current.elemX + deltaX));
      const newY = Math.max(4, Math.min(84, dragStartPosRef.current.elemY + deltaY));

      setElements(prev => prev.map(el => {
        if (el.id === dragElementIdRef.current) {
          return { ...el, x: newX, y: newY };
        }
        return el;
      }));
    };

    const handleGlobalMouseUp = () => {
      isDraggingRef.current = false;
      dragElementIdRef.current = null;
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [elements]);

  // Update sticky content
  const updateContent = (id: string, text: string) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, content: text } : el));
  };

  return (
    <div className="w-full pb-32 text-neutral-900 dark:text-neutral-100 max-w-5xl mx-auto px-2 sm:px-4">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 font-mono">Editing Journal Spread</span>
            </div>
            <div className="text-xs text-neutral-500 mt-0.5">
              Left page for memories & pictures • Right page for writing & reflections
            </div>
          </div>
        </div>

        {/* Action Controls & Multi-Page Navigation */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Sibling Page Turn Navigation within this book/month */}
          {siblingEntries.length > 0 && currentEntryIndex !== -1 && (
            <div className="flex items-center bg-neutral-100 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-1 mr-1">
              <button
                onClick={async () => {
                  if (currentEntryIndex > 0) {
                    await saveCurrentChanges();
                    const prevEntry = siblingEntries[currentEntryIndex - 1];
                    navigate(`/app/entry/${prevEntry.id}/edit`);
                  }
                }}
                disabled={currentEntryIndex <= 0}
                className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-400 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="Go to previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono px-2 text-neutral-600 dark:text-neutral-400 font-semibold">
                Page {currentEntryIndex + 1} of {siblingEntries.length}
              </span>
              <button
                onClick={async () => {
                  if (currentEntryIndex < siblingEntries.length - 1) {
                    await saveCurrentChanges();
                    const nextEntry = siblingEntries[currentEntryIndex + 1];
                    navigate(`/app/entry/${nextEntry.id}/edit`);
                  }
                }}
                disabled={currentEntryIndex >= siblingEntries.length - 1}
                className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-400 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="Go to next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Add New Page to this Book */}
          <button
            onClick={async () => {
              await saveCurrentChanges();
              navigate('/app/entry/new', {
                state: {
                  bookId: entryBookInfo?.bookId,
                  bookTitle: entryBookInfo?.bookTitle,
                  defaultDate: entryDate,
                }
              });
            }}
            className="rounded-xl px-3 py-2 text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
            title="Write a new page in this book"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Page</span>
          </button>

          {/* Delete Current Page Button */}
          <button
            onClick={handleDeleteCurrentPage}
            disabled={deletingPage}
            className="rounded-xl px-3 py-2 text-xs font-semibold bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            title="Delete this page spread"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{deletingPage ? 'Deleting...' : 'Delete Page'}</span>
          </button>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl px-5 py-2 text-xs font-semibold bg-black text-white dark:bg-white dark:text-black hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Spread'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Tool Palette (Left Page Visuals & Universal Stickers) */}
      <div className="mb-6 flex items-center justify-between gap-4 p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider mr-1">Add to Left Page:</span>
          
          <button
            onClick={() => addStickyNote('#fef08a')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-100 text-amber-900 shadow-sm hover:scale-105 active:scale-95 transition-all"
          >
            <StickyNote className="w-3.5 h-3.5 text-amber-700" />
            <span>+ Sticky Note</span>
          </button>

          <button
            onClick={() => setShowImageInput(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-neutral-800 shadow-sm hover:scale-105 active:scale-95 transition-all text-neutral-800 dark:text-neutral-200"
          >
            <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
            <span>+ Picture</span>
          </button>

          {/* Quick Universal Stickers */}
          <div className="flex items-center gap-1.5 pl-3 border-l border-neutral-300 dark:border-neutral-700">
            <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider mr-0.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Stickers:</span>
            </span>
            {STICKERS.map(s => (
              <button
                key={s}
                onClick={() => addSticker(s)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-neutral-800 hover:scale-125 transition-transform text-base"
                title="Click to insert sticker (drag anywhere!)"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Element Controls */}
        {selectedId && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Font Size Adjust for Sticky */}
            {elements.find(e => e.id === selectedId)?.type === 'sticky' && (
              <>
                <div className="flex items-center bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-0.5 shadow-sm mr-1">
                  <button
                    onClick={() => changeSelectedFontSize(-1)}
                    className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 transition-colors"
                    title="Decrease text size"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-mono px-1 text-neutral-600 dark:text-neutral-400 font-semibold min-w-[30px] text-center">
                    {elements.find(e => e.id === selectedId)?.fontSize || 14}px
                  </span>
                  <button
                    onClick={() => changeSelectedFontSize(1)}
                    className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 transition-colors"
                    title="Increase text size"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-0.5 shadow-sm mr-1">
                  <button
                    onClick={() => changeSelectedWidth(-20)}
                    className="px-1.5 py-0.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 text-[10px] font-mono"
                    title="Narrower"
                  >
                    -W
                  </button>
                  <span className="text-[10px] font-mono px-1 text-neutral-600 dark:text-neutral-400 font-semibold">
                    {elements.find(e => e.id === selectedId)?.width || 200}
                  </span>
                  <button
                    onClick={() => changeSelectedWidth(20)}
                    className="px-1.5 py-0.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 text-[10px] font-mono"
                    title="Wider"
                  >
                    +W
                  </button>
                </div>
              </>
            )}

            <button
              onClick={rotateSelected}
              className="p-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors"
              title="Rotate angle"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={deleteSelected}
              className="p-1.5 rounded-xl bg-red-100 dark:bg-red-900/30 hover:bg-red-200 text-red-600 dark:text-red-300 transition-colors"
              title="Delete element"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Picture Insert Modal */}
      {showImageInput && (
        <div className="mb-6 p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 animate-in fade-in duration-200">
          <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
            Select a picture or paste image URL
          </div>
          <div className="flex items-center gap-3 mb-3 overflow-x-auto pb-2">
            {SAMPLE_PICS.map((pic, i) => (
              <img
                key={i}
                src={pic}
                alt="Sample"
                onClick={() => addImage(pic)}
                className="w-16 h-16 rounded-lg object-cover cursor-pointer hover:scale-105 border-2 border-transparent hover:border-black dark:hover:border-white transition-all shadow-sm"
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={customImageUrl}
              onChange={(e) => setCustomImageUrl(e.target.value)}
              placeholder="Or paste image URL (https://...)"
              className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs focus:outline-none"
            />
            <button
              onClick={() => addImage(customImageUrl)}
              disabled={!customImageUrl.trim()}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-black text-white dark:bg-white dark:text-black hover:opacity-90 disabled:opacity-40"
            >
              Add
            </button>
            <button
              onClick={() => setShowImageInput(false)}
              className="px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* REALISTIC OPEN BOOK DOUBLE-PAGE SPREAD */}
      <div className="relative max-w-5xl mx-auto my-4 perspective-[2000px]">
        {/* Layered Book Pages effect on left & right */}
        <div className="absolute -left-4 top-3 bottom-3 w-6 bg-neutral-200 dark:bg-neutral-800 rounded-l-xl opacity-60 shadow-md pointer-events-none transform -rotate-1 z-0" />
        <div className="absolute -left-2 top-1.5 bottom-1.5 w-4 bg-neutral-100 dark:bg-neutral-700 rounded-l-xl opacity-80 shadow-sm pointer-events-none transform -rotate-0.5 z-0" />
        <div className="absolute -right-4 top-3 bottom-3 w-6 bg-neutral-200 dark:bg-neutral-800 rounded-r-xl opacity-60 shadow-md pointer-events-none transform rotate-1 z-0" />
        <div className="absolute -right-2 top-1.5 bottom-1.5 w-4 bg-neutral-100 dark:bg-neutral-700 rounded-r-xl opacity-80 shadow-sm pointer-events-none transform rotate-0.5 z-0" />

        {/* Double-Page Spread Container */}
        <div
          ref={spreadRef}
          className="open-journal-spread w-full min-h-[580px] relative overflow-hidden flex flex-col md:flex-row p-6 sm:p-10 shadow-2xl z-10 bg-[#111113] border border-white/10"
        >
          {/* Middle Valley / Spine Crease */}
          <div className="journal-center-spine" />

          {/* Top Spread Meta Bar */}
          <div className="absolute top-4 left-8 right-8 flex items-center justify-between text-[10px] font-mono tracking-widest text-neutral-400 uppercase pointer-events-none z-10">
            <div className="w-1/2 pr-6 flex justify-between">
              <span>SCRAPBOOK & MEMORIES</span>
              <span>LEFT PAGE</span>
            </div>
            <div className="w-1/2 pl-8 flex justify-between">
              <span>{new Date(entryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <span>RIGHT PAGE</span>
            </div>
          </div>

          {/* LEFT PAGE: Scrapbook for Pictures & Sticky Notes OR Direct Journal Writing Area */}
          <div className="w-full md:w-1/2 pr-0 md:pr-10 pt-6 pb-2 flex flex-col justify-between border-b md:border-b-0 md:border-r border-black/5 dark:border-white/5 relative min-h-[460px]">
            {/* Left Page Mode Switcher: Scrapbook vs Write in Left Page */}
            <div className="mb-3 flex items-center justify-between gap-2 pb-2 border-b border-black/5 dark:border-white/5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                Left Page
              </span>
              <div className="flex items-center bg-black/5 dark:bg-white/10 p-0.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setLeftPageMode('scrapbook')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    leftPageMode === 'scrapbook'
                      ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                  title="Photos, stickers, and sticky notes"
                >
                  <StickyNote className="w-3 h-3" />
                  <span>Scrapbook</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLeftPageMode('write')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    leftPageMode === 'write'
                      ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                  title="Write directly on the left page"
                >
                  <PenLine className="w-3 h-3" />
                  <span>Write Here</span>
                </button>
              </div>
            </div>

            {leftPageMode === 'write' ? (
              /* LEFT PAGE WRITING MODE: Clean distraction-free book writing area */
              <div className="flex-1 flex flex-col">
                {/* Markdown Formatting Shortcut Toolbar & Preview Toggle for Left Page */}
                <div className="flex items-center justify-between py-1.5 px-2 mb-2 rounded-xl bg-neutral-100/70 dark:bg-neutral-900/70 border border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center gap-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => insertLeftMarkdown('**', '**', 'bold')}
                      className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
                      title="Bold (**text**)"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertLeftMarkdown('*', '*', 'italic')}
                      className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
                      title="Italic (*text*)"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-[1px] h-3.5 bg-neutral-300 dark:bg-neutral-700 mx-0.5" />
                    <button
                      type="button"
                      onClick={() => insertLeftMarkdown('# ', '', 'Section')}
                      className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
                      title="Heading 1"
                    >
                      <Heading1 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertLeftMarkdown('- ', '', 'point')}
                      className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
                      title="Bullet List"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertLeftMarkdown('> ', '', 'Reflective thought')}
                      className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
                      title="Quote"
                    >
                      <Quote className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setLeftPreviewMarkdown(!leftPreviewMarkdown)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-colors ${
                      leftPreviewMarkdown
                        ? 'bg-indigo-600 text-white'
                        : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300'
                    }`}
                    title="Toggle Markdown Preview"
                  >
                    {leftPreviewMarkdown ? <Edit3 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{leftPreviewMarkdown ? 'Edit' : 'Preview'}</span>
                  </button>
                </div>

                {leftPreviewMarkdown ? (
                  <div className="w-full flex-1 min-h-[320px] p-2 text-sm sm:text-base leading-relaxed text-neutral-800 dark:text-neutral-200 font-serif overflow-y-auto">
                    {leftPageText ? (
                      <MarkdownRenderer content={leftPageText} />
                    ) : (
                      <span className="text-neutral-400 italic">Left page is empty. Switch back to Edit to type.</span>
                    )}
                  </div>
                ) : (
                  <textarea
                    ref={leftTextareaRef}
                    value={leftPageText}
                    onChange={(e) => setLeftPageText(e.target.value)}
                    placeholder="Write your story, opening notes, poem, or thoughts for the left page... (Markdown supported)"
                    className="w-full flex-1 min-h-[320px] text-sm sm:text-base leading-relaxed text-neutral-800 dark:text-neutral-200 font-serif bg-transparent border-none resize-none focus:outline-none placeholder:text-neutral-500"
                  />
                )}
              </div>
            ) : (
              /* SCRAPBOOK MODE */
              <>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                    Memories & Notes Board
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    (drag to position)
                  </span>
                </div>

                {elements.filter(e => e.type !== 'sticker').length === 0 && (
                  <div className="flex flex-col items-center justify-center my-auto p-6 text-center border-2 border-dashed border-neutral-300 dark:border-neutral-700/50 rounded-2xl">
                    <StickyNote className="w-8 h-8 text-neutral-400 mb-2 opacity-50" />
                    <p className="text-xs text-neutral-500 font-medium">No scrapbook items yet</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">Use the toolbar buttons above to add photos and sticky notes, or switch to "Write Here" to type.</p>
                  </div>
                )}

                <div className="flex-1" />
              </>
            )}

            {/* Left Page Bottom Footer Stamp */}
            <div className="pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs text-neutral-400 font-mono">
              <span>Journify {leftPageMode === 'write' ? 'Written Page' : 'Scrapbook'}</span>
              <span>Page Visuals / Left</span>
            </div>
          </div>

          {/* RIGHT PAGE: Structured Journal Writing Area (Just like Preview) */}
          <div className="w-full md:w-1/2 pl-0 md:pl-10 pt-6 pb-2 flex flex-col justify-between relative min-h-[460px]">
            <div className="flex-1 flex flex-col">
              {/* Date & Mood Selector */}
              <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                <div className="inline-block px-2.5 py-1 rounded-md bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 font-mono text-xs">
                  {new Date(entryDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>

                {/* Mood Tag Picker */}
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-neutral-400 font-mono">Mood:</span>
                  <select
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    className="text-xs font-semibold capitalize bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-full border-none focus:outline-none cursor-pointer"
                  >
                    {MOODS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title Input - clean, prominent serif/display title */}
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title of this page..."
                className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white bg-transparent border-b border-transparent hover:border-black/10 dark:hover:border-white/10 focus:border-indigo-500 focus:outline-none pb-1 mb-2 transition-colors"
              />

              {/* Markdown Formatting Shortcut Toolbar & Preview Toggle */}
              <div className="flex items-center justify-between py-1.5 px-2 mb-2 rounded-xl bg-neutral-100/70 dark:bg-neutral-900/70 border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => insertMarkdown('**', '**', 'bold')}
                    className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
                    title="Bold (**text**)"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('*', '*', 'italic')}
                    className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
                    title="Italic (*text*)"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-[1px] h-3.5 bg-neutral-300 dark:bg-neutral-700 mx-0.5" />
                  <button
                    type="button"
                    onClick={() => insertMarkdown('# ', '', 'Heading 1')}
                    className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
                    title="Heading 1 (# ...)"
                  >
                    <Heading1 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('## ', '', 'Heading 2')}
                    className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
                    title="Heading 2 (## ...)"
                  >
                    <Heading2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('- ', '', 'list item')}
                    className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
                    title="Bullet List (- item)"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('> ', '', 'Reflective thought or quote')}
                    className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
                    title="Quote (> quote)"
                  >
                    <Quote className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('`', '`', 'code')}
                    className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
                    title="Inline Code (`code`)"
                  >
                    <Code className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewMarkdown(!previewMarkdown)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-colors ${
                    previewMarkdown
                      ? 'bg-indigo-600 text-white'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300'
                  }`}
                  title="Toggle Markdown Preview"
                >
                  {previewMarkdown ? <Edit3 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{previewMarkdown ? 'Edit' : 'Preview'}</span>
                </button>
              </div>

              {/* Journal Textarea or Markdown Preview */}
              {previewMarkdown ? (
                <div className="w-full flex-1 min-h-[320px] p-2 text-sm sm:text-base leading-relaxed text-neutral-800 dark:text-neutral-200 font-serif overflow-y-auto">
                  {journalText ? (
                    <MarkdownRenderer content={journalText} />
                  ) : (
                    <span className="text-neutral-400 italic">Page is empty. Switch back to Edit to type.</span>
                  )}
                </div>
              ) : (
                <textarea
                  ref={textareaRef}
                  value={journalText}
                  onChange={(e) => setJournalText(e.target.value)}
                  placeholder="Write your story, thoughts, reflections, or dreams for this day in Markdown format...&#10;&#10;# Heading 1&#10;## Subheading&#10;- Bullet point&#10;> Blockquote reflection"
                  className="w-full flex-1 min-h-[320px] text-sm sm:text-base leading-relaxed text-neutral-800 dark:text-neutral-200 font-serif bg-transparent border-none resize-none focus:outline-none placeholder:text-neutral-500"
                />
              )}
            </div>

            {/* Right Page Bottom Footer Stamp */}
            <div className="pt-4 mt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs text-neutral-400 font-mono">
              <span>Journify Journal</span>
              <span>Page Written</span>
            </div>
          </div>

          {/* DRAGGABLE CANVAS ELEMENTS OVERLAY (Photos & Sticky notes docked to Left Page, Stickers everywhere) */}
          {elements
            .filter((elem) => (leftPageMode === 'write' ? elem.type === 'sticker' : true))
            .map((elem) => {
              const isSelected = selectedId === elem.id;

              return (
                <div
                  key={elem.id}
                  onMouseDown={(e) => handleMouseDown(e, elem)}
                  style={{
                    left: `${elem.x}%`,
                    top: `${elem.y}%`,
                    transform: `rotate(${elem.rotation || 0}deg)`,
                    fontFamily: elem.fontFamily || "'Patrick Hand', cursive",
                    cursor: isDraggingRef.current && selectedId === elem.id ? 'grabbing' : 'grab',
                  }}
                  className={`absolute transition-shadow select-none group z-30 ${
                    isSelected ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-lg' : ''
                  }`}
                >
                  {/* Washi Tape Accent on Top Edge */}
                  {(elem.type === 'sticky' || elem.type === 'image') && (
                    <div className="washi-tape absolute -top-3 left-1/2 -translate-x-1/2 w-14 h-4 -rotate-2 rounded-xs pointer-events-none z-40" />
                  )}

                  {/* Inline Selected Element Floating Action Bar */}
                  {isSelected && (
                    <div 
                      onMouseDown={(e) => e.stopPropagation()}
                      className="absolute -top-10 right-0 flex items-center gap-1 bg-black/90 text-white p-1 rounded-xl shadow-2xl z-50 pointer-events-auto border border-white/20"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          rotateSelected();
                        }}
                        title="Rotate"
                        className="p-1.5 hover:bg-white/20 rounded-lg text-white transition-colors"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSelected();
                        }}
                        title="Delete this element"
                        className="p-1.5 hover:bg-red-500/80 rounded-lg text-red-400 hover:text-white transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* 1. STICKY NOTE (Left page scrapbook) */}
                  {elem.type === 'sticky' && (
                    <div
                      style={{ 
                        backgroundColor: elem.color || '#fef08a',
                        width: elem.width ? `${elem.width}px` : '200px',
                      }}
                      className="p-4 shadow-xl rounded-sm text-neutral-900 leading-snug font-handwriting"
                    >
                      <textarea
                        value={elem.content}
                        onChange={(e) => updateContent(elem.id, e.target.value)}
                        style={{ fontSize: `${elem.fontSize || 14}px` }}
                        className="w-full bg-transparent border-none resize-none overflow-hidden focus:outline-none text-neutral-900 font-inherit leading-snug"
                        rows={Math.max(3, elem.content.split('\n').length)}
                      />
                    </div>
                  )}

                  {/* 2. POLAROID PICTURE (Left page scrapbook) */}
                  {elem.type === 'image' && (
                    <div className="polaroid-card w-40 sm:w-44 shadow-xl transform transition-transform hover:scale-102">
                      <img
                        src={elem.content}
                        alt="Journal Pic"
                        className="w-full aspect-[4/3] object-cover rounded-xs pointer-events-none"
                      />
                      <div className="mt-1.5 text-center text-[10px] text-neutral-400 font-mono tracking-tight">
                        memories.jpg
                      </div>
                    </div>
                  )}

                  {/* 3. STICKER EMOJI (Can be positioned ANYWHERE across left and right page) */}
                  {elem.type === 'sticker' && (
                    <div 
                      style={{ fontSize: `${elem.fontSize || 38}px` }}
                      className="filter drop-shadow-md hover:scale-110 transition-transform p-1 select-none"
                    >
                      {elem.content}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Quick Action Footer */}
      <div className="flex items-center justify-center gap-3 mt-6">
        <div className="flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/90 dark:bg-neutral-900/90 shadow-xl border border-neutral-200 dark:border-neutral-700 backdrop-blur-md">
          <button
            onClick={() => setShowImageInput(true)}
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
            title="Add picture to left page"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => addStickyNote('#fef08a')}
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
            title="Add sticky note to left page"
          >
            <StickyNote className="w-4 h-4" />
          </button>
          <button
            onClick={deleteSelected}
            disabled={!selectedId}
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-red-500 disabled:opacity-30 transition-colors"
            title="Delete selected item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-5 bg-neutral-200 dark:border-neutral-800" />
          <button
            onClick={handleSave}
            disabled={saving}
            className="p-2 rounded-full bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity"
            title="Save Page Spread"
          >
            <Check className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}

