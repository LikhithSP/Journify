import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  BookMarked, 
  Plus, 
  LogOut, 
  Settings, 
  Moon, 
  Sun, 
  Menu, 
  X,
  Home,
  Archive,
  Star,
  ChevronDown
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { signOut, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);  const [showFavorites, setShowFavorites] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      {/* Theme Toggle Button (top right, fixed) */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 p-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <Sun size={16} className="text-gray-300" /> : <Moon size={16} className="text-gray-700" />}
      </button>
      {/* Mobile Menu Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-20">
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur shadow-sm border border-gray-200 dark:border-gray-700"
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
      
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.2 }}
            className="w-56 md:w-60 bg-white dark:bg-gray-900 h-full border-r border-gray-100 dark:border-gray-800 fixed lg:sticky top-0 z-10"
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
                    className="w-full flex items-center justify-between px-3 py-1.5 rounded-md text-sm font-medium text-black dark:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 mb-2 transition-colors"
                  >
                    <div className="flex items-center">
                      <Plus size={15} className="mr-2" />
                      <span>New Entry</span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">⌘N</span>
                  </button>
                </div>                <div className={`px-2 py-1.5 rounded text-sm flex items-center mb-1 group transition-colors ${isActive('/') ? 'bg-gray-100 dark:bg-gray-800 font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
                  <Home size={15} className="mr-2 text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white" />
                  <button 
                    onClick={() => navigate('/')}
                    className="flex-1 text-left"
                  >
                    Home
                  </button>
                </div>

                {/* Favorites Section */}
                <div className="mt-4">
                  <button 
                    onClick={() => setShowFavorites(!showFavorites)}
                    className="flex items-center w-full py-2 px-2 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                  >
                    <ChevronDown size={14} className={`mr-1 transition-transform ${showFavorites ? 'transform rotate-180' : ''}`} />
                    <span className="uppercase tracking-wide font-medium">Favorites</span>
                  </button>
                  {showFavorites && (
                    <div className="ml-3 mt-1">
                      <div className="notion-sidebar-item group">
                        <Star size={15} className="mr-2 text-yellow-500" />
                        <span className="text-gray-800 dark:text-gray-300">Favorites</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tags Section */}
                <div className="mt-4">
                  <button 
                    className="flex items-center w-full py-2 px-2 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                  >
                    <ChevronDown size={14} className="mr-1" />
                    <span className="uppercase tracking-wide font-medium">Tags</span>
                  </button>
                </div>

                {/* Archives Section */}
                <div className="mt-1">
                  <div className="notion-sidebar-item group">
                    <Archive size={15} className="mr-2 text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white" />
                    <span className="text-gray-800 dark:text-gray-300">Archive</span>
                  </div>
                </div>
              </nav>
              
              {/* Footer */}
              <div className="p-3 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-7 h-7 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-300 mr-2">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="text-sm truncate max-w-[120px]">{user?.email}</div>
                  </div>
                </div>
                <div className="flex justify-between text-xs">
                  <button 
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center"
                    onClick={() => navigate('/settings')}
                  >
                    <Settings size={14} className="mr-1" />
                    <span>Settings</span>
                  </button>
                  <button 
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center"
                    onClick={handleLogout}
                  >
                    <LogOut size={14} className="mr-1" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
        {/* Main Content */}
      <main className="flex-1 overflow-auto bg-white dark:bg-gray-900">
        <div className="px-4 py-6 md:px-10 md:py-8 lg:px-14 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
