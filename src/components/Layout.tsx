import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { 
  BookMarked, 
  Plus, 
  Search, 
  LogOut, 
  User2, 
  Settings, 
  Moon, 
  Sun, 
  Menu, 
  X 
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { signOut, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      {/* Mobile Menu Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-20">
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-md"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ duration: 0.3 }}
            className={`w-64 bg-white dark:bg-gray-900 h-full shadow-lg fixed lg:relative z-10`}
          >
            <div className="flex flex-col h-full py-6">
              {/* App Logo */}
              <div className="px-6 mb-8">
                <h1 className="text-2xl font-title font-bold text-primary-600 flex items-center">
                  <BookMarked className="mr-2" />
                  Journify
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Your daily journal companion</p>
              </div>
              
              {/* Navigation */}
              <nav className="flex-1 px-3">
                <div className="space-y-2">
                  <button 
                    onClick={() => navigate('/')}
                    className="w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <BookMarked size={18} className="mr-3" />
                    <span>All Entries</span>
                  </button>
                  
                  <button 
                    onClick={() => navigate('/entry/new')}
                    className="w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
                  >
                    <Plus size={18} className="mr-3" />
                    <span>New Entry</span>
                  </button>
                  
                  {/* Search Form */}
                  <div className="mt-6 px-3">
                    <form className="flex items-center" onSubmit={(e) => { 
                      e.preventDefault(); 
                      if (searchQuery.trim()) {
                        navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
                      }
                    }}>
                      <input 
                        type="text" 
                        placeholder="Search entries..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input text-sm w-full"
                      />
                      <button type="submit" className="ml-2 p-2 rounded-md bg-gray-100 dark:bg-gray-800">
                        <Search size={16} />
                      </button>
                    </form>
                  </div>
                </div>
                
                {/* Tags (will implement later) */}
                <div className="mt-8">
                  <h2 className="px-3 mb-3 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                    Popular Tags
                  </h2>
                  <div className="space-y-1 px-3">
                    {['Work', 'Personal', 'Ideas', 'Health'].map(tag => (
                      <button 
                        key={tag} 
                        className="inline-flex items-center mr-2 mb-2 px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </nav>
              
              {/* User Profile & Controls */}
              <div className="mt-auto px-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                      <User2 size={16} className="text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium">{user?.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={toggleTheme}
                    className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800"
                    aria-label="Toggle theme"
                  >
                    {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                  </button>
                </div>
                <div className="flex justify-between">
                  <button 
                    className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    onClick={() => navigate('/settings')}
                  >
                    <Settings size={16} className="mr-1" />
                    <span>Settings</span>
                  </button>
                  <button 
                    className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} className="mr-1" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
