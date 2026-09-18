import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  BookMarked, 
  Plus, 
  LogOut, 
  Moon, 
  Sun, 
  Home, 
  Search,
  Calendar,
  ShieldCheck,
  User,
  FolderPlus
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useProfileInfo } from '../hooks/useProfileInfo';
import { supabase } from '../lib/supabase';
import { OfflineDB } from '../services/offlineDB';
import OfflineSyncBanner from './OfflineSyncBanner';
import GlobalSearchModal from './GlobalSearchModal';
import InAppNotificationToast from './InAppNotificationToast';
import PWAInstallPrompt from './PWAInstallPrompt';
import FolderTree from './FolderTree';
import { NotificationService } from '../services/notificationService';
import type { JournalEntry } from '../types/journal';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { signOut, user } = useAuth();
  const profile = useProfileInfo(user?.id);
  const [sidebarOpen, setSidebarOpen] = useState(true);  
  const [folders, setFolders] = useState<any[]>([]);
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  // Drag and drop state for journal id
  const [draggedJournalId, setDraggedJournalId] = useState<string | null>(null);

  // Global search modal state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchEntries, setSearchEntries] = useState<JournalEntry[]>([]);

  // Fetch all entries for global search modal (cached in OfflineDB)
  useEffect(() => {
    async function loadSearchData() {
      if (!user) return;
      try {
        const localEntries = await OfflineDB.getAllEntries(user.id);
        if (localEntries.length > 0) setSearchEntries(localEntries);

        if (navigator.onLine) {
          const { data } = await supabase
            .from('journal_entries')
            .select('*')
            .eq('user_id', user.id);
          if (data) setSearchEntries(data as JournalEntry[]);
        }
      } catch (e) {}
    }
    loadSearchData();
  }, [user, location.pathname]);

  // Start Notification Scheduler (evaluates daily, custom, missed, and streak reminders)
  useEffect(() => {
    const getLastDate = () => {
      if (searchEntries.length === 0) return null;
      return searchEntries[0]?.created_at || null;
    };
    const getStreak = () => {
      // Calculate simple consecutive day streak
      return Math.min(searchEntries.length, 7);
    };

    const stopScheduler = NotificationService.startScheduler(getLastDate, getStreak);
    return () => stopScheduler();
  }, [searchEntries]);

  // Derived tags & moods for search
  const availableTags = Array.from(new Set(searchEntries.flatMap((e) => e.tags || []))).sort();
  const availableMoods = Array.from(new Set(searchEntries.map((e) => e.mood).filter(Boolean))) as string[];

  // Fetch folders from Supabase & IndexedDB
  useEffect(() => {
    async function fetchFolders() {
      if (!user) return;
      try {
        const localFolders = await OfflineDB.getAllFolders(user.id);
        if (localFolders.length > 0) setFolders(localFolders);

        if (navigator.onLine) {
          const { data } = await supabase
            .from('folders')
            .select('id, name, parent_id, color, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });
          if (data) {
            setFolders(data);
            await OfflineDB.putFoldersBatch(data);
          }
        }
      } catch (e) {
        console.error('Error loading folders:', e);
      }
    }
    fetchFolders();
  }, [user]);

  // Add folder or subfolder
  const handleCreateFolder = async (name: string, parentId?: string | null) => {
    if (!name.trim() || !user) return;
    const tempId = `folder_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const folderPayload = {
      id: tempId,
      name: name.trim(),
      user_id: user.id,
      parent_id: parentId || null,
      created_at: new Date().toISOString(),
    };

    // Optimistic local update
    setFolders((prev) => [...prev, folderPayload]);
    await OfflineDB.putFolder(folderPayload);

    if (navigator.onLine) {
      const { data, error } = await supabase
        .from('folders')
        .insert([{ 
          name: name.trim(), 
          user_id: user.id,
          parent_id: parentId || null 
        }])
        .select('id, name, parent_id, color, created_at')
        .single();
      
      if (!error && data) {
        setFolders((prev) => prev.map((f) => (f.id === tempId ? data : f)));
        await OfflineDB.deleteFolder(tempId);
        await OfflineDB.putFolder(data);
      }
    }
  };

  // Delete folder and its nested subfolders
  const handleDeleteFolder = async (folderId: string) => {
    if (!user) return;

    // Find all subfolder IDs recursively
    const idsToDelete: string[] = [folderId];
    const findChildren = (pid: string) => {
      folders.filter((f) => f.parent_id === pid).forEach((child) => {
        idsToDelete.push(child.id);
        findChildren(child.id);
      });
    };
    findChildren(folderId);

    // Optimistic local removal
    setFolders((prev) => prev.filter((f) => !idsToDelete.includes(f.id)));
    for (const id of idsToDelete) {
      await OfflineDB.deleteFolder(id);
    }

    if (navigator.onLine) {
      await supabase
        .from('folders')
        .delete()
        .in('id', idsToDelete)
        .eq('user_id', user.id);
    }

    // If currently viewing the deleted folder, navigate back to home
    if (location.pathname.includes(`/folder/${folderId}`)) {
      navigate('/');
    }
  };

  // Add folder click handler
  const handleFolderClick = (folderId: string) => {
    navigate(`/folder/${folderId}`);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isDashboard = location.pathname === '/home' || location.pathname === '/';

  return (
    <div className="flex h-screen w-screen bg-white dark:bg-[rgb(23,23,23)]">
      {/* Theme Toggle Button (top right, fixed) - only on dashboard */}
      {isDashboard && (        <button
          onClick={toggleTheme}
          className="fixed top-4 right-16 z-50 p-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={16} className="text-gray-300" /> : <Moon size={16} className="text-gray-700" />}
        </button>
      )}
      {/* Mobile Menu Toggle (Hamburger) - only on dashboard */}
      {isDashboard && (
        <div className="lg:hidden fixed top-4 left-4 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur shadow-sm border border-gray-200 dark:border-gray-700"
            aria-label="Open sidebar menu"
          >
            {/* Hamburger icon: 3 lines */}
            <span className="block w-6 h-0.5 bg-gray-800 dark:bg-gray-200 mb-1"></span>
            <span className="block w-6 h-0.5 bg-gray-800 dark:bg-gray-200 mb-1"></span>
            <span className="block w-6 h-0.5 bg-gray-800 dark:bg-gray-200"></span>
          </button>
        </div>
      )}
      
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.2 }}
            className="w-56 md:w-60 h-full border-r border-gray-100 dark:border-gray-800 fixed lg:sticky top-0 z-10 bg-white dark:bg-[rgb(23,23,23)]"
            onClick={(e) => {
              // Prevent closing when clicking inside the sidebar
              e.stopPropagation();
            }}
          >
            <div className="flex flex-col h-full">              {/* App Logo */}
              <div className="px-4 py-5">
                <h1 className="text-xl font-semibold text-black dark:text-white flex items-center">
                  <BookMarked className="mr-2 h-5 w-5 text-gray-700 dark:text-gray-300" />
                  Journify
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Your daily journal companion</p>
              </div>
              
              {/* Navigation */}
              <nav className="flex-1 px-2 pb-4 space-y-1">
                <div className={`px-2 py-1.5 rounded text-sm flex items-center mb-1 group transition-colors hover:bg-gray-100 dark:hover:bg-[rgb(60,60,60)] text-gray-700 dark:text-gray-300`}>
                  <Search size={15} className="mr-2 text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white" />
                  <button 
                    onClick={() => setSearchOpen(true)}
                    className="flex-1 text-left flex items-center justify-between"
                  >
                    <span>Search</span>
                    <span className="text-[10px] bg-gray-200 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-gray-500">⌘K</span>
                  </button>
                </div>

                <div className={`px-2 py-1.5 rounded text-sm flex items-center mb-1 group transition-colors ${isActive('/home') ? 'bg-gray-100 dark:bg-[rgb(44,44,44)] font-medium' : 'hover:bg-gray-100 dark:hover:bg-[rgb(60,60,60)] text-gray-700 dark:text-gray-300'}`}>
                  <Home size={15} className="mr-2 text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white" />
                  <button 
                    onClick={() => navigate('/home')}
                    className="flex-1 text-left"
                  >
                    Home
                  </button>
                </div>

                <div className={`px-2 py-1.5 rounded text-sm flex items-center mb-1 group transition-colors ${isActive('/journals') ? 'bg-gray-100 dark:bg-[rgb(44,44,44)] font-medium' : 'hover:bg-gray-100 dark:hover:bg-[rgb(60,60,60)] text-gray-700 dark:text-gray-300'}`}>
                  <BookMarked size={15} className="mr-2 text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white" />
                  <button 
                    onClick={() => navigate('/journals')}
                    className="flex-1 text-left"
                  >
                    All Journals
                  </button>
                </div>

                <div className={`px-2 py-1.5 rounded text-sm flex items-center mb-1 group transition-colors ${isActive('/calendar') ? 'bg-gray-100 dark:bg-[rgb(44,44,44)] font-medium' : 'hover:bg-gray-100 dark:hover:bg-[rgb(60,60,60)] text-gray-700 dark:text-gray-300'}`}>
                  <Calendar size={15} className="mr-2 text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white" />
                  <button 
                    onClick={() => navigate('/calendar')}
                    className="flex-1 text-left"
                  >
                    Calendar
                  </button>
                </div>

                {/* Hierarchical Folders & Subfolders Section */}
                <div className="mt-4 px-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Folders</span>
                    <button
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition"
                      onClick={() => setShowFolderInput((v) => !v)}
                      title="Add Root Folder"
                      type="button"
                    >
                      <FolderPlus size={15} />
                    </button>
                  </div>

                  {showFolderInput && (
                    <div className="flex items-center gap-1 mb-2">
                      <input
                        type="text"
                        className="flex-1 px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-xs text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                        placeholder="Folder name"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCreateFolder(newFolderName);
                            setNewFolderName('');
                            setShowFolderInput(false);
                          }
                          if (e.key === 'Escape') setShowFolderInput(false);
                        }}
                        autoFocus
                      />
                      <button
                        className="px-2 py-1 rounded bg-black text-white dark:bg-white dark:text-black text-xs font-medium hover:opacity-90"
                        onClick={() => {
                          handleCreateFolder(newFolderName);
                          setNewFolderName('');
                          setShowFolderInput(false);
                        }}
                        type="button"
                      >
                        Add
                      </button>
                    </div>
                  )}

                  <FolderTree
                    folders={folders}
                    activeFolderId={location.pathname.startsWith('/folder/') ? location.pathname.split('/folder/')[1] : null}
                    onSelectFolder={handleFolderClick}
                    onCreateFolder={handleCreateFolder}
                    onDeleteFolder={handleDeleteFolder}
                    onDropJournal={async (folderId) => {
                      if (draggedJournalId && user) {
                        await supabase
                          .from('journal_entries')
                          .update({ folder_id: folderId })
                          .eq('id', draggedJournalId)
                          .eq('user_id', user.id);
                        setDraggedJournalId(null);
                      }
                    }}
                  />
                </div>
              </nav>
              
              {/* Footer */}
              <div className="p-3 border-t border-gray-200 dark:border-gray-800 mt-auto">
                <button
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-[rgb(44,44,44)] hover:bg-gray-200 dark:hover:bg-[rgb(60,60,60)] mb-3 transition-colors"
                  onClick={() => navigate('/profile')}
                >
                  <img
                    src={profile?.avatar_url || '/journal.svg'}
                    alt="Profile"
                    className="w-7 h-7 rounded-full object-cover border"
                  />
                  <div className="flex flex-col items-start">
                    <span className="font-semibold">{profile?.name || user?.email?.split('@')[0] || 'Profile'}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Profile</span>
                  </div>
                </button>
                <button 
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  Log Out
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
      {/* Overlay for mobile sidebar, closes sidebar on click (only on mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-5 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-white dark:bg-[rgb(23,23,23)] pb-20 lg:pb-0">
        <div className="px-4 py-6 md:px-8 md:py-8 lg:px-10 max-w-7xl mx-auto">
          <Outlet context={{ setDraggedJournalId }} />
        </div>
      </main>

      {/* Modern Mobile Bottom App Bar (Native PWA Feel) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-lg border-t border-gray-200/80 dark:border-neutral-800 px-3 py-2 flex items-center justify-around shadow-lg">
        <button
          onClick={() => navigate('/home')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition ${
            isActive('/home') ? 'text-black dark:text-white font-semibold' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
          }`}
        >
          <Home size={20} />
          <span className="text-[10px] mt-0.5">Home</span>
        </button>

        <button
          onClick={() => setSearchOpen(true)}
          className="flex flex-col items-center justify-center p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
        >
          <Search size={20} />
          <span className="text-[10px] mt-0.5">Search</span>
        </button>

        {/* Floating Center Write Action */}
        <button
          onClick={() => navigate('/entry/new')}
          className="w-11 h-11 -mt-5 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition"
          aria-label="New Journal Entry"
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>

        <button
          onClick={() => navigate('/journals')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition ${
            isActive('/journals') ? 'text-black dark:text-white font-semibold' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
          }`}
        >
          <BookMarked size={20} />
          <span className="text-[10px] mt-0.5">Journals</span>
        </button>

        <button
          onClick={() => navigate('/profile')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition ${
            isActive('/profile') ? 'text-black dark:text-white font-semibold' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
          }`}
        >
          <User size={20} />
          <span className="text-[10px] mt-0.5">Profile</span>
        </button>
      </nav>

      {/* Floating Offline / Background Sync Status Banner */}
      <OfflineSyncBanner />

      {/* PWA Install Prompt Banner */}
      <PWAInstallPrompt />

      {/* Global Command Palette & Search Modal */}
      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        entries={searchEntries}
        availableTags={availableTags}
        availableMoods={availableMoods}
      />

      {/* In-App Notification Toast */}
      <InAppNotificationToast />
    </div>
  );
}
