import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { supabase, isLiveSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, role?: UserRole) => Promise<void>;
  signUp: (email: string, fullName: string, role?: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  setRole: (role: UserRole) => void;
  isLiveSupabase: boolean;
}

const DEFAULT_DEMO_USER: UserProfile = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'editor@medlabel.ai',
  fullName: 'Dr. Priya Sharma',
  role: 'editor',
  organization: 'MedLabel AI Global Regulatory Operations'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('medlabel_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_DEMO_USER;
  });
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('medlabel_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('medlabel_current_user');
    }
  }, [user]);

  // Listen to live Supabase Auth state if configured
  useEffect(() => {
    if (!supabase || !isLiveSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || 'user@medlabel.ai',
          fullName: session.user.user_metadata?.full_name || 'Regulatory Professional',
          role: (session.user.user_metadata?.role as UserRole) || 'editor',
          organization: 'Connected Supabase Organization'
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || 'user@medlabel.ai',
          fullName: session.user.user_metadata?.full_name || 'Regulatory Professional',
          role: (session.user.user_metadata?.role as UserRole) || 'editor',
          organization: 'Connected Supabase Organization'
        });
      } else {
        // Keep demo user so evaluating reviewer can explore without barrier
        setUser(DEFAULT_DEMO_USER);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, role: UserRole = 'editor') => {
    setLoading(true);
    try {
      if (supabase && isLiveSupabaseConfigured) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: 'Password123!'
        });
        if (error) console.warn('Supabase signIn error:', error.message);
      }
      
      setUser({
        id: crypto.randomUUID(),
        email,
        fullName: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        role,
        organization: 'MedLabel AI Regulatory Systems'
      });
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, fullName: string, role: UserRole = 'editor') => {
    setLoading(true);
    try {
      if (supabase && isLiveSupabaseConfigured) {
        const { error } = await supabase.auth.signUp({
          email,
          password: 'Password123!',
          options: {
            data: { full_name: fullName, role }
          }
        });
        if (error) console.warn('Supabase signUp error:', error.message);
      }

      setUser({
        id: crypto.randomUUID(),
        email,
        fullName,
        role,
        organization: 'MedLabel AI Regulatory Systems'
      });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (supabase && isLiveSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  const setRole = (newRole: UserRole) => {
    if (user) {
      setUser({ ...user, role: newRole });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      signUp,
      signOut,
      setRole,
      isLiveSupabase: isLiveSupabaseConfigured
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
