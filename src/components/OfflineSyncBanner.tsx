import { useState, useEffect } from 'react';
import { SyncEngine } from '../services/syncEngine';
import type { SyncState } from '../services/syncEngine';
import { WifiOff, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function OfflineSyncBanner() {
  const [syncInfo, setSyncInfo] = useState<{
    status: SyncState;
    pendingCount: number;
    lastSyncedAt: string | null;
  }>({
    status: navigator.onLine ? 'online' : 'offline',
    pendingCount: 0,
    lastSyncedAt: null,
  });

  useEffect(() => {
    const unsubscribe = SyncEngine.subscribe((state) => {
      setSyncInfo(state);
    });
    return () => unsubscribe();
  }, []);

  const handleManualSync = () => {
    SyncEngine.processQueue();
  };

  // Only render if actively offline, syncing, or there are pending queue items (never show 'All changes synced')
  if ((syncInfo.status === 'online' || syncInfo.status === 'synced') && syncInfo.pendingCount === 0) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-medium shadow-lg backdrop-blur-md transition-all duration-200 border ${
        syncInfo.status === 'offline'
          ? 'bg-neutral-900/90 text-white border-neutral-800'
          : syncInfo.status === 'syncing'
          ? 'bg-blue-600/90 text-white border-blue-500'
          : 'bg-amber-500/90 text-white border-amber-400'
      }`}
    >
      <div className="flex items-center space-x-2">
        {syncInfo.status === 'offline' ? (
          <>
            <WifiOff size={15} className="text-amber-400 animate-pulse" />
            <span>Working Offline (IndexedDB Active)</span>
          </>
        ) : syncInfo.status === 'syncing' ? (
          <>
            <RefreshCw size={14} className="animate-spin text-white" />
            <span>Syncing {syncInfo.pendingCount} pending items...</span>
          </>
        ) : (
          <>
            <AlertTriangle size={15} className="text-white" />
            <span>{syncInfo.pendingCount} changes queued</span>
          </>
        )}
      </div>

      {syncInfo.status !== 'offline' && syncInfo.pendingCount > 0 && (
        <button
          onClick={handleManualSync}
          className="ml-1 px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold transition"
        >
          Sync Now
        </button>
      )}
    </div>
  );
}
