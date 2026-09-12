import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Plus, 
  LogOut, 
  Moon, 
  Sun, 
  User as UserIcon,
  Library,
  BookOpen
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useProfileInfo } from '../pages/ProfilePage';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { signOut, user } = useAuth();
  const profile = useProfileInfo(user?.id);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const isLibrary = location.pathname.startsWith('/app/library') || location.pathname.startsWith('/app/book') || location.pathname.startsWith('/app/daily');

  return (
    <div className="min-h-screen w-full bg-[#fcfcfc] dark:bg-[#121214] text-neutral-900 dark:text-neutral-100 transition-colors flex flex-col justify-between relative selection:bg-neutral-200 dark:selection:bg-neutral-800">
      
      {/* Top Floating Brand Header */}
      <header className="sticky top-0 z-30 w-full backdrop-blur-md bg-white/70 dark:bg-[#121214]/70 border-b border-neutral-200/60 dark:border-neutral-800/60">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
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
            <Link
              to="/app/library"
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isLibrary 
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm' 
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              <Library className="w-3.5 h-3.5" />
              <span>The Bookshelf</span>
            </Link>

            <Link
              to="/app"
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                !isLibrary 
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm' 
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>All Entries</span>
            </Link>

            <Link
              to="/app/entry/new"
              className="liquid-glass rounded-full px-4 py-1.5 text-xs font-semibold bg-black text-white dark:bg-white dark:text-black hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Write</span>
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content (Full Width Without Sidebars) */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8 pb-32">
        <Outlet />
      </main>

      {/* Floating Bottom Rounded Bar for Profile & Logout */}
      <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center pointer-events-none px-4">
        <div className="pointer-events-auto liquid-glass rounded-full px-4 py-2.5 shadow-2xl border border-neutral-200/80 dark:border-white/15 bg-white/80 dark:bg-black/65 backdrop-blur-2xl flex items-center gap-3 transition-all hover:scale-[1.01]">
          
          {/* User Profile Capsule */}
          <button
            onClick={() => navigate('/app/profile')}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors group"
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="w-7 h-7 rounded-full object-cover border border-neutral-300 dark:border-neutral-700"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center text-xs font-semibold">
                <UserIcon className="w-3.5 h-3.5" />
              </div>
            )}
            <div className="flex flex-col text-left pr-1">
              <span className="text-xs font-semibold text-neutral-900 dark:text-white leading-tight group-hover:underline">
                {profile?.name || user?.email?.split('@')[0] || 'Profile'}
              </span>
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-tight">
                {user?.email}
              </span>
            </div>
          </button>

          <div className="w-[1px] h-6 bg-neutral-200 dark:bg-neutral-800" />

          {/* Quick Write Button inside bottom bar */}
          <button
            onClick={() => navigate('/app/entry/new')}
            className="p-2 rounded-full bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity"
            title="Write New Entry"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            title="Log Out"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log out</span>
          </button>

        </div>
      </div>

    </div>
  );
}
