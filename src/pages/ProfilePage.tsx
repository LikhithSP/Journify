import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Download, 
  KeyRound, 
  Laptop, 
  LogOut, 
  AlertTriangle,
  FileCheck2,
  Lock,
  CheckCircle2,
  AlertCircle,
  Bell,
  Flame,
  Clock,
  HardDrive,
  Database,
  UserCheck
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { validateFileUpload, sanitizeUploadFileName, SECURITY_SPECS } from '../lib/security';
import { NotificationService } from '../services/notificationService';
import type { NotificationSettings } from '../services/notificationService';
import { PrivacyService } from '../services/privacyService';
import type { ConsentSettings } from '../services/privacyService';
import { OfflineDB } from '../services/offlineDB';

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
  const { user, session, signOut, updatePassword, exportUserData, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [searchParams, _setSearchParams] = useSearchParams();

  const [profile, setProfile] = useState({
    name: '',
    tagline: '',
    avatar_url: '',
    email: user?.email || '',
  });

  const tabParam = searchParams.get('tab');
  const initialTab = (tabParam === 'data' || tabParam === 'security' || tabParam === 'notifications' || tabParam === 'profile')
    ? tabParam
    : 'profile';

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'data'>(initialTab);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    return NotificationService.getSettings();
  });
  const [notifPermission, setNotifPermission] = useState<string>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  });

  // Security tab state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [globalLoggingOut, setGlobalLoggingOut] = useState(false);

  // Privacy & Data tab state
  const [privacySubTab, setPrivacySubTab] = useState<'controls' | 'policy'>('controls');
  const [consent, setConsent] = useState<ConsentSettings>(() => PrivacyService.getConsent());
  const [exporting, setExporting] = useState(false);
  const [downloadingJournals, setDownloadingJournals] = useState(false);
  const [purgingLocal, setPurgingLocal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Sync tab with URL if changed
  useEffect(() => {
    if (tabParam && (tabParam === 'data' || tabParam === 'security' || tabParam === 'notifications' || tabParam === 'profile')) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    async function fetchProfile() {
      if (!user?.id) return;
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
      const file = e.target.files[0];
      
      // Strict SaaS MIME & Size Validation (Max 5MB, JPG/PNG/WEBP/GIF)
      const validation = validateFileUpload(file, 5 * 1024 * 1024);
      if (!validation.valid) {
        setStatusMessage({ text: validation.error || 'Invalid file format', type: 'error' });
        return;
      }

      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setStatusMessage(null);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    let avatar_url = profile.avatar_url;

    if (avatarFile && user) {
      const sanitizedName = sanitizeUploadFileName(avatarFile.name);
      const filePath = `${user.id}/${sanitizedName}`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { upsert: true, contentType: avatarFile.type });

      if (!error && data) {
        const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(data.path);
        avatar_url = publicData?.publicUrl || avatar_url;
      } else if (error) {
        setStatusMessage({ text: `Avatar upload failed: ${error.message}`, type: 'error' });
        setSaving(false);
        return;
      }
    }

    if (!user?.id) {
      setStatusMessage({ text: 'User session not found.', type: 'error' });
      setSaving(false);
      return;
    }

    const updates = {
      id: user.id,
      username: profile.name.trim(),
      bio: profile.tagline.trim(),
      avatar_url,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('profiles').upsert(updates);
    if (!error) {
      setStatusMessage({ text: 'Profile preferences saved successfully.', type: 'success' });
      setProfile((p) => ({ ...p, avatar_url }));
    } else {
      setStatusMessage({ text: `Failed to update profile: ${error.message}`, type: 'error' });
    }
    setSaving(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setStatusMessage({ text: 'Password must contain at least 8 characters.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatusMessage({ text: 'Passwords do not match.', type: 'error' });
      return;
    }

    setUpdatingPassword(true);
    setStatusMessage(null);
    const { error } = await updatePassword(newPassword);
    if (!error) {
      setStatusMessage({ text: 'Password successfully updated across your account.', type: 'success' });
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setStatusMessage({ text: error.message, type: 'error' });
    }
    setUpdatingPassword(false);
  };

  const handleLogoutAllDevices = async () => {
    setGlobalLoggingOut(true);
    try {
      await signOut('global');
      navigate('/login');
    } catch (err) {
      setStatusMessage({ text: 'Failed to terminate all sessions.', type: 'error' });
      setGlobalLoggingOut(false);
    }
  };

  const handleConsentToggle = (key: keyof ConsentSettings) => {
    if (key === 'essentialStorage') return;
    const updated = { ...consent, [key]: !consent[key] };
    setConsent(updated);
    PrivacyService.saveConsent(updated);
    setStatusMessage({ text: 'Privacy preference updated successfully.', type: 'success' });
  };

  const handleExportData = async () => {
    setExporting(true);
    setStatusMessage(null);
    try {
      const { data, error } = await exportUserData();
      if (error || !data) {
        throw error || new Error('Could not retrieve data');
      }

      const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const downloadUrl = URL.createObjectURL(jsonBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `journify_export_${user?.id?.slice(0, 8)}_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setStatusMessage({ text: 'Account data package downloaded successfully.', type: 'success' });
    } catch (err: any) {
      setStatusMessage({ text: `Data export failed: ${err?.message}`, type: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadJournals = async () => {
    setDownloadingJournals(true);
    setStatusMessage(null);
    try {
      const { data, error } = await exportUserData();
      if (error || !data) throw error || new Error('Failed to fetch journal entries');

      const entries = data.journalEntries || [];
      let markdownContent = `# Journify Journal Archive\nExported: ${new Date().toLocaleString()}\nUser: ${user?.email}\nTotal Entries: ${entries.length}\n\n---\n\n`;

      entries.forEach((e: any, index: number) => {
        const plainContent = (e.content || '').replace(/<p>/g, '\n').replace(/<\/p>/g, '\n').replace(/<[^>]*>/g, '');
        markdownContent += `## ${index + 1}. ${e.title || 'Untitled Entry'}\n`;
        markdownContent += `**Date:** ${new Date(e.created_at).toLocaleString()} | **Mood:** ${e.mood || 'None'} | **Tags:** ${e.tags?.join(', ') || 'None'}\n\n`;
        markdownContent += `${plainContent.trim()}\n\n---\n\n`;
      });

      const mdBlob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
      const downloadUrl = URL.createObjectURL(mdBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `my_journals_${new Date().toISOString().slice(0, 10)}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setStatusMessage({ text: 'Journals downloaded in Markdown (.md) format.', type: 'success' });
    } catch (err: any) {
      setStatusMessage({ text: `Journal download failed: ${err.message}`, type: 'error' });
    } finally {
      setDownloadingJournals(false);
    }
  };

  const handlePurgeLocalStorage = async () => {
    if (!user) return;
    setPurgingLocal(true);
    try {
      await OfflineDB.clearAll();
      setStatusMessage({ text: 'Browser offline IndexedDB cache cleared.', type: 'success' });
    } catch (e: any) {
      setStatusMessage({ text: `Failed to clear offline storage: ${e.message}`, type: 'error' });
    } finally {
      setPurgingLocal(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== 'DELETE') {
      setStatusMessage({ text: 'Please type "DELETE" to confirm account erasure.', type: 'error' });
      return;
    }

    setDeleting(true);
    try {
      const { error } = await deleteAccount();
      if (error) throw error;
      navigate('/login');
    } catch (err: any) {
      setStatusMessage({ text: `Account deletion failed: ${err?.message}`, type: 'error' });
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-4 px-2">
      {/* Back button */}
      <button
        type="button"
        className="mb-5 inline-flex items-center text-xs font-medium text-gray-500 hover:text-black dark:hover:text-white transition-colors"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
        Back to Dashboard
      </button>

      {/* Main SaaS Settings Card */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
        
        {/* Header and tabs */}
        <div className="p-6 pb-0 border-b border-gray-100 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
            <div className="flex items-center space-x-4">
              <img
                src={avatarPreview || profile.avatar_url || '/journal.svg'}
                alt="Profile"
                className="w-14 h-14 rounded-full object-cover border border-gray-200 dark:border-gray-700 shadow-sm"
              />
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {profile.name || user?.email?.split('@')[0]}
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.email} • Account ID: <span className="font-mono">{user?.id?.slice(0, 8)}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck size={12} className="mr-1" /> RLS Protected
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-6 text-xs font-medium">
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-3 border-b-2 transition-colors ${
                activeTab === 'profile'
                  ? 'border-black dark:border-white text-black dark:text-white font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
              }`}
            >
              General Profile
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`pb-3 border-b-2 transition-colors ${
                activeTab === 'security'
                  ? 'border-black dark:border-white text-black dark:text-white font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
              }`}
            >
              Security & Sessions
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`pb-3 border-b-2 transition-colors ${
                activeTab === 'notifications'
                  ? 'border-black dark:border-white text-black dark:text-white font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
              }`}
            >
              Notifications & Habits
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`pb-3 border-b-2 transition-colors ${
                activeTab === 'data'
                  ? 'border-black dark:border-white text-black dark:text-white font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
              }`}
            >
              Data & Privacy
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {statusMessage && (
          <div
            className={`m-6 mb-0 p-3 rounded-lg text-xs flex items-center ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 size={16} className="mr-2 flex-shrink-0" />
            ) : (
              <AlertCircle size={16} className="mr-2 flex-shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Tab 1: Profile Tab */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Profile Avatar
              </label>
              <div className="flex items-center space-x-4">
                <label className="cursor-pointer py-1.5 px-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-neutral-800 text-xs font-medium text-gray-700 dark:text-gray-200 transition shadow-sm">
                  Upload new avatar
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp, image/gif"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
                <span className="text-[11px] text-gray-400">
                  JPG, PNG, WEBP, or GIF up to 5MB (MIME validated)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name / Username
                </label>
                <input
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleInputChange}
                  placeholder="Ada Lovelace"
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-3 py-2 text-xs bg-gray-100 dark:bg-neutral-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bio / Tagline
              </label>
              <input
                type="text"
                name="tagline"
                value={profile.tagline}
                onChange={handleInputChange}
                placeholder="Software architect, avid journal keeper, continuous learner."
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="py-2 px-5 rounded-lg bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black text-xs font-semibold tracking-wide transition shadow-sm disabled:opacity-50"
              >
                {saving ? 'Saving changes...' : 'Save Profile Preferences'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Security & Session Management */}
        {activeTab === 'security' && (
          <div className="p-6 space-y-8">
            {/* Active Session & Device Management */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1 flex items-center">
                <Laptop size={16} className="mr-2 text-gray-500" />
                Session & Device Governance
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Monitor and revoke access across all devices signed in with your credentials.
              </p>

              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-neutral-800/40 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        Current Active Device
                      </span>
                      <p className="text-[11px] text-gray-500">
                        Browser: {navigator.userAgent.slice(0, 40)}...
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] uppercase font-bold rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    Active
                  </span>
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700/60 flex items-center justify-between">
                  <div className="text-[11px] text-gray-500">
                    Token expires in: {session?.expires_in ? `${Math.round(session.expires_in / 60)} minutes` : 'Session active'}
                  </div>
                  <button
                    type="button"
                    onClick={handleLogoutAllDevices}
                    disabled={globalLoggingOut}
                    className="inline-flex items-center py-1.5 px-3 rounded-lg bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-medium transition"
                  >
                    <LogOut size={13} className="mr-1.5" />
                    {globalLoggingOut ? 'Logging out...' : 'Log out from all devices'}
                  </button>
                </div>
              </div>
            </div>

            {/* Change Password */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1 flex items-center">
                <KeyRound size={16} className="mr-2 text-gray-500" />
                Change Master Password
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Update your authentication password to maintain account integrity.
              </p>

              <form onSubmit={handleUpdatePassword} className="space-y-3 max-w-md">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="py-2 px-4 rounded-lg bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black text-xs font-semibold tracking-wide transition shadow-sm disabled:opacity-50"
                >
                  {updatingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>

            {/* Cryptographic Reality Transparency Check */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                <Lock size={16} className="mr-2 text-gray-500" />
                Security Specifications & Transparency
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-neutral-800/40 border border-gray-200 dark:border-gray-800">
                  <span className="font-semibold text-gray-800 dark:text-gray-200 block mb-1">In-Transit Encryption</span>
                  <span className="text-gray-500 text-[11px]">{SECURITY_SPECS.transportEncryption}</span>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-neutral-800/40 border border-gray-200 dark:border-gray-800">
                  <span className="font-semibold text-gray-800 dark:text-gray-200 block mb-1">At-Rest Encryption</span>
                  <span className="text-gray-500 text-[11px]">{SECURITY_SPECS.storageEncryption}</span>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-neutral-800/40 border border-gray-200 dark:border-gray-800">
                  <span className="font-semibold text-gray-800 dark:text-gray-200 block mb-1">Access Authorization</span>
                  <span className="text-gray-500 text-[11px]">{SECURITY_SPECS.ownershipModel}</span>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-neutral-800/40 border border-gray-200 dark:border-gray-800">
                  <span className="font-semibold text-gray-800 dark:text-gray-200 block mb-1">E2EE Reality Check</span>
                  <span className="text-gray-500 text-[11px]">
                    Standard cloud sync (TLS 1.3 + DB encryption). We do not market misleading E2EE without client-derived keys.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Notifications & Habits Configuration */}
        {activeTab === 'notifications' && (
          <div className="p-6 space-y-8">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                  <Bell size={16} className="mr-2 text-gray-500" />
                  Journaling Habit & Notification System
                </h3>
                {notifPermission !== 'granted' && (
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await NotificationService.requestPermission();
                      setNotifPermission(res);
                      if (res === 'granted') {
                        NotificationService.trigger('Journify Notifications Enabled!', {
                          body: 'You will receive reminders according to your schedule.',
                        });
                      }
                    }}
                    className="py-1 px-3 rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-90 transition"
                  >
                    Enable Browser Notifications
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                Configure your daily check-ins, custom reminders, missed-journal nudges, and milestone celebrations.
              </p>
            </div>

            {/* Master Toggle */}
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-neutral-800/40 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                  Global Notifications
                </span>
                <p className="text-[11px] text-gray-500">
                  Turn all journaling notifications and audio alerts on or off.
                </p>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.enabled}
                onChange={(e) => {
                  const updated = { ...notificationSettings, enabled: e.target.checked };
                  setNotificationSettings(updated);
                  NotificationService.saveSettings(updated);
                }}
                className="h-4 w-4 rounded border-gray-300 text-black dark:text-white"
              />
            </div>

            {/* Daily Reminder */}
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <Clock size={16} className="text-gray-500" />
                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100">Daily Writing Reminder</h4>
                    <p className="text-[11px] text-gray-500">Regular reminder at your preferred journaling time.</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.dailyReminder.enabled}
                  onChange={(e) => {
                    const updated = {
                      ...notificationSettings,
                      dailyReminder: { ...notificationSettings.dailyReminder, enabled: e.target.checked },
                    };
                    setNotificationSettings(updated);
                    NotificationService.saveSettings(updated);
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-black dark:text-white"
                />
              </div>

              {notificationSettings.dailyReminder.enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">Reminder Time</label>
                    <input
                      type="time"
                      value={notificationSettings.dailyReminder.time}
                      onChange={(e) => {
                        const updated = {
                          ...notificationSettings,
                          dailyReminder: { ...notificationSettings.dailyReminder, time: e.target.value },
                        };
                        setNotificationSettings(updated);
                        NotificationService.saveSettings(updated);
                      }}
                      className="w-full p-1.5 text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">Custom Message</label>
                    <input
                      type="text"
                      value={notificationSettings.dailyReminder.message}
                      onChange={(e) => {
                        const updated = {
                          ...notificationSettings,
                          dailyReminder: { ...notificationSettings.dailyReminder, message: e.target.value },
                        };
                        setNotificationSettings(updated);
                        NotificationService.saveSettings(updated);
                      }}
                      className="w-full p-1.5 text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Custom Reminder */}
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <Clock size={16} className="text-gray-500" />
                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100">Custom Reminder</h4>
                    <p className="text-[11px] text-gray-500">Secondary check-in (e.g. midday reflection or morning intent).</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.customReminder.enabled}
                  onChange={(e) => {
                    const updated = {
                      ...notificationSettings,
                      customReminder: { ...notificationSettings.customReminder, enabled: e.target.checked },
                    };
                    setNotificationSettings(updated);
                    NotificationService.saveSettings(updated);
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-black dark:text-white"
                />
              </div>

              {notificationSettings.customReminder.enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">Reminder Time</label>
                    <input
                      type="time"
                      value={notificationSettings.customReminder.time}
                      onChange={(e) => {
                        const updated = {
                          ...notificationSettings,
                          customReminder: { ...notificationSettings.customReminder, time: e.target.value },
                        };
                        setNotificationSettings(updated);
                        NotificationService.saveSettings(updated);
                      }}
                      className="w-full p-1.5 text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">Custom Message</label>
                    <input
                      type="text"
                      value={notificationSettings.customReminder.message}
                      onChange={(e) => {
                        const updated = {
                          ...notificationSettings,
                          customReminder: { ...notificationSettings.customReminder, message: e.target.value },
                        };
                        setNotificationSettings(updated);
                        NotificationService.saveSettings(updated);
                      }}
                      className="w-full p-1.5 text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Missed-Journal Reminder */}
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <Bell size={16} className="text-amber-500" />
                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100">Missed-Journal Nudge</h4>
                    <p className="text-[11px] text-gray-500">“You haven't written today. Want to take 5 minutes?”</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.missedJournalReminder.enabled}
                  onChange={(e) => {
                    const updated = {
                      ...notificationSettings,
                      missedJournalReminder: { ...notificationSettings.missedJournalReminder, enabled: e.target.checked },
                    };
                    setNotificationSettings(updated);
                    NotificationService.saveSettings(updated);
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-black dark:text-white"
                />
              </div>

              {notificationSettings.missedJournalReminder.enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">Trigger if unwritten by hour (24-hr)</label>
                    <select
                      value={notificationSettings.missedJournalReminder.cutoffHour}
                      onChange={(e) => {
                        const updated = {
                          ...notificationSettings,
                          missedJournalReminder: {
                            ...notificationSettings.missedJournalReminder,
                            cutoffHour: parseInt(e.target.value, 10),
                          },
                        };
                        setNotificationSettings(updated);
                        NotificationService.saveSettings(updated);
                      }}
                      className="w-full p-1.5 text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100"
                    >
                      <option value={19}>7:00 PM</option>
                      <option value={20}>8:00 PM</option>
                      <option value={21}>9:00 PM</option>
                      <option value={22}>10:00 PM</option>
                      <option value={23}>11:00 PM</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">Reminder Copy</label>
                    <input
                      type="text"
                      value={notificationSettings.missedJournalReminder.message}
                      onChange={(e) => {
                        const updated = {
                          ...notificationSettings,
                          missedJournalReminder: { ...notificationSettings.missedJournalReminder, message: e.target.value },
                        };
                        setNotificationSettings(updated);
                        NotificationService.saveSettings(updated);
                      }}
                      className="w-full p-1.5 text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Streak Milestone Notification */}
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Flame size={16} className="text-orange-500" />
                <div>
                  <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100">Streak Celebration & Protection</h4>
                  <p className="text-[11px] text-gray-500">Celebrate 3, 7, 14, 30, and 100-day streaks automatically.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.streakNotifications.enabled}
                onChange={(e) => {
                  const updated = {
                    ...notificationSettings,
                    streakNotifications: { ...notificationSettings.streakNotifications, enabled: e.target.checked },
                  };
                  setNotificationSettings(updated);
                  NotificationService.saveSettings(updated);
                }}
                className="h-4 w-4 rounded border-gray-300 text-black dark:text-white"
              />
            </div>

            {/* Test Notification Trigger */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  NotificationService.trigger('Test Notification', {
                    body: "You haven't written today. Want to take 5 minutes?",
                  });
                  setStatusMessage({ text: 'Test notification triggered!', type: 'success' });
                }}
                className="py-1.5 px-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-neutral-800 text-xs font-medium transition"
              >
                Send Test Notification
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Privacy Center & Data Governance */}
        {activeTab === 'data' && (
          <div className="p-6 space-y-6">
            {/* Privacy Sub-Navigation (Controls vs Policy) */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck size={18} className="text-black dark:text-white" />
                <div>
                  <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                    Privacy Center
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Control data portability, sync settings, and cryptographic safeguards.
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5 p-0.5 bg-gray-100 dark:bg-neutral-800 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setPrivacySubTab('controls')}
                  className={`px-3 py-1 rounded-md font-medium transition ${
                    privacySubTab === 'controls'
                      ? 'bg-white dark:bg-neutral-700 text-black dark:text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Controls & Export
                </button>
                <button
                  type="button"
                  onClick={() => setPrivacySubTab('policy')}
                  className={`px-3 py-1 rounded-md font-medium transition ${
                    privacySubTab === 'policy'
                      ? 'bg-white dark:bg-neutral-700 text-black dark:text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Privacy Promise
                </button>
              </div>
            </div>

            {privacySubTab === 'controls' ? (
              <div className="space-y-6">
                {/* Data Portability & Export */}
                <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-neutral-850/30 space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                      <Database size={15} className="mr-2 text-gray-500" />
                      Data Portability & Export
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Your journal is your intellectual property. Download archives in standard open formats anytime.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* JSON Archive */}
                    <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-900 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center space-x-2 text-xs font-semibold text-gray-900 dark:text-gray-100">
                          <Download size={14} className="text-gray-500" />
                          <span>Full Data Archive (JSON)</span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                          Machine-readable export with entries, folders, tags, and account settings.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleExportData}
                        disabled={exporting}
                        className="w-full py-1.5 px-3 rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-90 transition disabled:opacity-40"
                      >
                        {exporting ? 'Generating package...' : 'Download JSON (.json)'}
                      </button>
                    </div>

                    {/* Markdown Journals */}
                    <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-900 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center space-x-2 text-xs font-semibold text-gray-900 dark:text-gray-100">
                          <FileCheck2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                          <span>Journals Only (Markdown)</span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                          Formatted text ready to open in Obsidian, Notion, or personal markdown notes.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleDownloadJournals}
                        disabled={downloadingJournals}
                        className="w-full py-1.5 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-700 text-xs font-semibold transition disabled:opacity-40"
                      >
                        {downloadingJournals ? 'Writing file...' : 'Download Markdown (.md)'}
                      </button>
                    </div>
                  </div>

                  {/* Browser IndexedDB Cache Purge */}
                  <div className="pt-3 border-t border-gray-200/80 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-1.5 text-xs font-medium text-gray-900 dark:text-gray-200">
                        <HardDrive size={13} className="text-blue-500" />
                        <span>Browser Offline Storage</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Clear local offline cache and temporary drafts from this device's browser memory.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handlePurgeLocalStorage}
                      disabled={purgingLocal}
                      className="py-1.5 px-3 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-neutral-800 text-xs font-medium transition self-start sm:self-center"
                    >
                      {purgingLocal ? 'Purging...' : 'Clear Offline Cache'}
                    </button>
                  </div>
                </div>

                {/* Privacy & Feature Consent */}
                <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-900 space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                      <UserCheck size={15} className="mr-2 text-gray-500" />
                      Consent & Feature Preferences
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Fine-tune sync behaviors and peripheral permissions.
                    </p>
                  </div>

                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    <div className="py-2.5 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-medium text-gray-900 dark:text-gray-100 block">
                          Cloud Synchronization
                        </span>
                        <p className="text-[11px] text-gray-500">
                          Keeps notes synchronized across devices with Postgres Row-Level Security.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={consent.cloudSync}
                        onChange={() => handleConsentToggle('cloudSync')}
                        className="h-4 w-4 rounded border-gray-300 text-black dark:text-white"
                      />
                    </div>

                    <div className="py-2.5 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-medium text-gray-900 dark:text-gray-100 block">
                          Browser Voice Dictation
                        </span>
                        <p className="text-[11px] text-gray-500">
                          Use browser-native speech recognition for voice journaling.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={consent.localVoiceProcessing}
                        onChange={() => handleConsentToggle('localVoiceProcessing')}
                        className="h-4 w-4 rounded border-gray-300 text-black dark:text-white"
                      />
                    </div>

                    <div className="py-2.5 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-medium text-gray-900 dark:text-gray-100 block">
                          Anonymous Error Diagnostics
                        </span>
                        <p className="text-[11px] text-gray-500">
                          Reports client errors to fix crashes. Never includes journal text.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={consent.telemetryAndDiagnostics}
                        onChange={() => handleConsentToggle('telemetryAndDiagnostics')}
                        className="h-4 w-4 rounded border-gray-300 text-black dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Danger Zone: Account Deletion */}
                <div className="pt-2 border-t border-red-100 dark:border-red-950/50">
                  <div className="p-5 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20">
                    <div className="flex items-start space-x-3 mb-4">
                      <AlertTriangle className="text-red-600 dark:text-red-400 w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-red-900 dark:text-red-200">
                          Danger Zone: Delete Account
                        </h4>
                        <p className="text-xs text-red-700 dark:text-red-300/80 mt-1 leading-relaxed">
                          Permanently erase your account, all journal entries, folders, and uploaded media. This action is irrevocable and cannot be undone.
                        </p>
                      </div>
                    </div>

                    {!showDeleteModal ? (
                      <button
                        type="button"
                        onClick={() => setShowDeleteModal(true)}
                        className="py-2 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition"
                      >
                        Request Account Deletion
                      </button>
                    ) : (
                      <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-red-200 dark:border-red-800 space-y-3">
                        <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                          To confirm complete deletion, please type <span className="font-bold text-red-600">DELETE</span> in the box below:
                        </p>
                        <input
                          type="text"
                          value={deleteConfirmationText}
                          onChange={(e) => setDeleteConfirmationText(e.target.value)}
                          placeholder="Type DELETE"
                          className="w-full max-w-xs px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-neutral-800 outline-none"
                        />
                        <div className="flex items-center space-x-3 pt-2">
                          <button
                            type="button"
                            onClick={handleDeleteAccount}
                            disabled={deleting || deleteConfirmationText !== 'DELETE'}
                            className="py-1.5 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold disabled:opacity-40 transition"
                          >
                            {deleting ? 'Deleting account...' : 'Permanently Delete Everything'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowDeleteModal(false);
                              setDeleteConfirmationText('');
                            }}
                            className="text-xs text-gray-500 hover:text-black dark:hover:text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Sub-Tab 2: Privacy Promise & Security */
              <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-900 space-y-4 text-xs leading-relaxed text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                  <Lock size={16} className="text-gray-500" />
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Journify Privacy Promise & Security Model
                  </h4>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-neutral-850/50 border border-gray-100 dark:border-gray-800">
                    <h5 className="font-bold text-gray-900 dark:text-gray-100 text-xs mb-1">1. Absolute Data Ownership</h5>
                    <p className="text-gray-600 dark:text-gray-400">
                      Your journal entries belong entirely to you. We do not sell user data, train public AI models on your memories, or track you across the web.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-neutral-850/50 border border-gray-100 dark:border-gray-800">
                    <h5 className="font-bold text-gray-900 dark:text-gray-100 text-xs mb-1">2. Encryption in Transit & At Rest</h5>
                    <p className="text-gray-600 dark:text-gray-400">
                      All data in flight travels through TLS 1.3 encryption. At rest, data is protected by disk-level AES-256 and Supabase Postgres Row Level Security isolating every row to your user UUID.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-neutral-850/50 border border-gray-100 dark:border-gray-800">
                    <h5 className="font-bold text-gray-900 dark:text-gray-100 text-xs mb-1">3. Right to be Forgotten (GDPR)</h5>
                    <p className="text-gray-600 dark:text-gray-400">
                      You can download your entire journal at any time in JSON or Markdown and delete your entire account permanently with zero leftover server residue.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
