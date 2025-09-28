import React, { createContext, useContext } from 'react';
import { useSessionManager } from '@/hooks/useSessionManager';
import type { User, Session } from '@supabase/supabase-js';

// Define the shape of the context data
interface AuthContextType {
  user: User | null;
  session: Session | null;
  isSuperAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

// Create the context with a default undefined value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // We will modify useSessionManager to return isSuperAdmin
  const { user, session, loading, signOut, isSuperAdmin } = useSessionManager();

  const value = { user, session, loading, signOut, isSuperAdmin };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Create a custom hook for easy consumption of the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};