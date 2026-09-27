import { format } from 'date-fns';
import { History, RotateCcw, X, FileText, CheckCircle2 } from 'lucide-react';
import type { VersionSnapshot } from '../services/draftService';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: VersionSnapshot[];
  onRestore: (version: VersionSnapshot) => void;
  currentTitle: string;
}

export default function VersionHistoryModal({
  isOpen,
  onClose,
  versions,
  onRestore,
  currentTitle,
}: VersionHistoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300">
              <History size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Version History & Auto-Drafts
              </h3>
              <p className="text-[11px] text-gray-500">
                Recover previous revisions and crash-saved snapshots for: <span className="font-medium text-gray-700 dark:text-gray-300">"{currentTitle || 'Untitled'}"</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {versions.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileText size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-xs">No prior version snapshots recorded yet.</p>
              <p className="text-[11px] text-gray-500 mt-1">
                Snapshots are automatically created as you write.
              </p>
            </div>
          ) : (
            versions.map((ver, index) => {
              const previewText = ver.content.replace(/<[^>]*>/g, ' ').slice(0, 140);
              const isLatest = index === 0;

              return (
                <div
                  key={ver.id}
                  className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-gray-50/50 dark:bg-neutral-850 transition flex items-start justify-between gap-4"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                        {format(new Date(ver.timestamp), 'PPpp')}
                      </span>
                      {isLatest && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          <CheckCircle2 size={10} className="mr-1" /> Latest draft
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      Title: <span className="text-gray-700 dark:text-gray-300 font-medium">"{ver.title || 'Untitled'}"</span> • {ver.wordCount} words
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 italic pt-1">
                      "{previewText || 'Empty entry content'}"
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onRestore(ver);
                      onClose();
                    }}
                    className="inline-flex items-center py-1.5 px-3 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black text-xs font-medium transition shadow-sm flex-shrink-0"
                  >
                    <RotateCcw size={12} className="mr-1.5" />
                    Restore
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-neutral-950 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-500 flex items-center justify-between">
          <span>Local checkpoints are persisted securely in browser storage.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-gray-200 dark:bg-neutral-800 hover:bg-gray-300 dark:hover:bg-neutral-700 text-xs font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
