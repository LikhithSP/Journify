-- =========================================================
-- Journify SaaS Security Hardening Migration
-- Row Level Security (RLS) & Strict Ownership Enforcement
-- =========================================================

-- 1. Enable RLS on all existing and public schema tables
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.folders ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent conflicts or permissive leaks
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Users can view their own entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can insert their own entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can update their own entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can delete their own entries" ON public.journal_entries;

DROP POLICY IF EXISTS "Users can view their own media" ON public.media;
DROP POLICY IF EXISTS "Users can insert their own media" ON public.media;
DROP POLICY IF EXISTS "Users can update their own media" ON public.media;
DROP POLICY IF EXISTS "Users can delete their own media" ON public.media;

DROP POLICY IF EXISTS "Users can view their own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can insert their own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can update their own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can delete their own tags" ON public.tags;

DROP POLICY IF EXISTS "Users can view their own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can insert their own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can update their own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can delete their own folders" ON public.folders;

-- 3. Profiles Policies (Strict auth.uid() check)
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- 4. Journal Entries Policies
CREATE POLICY "Users can view their own entries"
  ON public.journal_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own entries"
  ON public.journal_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entries"
  ON public.journal_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entries"
  ON public.journal_entries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. Folders Policies
CREATE POLICY "Users can view their own folders"
  ON public.folders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own folders"
  ON public.folders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders"
  ON public.folders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders"
  ON public.folders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 6. Media Policies
CREATE POLICY "Users can view their own media"
  ON public.media FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own media"
  ON public.media FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media"
  ON public.media FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 7. Tags Policies
CREATE POLICY "Users can view their own tags"
  ON public.tags FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tags"
  ON public.tags FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags"
  ON public.tags FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
  ON public.tags FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 8. Storage bucket security (Avatars & Journal attachments)
-- Ensure buckets exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('journal-media', 'journal-media', false)
ON CONFLICT (id) DO NOTHING;

-- Storage object policies for 'avatars'
-- Path format: {user_id}/{filename}
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

-- Storage object policies for 'journal-media'
CREATE POLICY "Users can upload their own journal media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'journal-media' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view their own journal media"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'journal-media' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own journal media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'journal-media' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 9. Account Self-Deletion Function (Server-side wipe of user data)
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete from dependent tables
  DELETE FROM public.media WHERE user_id = current_user_id;
  DELETE FROM public.journal_entries WHERE user_id = current_user_id;
  DELETE FROM public.folders WHERE user_id = current_user_id;
  DELETE FROM public.tags WHERE user_id = current_user_id;
  DELETE FROM public.profiles WHERE id = current_user_id;

  -- Remove user from auth.users (requires security definer permissions)
  DELETE FROM auth.users WHERE id = current_user_id;
END;
$$;
