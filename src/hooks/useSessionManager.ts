import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export const useSessionManager = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsSuperAdmin(false);
  }, []);

  const checkUserStatus = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setIsSuperAdmin(false);
      return;
    }
    
    try {
      const { data, error } = await supabase.rpc('is_super_admin', { user_id: currentUser.id });
      if (error) throw error;
      setIsSuperAdmin(data);
    } catch (error) {
      console.error("Error checking super admin status:", error);
      setIsSuperAdmin(false);
    }
  }, []);


  useEffect(() => {
    setLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        await checkUserStatus(currentUser);
        setLoading(false);
      }
    );

    // Initial check
    const initializeSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        await checkUserStatus(currentUser);
        setLoading(false);
    };
    initializeSession();

    return () => {
      subscription?.unsubscribe();
    };
  }, [checkUserStatus]);

  return {
    user,
    session,
    isSuperAdmin,
    loading,
    signOut,
  };
};