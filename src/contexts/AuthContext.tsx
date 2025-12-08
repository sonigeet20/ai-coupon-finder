import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = (user: User | null) => {
      if (!user) return false;
      // Check if user has admin role in app_metadata
      console.log('Checking admin status for user:', user.id);
      console.log('User app_metadata:', user.app_metadata);
      console.log('Admin role check:', user.app_metadata?.role);
      const isAdminUser = user.app_metadata?.role === 'admin';
      console.log('Is admin:', isAdminUser);
      return isAdminUser;
    };

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Session loaded:', session?.user?.email);
      setUser(session?.user ?? null);
      if (session?.user) {
        const admin = checkAdminStatus(session.user);
        setIsAdmin(admin);
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.email);
      setUser(session?.user ?? null);
      if (session?.user) {
        const admin = checkAdminStatus(session.user);
        setIsAdmin(admin);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
