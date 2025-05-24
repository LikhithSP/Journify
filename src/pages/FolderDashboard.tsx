import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import NotionCard from '../components/NotionCard';
import { motion } from 'framer-motion';

export default function FolderDashboard() {
  const { folderId } = useParams<{ folderId: string }>();
  const { user } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [folderName, setFolderName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFolderAndEntries() {
      if (!user || !folderId) return;
      setLoading(true);
      // Fetch folder name
      const { data: folder } = await supabase
        .from('folders')
        .select('name')
        .eq('id', folderId)
        .eq('user_id', user.id)
        .single();
      setFolderName(folder?.name || '');
      // Fetch entries in this folder
      const { data: entriesData } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('folder_id', folderId)
        .order('created_at', { ascending: false });
      setEntries(entriesData || []);
      setLoading(false);
    }
    fetchFolderAndEntries();
  }, [user, folderId]);

  return (
    <div className="max-w-5xl mx-auto px-2 min-h-screen dark:bg-[rgb(23,23,23)] bg-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 py-4 border-b border-gray-200 dark:border-gray-800 gap-4">
        <h1 className="notion-page-title text-4xl font-semibold text-gray-800 dark:text-gray-100">{folderName || 'Folder'}</h1>
      </div>
      {loading ? (
        <div className="text-center text-gray-400 dark:text-gray-500 py-20">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="text-center text-gray-400 dark:text-gray-500 py-20">No journals in this folder.</div>
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
  );
}
