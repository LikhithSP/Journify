import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { 
  Plus, 
  LogOut, 
  Moon, 
  Sun, 
  User as UserIcon,
  BookOpen,
  PenLine,
  ChevronRight,
  X,
  Library
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useProfileInfo } from '../pages/ProfilePage';
import type { DiaryBook } from '../types/journal';

export default function Layout() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { signOut, user } = useAuth();
  const profile = useProfileInfo(user?.id);

  // Create popover state
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showBookPicker, setShowBookPicker] = useState(false);
  const [books, setBooks] = useState<DiaryBook[]>([]);
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  // Load books from localStorage whenever popover opens
  useEffect(() => {
    if (showCreateMenu && user) {
      const stored = localStorage.getItem(`journify_books_${user.id}`);
      if (stored) {
        try {
          setBooks(JSON.parse(stored));
        } catch {
          setBooks([]);
        }
      }
    }
  }, [showCreateMenu, user]);

  // Close popover when clicking outside
  useEffect(() => {
    if (!showCreateMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowCreateMenu(false);
        setShowBookPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCreateMenu]);

  const handleSelectJournal = () => {
    setShowCreateMenu(false);
    setShowBookPicker(false);
    navigate('/app/entry/new');
  };

  const handleSelectBook = (book: DiaryBook) => {
    setShowCreateMenu(false);
    setShowBookPicker(false);
    navigate('/app/entry/new', {
      state: {
        bookId: book.id,
        bookTitle: book.title,
      },
    });
  };

  const handleOpenBookshelf = () => {
    setShowCreateMenu(false);
    setShowBookPicker(false);
    navigate('/app/library');
  };

  return (
    <div className="min-h-screen w-full bg-[#fcfcfc] dark:bg-[#121214] text-neutral-900 dark:text-neutral-100 transition-colors flex flex-col justify-between relative selection:bg-neutral-200 dark:selection:bg-neutral-800">
      
      {/* Top Floating Brand Header */}
      <header className="sticky top-0 z-30 w-full backdrop-blur-md bg-white/70 dark:bg-[#121214]/70 border-b border-neutral-200/60 dark:border-neutral-800/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Link to="/app" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center text-xs font-bold tracking-tight group-hover:scale-105 transition-transform">
              J
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Journify
            </span>
          </Link>

          {/* Quick Actions in Header */}
          <div className="flex items-center gap-2.5">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content (Full Width Without Sidebars) */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 pt-5 pb-28">
        <Outlet />
      </main>

      {/* Floating Bottom Rounded Bar with Centered Create Button & Balanced Left/Right Spacing */}
      <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center pointer-events-none px-4">
        <div ref={popoverRef} className="relative pointer-events-auto flex items-center justify-center w-full sm:w-auto">
          
          {/* ────────── Create Type Popover ────────── */}
          {showCreateMenu && (
            <div className="absolute bottom-[70px] left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
              <div className="liquid-glass rounded-2xl border border-white/20 dark:border-white/10 bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-2xl shadow-2xl overflow-hidden min-w-[240px]">
                
                {/* Popover Header */}
                <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-neutral-100 dark:border-neutral-800">
                  <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-neutral-400">
                    Create New
                  </span>
                  <button
                    onClick={() => { setShowCreateMenu(false); setShowBookPicker(false); }}
                    className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {!showBookPicker ? (
                  /* ── Step 1: Choose type ── */
                  <div className="p-2 space-y-1">
                    {/* Journal Entry */}
                    <button
                      onClick={handleSelectJournal}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/80 text-left transition-colors group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                        <PenLine className="w-4 h-4 text-white dark:text-neutral-900" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-neutral-900 dark:text-white leading-tight">
                          Journal Entry
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                          Standalone page · not in a diary book
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                    </button>

                    {/* Diary Page */}
                    <button
                      onClick={() => setShowBookPicker(true)}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/80 text-left transition-colors group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                        <BookOpen className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-neutral-900 dark:text-white leading-tight">
                          Diary Page
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                          Write inside one of your diary books
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                    </button>
                  </div>
                ) : (
                  /* ── Step 2: Pick a book ── */
                  <div className="p-2">
                    <button
                      onClick={() => setShowBookPicker(false)}
                      className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white mb-2 px-2 py-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <ChevronRight className="w-3 h-3 rotate-180" />
                      Back
                    </button>

                    <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                      {books.length === 0 ? (
                        <div className="text-center py-6">
                          <Library className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            No diary books yet.
                          </p>
                          <button
                            onClick={handleOpenBookshelf}
                            className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            Create one in the Library →
                          </button>
                        </div>
                      ) : (
                        books.map((book) => (
                          <button
                            key={book.id}
                            onClick={() => handleSelectBook(book)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/80 text-left transition-colors group"
                          >
                            {/* Mini Book Cover */}
                            <div className="w-8 h-10 rounded-sm overflow-hidden flex-shrink-0 shadow-md border border-black/10 dark:border-white/10">
                              {book.cover_url ? (
                                <img
                                  src={book.cover_url}
                                  alt={book.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div
                                  className="w-full h-full flex items-center justify-center text-white text-xs font-bold"
                                  style={{ backgroundColor: book.spine_color || '#18181b' }}
                                >
                                  {book.title[0]}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-neutral-900 dark:text-white truncate leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {book.title}
                              </div>
                              {book.subtitle && (
                                <div className="text-[10px] text-neutral-400 truncate mt-0.5">
                                  {book.subtitle}
                                </div>
                              )}
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Popover Arrow */}
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-white/95 dark:bg-[#18181b]/95 border-r border-b border-white/20 dark:border-white/10" />
            </div>
          )}

          {/* ────────── The Actual Nav Bar ────────── */}
          <div className="liquid-glass rounded-full px-3 sm:px-5 py-2 sm:py-2.5 shadow-2xl border border-neutral-200/80 dark:border-white/15 bg-white/90 dark:bg-[#18181b]/90 backdrop-blur-2xl flex items-center justify-between gap-3 sm:gap-6 transition-all hover:scale-[1.01] max-w-sm sm:max-w-none w-full sm:w-auto">
            
            {/* Left Side: User Profile Capsule */}
            <div className="flex-1 flex justify-start">
              <button
                onClick={() => navigate('/app/profile')}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors group"
                title="My Profile"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover border border-neutral-300 dark:border-neutral-700 shadow-sm"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center text-xs font-semibold shadow-sm">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
                <div className="flex items-center text-left">
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white leading-tight group-hover:underline max-w-[100px] sm:max-w-none truncate">
                    {profile?.name || user?.email?.split('@')[0] || 'Guest'}
                  </span>
                </div>
              </button>
            </div>

            {/* Center: Large Distinct Create Button */}
            <div className="flex-shrink-0 flex items-center justify-center px-1 relative">
              <button
                onClick={() => {
                  setShowBookPicker(false);
                  setShowCreateMenu(prev => !prev);
                }}
                className={`w-12 h-12 rounded-full bg-black text-white dark:bg-white dark:text-black hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center group ${showCreateMenu ? 'scale-95 ring-2 ring-indigo-500 ring-offset-2' : ''}`}
                title="Create New Entry"
              >
                <Plus className={`w-6 h-6 transition-transform duration-200 ${showCreateMenu ? 'rotate-45' : 'group-hover:rotate-90'}`} />
              </button>
            </div>

            {/* Right Side: Logout Button */}
            <div className="flex-1 flex justify-end">
              <button
                onClick={handleLogout}
                title="Log Out"
                className="flex items-center gap-2 px-2 sm:px-4 py-2 rounded-full text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 active:scale-95 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
