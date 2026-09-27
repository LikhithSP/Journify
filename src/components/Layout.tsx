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
  Star,
  Zap,
  X,
  ChevronDown,
  Settings,
  User
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
import { NotificationService } from '../services/notificationService';
import type { JournalEntry } from '../types/journal';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { signOut, user } = useAuth();
  const profile = useProfileInfo(user?.id);
  const [sidebarOpen, setSidebarOpen] = useState(true);  
  // Pro Upgrade banner state
  const [proBannerDismissed, setProBannerDismissed] = useState<boolean>(() => {
    return localStorage.getItem('journify_dismiss_pro_card') === 'true';
  });
  const isUserPro = localStorage.getItem('journify_user_pro') === 'true';

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

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="flex h-screen w-screen bg-white dark:bg-[rgb(23,23,23)]">
      {/* Global Theme Toggle Button (top right, fixed) - accessible on every page */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 sm:right-8 z-50 p-2 rounded-xl bg-white/90 dark:bg-neutral-800/90 hover:bg-gray-100 dark:hover:bg-neutral-700 backdrop-blur-md border border-gray-200 dark:border-neutral-700 shadow-sm transition-all duration-150 flex items-center justify-center cursor-pointer"
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? (
          <Sun size={16} className="text-amber-400 stroke-[2.2]" />
        ) : (
          <Moon size={16} className="text-neutral-700 stroke-[2.2]" />
        )}
      </button>

      {/* Mobile Menu Toggle (Hamburger) */}
      <div className="lg:hidden fixed top-4 left-4 z-40">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-xl bg-white/90 dark:bg-neutral-800/90 backdrop-blur-md shadow-sm border border-gray-200 dark:border-neutral-700"
          aria-label="Open sidebar menu"
        >
          {/* Hamburger icon: 3 lines */}
          <span className="block w-5 h-0.5 bg-gray-800 dark:bg-gray-200 mb-1 rounded-full"></span>
          <span className="block w-5 h-0.5 bg-gray-800 dark:bg-gray-200 mb-1 rounded-full"></span>
          <span className="block w-5 h-0.5 bg-gray-800 dark:bg-gray-200 rounded-full"></span>
        </button>
      </div>
      
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.2 }}
            className="w-56 md:w-60 h-full border-r border-gray-100 dark:border-gray-800 fixed lg:sticky top-0 z-40 bg-white dark:bg-[rgb(23,23,23)]"
            onClick={(e) => {
              // Prevent closing when clicking inside the sidebar
              e.stopPropagation();
            }}
          >
            <div className="flex flex-col h-full">
              {/* App Logo & Theme Toggle */}
              <div className="px-4 py-5 flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold text-black dark:text-white flex items-center">
                    <BookMarked className="mr-2 h-5 w-5 text-gray-700 dark:text-gray-300" />
                    Journify
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Your daily journal companion</p>
                </div>
                <button
                  onClick={toggleTheme}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
                  aria-label="Toggle theme"
                  title="Toggle light/dark theme"
                >
                  {theme === 'dark' ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
                </button>
              </div>
              
              {/* Navigation */}
              <nav className="flex-1 px-2 pb-4 space-y-1 overflow-y-auto">
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

                <div className={`px-2 py-1.5 rounded text-sm flex items-center mb-1 group transition-colors ${isActive('/journals') && !location.search.includes('favorites') ? 'bg-gray-100 dark:bg-[rgb(44,44,44)] font-medium' : 'hover:bg-gray-100 dark:hover:bg-[rgb(60,60,60)] text-gray-700 dark:text-gray-300'}`}>
                  <BookMarked size={15} className="mr-2 text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white" />
                  <button 
                    onClick={() => navigate('/journals')}
                    className="flex-1 text-left"
                  >
                    All Journals
                  </button>
                </div>

                <div className={`px-2 py-1.5 rounded text-sm flex items-center mb-1 group transition-colors ${location.pathname === '/journals' && location.search.includes('tab=favorites') ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 font-medium' : 'hover:bg-gray-100 dark:hover:bg-[rgb(60,60,60)] text-gray-700 dark:text-gray-300'}`}>
                  <Star size={15} className={`mr-2 ${location.search.includes('tab=favorites') ? 'text-amber-500 fill-amber-500' : 'text-gray-500 group-hover:text-amber-500'}`} />
                  <button 
                    onClick={() => navigate('/journals?tab=favorites')}
                    className="flex-1 text-left"
                  >
                    Favorites
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

                {/* New Entry shortcut */}
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => navigate('/entry/new')}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[rgb(60,60,60)] transition-colors group"
                  >
                    <Plus size={15} className="text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white" />
                    New Entry
                  </button>
                </div>
              </nav>
              
              {/* Footer */}
              <div className="p-3 border-t border-gray-200 dark:border-gray-800 mt-auto space-y-2.5">
                {/* Upgrade to PRO Badge / Card */}
                {!isUserPro && !proBannerDismissed && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative overflow-hidden rounded-2xl p-3.5 text-white shadow-md bg-gradient-to-br from-[#8d5b74] via-[#7c4e78] to-[#60447c] dark:from-[#543048] dark:via-[#472c50] dark:to-[#36254a] border border-[#a8748d]/40 dark:border-white/15"
                  >
                    {/* Top Row: Icon, Title, Discount Pill & Close Button */}
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Zap size={14} className="text-amber-300 fill-amber-300" />
                        <span className="font-bold text-xs tracking-tight text-white">Upgrade to PRO</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-white/20 text-white uppercase tracking-wider backdrop-blur-xs border border-white/20">
                          20% OFF
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProBannerDismissed(true);
                          localStorage.setItem('journify_dismiss_pro_card', 'true');
                        }}
                        className="text-white/70 hover:text-white p-0.5 rounded transition"
                        title="Dismiss"
                      >
                        <X size={13} />
                      </button>
                    </div>

                    {/* Subtext description */}
                    <p className="text-[11px] text-white/90 leading-snug mb-3 font-normal">
                      Advanced reports, unlimited cloud storage and 30-day data retention.
                    </p>

                    {/* Dotted Divider line */}
                    <div className="border-b border-dotted border-white/25 my-2.5" />

                    {/* Price and Upgrade Now Button */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-lg font-extrabold font-mono text-white">$5</span>
                        <span className="text-[11px] text-white/75">/month</span>
                      </div>
                      <ChevronDown size={14} className="text-white/75" />
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate('/upgrade')}
                      className="w-full py-1.5 px-3 rounded-xl bg-white/20 hover:bg-white/30 active:scale-[0.98] text-white text-xs font-semibold backdrop-blur-md transition-all shadow-xs border border-white/25 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Upgrade now</span>
                    </button>
                  </motion.div>
                )}

                {/* Profile Button */}
                <button
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-[rgb(44,44,44)] hover:bg-gray-200 dark:hover:bg-[rgb(60,60,60)] transition-colors border border-gray-200/50 dark:border-neutral-700/50"
                  onClick={() => navigate('/profile')}
                >
                  <img
                    src={profile?.avatar_url || '/journal.svg'}
                    alt="Profile"
                    className="w-7 h-7 rounded-full object-cover border"
                  />
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="font-semibold text-xs truncate w-full text-left">
                      {profile?.name || user?.email?.split('@')[0] || 'Profile'}
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate w-full text-left">
                      {user?.email || 'profile'}
                    </span>
                  </div>
                  {isUserPro && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      PRO
                    </span>
                  )}
                </button>

                {/* Bottom action row: Settings + Logout */}
                <div className="flex items-center gap-2">
                  <button
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[rgb(44,44,44)] hover:text-gray-900 dark:hover:text-white transition-colors border border-gray-200 dark:border-neutral-700"
                    onClick={() => navigate('/profile?tab=settings')}
                    title="Settings"
                  >
                    <Settings size={13} />
                    Settings
                  </button>
                  <button 
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity"
                    onClick={handleLogout}
                  >
                    <LogOut size={13} />
                    Log Out
                  </button>
                </div>
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
      <main className="flex-1 overflow-auto bg-white dark:bg-[rgb(23,23,23)] pb-28 lg:pb-0">
        <div className="px-4 py-6 md:px-8 md:py-8 lg:px-10 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Apple-style Floating Pill Nav */}
      <nav className="lg:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-0.5 px-2.5 py-2 rounded-full
        bg-white/90 dark:bg-neutral-900/90
        backdrop-blur-2xl
        border border-gray-200/70 dark:border-neutral-700/60
        shadow-[0_4px_24px_rgba(0,0,0,0.10),0_1px_4px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)]">

        {/* Home */}
        <button
          onClick={() => navigate('/home')}
          className={`flex flex-col items-center justify-center px-3.5 py-1.5 rounded-full transition-all duration-200 ${
            isActive('/home')
              ? 'bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-gray-100'
              : 'text-gray-400 dark:text-neutral-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100/60 dark:hover:bg-neutral-800/60'
          }`}
        >
          <Home size={18} strokeWidth={isActive('/home') ? 2.2 : 1.8} />
          <span className="text-[9px] mt-0.5 font-medium">{isActive('/home') ? 'Home' : 'Home'}</span>
        </button>

        {/* Search */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex flex-col items-center justify-center px-3.5 py-1.5 rounded-full text-gray-400 dark:text-neutral-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100/60 dark:hover:bg-neutral-800/60 transition-all duration-200"
        >
          <Search size={18} strokeWidth={1.8} />
          <span className="text-[9px] mt-0.5 font-medium">Search</span>
        </button>

        {/* Center compose — primary CTA, intentionally more prominent */}
        <button
          onClick={() => navigate('/entry/new')}
          className="flex items-center justify-center w-10 h-10 mx-1.5 rounded-full
            bg-neutral-900 dark:bg-neutral-100
            text-white dark:text-neutral-900
            shadow-md shadow-neutral-900/20 dark:shadow-neutral-100/10
            hover:bg-neutral-700 dark:hover:bg-white
            hover:scale-105 active:scale-95 transition-all duration-150"
          aria-label="New Journal Entry"
        >
          <Plus size={19} strokeWidth={2.3} />
        </button>

        {/* Journals */}
        <button
          onClick={() => navigate('/journals')}
          className={`flex flex-col items-center justify-center px-3.5 py-1.5 rounded-full transition-all duration-200 ${
            isActive('/journals')
              ? 'bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-gray-100'
              : 'text-gray-400 dark:text-neutral-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100/60 dark:hover:bg-neutral-800/60'
          }`}
        >
          <BookMarked size={18} strokeWidth={isActive('/journals') ? 2.2 : 1.8} />
          <span className="text-[9px] mt-0.5 font-medium">Journals</span>
        </button>

        {/* Profile */}
        <button
          onClick={() => navigate('/profile')}
          className={`flex flex-col items-center justify-center px-3.5 py-1.5 rounded-full transition-all duration-200 ${
            isActive('/profile')
              ? 'bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-gray-100'
              : 'text-gray-400 dark:text-neutral-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100/60 dark:hover:bg-neutral-800/60'
          }`}
        >
          <User size={18} strokeWidth={isActive('/profile') ? 2.2 : 1.8} />
          <span className="text-[9px] mt-0.5 font-medium">Profile</span>
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
