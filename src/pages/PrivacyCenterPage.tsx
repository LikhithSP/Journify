import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Download, 
  Lock, 
  CheckCircle2, 
  FileCheck2, 
  AlertTriangle,
  HardDrive,
  Database,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PrivacyService } from '../services/privacyService';
import type { ConsentSettings } from '../services/privacyService';
import { OfflineDB } from '../services/offlineDB';
import { useNavigate } from 'react-router-dom';

export default function PrivacyCenterPage() {
  const { user, exportUserData, deleteAccount } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'controls' | 'policy'>('controls');
  const [consent, setConsent] = useState<ConsentSettings>(() => PrivacyService.getConsent());
  const [exporting, setExporting] = useState(false);
  const [downloadingJournals, setDownloadingJournals] = useState(false);
  const [purgingLocal, setPurgingLocal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleConsentToggle = (key: keyof ConsentSettings) => {
    if (key === 'essentialStorage') return;
    const updated = { ...consent, [key]: !consent[key] };
    setConsent(updated);
    PrivacyService.saveConsent(updated);
    setFeedback({ text: 'Preferences updated successfully.', type: 'success' });
  };

  // Export Everything (JSON Archive)
  const handleExportAll = async () => {
    setExporting(true);
    setFeedback(null);
    try {
      const { data, error } = await exportUserData();
      if (error || !data) throw error || new Error('Failed to retrieve full data archive');

      const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const downloadUrl = URL.createObjectURL(jsonBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `journify_archive_${user?.id?.slice(0, 8)}_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setFeedback({ text: 'Complete JSON archive downloaded successfully.', type: 'success' });
    } catch (err: any) {
      setFeedback({ text: `Export failed: ${err.message}`, type: 'error' });
    } finally {
      setExporting(false);
    }
  };

  // Download Journals Only (Clean Markdown format)
  const handleDownloadJournals = async () => {
    setDownloadingJournals(true);
    setFeedback(null);
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

      setFeedback({ text: 'Journals downloaded in Markdown format.', type: 'success' });
    } catch (err: any) {
      setFeedback({ text: `Journal download failed: ${err.message}`, type: 'error' });
    } finally {
      setDownloadingJournals(false);
    }
  };

  // Purge Local IndexedDB Offline Storage
  const handlePurgeLocalStorage = async () => {
    if (!user) return;
    setPurgingLocal(true);
    try {
      await OfflineDB.clearAll();
      setFeedback({ text: 'Local offline cache cleared.', type: 'success' });
    } catch (e: any) {
      setFeedback({ text: `Failed to clear offline storage: ${e.message}`, type: 'error' });
    } finally {
      setPurgingLocal(false);
    }
  };

  // Account Deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== 'DELETE') {
      setFeedback({ text: 'Please type "DELETE" exactly to confirm.', type: 'error' });
      return;
    }
    setDeleting(true);
    try {
      const { error } = await deleteAccount();
      if (error) throw error;
      navigate('/login');
    } catch (err: any) {
      setFeedback({ text: `Deletion failed: ${err.message}`, type: 'error' });
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 px-2 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
        <div className="flex items-center space-x-3 mb-1.5">
          <div className="p-2 rounded-xl bg-black text-white dark:bg-white dark:text-black">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Privacy Center
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Manage your personal data, download copies, and control how your journal is stored.
            </p>
          </div>
        </div>
      </div>

      {/* Streamlined 2-Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-100 dark:border-gray-800 pb-3 text-xs">
        <button
          onClick={() => setActiveTab('controls')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition ${
            activeTab === 'controls'
              ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
              : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700'
          }`}
        >
          Data & Privacy Controls
        </button>
        <button
          onClick={() => setActiveTab('policy')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition ${
            activeTab === 'policy'
              ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
              : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700'
          }`}
        >
          Privacy Policy & Security
        </button>
      </div>

      {/* Notification Banner */}
      {feedback && (
        <div className={`p-3 rounded-xl text-xs flex items-center ${
          feedback.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}>
          <CheckCircle2 size={16} className="mr-2 flex-shrink-0" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* TAB 1: DATA & PRIVACY CONTROLS */}
      {activeTab === 'controls' && (
        <div className="space-y-6">
          {/* Export & Storage Cards */}
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                <Database size={16} className="mr-2 text-neutral-500" />
                Data Portability & Export
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Download a local copy of your memories anytime in standard open formats.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Export JSON */}
              <div className="p-4 rounded-xl border border-gray-200/90 dark:border-gray-800 bg-gray-50/50 dark:bg-neutral-850/40 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center space-x-2 text-xs font-semibold text-gray-900 dark:text-gray-100">
                    <Download size={14} className="text-neutral-700 dark:text-neutral-200" />
                    <span>Full Data Archive (JSON)</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    Complete machine-readable backup of your entries, tags, folders, and profile.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportAll}
                  disabled={exporting}
                  className="w-full py-1.5 px-3 rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-90 transition disabled:opacity-40"
                >
                  {exporting ? 'Exporting...' : 'Download JSON (.json)'}
                </button>
              </div>

              {/* Download Markdown */}
              <div className="p-4 rounded-xl border border-gray-200/90 dark:border-gray-800 bg-gray-50/50 dark:bg-neutral-850/40 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center space-x-2 text-xs font-semibold text-gray-900 dark:text-gray-100">
                    <FileCheck2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Journals Only (Markdown)</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    Export readable text entries ready for Obsidian, Notion, or personal archival.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadJournals}
                  disabled={downloadingJournals}
                  className="w-full py-1.5 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-700 text-xs font-semibold transition disabled:opacity-40"
                >
                  {downloadingJournals ? 'Writing files...' : 'Download Markdown (.md)'}
                </button>
              </div>
            </div>

            {/* Offline Cache Cleanup */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-1.5 text-xs font-medium text-gray-900 dark:text-gray-200">
                  <HardDrive size={14} className="text-blue-500" />
                  <span>Browser Offline Cache</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  Clear local drafts and entries cached in this browser's IndexedDB without deleting cloud entries.
                </p>
              </div>
              <button
                type="button"
                onClick={handlePurgeLocalStorage}
                disabled={purgingLocal}
                className="py-1.5 px-3 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 text-xs font-medium transition self-start sm:self-center"
              >
                {purgingLocal ? 'Clearing...' : 'Clear Offline Cache'}
              </button>
            </div>
          </div>

          {/* Granular Sync & Consent Settings */}
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                <UserCheck size={16} className="mr-2 text-neutral-500" />
                Data & Feature Preferences
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Toggle optional data features and sync mechanisms.
              </p>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {/* Cloud Sync */}
              <div className="py-3 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-medium text-gray-900 dark:text-gray-100 block">
                    Cloud Synchronization
                  </span>
                  <p className="text-[11px] text-gray-500">
                    Syncs encrypted journals across devices with Postgres Row Level Security.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={consent.cloudSync}
                  onChange={() => handleConsentToggle('cloudSync')}
                  className="h-4 w-4 rounded border-gray-300 text-black dark:text-white"
                />
              </div>

              {/* Local Voice */}
              <div className="py-3 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-medium text-gray-900 dark:text-gray-100 block">
                    Browser Voice Dictation
                  </span>
                  <p className="text-[11px] text-gray-500">
                    Use browser-native speech recognition for hands-free voice journaling.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={consent.localVoiceProcessing}
                  onChange={() => handleConsentToggle('localVoiceProcessing')}
                  className="h-4 w-4 rounded border-gray-300 text-black dark:text-white"
                />
              </div>

              {/* Diagnostics */}
              <div className="py-3 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-medium text-gray-900 dark:text-gray-100 block">
                    Anonymous Error Diagnostics
                  </span>
                  <p className="text-[11px] text-gray-500">
                    Sends anonymous bug reports to improve app reliability. No journal content is ever included.
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
          <div className="p-4 sm:p-5 rounded-2xl border border-red-200/80 dark:border-red-900/60 bg-red-50/30 dark:bg-red-950/15 space-y-3">
            <div className="flex items-start space-x-2.5">
              <AlertTriangle size={17} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-red-900 dark:text-red-200">
                  Delete Account & Erase All Data
                </h4>
                <p className="text-[11px] text-red-700/90 dark:text-red-300/80 mt-0.5">
                  Permanently wipe all journals, media attachments, folders, and profile data from Supabase and local storage.
                </p>
              </div>
            </div>

            {!showDeleteModal ? (
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="py-1.5 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition"
              >
                Delete My Account
              </button>
            ) : (
              <div className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-red-300 dark:border-red-800 space-y-2">
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  Type <span className="font-bold text-red-600">DELETE</span> to confirm permanent account erasure:
                </p>
                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full max-w-xs px-2.5 py-1 text-xs border rounded-lg bg-gray-50 dark:bg-neutral-800"
                />
                <div className="flex items-center space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleting || deleteConfirmationText !== 'DELETE'}
                    className="py-1 px-3 rounded-lg bg-red-600 text-white text-xs font-semibold disabled:opacity-40"
                  >
                    {deleting ? 'Erasing...' : 'Confirm Deletion'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteConfirmationText('');
                    }}
                    className="text-xs text-gray-500 hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PRIVACY POLICY & SECURITY */}
      {activeTab === 'policy' && (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-xs space-y-5 text-xs leading-relaxed text-gray-700 dark:text-gray-300">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Lock size={17} className="text-neutral-500" />
              Journify Privacy Promise & Security
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Updated September 2026</p>
          </div>

          <div className="space-y-4 pt-1">
            <div className="p-3.5 rounded-xl bg-gray-50/60 dark:bg-neutral-850/50 border border-gray-100 dark:border-gray-800 space-y-1">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-xs">1. Absolute Data Ownership</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your entries belong solely to you. We do not sell user data, we do not train general AI models on your notes, and we never serve third-party advertising.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50/60 dark:bg-neutral-850/50 border border-gray-100 dark:border-gray-800 space-y-1">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-xs">2. Encryption in Transit & at Rest</h3>
              <p className="text-gray-600 dark:text-gray-400">
                All synchronization with cloud servers runs over TLS 1.3 encryption. At rest, data is stored on encrypted disks (AES-256). PostgreSQL Row-Level Security ensures only your authenticated credentials can read or write your journals.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50/60 dark:bg-neutral-850/50 border border-gray-100 dark:border-gray-800 space-y-1">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-xs">3. Data Retention & Instant Deletion</h3>
              <p className="text-gray-600 dark:text-gray-400">
                We only retain data while your account is active. When you delete an entry or your account, it is wiped permanently and irrevocably from cloud servers and local storage.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50/60 dark:bg-neutral-850/50 border border-gray-100 dark:border-gray-800 space-y-1">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-xs">4. GDPR & CCPA Compliance</h3>
              <p className="text-gray-600 dark:text-gray-400">
                You have the permanent right to access, export full machine-readable JSON or Markdown archives, and execute the right to be forgotten anytime.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
