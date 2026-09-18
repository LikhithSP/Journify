import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Download, 
  Lock, 
  Laptop, 
  Globe, 
  CheckCircle2, 
  FileCheck2, 
  AlertTriangle,
  HardDrive,
  Database,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PRIVACY_SPECIFICATIONS, PrivacyService } from '../services/privacyService';
import type { ConsentSettings } from '../services/privacyService';
import { OfflineDB } from '../services/offlineDB';
import { useNavigate } from 'react-router-dom';

export default function PrivacyCenterPage() {
  const { user, signOut, exportUserData, deleteAccount } = useAuth();
  const navigate = useNavigate();

  const [activeSubSection, setActiveSubSection] = useState<'your-data' | 'encryption' | 'retention' | 'consent' | 'privacy-policy'>('your-data');
  const [consent, setConsent] = useState<ConsentSettings>(() => PrivacyService.getConsent());
  const [exporting, setExporting] = useState(false);
  const [downloadingJournals, setDownloadingJournals] = useState(false);
  const [purgingLocal, setPurgingLocal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [globalLoggingOut, setGlobalLoggingOut] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleConsentToggle = (key: keyof ConsentSettings) => {
    if (key === 'essentialStorage') return; // Essential cannot be disabled
    const updated = { ...consent, [key]: !consent[key] };
    setConsent(updated);
    PrivacyService.saveConsent(updated);
    setFeedback({ text: 'Privacy and consent preferences updated.', type: 'success' });
  };

  // 1. Export Everything (Comprehensive Archive)
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
      link.download = `journify_full_archive_${user?.id?.slice(0, 8)}_${new Date().toISOString().slice(0, 10)}.json`;
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

  // 2. Download Journals Only (Clean Markdown Text format)
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

      setFeedback({ text: 'Journals downloaded in clean Markdown format.', type: 'success' });
    } catch (err: any) {
      setFeedback({ text: `Journal download failed: ${err.message}`, type: 'error' });
    } finally {
      setDownloadingJournals(false);
    }
  };

  // 3. Purge Local IndexedDB Offline Storage
  const handlePurgeLocalStorage = async () => {
    if (!user) return;
    setPurgingLocal(true);
    try {
      await OfflineDB.clearAll();
      setFeedback({ text: 'Local IndexedDB offline cache cleared cleanly.', type: 'success' });
    } catch (e: any) {
      setFeedback({ text: `Failed to clear offline storage: ${e.message}`, type: 'error' });
    } finally {
      setPurgingLocal(false);
    }
  };

  // 4. Terminate Sessions
  const handleLogoutAll = async () => {
    setGlobalLoggingOut(true);
    try {
      await signOut('global');
      navigate('/login');
    } catch (e: any) {
      setFeedback({ text: 'Could not log out from all sessions.', type: 'error' });
      setGlobalLoggingOut(false);
    }
  };

  // 5. Account Deletion
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
    <div className="max-w-5xl mx-auto py-4 px-2 space-y-8">
      {/* Top Header */}
      <div className="border-b border-gray-100 dark:border-gray-800 pb-5">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 rounded-xl bg-black text-white dark:bg-white dark:text-black">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Privacy Center
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Privacy is Journify's identity. You own your thoughts, controls, and data.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex flex-wrap gap-2 border-b border-gray-100 dark:border-gray-800 pb-3 text-xs">
        <button
          onClick={() => setActiveSubSection('your-data')}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            activeSubSection === 'your-data'
              ? 'bg-black text-white dark:bg-white dark:text-black'
              : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
          }`}
        >
          Your Data & Controls
        </button>
        <button
          onClick={() => setActiveSubSection('encryption')}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            activeSubSection === 'encryption'
              ? 'bg-black text-white dark:bg-white dark:text-black'
              : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
          }`}
        >
          Encryption at Rest & Transparency
        </button>
        <button
          onClick={() => setActiveSubSection('retention')}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            activeSubSection === 'retention'
              ? 'bg-black text-white dark:bg-white dark:text-black'
              : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
          }`}
        >
          Data Retention Policy
        </button>
        <button
          onClick={() => setActiveSubSection('consent')}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            activeSubSection === 'consent'
              ? 'bg-black text-white dark:bg-white dark:text-black'
              : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
          }`}
        >
          Consent Management
        </button>
        <button
          onClick={() => setActiveSubSection('privacy-policy')}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            activeSubSection === 'privacy-policy'
              ? 'bg-black text-white dark:bg-white dark:text-black'
              : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
          }`}
        >
          Privacy Policy
        </button>
      </div>

      {/* Alert banner */}
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

      {/* SECTION 1: YOUR DATA & CONTROLS */}
      {activeSubSection === 'your-data' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <Database size={18} className="mr-2 text-gray-500" />
              Your Data Ownership & Portability
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Export Everything */}
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-neutral-850/50 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center space-x-2 text-xs font-semibold text-gray-900 dark:text-gray-100">
                    <Download size={15} className="text-black dark:text-white" />
                    <span>Export Everything (JSON)</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                    Download complete machine-readable archive including entries, tags, folders, and profile info.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportAll}
                  disabled={exporting}
                  className="w-full py-2 px-3 rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-medium hover:opacity-90 transition disabled:opacity-40"
                >
                  {exporting ? 'Packing JSON...' : 'Download Full Archive (.json)'}
                </button>
              </div>

              {/* Download Journals in Markdown */}
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-neutral-850/50 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center space-x-2 text-xs font-semibold text-gray-900 dark:text-gray-100">
                    <FileCheck2 size={15} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Download Journals (.md)</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                    Export your thoughts formatted as readable Markdown files, ready for Obsidian, Notion, or personal print.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadJournals}
                  disabled={downloadingJournals}
                  className="w-full py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 hover:bg-gray-100 text-xs font-medium transition disabled:opacity-40"
                >
                  {downloadingJournals ? 'Writing Markdown...' : 'Download Journals (.md)'}
                </button>
              </div>

              {/* Local Storage Governance */}
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-neutral-850/50 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center space-x-2 text-xs font-semibold text-gray-900 dark:text-gray-100">
                    <HardDrive size={15} className="text-blue-500" />
                    <span>Manage Offline Cache (IndexedDB)</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                    Purge offline cached drafts and entries from this browser's local sandbox storage without affecting cloud entries.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePurgeLocalStorage}
                  disabled={purgingLocal}
                  className="w-full py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-300 text-xs font-medium transition"
                >
                  {purgingLocal ? 'Purging local storage...' : 'Purge Local Offline Cache'}
                </button>
              </div>

              {/* Sessions & Connected Devices */}
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-neutral-850/50 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center space-x-2 text-xs font-semibold text-gray-900 dark:text-gray-100">
                    <Laptop size={15} className="text-purple-500" />
                    <span>Manage Active Sessions</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                    Current device: <span className="font-mono text-[10px]">{navigator.userAgent.slice(0, 30)}...</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLogoutAll}
                  disabled={globalLoggingOut}
                  className="w-full py-2 px-3 rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-medium transition"
                >
                  {globalLoggingOut ? 'Logging out...' : 'Log Out from All Devices'}
                </button>
              </div>
            </div>

            {/* Connected Accounts & OAuth Identities */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
              <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                <Globe size={14} className="mr-1.5 text-gray-500" />
                Connected Accounts & Providers
              </h3>
              <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-neutral-850/30 flex items-center justify-between text-xs">
                <div>
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    Authentication Identity
                  </span>
                  <p className="text-[11px] text-gray-500">
                    {user?.app_metadata?.provider ? `Linked via ${user.app_metadata.provider.toUpperCase()} OAuth` : 'Email & Password Authentication'}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  Verified
                </span>
              </div>
            </div>

            {/* Irreversible Account Erasure */}
            <div className="pt-4 border-t border-red-100 dark:border-red-950">
              <div className="p-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50/40 dark:bg-red-950/20 space-y-3">
                <div className="flex items-start space-x-2.5">
                  <AlertTriangle size={18} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-red-900 dark:text-red-200">
                      Delete Account (Permanent Erasure)
                    </h4>
                    <p className="text-[11px] text-red-700 dark:text-red-300/80 mt-0.5">
                      Instantly wipe all journals, media attachments, tags, and account records across Supabase and local storage.
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
                  <div className="p-3 bg-white dark:bg-neutral-900 rounded-lg border border-red-300 dark:border-red-800 space-y-2">
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      Type <span className="font-bold text-red-600">DELETE</span> to confirm permanent deletion:
                    </p>
                    <input
                      type="text"
                      value={deleteConfirmationText}
                      onChange={(e) => setDeleteConfirmationText(e.target.value)}
                      placeholder="Type DELETE"
                      className="w-full max-w-xs px-2.5 py-1 text-xs border rounded bg-gray-50 dark:bg-neutral-800"
                    />
                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={deleting || deleteConfirmationText !== 'DELETE'}
                        className="py-1 px-3 rounded bg-red-600 text-white text-xs font-semibold disabled:opacity-40"
                      >
                        {deleting ? 'Erasing...' : 'Confirm Delete Everything'}
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
          </div>
        </div>
      )}

      {/* SECTION 2: ENCRYPTION AT REST & ARCHITECTURE TRANSPARENCY */}
      {activeSubSection === 'encryption' && (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <Lock size={18} className="mr-2 text-gray-500" />
              Cryptographic Reality & Encryption Specifications
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Journify practices strict cryptographic transparency. Here is an exact breakdown of what is encrypted, where, and by whom.
            </p>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {PRIVACY_SPECIFICATIONS.encryptionDetails.map((spec) => (
              <div key={spec.domain} className="py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                      {spec.domain}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300">
                      {spec.protocol}
                    </span>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    spec.status === 'Enforced'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                      : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                  }`}>
                    {spec.status}
                  </span>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  {spec.scope}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-neutral-850 p-2.5 rounded-lg font-mono">
                  <div><span className="text-gray-400">Cipher / Protocol:</span> {spec.cipher}</div>
                  <div><span className="text-gray-400">Key Management:</span> {spec.keysHeldBy}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: DATA RETENTION POLICY */}
      {activeSubSection === 'retention' && (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <Database size={18} className="mr-2 text-gray-500" />
              Strict Data Retention Policy
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              We operate on zero data retention beyond what is needed to preserve your journal.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-neutral-850/50 space-y-1">
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100">Journal Entries & Content</span>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {PRIVACY_SPECIFICATIONS.retentionPolicy.journalEntries}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-neutral-850/50 space-y-1">
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100">Media & Photos</span>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {PRIVACY_SPECIFICATIONS.retentionPolicy.mediaAttachments}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-neutral-850/50 space-y-1">
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100">Deleted Rows & Items</span>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {PRIVACY_SPECIFICATIONS.retentionPolicy.deletedItems}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-neutral-850/50 space-y-1">
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100">Account Erasure</span>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {PRIVACY_SPECIFICATIONS.retentionPolicy.accountWipe}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-neutral-850/50 space-y-1">
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100">Local Browser Cache</span>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {PRIVACY_SPECIFICATIONS.retentionPolicy.localIndexedDB}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: CONSENT MANAGEMENT */}
      {activeSubSection === 'consent' && (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <UserCheck size={18} className="mr-2 text-gray-500" />
              Granular Consent Management
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Control exactly what data processes run. You can revoke consent at any time.
            </p>
          </div>

          <div className="space-y-3">
            {/* Essential Storage */}
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100 block">
                  Essential Application Storage
                </span>
                <p className="text-[11px] text-gray-500">
                  Required to save session tokens and drafts in your browser. Cannot be disabled.
                </p>
              </div>
              <input type="checkbox" checked={consent.essentialStorage} disabled className="h-4 w-4 rounded opacity-60" />
            </div>

            {/* Cloud Sync */}
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100 block">
                  Cloud Synchronization (Supabase)
                </span>
                <p className="text-[11px] text-gray-500">
                  Syncs encrypted journal entries across your devices using PostgreSQL Row Level Security.
                </p>
              </div>
              <input
                type="checkbox"
                checked={consent.cloudSync}
                onChange={() => handleConsentToggle('cloudSync')}
                className="h-4 w-4 rounded border-gray-300 text-black dark:text-white"
              />
            </div>

            {/* Local Voice Dictation */}
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100 block">
                  Local Speech-to-Text Voice Processing
                </span>
                <p className="text-[11px] text-gray-500">
                  Permits browser-native speech recognition for voice journaling. Audio is processed via your browser's speech engine.
                </p>
              </div>
              <input
                type="checkbox"
                checked={consent.localVoiceProcessing}
                onChange={() => handleConsentToggle('localVoiceProcessing')}
                className="h-4 w-4 rounded border-gray-300 text-black dark:text-white"
              />
            </div>

            {/* Anonymous Diagnostics */}
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100 block">
                  Anonymous Diagnostics & Error Tracking
                </span>
                <p className="text-[11px] text-gray-500">
                  Help improve Journify with anonymous error reports. No entry titles or content are ever sent.
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
      )}

      {/* SECTION 5: PRIVACY POLICY */}
      {activeSubSection === 'privacy-policy' && (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-4 text-xs leading-relaxed text-gray-700 dark:text-gray-300">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Journify Privacy Policy & Promise
          </h2>
          <p className="text-[11px] text-gray-500">Effective Date: September 2026</p>

          <h3 className="font-bold text-gray-900 dark:text-gray-100 pt-2">1. Fundamental Philosophy</h3>
          <p>
            Journify is a sanctuary for personal thought. We believe personal journals are the most intimate digital records in existence. We do not sell your data, we do not train general AI models on your journal entries, and we do not serve third-party ads.
          </p>

          <h3 className="font-bold text-gray-900 dark:text-gray-100 pt-2">2. Information We Collect</h3>
          <p>
            We only store the data you explicitly supply: your email address for account authentication, your profile username, and the journal entries and photos you create.
          </p>

          <h3 className="font-bold text-gray-900 dark:text-gray-100 pt-2">3. Storage & Encryption</h3>
          <p>
            All data in transit is encrypted using modern TLS 1.3 encryption. At rest, data is stored on encrypted disks managed with AES-256 transparent database volume encryption. Access to your entries is enforced through PostgreSQL Row Level Security (RLS) bound strictly to your authenticated User ID.
          </p>

          <h3 className="font-bold text-gray-900 dark:text-gray-100 pt-2">4. Your GDPR & CCPA Rights</h3>
          <p>
            Under global privacy standards, you maintain absolute right of access, right to rectification, right to data portability (downloading your JSON/Markdown archive at any time), and the right to be forgotten (instant, irreversible account deletion).
          </p>
        </div>
      )}
    </div>
  );
}
