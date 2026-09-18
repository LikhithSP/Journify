# Database Design & Schema

Journify uses **PostgreSQL** managed through Supabase. Data isolation and authorization are guaranteed at the database engine level via Row Level Security (RLS).

---

## Entity Relationship Diagram (ERD)

```
       auth.users (Supabase Core)
           │
     ┌─────┴─────────────────────────┐
     │ 1:1                           │ 1:N
     ▼                               ▼
  profiles                     journal_entries
     │                               │
     │ 1:N                           │ 1:N
     ▼                               ▼
  folders                          media
     │ 1:N
     ▼
  tags
```

---

## Database Tables

### 1. `profiles`
Extends Supabase built-in `auth.users`.
- `id` (UUID, Primary Key, references `auth.users.id` ON DELETE CASCADE)
- `username` (TEXT, UNIQUE)
- `avatar_url` (TEXT)
- `bio` (TEXT)
- `created_at` (TIMESTAMPTZ, default `NOW()`)
- `updated_at` (TIMESTAMPTZ, default `NOW()`)
- `settings` (JSONB): Preferences including theme, language, and notification flags.

### 2. `journal_entries`
Stores individual user journal reflections.
- `id` (UUID, Primary Key, default `uuid_generate_v4()`)
- `user_id` (UUID, references `auth.users.id` ON DELETE CASCADE)
- `title` (TEXT, NOT NULL)
- `content` (TEXT, NOT NULL, HTML content from TipTap)
- `mood` (TEXT, CHECK IN `('joyful', 'peaceful', 'sad', 'angry', 'anxious')`)
- `tags` (TEXT[], default `'{}'`)
- `created_at` (TIMESTAMPTZ, default `NOW()`)
- `updated_at` (TIMESTAMPTZ, default `NOW()`)
- `is_favorite` (BOOLEAN, default `FALSE`)
- `is_private` (BOOLEAN, default `TRUE`)
- `images` (TEXT[], default `'{}'`)
- `folder_id` (UUID, references `folders.id` ON DELETE SET NULL)

### 3. `folders`
User-defined folders for organizing entries into work, personal, or travel themes.
- `id` (UUID, Primary Key, default `uuid_generate_v4()`)
- `user_id` (UUID, references `auth.users.id` ON DELETE CASCADE)
- `name` (TEXT, NOT NULL)
- `color` (TEXT)
- `created_at` (TIMESTAMPTZ, default `NOW()`)

### 4. `media`
Tracks attachments and uploads associated with journal entries.
- `id` (UUID, Primary Key, default `uuid_generate_v4()`)
- `entry_id` (UUID, references `journal_entries.id` ON DELETE CASCADE)
- `user_id` (UUID, references `auth.users.id` ON DELETE CASCADE)
- `storage_path` (TEXT, path within Supabase Storage bucket)
- `file_name` (TEXT)
- `file_type` (TEXT)
- `file_size` (INTEGER)
- `created_at` (TIMESTAMPTZ, default `NOW()`)

---

## Row Level Security (RLS) Policies

All tables have RLS strictly enabled. Users can only perform CRUD operations on records where `auth.uid() = user_id`:

```sql
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own journal entries"
ON journal_entries
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```
