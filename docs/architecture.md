# System Architecture

## 1. High-Level Architecture

Journify is designed as an **offline-first, client-driven Progressive Web Application (PWA)** backed by Supabase (PostgreSQL with Row Level Security).

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Journify Client (PWA)                         │
│                                                                        │
│   ┌────────────────┐   ┌───────────────────┐   ┌───────────────────┐   │
│   │ React 19 / UI  │◄──┤  Reactive State   │◄──┤   TipTap Editor   │   │
│   └───────┬────────┘   └─────────▲─────────┘   └───────────────────┘   │
│           │                      │                                     │
│           ▼                      │                                     │
│   ┌────────────────────────────────────────┐                           │
│   │              Sync Engine               │                           │
│   │       (Optimistic LWW Resolution)      │                           │
│   └───────┬────────────────────────┬───────┘                           │
│           │                        │                                   │
│           ▼                        ▼                                   │
│   ┌────────────────┐      ┌────────────────┐                           │
│   │   IndexedDB    │      │ Service Worker │                           │
│   │ (Local Store & │      │ (Shell Cache & │                           │
│   │  Sync Queue)   │      │ Background     │                           │
│   │                │      │ Sync)          │                           │
│   └────────────────┘      └────────────────┘                           │
└───────────┬────────────────────────────────────────────────────────────┘
            │ HTTPS (TLS 1.3 / JWT)
            ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          Supabase Cloud Backend                        │
│                                                                        │
│   ┌────────────────┐      ┌────────────────┐    ┌──────────────────┐   │
│   │ Supabase Auth  │      │ PostgreSQL DB  │    │  Storage Bucket  │   │
│   │ (PKCE Flow)    │      │ (RLS Protected)│    │  (AES-256 Media) │   │
│   └────────────────┘      └────────────────┘    └──────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Subsystems

### A. Offline-First Sync Subsystem
- **Primary Data Store**: Browser-native IndexedDB (`OfflineDB`) stores `journal_entries`, `folders`, `tags`, and the pending `sync_queue`.
- **Sync Engine**:
  - Handles optimistic writes: updates UI immediately and registers operations into a FIFO queue.
  - Automatically listens for `online` network state transitions and Service Worker `sync` triggers.
  - Resolves conflicts using Last-Write-Wins (LWW) timestamp comparison between local drafts and server updates.

### B. Rich Text Editing Engine
- Powered by **TipTap v2** (built on ProseMirror).
- Decoupled toolbar and slash command menu (`/`) for adding block elements (tables, checklists, code blocks, callouts, blockquotes).
- **Auto-save & Checkpoints**: Debounces content modifications (500–1000ms), writes to IndexedDB draft storage, and creates version history snapshots.

### C. Progressive Web App (PWA) Layer
- **Service Worker (`public/sw.js`)**: Implements Stale-While-Revalidate caching for HTML, CSS, icons, and JavaScript chunks.
- **Background Sync**: Dispatches sync tasks if an entry was edited or saved while disconnected.
- **Push Notification Listener**: Receives habit reminder payloads and manages interaction workflows.

### D. Multi-Vector Search Subsystem
- Client-side search engine providing sub-millisecond query evaluation across titles, HTML body content, mood classification, date intervals, and workspace tags.

---

## 3. Data Flow

1. **User Action**: The user edits a journal entry in the editor.
2. **Local Commit**: State updates immediately in React memory and commits to IndexedDB.
3. **Queue Enqueue**: An operation record `{ id, entity, action: 'UPDATE', payload, timestamp }` is pushed to the sync queue.
4. **Network Dispatch**:
   - If connected, `SyncEngine` immediately posts the change to Supabase.
   - If offline, the item waits in the queue until the network reconnects or a background sync event fires.
5. **Server Confirmation**: Upon a 200/201 response from Supabase, the item is removed from the local sync queue.
