# API & Data Contracts

Journify interacts with its backend through the **Supabase JavaScript Client SDK** using PostgREST endpoints and WebSocket channels.

---

## Authentication Endpoints

Handled by Supabase Auth with PKCE and JWT storage:

### 1. Sign In with Email & Password
- **SDK Method**: `supabase.auth.signInWithPassword({ email, password })`
- **Output**: Session object with user profile and access JWT token.

### 2. Sign Up
- **SDK Method**: `supabase.auth.signUp({ email, password, options: { data: { full_name } } })`
- **Behavior**: Creates auth row and triggers profile creation.

### 3. OAuth Authentication
- **SDK Method**: `supabase.auth.signInWithOAuth({ provider: 'google' | 'github' })`

### 4. Password Recovery
- **SDK Method**: `supabase.auth.resetPasswordForEmail(email, { redirectTo })`

---

## Journal Entries API

CRUD interactions implemented in `src/services/syncEngine.ts` and React views:

### 1. Pull All Entries
- **Query**:
  ```typescript
  supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  ```

### 2. Insert Entry
- **Payload**:
  ```typescript
  interface CreateEntryPayload {
    id: string; // UUID generated locally
    user_id: string;
    title: string;
    content: string;
    mood?: 'joyful' | 'peaceful' | 'sad' | 'angry' | 'anxious';
    tags?: string[];
    is_favorite?: boolean;
    is_private?: boolean;
    folder_id?: string | null;
    created_at?: string;
    updated_at: string;
  }
  ```

### 3. Update Entry
- **Query**:
  ```typescript
  supabase
    .from('journal_entries')
    .update({ title, content, mood, tags, updated_at })
    .eq('id', entryId);
  ```

### 4. Delete Entry
- **Query**:
  ```typescript
  supabase
    .from('journal_entries')
    .delete()
    .eq('id', entryId);
  ```

---

## Storage Buckets (Media & Attachments)

- **Bucket**: `journal-media`
- **Upload Path**: `{userId}/{entryId}/{timestamp}_{filename}`
- **Permissions**: Scoped strictly to authenticated user matching `{userId}` prefix.
