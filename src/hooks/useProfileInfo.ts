import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useProfileInfo(userId?: string) {
  const [profile, setProfile] = useState<{ avatar_url?: string; name?: string } | null>(null);
  useEffect(() => {
    if (!userId) return;
    let ignore = false;
    supabase
      .from('profiles')
      .select('avatar_url, username')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (!ignore && data) {
          setProfile({
            avatar_url: data.avatar_url || '',
            name: data.username || '',
          });
        }
      });
    return () => {
      ignore = true;
    };
  }, [userId]);
  return profile;
}
