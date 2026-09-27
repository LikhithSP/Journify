# Changelog

All notable changes to the **Journify** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2026-09-18

### Added
- **Progressive Web App (PWA) Integration**: Full offline shell, Web App Manifest (`manifest.json`), adaptive app icons, and native install prompt (`PWAInstallPrompt.tsx`).
- **Web Push & Background Sync**: Service worker event handlers for `sync` (`sync-entries`) and `push` notifications.
- **Mobile-Responsive UI**: Bottom navigation bar with floating center write button, horizontal touch scrollbars for mood and tag filters, and safe area insets.
- **Voice Journaling**: Real-time continuous speech-to-text dictation with live transcripts and heuristic mood/title extraction.
- **Privacy Center (`/privacy`)**: Data export (JSON & Markdown), local offline cache purging, connected sessions inspection, and permanent account deletion.
- **Calendar & Timeline (`/calendar`)**: Month view grid (`M T W T F S S`) with mood pills, word counts, writing streaks, and date-based entry drilldown.
- **Performance Optimizations**: Route-level code splitting with `React.lazy`, infinite scroll pagination with `IntersectionObserver`, and blur-up lazy loading (`OptimizedImage.tsx`).

### Changed
- Decoupled layout navigation from static page imports to optimize bundle size and enable granular code splitting.
- Upgraded Service Worker cache strategy to Stale-While-Revalidate with navigation offline fallback.

---

## [1.1.0] - 2026-09-15

### Added
- **Notion-Style Block Editor**: TipTap v2 integration with headings, tables, task lists, code blocks, blockquotes, links, and slash commands (`/`).
- **Autosave & Draft System**: Debounced background persistence, crash recovery, and version history snapshots.
- **Offline-First Synchronization**: Client-side persistence using IndexedDB (`journify_offline_db`) with optimistic updates and LWW conflict resolution.
- **Multi-Vector Global Search**: `Cmd+K` command palette with search across titles, contents, tags, moods, and dates.
- **Habit & Reminder Notifications**: In-app toasts and browser notifications for daily reflections and streak milestones.

---

## [1.0.0] - 2025-05-20

### Added
- Initial release of Journify.
- Supabase user authentication with email/password and OAuth providers.
- Journal entry creation, editing, tagging, and mood selection.
- Dark and light theme support.
- Media upload and attachment support via Supabase Storage.
