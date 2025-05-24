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
  FolderPlus,
  Folder
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useProfileInfo } from '../pages/ProfilePage';
import { supabase } from '../lib/supabase';
import Dashboard from '../pages/Dashboard';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { signOut, user } = useAuth();
  const profile = useProfileInfo(user?.id);
  const [sidebarOpen, setSidebarOpen] = useState(true);  
  const [folders, setFolders] = useState<{ id: string; name: string }[]>([]);
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  // Drag and drop state for journal id
  const [draggedJournalId, setDraggedJournalId] = useState<string | null>(null);

  // Fetch folders from Supabase
  useEffect(() => {
    async function fetchFolders() {
      if (!user) return;
      const { data } = await supabase
        .from('folders')
        .select('id, name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (data) setFolders(data);
    }
    fetchFolders();
  }, [user]);

  // Add folder to Supabase
  const handleAddFolder = async () => {
    if (newFolderName.trim() && user) {
      const { data, error } = await supabase
        .from('folders')
        .insert([{ name: newFolderName.trim(), user_id: user.id }])
        .select('id, name')
        .single();
      if (!error && data) {
        setFolders([...folders, data]);
        setNewFolderName('');
        setShowFolderInput(false);
      }
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

  const isDashboard = location.pathname === '/';

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
                {/* Quick Actions */}                <div className="mb-5 px-3">
                  <button 
                    onClick={() => navigate('/entry/new')}
                    className="w-full flex items-center justify-between px-3 py-1.5 rounded-md text-sm font-medium text-black dark:text-white bg-gray-100 dark:bg-[rgb(44,44,44)] hover:bg-gray-200 dark:hover:bg-[rgb(60,60,60)] mb-2 transition-colors"
                  >
                    <div className="flex items-center">
                      <Plus size={15} className="mr-2" />
                      <span>New Entry</span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">⌘N</span>
                  </button>
                </div>                <div className={`px-2 py-1.5 rounded text-sm flex items-center mb-1 group transition-colors ${isActive('/') ? 'bg-gray-100 dark:bg-[rgb(44,44,44)] font-medium' : 'hover:bg-gray-100 dark:hover:bg-[rgb(60,60,60)] text-gray-700 dark:text-gray-300'}`}>
                  <Home size={15} className="mr-2 text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white" />
                  <button 
                    onClick={() => navigate('/')}
                    className="flex-1 text-left"
                  >
                    Home
                  </button>
                </div>
                {/* Folders Section */}
                <div className="mt-2 px-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Folders</span>
                    <button
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                      onClick={() => setShowFolderInput((v) => !v)}
                      title="Add Folder"
                      type="button"
                    >
                      <FolderPlus size={16} />
                    </button>
                  </div>
                  {showFolderInput && (
                    <div className="flex items-center gap-1 mb-2">
                      <input
                        type="text"
                        className="flex-1 px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-xs text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700"
                        placeholder="Folder name"
                        value={newFolderName}
                        onChange={e => setNewFolderName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleAddFolder(); }}
                        autoFocus
                      />
                      <button
                        className="px-2 py-1 rounded bg-black text-white dark:bg-white dark:text-black text-xs font-medium hover:opacity-90"
                        onClick={handleAddFolder}
                        type="button"
                      >
                        Add
                      </button>
                    </div>
                  )}
                  <div className="space-y-1">
                    {folders.map(folder => (
                      <div
                        key={folder.id}
                        className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-700 dark:text-gray-200"
                        onClick={() => handleFolderClick(folder.id)}
                        onDragOver={e => { e.preventDefault(); }}
                        onDrop={async e => {
                          e.preventDefault();
                          if (draggedJournalId && user) {
                            // Move journal to this folder in Supabase
                            await supabase
                              .from('journal_entries')
                              .update({ folder_id: folder.id })
                              .eq('id', draggedJournalId)
                              .eq('user_id', user.id);
                            setDraggedJournalId(null);
                            // Optionally: refresh dashboard/folder view here
                          }
                        }}
                        style={{ minHeight: 36 }}
                      >
                        <Folder size={15} className="text-gray-400 dark:text-gray-300" />
                        <span>{folder.name}</span>
                      </div>
                    ))}
                  </div>
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
      <main className="flex-1 overflow-auto bg-white dark:bg-[rgb(23,23,23)]">
        <div className="px-4 py-6 md:px-10 md:py-8 lg:px-14 max-w-6xl mx-auto">
          {location.pathname === '/' ? <Dashboard setDraggedJournalId={setDraggedJournalId} /> : <Outlet />}
        </div>
      </main>
    </div>
  );
}
