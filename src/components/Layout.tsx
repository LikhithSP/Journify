import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  BookMarked, 
  Plus, 
  LogOut, 
  Moon, 
  Sun, 
  Menu, 
  X,
  Home
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useProfileInfo } from '../pages/ProfilePage';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { signOut, user } = useAuth();
  const profile = useProfileInfo(user?.id);
  const [sidebarOpen, setSidebarOpen] = useState(true);  

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
              </nav>
              
              {/* Footer */}
              <div className="p-3 border-t border-gray-200 dark:border-gray-800 mt-auto">
                <button
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 mb-3"
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
        {/* Main Content */}
      <main className="flex-1 overflow-auto bg-white dark:bg-gray-900">
        <div className="px-4 py-6 md:px-10 md:py-8 lg:px-14 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
