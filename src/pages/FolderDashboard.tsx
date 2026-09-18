import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { OfflineDB } from '../services/offlineDB';
import NotionCard from '../components/NotionCard';
import { motion } from 'framer-motion';
import { 
  Folder as FolderIcon, 
  FolderPlus, 
  Trash2, 
  ChevronRight, 
  Plus, 
  ArrowLeft,
  Edit2,
  Check,
  X
} from 'lucide-react';
import type { Folder, JournalEntry } from '../types/journal';

export default function FolderDashboard() {
  const { folderId } = useParams<{ folderId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [parentFolder, setParentFolder] = useState<Folder | null>(null);
  const [subFolders, setSubFolders] = useState<Folder[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Rename folder state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  // Add subfolder inline state
  const [showAddSub, setShowAddSub] = useState(false);
  const [subName, setSubName] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadFolderData() {
      if (!user || !folderId) return;
      setLoading(true);

      try {
        // Fetch current folder
        const { data: folderData } = await supabase
          .from('folders')
          .select('*')
          .eq('id', folderId)
          .eq('user_id', user.id)
          .single();

        if (ignore) return;

        if (folderData) {
          setCurrentFolder(folderData);
          setEditedName(folderData.name);

          // If it has a parent_id, fetch the parent folder
          if (folderData.parent_id) {
            const { data: pData } = await supabase
              .from('folders')
              .select('*')
              .eq('id', folderData.parent_id)
              .eq('user_id', user.id)
              .single();
            if (!ignore && pData) setParentFolder(pData);
          } else {
            setParentFolder(null);
          }
        }

        // Fetch direct subfolders
        const { data: subData } = await supabase
          .from('folders')
          .select('*')
          .eq('user_id', user.id)
          .eq('parent_id', folderId)
          .order('created_at', { ascending: true });

        if (!ignore && subData) {
          setSubFolders(subData);
        }

        // Fetch entries in this folder
        const { data: entriesData } = await supabase
          .from('journal_entries')
          .select('*')
          .eq('user_id', user.id)
          .eq('folder_id', folderId)
          .order('created_at', { ascending: false });

        if (!ignore) {
          setEntries((entriesData as JournalEntry[]) || []);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading folder view:', err);
        if (!ignore) setLoading(false);
      }
    }

    loadFolderData();
    return () => { ignore = true; };
  }, [user, folderId]);

  // Rename Folder
  const handleRename = async () => {
    if (!editedName.trim() || !user || !folderId) return;
    setIsEditingName(false);
    if (currentFolder) {
      setCurrentFolder({ ...currentFolder, name: editedName.trim() });
    }

    await supabase
      .from('folders')
      .update({ name: editedName.trim() })
      .eq('id', folderId)
      .eq('user_id', user.id);

    await OfflineDB.putFolder({ ...currentFolder, name: editedName.trim() });
  };

  // Create Subfolder
  const handleAddSubfolder = async () => {
    if (!subName.trim() || !user || !folderId) return;
    const tempId = `folder_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newSub: Folder = {
      id: tempId,
      name: subName.trim(),
      user_id: user.id,
      parent_id: folderId,
      created_at: new Date().toISOString(),
    };

    setSubFolders((prev) => [...prev, newSub]);
    setSubName('');
    setShowAddSub(false);
    await OfflineDB.putFolder(newSub);

    if (navigator.onLine) {
      const { data, error } = await supabase
        .from('folders')
        .insert([{
          name: newSub.name,
          user_id: user.id,
          parent_id: folderId,
        }])
        .select('*')
        .single();

      if (!error && data) {
        setSubFolders((prev) => prev.map((f) => (f.id === tempId ? data : f)));
        await OfflineDB.deleteFolder(tempId);
        await OfflineDB.putFolder(data);
      }
    }
  };

  // Delete Folder
  const handleDeleteCurrentFolder = async () => {
    if (!user || !folderId || !currentFolder) return;
    if (!confirm(`Delete folder "${currentFolder.name}" and any subfolders? Entries will remain safe.`)) {
      return;
    }

    // Delete folder from Supabase
    await supabase.from('folders').delete().eq('id', folderId).eq('user_id', user.id);
    await OfflineDB.deleteFolder(folderId);

    // Navigate to parent folder or home
    if (parentFolder) {
      navigate(`/folder/${parentFolder.id}`);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-2 min-h-screen dark:bg-[rgb(23,23,23)] bg-white pb-24">
      {/* Breadcrumbs Navigation */}
      <nav className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 py-3 mb-2">
        <Link to="/" className="hover:text-black dark:hover:text-white transition flex items-center">
          <ArrowLeft size={13} className="mr-1" />
          Home
        </Link>
        {parentFolder && (
          <>
            <ChevronRight size={12} className="text-gray-400" />
            <Link
              to={`/folder/${parentFolder.id}`}
              className="hover:text-black dark:hover:text-white transition truncate max-w-[120px]"
            >
              {parentFolder.name}
            </Link>
          </>
        )}
        <ChevronRight size={12} className="text-gray-400" />
        <span className="font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[150px]">
          {currentFolder?.name || 'Folder'}
        </span>
      </nav>

      {/* Header & Folder Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 py-4 border-b border-gray-200 dark:border-gray-800 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 shadow-xs">
            <FolderIcon size={24} />
          </div>

          {isEditingName ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename();
                  if (e.key === 'Escape') setIsEditingName(false);
                }}
                autoFocus
                className="text-2xl font-bold bg-transparent border-b border-black dark:border-white focus:outline-none text-gray-900 dark:text-gray-100"
              />
              <button
                onClick={handleRename}
                className="p-1 rounded bg-black text-white dark:bg-white dark:text-black hover:opacity-90"
                title="Save Name"
              >
                <Check size={14} />
              </button>
              <button
                onClick={() => setIsEditingName(false)}
                className="p-1 rounded text-gray-400 hover:text-gray-600"
                title="Cancel"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                {currentFolder?.name ?? 'Loading...'}
              </h1>
              <button
                onClick={() => setIsEditingName(true)}
                className="p-1 rounded-md text-gray-400 hover:text-black dark:hover:text-white transition"
                title="Rename Folder"
              >
                <Edit2 size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          <button
            onClick={() => setShowAddSub(true)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-neutral-800 text-xs font-medium text-gray-700 dark:text-gray-200 transition"
          >
            <FolderPlus size={14} />
            <span>New Subfolder</span>
          </button>

          <button
            onClick={handleDeleteCurrentFolder}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-medium text-red-600 dark:text-red-400 transition"
          >
            <Trash2 size={14} />
            <span>Delete Folder</span>
          </button>

          <Link
            to="/entry/new"
            className="flex items-center space-x-1 px-3.5 py-1.5 rounded-lg bg-black text-white dark:bg-white dark:text-black text-xs font-semibold hover:opacity-90 transition shadow-sm"
          >
            <Plus size={14} />
            <span>Write Entry</span>
          </Link>
        </div>
      </div>

      {/* Subfolder Creation Form */}
      {showAddSub && (
        <div className="mb-6 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-neutral-900/70 flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1 max-w-md">
            <FolderPlus size={16} className="text-gray-500" />
            <input
              type="text"
              autoFocus
              placeholder="Enter subfolder name..."
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddSubfolder();
                if (e.key === 'Escape') setShowAddSub(false);
              }}
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
            />
            <button
              onClick={handleAddSubfolder}
              className="px-3 py-1.5 rounded-lg bg-black text-white dark:bg-white dark:text-black text-xs font-medium hover:opacity-90"
            >
              Create
            </button>
            <button
              onClick={() => setShowAddSub(false)}
              className="px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Subfolders Grid (if any) */}
      {subFolders.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
            Subfolders ({subFolders.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {subFolders.map((sub) => (
              <div
                key={sub.id}
                onClick={() => navigate(`/folder/${sub.id}`)}
                className="group p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-900 hover:border-black dark:hover:border-white cursor-pointer transition-all flex items-center justify-between shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <FolderIcon size={16} className="text-amber-500 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                    {sub.name}
                  </span>
                </div>
                <ChevronRight size={13} className="text-gray-300 group-hover:text-gray-600 dark:group-hover:text-gray-200 transition-transform group-hover:translate-x-0.5" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Journal Entries in this folder */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Journals ({entries.length})
          </h3>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 dark:text-gray-500 py-16">
            Loading journals...
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 p-8 space-y-3">
            <FolderIcon size={32} className="mx-auto text-gray-300 dark:text-gray-700" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              No journal entries in this folder yet.
            </p>
            <p className="text-xs text-gray-400">
              Drag entries from Home into this folder on the sidebar, or click Write Entry.
            </p>
            <Link
              to="/entry/new"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-black text-white dark:bg-white dark:text-black text-xs font-medium hover:opacity-90 shadow-sm"
            >
              <Plus size={13} />
              <span>Write Entry</span>
            </Link>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
          >
            {entries.map((entry) => (
              <NotionCard key={entry.id} entry={entry} viewType="grid" />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
