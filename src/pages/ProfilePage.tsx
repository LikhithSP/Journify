import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Add a hook to fetch the current user's profile (avatar, name) for sidebar use
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: '',
    tagline: '',
    avatar_url: '',
    email: user?.email || '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

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
          tagline: data.bio || '',
          avatar_url: data.avatar_url || '',
          email: user.email || '',
        });
      }
    }
    fetchProfile();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    let avatar_url = profile.avatar_url;
    if (avatarFile && user) {
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(`${user.id}/${avatarFile.name}`, avatarFile, { upsert: true });
      if (!error && data) {
        const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(data.path);
        avatar_url = publicData?.publicUrl || avatar_url;
      } else if (error) {
        setMessage('Failed to upload avatar: ' + error.message);
        setSaving(false);
        return;
      }
    }
    if (!user?.id) {
      setMessage('User not found.');
      setSaving(false);
      return;
    }
    const updates = {
      id: user.id,
      username: profile.name,
      bio: profile.tagline,
      avatar_url,
    };
    const { error } = await supabase.from('profiles').upsert(updates);
    if (!error) {
      setMessage('Profile updated!');
      setProfile((p) => ({ ...p, avatar_url }));
    } else {
      setMessage('Failed to update profile: ' + error.message);
      console.error('Supabase profile update error:', error);
    }
    setSaving(false);
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow">
      <button
        type="button"
        className="mb-4 flex items-center text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="w-5 h-5 mr-1" />
        Back to Dashboard
      </button>
      <h2 className="text-2xl font-bold mb-6">Profile</h2>
      <form onSubmit={handleSave} className="space-y-5">
        <div className="flex flex-col items-center mb-4">
          <label htmlFor="avatar-upload" className="cursor-pointer group">
            <img
              src={profile.avatar_url || '/journal.svg'}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border mb-2 group-hover:opacity-80 transition-opacity"
            />
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <span className="block text-xs text-gray-400 group-hover:text-blue-500 text-center">Click to change</span>
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            name="name"
            value={profile.name}
            onChange={handleInputChange}
            className="input w-full"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tagline</label>
          <input
            type="text"
            name="tagline"
            value={profile.tagline}
            onChange={handleInputChange}
            className="input w-full"
            placeholder="A short description for your journal"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={profile.email}
            disabled
            className="input w-full bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary w-full mt-4"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        {message && <div className="text-center text-green-600 dark:text-green-400 mt-2">{message}</div>}
      </form>
    </div>
  );
}
