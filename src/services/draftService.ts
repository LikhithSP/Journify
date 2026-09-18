/**
 * Draft & Version History Storage Service
 * Handles:
 * - Local automatic drafts
 * - Crash recovery / restore detection
 * - Snapshot version history (timestamped checkpoints)
 * - Unsaved change comparisons
 */

export interface VersionSnapshot {
  id: string;
  timestamp: string;
  title: string;
  content: string;
  mood?: string | null;
  tags?: string[];
  wordCount: number;
}

export interface DraftData {
  id?: string; // existing entry id or 'new'
  title: string;
  content: string;
  mood?: string | null;
  tags?: string[];
  lastSavedAt: string;
  versionHistory: VersionSnapshot[];
}

const DRAFT_PREFIX = 'journify_draft_';

export const DraftService = {
  /**
   * Get draft storage key for an entry id or 'new'
   */
  getKey(entryId: string = 'new'): string {
    return `${DRAFT_PREFIX}${entryId}`;
  },

  /**
   * Saves a draft locally
   */
  saveDraft(
    entryId: string = 'new',
    data: {
      title: string;
      content: string;
      mood?: string | null;
      tags?: string[];
    }
  ): DraftData {
    const key = this.getKey(entryId);
    const existing = this.getDraft(entryId);
    const now = new Date().toISOString();

    const wordCount = data.content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;

    let versions: VersionSnapshot[] = existing?.versionHistory || [];

    // Add a snapshot checkpoint every ~3 minutes or if content meaningfully changed
    const lastVersion = versions[0];
    const shouldAddCheckpoint =
      !lastVersion ||
      Date.now() - new Date(lastVersion.timestamp).getTime() > 3 * 60 * 1000 ||
      Math.abs((lastVersion.content?.length || 0) - (data.content?.length || 0)) > 200;

    if (shouldAddCheckpoint && (data.title.trim() || data.content.trim())) {
      const snapshot: VersionSnapshot = {
        id: `v_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: now,
        title: data.title,
        content: data.content,
        mood: data.mood,
        tags: data.tags,
        wordCount,
      };
      // Keep up to 20 recent versions
      versions = [snapshot, ...versions.slice(0, 19)];
    }

    const draftData: DraftData = {
      id: entryId,
      title: data.title,
      content: data.content,
      mood: data.mood,
      tags: data.tags,
      lastSavedAt: now,
      versionHistory: versions,
    };

    try {
      localStorage.setItem(key, JSON.stringify(draftData));
    } catch (e) {
      console.warn('Draft storage warning (possibly storage full):', e);
    }

    return draftData;
  },

  /**
   * Retrieves saved draft
   */
  getDraft(entryId: string = 'new'): DraftData | null {
    try {
      const key = this.getKey(entryId);
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as DraftData;
    } catch (e) {
      return null;
    }
  },

  /**
   * Clears draft when successfully published or discarded
   */
  clearDraft(entryId: string = 'new') {
    try {
      localStorage.removeItem(this.getKey(entryId));
    } catch (e) {}
  },

  /**
   * Compares server version with local draft to detect crash or unsaved work
   */
  hasRecoverableDraft(entryId: string = 'new', serverTitle = '', serverContent = ''): boolean {
    const draft = this.getDraft(entryId);
    if (!draft) return false;
    
    // Check if draft has content
    const hasContent = (draft.title && draft.title.trim().length > 0) || (draft.content && draft.content.replace(/<[^>]*>/g, '').trim().length > 0);
    if (!hasContent) return false;

    // Check if it differs meaningfully from server content
    const serverNorm = serverContent.replace(/\s+/g, ' ').trim();
    const draftNorm = draft.content.replace(/\s+/g, ' ').trim();
    return serverNorm !== draftNorm || serverTitle.trim() !== draft.title.trim();
  },
};
