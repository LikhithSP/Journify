import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Trash2, Camera, ShieldAlert, Check, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Hook to fetch current user's profile info
export function useProfileInfo(userId?: string) {
  const [profile, setProfile] = useState<{ avatar_url?: string; name?: string } | null>(null);
  useEffect(() => {
    if (!userId) return;
    let ignore = false;
    supabase
      .from('profiles')
      .select('avatar_url, username')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (!ignore && data) {
          setProfile({
            avatar_url: data.avatar_url || '',
            name: data.username || '',
          });
        }
      });
    return () => {
      ignore = true;
    };
  }, [userId]);
  return profile;
}

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: '',
    avatar_url: '',
    email: user?.email || '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      if (!user || !user.id || !user.email) return;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (data) {
        setProfile({
          name: data.username || '',
          avatar_url: data.avatar_url || '',
          email: user.email || '',
        });
      }
    }
    fetchProfile();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      // Immediate local preview
      const previewUrl = URL.createObjectURL(file);
      setProfile(p => ({ ...p, avatar_url: previewUrl }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    let avatar_url = profile.avatar_url;
    
    if (avatarFile && user) {
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(`${user.id}/${Date.now()}_${avatarFile.name}`, avatarFile, { upsert: true });
      if (!error && data) {
        const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(data.path);
        avatar_url = publicData?.publicUrl || avatar_url;
      } else if (error) {
        setMessage({ text: 'Failed to upload photo: ' + error.message, type: 'error' });
        setSaving(false);
        return;
      }
    }

    if (!user?.id) {
      setMessage({ text: 'User not found.', type: 'error' });
      setSaving(false);
      return;
    }

    const updates = {
      id: user.id,
      username: profile.name,
      avatar_url,
    };

    const { error } = await supabase.from('profiles').upsert(updates);
    if (!error) {
      setMessage({ text: 'Profile details saved successfully.', type: 'success' });
      setProfile((p) => ({ ...p, avatar_url }));
    } else {
      setMessage({ text: 'Failed to update profile: ' + error.message, type: 'error' });
      console.error('Supabase profile update error:', error);
    }
    setSaving(false);
  };

  // Delete account function
  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      setDeleting(true);

      // Clean up user entries and profile from database
      await supabase.from('journal_entries').delete().eq('user_id', user.id);
      await supabase.from('profiles').delete().eq('id', user.id);

      // Clear local storage data
      localStorage.removeItem(`journify_books_${user.id}`);

      // Sign out user
      await signOut();
      navigate('/login');
    } catch (err: any) {
      console.error('Error deleting account:', err);
      alert('Could not delete account. Please try again.');
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-6 text-neutral-900 dark:text-neutral-100 animate-in fade-in duration-300">
      {/* Back button */}
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/app/library')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </button>
      </div>

      {/* Main Profile Card */}
      <div className="rounded-3xl bg-white dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800/80 shadow-xl p-8 sm:p-10 mb-8 backdrop-blur-xl">
        <div className="mb-6 pb-4 border-b border-neutral-150 dark:border-neutral-800/80">
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Profile Settings
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Manage your personal identity, avatar, and account credentials.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Avatar Upload with Camera Badge */}
          <div className="flex flex-col items-center justify-center mb-6">
            <label htmlFor="avatar-upload" className="cursor-pointer group relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-neutral-200 dark:border-neutral-700 group-hover:border-black dark:group-hover:border-white transition-all shadow-md">
                <img
                  src={profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                  alt="Profile"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              <div className="absolute bottom-0 right-0 p-2 rounded-full bg-black text-white dark:bg-white dark:text-black shadow-md border-2 border-white dark:border-neutral-900 group-hover:scale-110 transition-transform">
                <Camera className="w-3.5 h-3.5" />
              </div>

              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
            <span className="text-[11px] font-mono text-neutral-400 mt-2.5">
              Click photo to change avatar
            </span>
          </div>

          {/* Form Fields: Name & Email */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider font-mono mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-neutral-900 dark:text-white"
                placeholder="Your name"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider font-mono mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={profile.email}
                disabled
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-850/50 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-500 dark:text-neutral-400 cursor-not-allowed font-mono text-xs"
              />
              <span className="text-[11px] text-neutral-400 mt-1 block">
                Your email is linked to your authentication account.
              </span>
            </div>
          </div>

          {message && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'}`}>
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>{message.text}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl text-xs font-semibold uppercase tracking-wider bg-black text-white dark:bg-white dark:text-black hover:opacity-90 active:scale-[0.99] transition-all shadow-md disabled:opacity-50"
          >
            {saving ? 'Saving changes...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>

      {/* Danger Zone: Delete Account */}
      <div className="rounded-3xl bg-red-50/50 dark:bg-red-950/10 border border-red-200/80 dark:border-red-900/40 p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 flex-col sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <ShieldAlert className="w-4 h-4" />
              <h3 className="text-sm font-semibold uppercase tracking-wider font-mono">
                Danger Zone
              </h3>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
              Permanently delete your account, journals, and all personal reflections.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="font-display text-xl font-bold text-neutral-900 dark:text-white">
              Delete your account?
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
              This action cannot be undone. All of your diary books, daily pages, memories, and photos will be permanently erased.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteAccount}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

