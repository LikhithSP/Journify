import { Outlet, useNavigate, Link } from 'react-router-dom';
import { 
  Plus, 
  LogOut, 
  Moon, 
  Sun, 
  User as UserIcon
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useProfileInfo } from '../pages/ProfilePage';

export default function Layout() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { signOut, user } = useAuth();
  const profile = useProfileInfo(user?.id);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };


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
        <div className="pointer-events-auto liquid-glass rounded-full px-5 py-2.5 shadow-2xl border border-neutral-200/80 dark:border-white/15 bg-white/90 dark:bg-[#18181b]/90 backdrop-blur-2xl flex items-center justify-between gap-6 transition-all hover:scale-[1.01]">
          
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
                <span className="text-sm font-semibold text-neutral-900 dark:text-white leading-tight group-hover:underline">
                  {profile?.name || user?.email?.split('@')[0] || 'Guest'}
                </span>
              </div>
            </button>
          </div>

          {/* Center: Large Distinct Create Button */}
          <div className="flex-shrink-0 flex items-center justify-center px-1">
            <button
              onClick={() => navigate('/app/entry/new')}
              className="w-12 h-12 rounded-full bg-black text-white dark:bg-white dark:text-black hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center group"
              title="Create New Entry"
            >
              <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" />
            </button>
          </div>

          {/* Right Side: Logout Button */}
          <div className="flex-1 flex justify-end">
            <button
              onClick={handleLogout}
              title="Log Out"
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 active:scale-95 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
