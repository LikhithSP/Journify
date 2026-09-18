import React, { useState } from 'react';
import { 
  Folder, 
  FolderPlus, 
  ChevronRight, 
  ChevronDown, 
  Trash2, 
  Plus, 
  FolderOpen 
} from 'lucide-react';
import type { Folder as FolderType } from '../types/journal';

interface FolderTreeProps {
  folders: FolderType[];
  activeFolderId: string | null;
  onSelectFolder: (folderId: string) => void;
  onCreateFolder: (name: string, parentId?: string | null) => Promise<void>;
  onDeleteFolder: (folderId: string) => Promise<void>;
  onDropJournal?: (folderId: string) => void;
}

export default function FolderTree({
  folders,
  activeFolderId,
  onSelectFolder,
  onCreateFolder,
  onDeleteFolder,
  onDropJournal,
}: FolderTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [showSubInput, setShowSubInput] = useState<string | null>(null);
  const [subFolderName, setSubFolderName] = useState('');
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  const toggleExpand = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const handleCreateSubfolder = async (parentId: string) => {
    if (!subFolderName.trim()) return;
    await onCreateFolder(subFolderName.trim(), parentId);
    setSubFolderName('');
    setShowSubInput(null);
    setExpandedFolders((prev) => ({ ...prev, [parentId]: true }));
  };

  // Group folders hierarchically
  const topLevelFolders = folders.filter((f) => !f.parent_id);
  const getSubFolders = (parentId: string) => folders.filter((f) => f.parent_id === parentId);

  const renderFolderItem = (folder: FolderType, depth: number = 0) => {
    const subFolders = getSubFolders(folder.id);
    const hasChildren = subFolders.length > 0;
    const isExpanded = !!expandedFolders[folder.id];
    const isActive = activeFolderId === folder.id;
    const isDragOver = dragOverFolderId === folder.id;

    return (
      <div key={folder.id} className="space-y-0.5">
        <div
          className={`group flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
            isActive
              ? 'bg-black text-white dark:bg-white dark:text-black font-semibold'
              : isDragOver
              ? 'bg-blue-100 dark:bg-blue-900/50 border border-dashed border-blue-400 text-blue-900 dark:text-blue-100'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800'
          }`}
          style={{ paddingLeft: `${Math.max(depth * 14 + 8, 8)}px` }}
          onClick={() => onSelectFolder(folder.id)}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOverFolderId(folder.id);
          }}
          onDragLeave={() => {
            setDragOverFolderId(null);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOverFolderId(null);
            if (onDropJournal) {
              onDropJournal(folder.id);
            }
          }}
        >
          {/* Left Icon & Folder Name */}
          <div className="flex items-center space-x-1.5 min-w-0 flex-1">
            {/* Expand / Collapse toggle or indent spacing */}
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleExpand(folder.id, e)}
                className="p-0.5 hover:opacity-75 focus:outline-none"
              >
                {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </button>
            ) : (
              <span className="w-3.5 inline-block" />
            )}

            {isExpanded ? (
              <FolderOpen
                size={14}
                className={isActive ? 'text-white dark:text-black flex-shrink-0' : 'text-amber-500 flex-shrink-0'}
              />
            ) : (
              <Folder
                size={14}
                className={isActive ? 'text-white dark:text-black flex-shrink-0' : 'text-gray-400 dark:text-gray-400 flex-shrink-0'}
              />
            )}

            <span className="truncate">{folder.name}</span>
          </div>

          {/* Action Buttons (Add Subfolder, Delete) */}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
            {/* Add Subfolder */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowSubInput(folder.id);
                setExpandedFolders((prev) => ({ ...prev, [folder.id]: true }));
              }}
              title="Add Subfolder"
              className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-neutral-700 ${
                isActive ? 'text-white dark:text-black' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <Plus size={12} />
            </button>

            {/* Delete Folder */}
            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation();
                if (confirm(`Delete folder "${folder.name}" and any subfolders? Journals will remain safe.`)) {
                  await onDeleteFolder(folder.id);
                }
              }}
              title="Delete Folder"
              className={`p-1 rounded hover:bg-red-100 dark:hover:bg-red-950/60 ${
                isActive ? 'text-red-300' : 'text-gray-400 hover:text-red-600 dark:hover:text-red-400'
              }`}
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* Subfolder Input Form when active */}
        {showSubInput === folder.id && (
          <div
            className="flex items-center gap-1.5 py-1 pr-2"
            style={{ paddingLeft: `${(depth + 1) * 14 + 12}px` }}
          >
            <input
              type="text"
              autoFocus
              value={subFolderName}
              placeholder="Subfolder name..."
              onChange={(e) => setSubFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateSubfolder(folder.id);
                if (e.key === 'Escape') setShowSubInput(null);
              }}
              className="flex-1 px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
            />
            <button
              type="button"
              onClick={() => handleCreateSubfolder(folder.id)}
              className="px-2 py-1 text-[11px] font-semibold rounded bg-black text-white dark:bg-white dark:text-black hover:opacity-90"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowSubInput(null)}
              className="px-1.5 py-1 text-[11px] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
        )}

        {/* Render nested child subfolders */}
        {hasChildren && isExpanded && (
          <div className="space-y-0.5">
            {subFolders.map((sub) => renderFolderItem(sub, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (folders.length === 0) {
    return (
      <div className="px-3 py-3 text-center text-xs text-gray-400 dark:text-gray-500">
        No folders yet. Click <FolderPlus size={12} className="inline mx-0.5" /> to create one.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {topLevelFolders.map((folder) => renderFolderItem(folder, 0))}
    </div>
  );
}
