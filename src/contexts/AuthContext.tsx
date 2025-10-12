import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signInWithUsername: (username: string, password: string) => Promise<{ error?: any }>;
  signUp: (email: string, username: string, password: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
  verifyAdminPassword: (password: string) => Promise<boolean>;
  loading: boolean;
  isApproved: boolean;
  isAdmin: boolean;
  isAdminCheckComplete: boolean;
  isSubscriptionExpired: boolean;
  subscriptionExpiredAt: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminCheckComplete, setIsAdminCheckComplete] = useState(false);
  const [isSubscriptionExpired, setIsSubscriptionExpired] = useState(false);
  const [subscriptionExpiredAt, setSubscriptionExpiredAt] = useState<string | null>(null);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check approval status and role
        if (session?.user) {
          setIsAdminCheckComplete(false);
          setTimeout(() => {
            checkUserApprovalAndRole(session.user.id);
          }, 0);
        } else {
          setIsApproved(false);
          setIsAdmin(false);
          setIsAdminCheckComplete(true);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setIsAdminCheckComplete(false);
        checkUserApprovalAndRole(session.user.id);
      } else {
        setIsAdminCheckComplete(true);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserApprovalAndRole = async (userId: string) => {
    try {
      // Check profile approval status and subscription
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_approved, subscription_expired_at')
        .eq('user_id', userId)
        .single();
      
      setIsApproved(profile?.is_approved ?? false);
      
      // Check subscription status
      const expiredAt = profile?.subscription_expired_at;
      setSubscriptionExpiredAt(expiredAt || null);
      
      if (expiredAt) {
        const now = new Date();
        const expired = new Date(expiredAt);
        setIsSubscriptionExpired(expired < now);
      } else {
        setIsSubscriptionExpired(false);
      }

      // Check if user is admin
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      
      setIsAdmin(!!roles);
    } catch (error) {
      console.error('Error checking user status:', error);
      setIsApproved(false);
      setIsAdmin(false);
      setIsSubscriptionExpired(false);
      setSubscriptionExpiredAt(null);
    } finally {
      // Mark admin check as complete
      setIsAdminCheckComplete(true);
    }
  };

  const signUp = async (email: string, username: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username
        },
        emailRedirectTo: `${window.location.origin}/waiting-approval`
      }
    });
    
    if (error) return { error };
    
    // Notify admin about new registration
    if (data.user) {
      try {
        await supabase.functions.invoke('notify-admin-new-user', {
          body: {
            userEmail: email,
            username: username,
          },
        });
      } catch (notifyError) {
        console.error('Failed to notify admin:', notifyError);
        // Don't block signup if notification fails
      }
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) return { error };
    
    // User approval will be checked by ProtectedRoute
    // So we don't block login here, just let them in
    
    return { error };
  };

  const signInWithUsername = async (username: string, password: string) => {
    // Use RPC with SECURITY DEFINER to bypass RLS when not authenticated
    const { data, error } = await supabase.rpc('get_user_by_username_or_email', {
      identifier: username,
    });

    if (error || !data || (Array.isArray(data) && data.length === 0)) {
      return { error: { message: 'Username tidak ditemukan' } };
    }

    const record = Array.isArray(data) ? data[0] : data;
    if (!record || !record.email) {
      return { error: { message: 'Username tidak ditemukan' } };
    }

    return signIn(record.email as string, password);
  };

  const signOut = async () => {
    try {
      // Clear all local state first
      setUser(null);
      setSession(null);
      
      // Clear any local storage/session storage data
      localStorage.clear();
      sessionStorage.clear();
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        throw error;
      }
      
      // Force page reload to ensure clean state
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if there's an error, try to clear local state
      setUser(null);
      setSession(null);
      window.location.href = '/';
    }
  };

  const verifyAdminPassword = async (password: string): Promise<boolean> => {
    // Simplified to use the same constant as AdminProtection to avoid DB dependency
    return password === '122344566';
  };

  const value = {
    user,
    session,
    signIn,
    signInWithUsername,
    signUp,
    signOut,
    verifyAdminPassword,
    loading,
    isApproved,
    isAdmin,
    isAdminCheckComplete,
    isSubscriptionExpired,
    subscriptionExpiredAt,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};