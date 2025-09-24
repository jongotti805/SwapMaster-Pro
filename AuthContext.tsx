import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, getCurrentUser, signIn as supabaseSignIn, signOut as supabaseSignOut } from '@/lib/supabase';

interface Profile {
  id: string;
  user_id: string;
  username?: string;
  display_name?: string;
  email?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  specialties?: string[];
  reputation?: number;
  level?: string;
  badges?: string[];
  is_verified?: boolean;
  is_online?: boolean;
  last_seen?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  setOnlineStatus: (isOnline: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Create guest account for immediate access
  async function createGuestAccount() {
    try {
      const guestEmail = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@swapmaster.local`;
      const guestPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      console.log('Creating guest account for immediate access...');
      
      const { data, error } = await supabase.auth.signUp({
        email: guestEmail,
        password: guestPassword,
        options: {
          data: {
            display_name: 'Guest User',
            is_guest: true
          }
        }
      });

      if (error) {
        console.error('Error creating guest account:', error);
        return;
      }

      if (data.user) {
        console.log('Guest account created successfully');
        localStorage.setItem('swapmaster_guest_created', 'true');
        localStorage.setItem('swapmaster_guest_email', guestEmail);
        localStorage.setItem('swapmaster_guest_password', guestPassword);
      }
    } catch (error) {
      console.error('Error creating guest account:', error);
    }
  }

  // Load user and profile on mount
  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      try {
        const currentUser = await getCurrentUser();
        
        // If no user exists, create a guest account automatically
        if (!currentUser) {
          // Check if we already created a guest account in this session
          const hasGuestAccount = localStorage.getItem('swapmaster_guest_created');
          
          if (!hasGuestAccount) {
            console.log('No user found, creating guest account for immediate access...');
            await createGuestAccount();
            return; // The auth state change will handle the rest
          }
        }
        
        setUser(currentUser);
        
        if (currentUser) {
          await loadUserProfile(currentUser.id);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        // If there's an error, still try to create a guest account
        const hasGuestAccount = localStorage.getItem('swapmaster_guest_created');
        if (!hasGuestAccount) {
          console.log('Error loading user, creating guest account as fallback...');
          await createGuestAccount();
        }
      } finally {
        setLoading(false);
      }
    }
    loadUser();

    // Set up auth listener - KEEP SIMPLE, avoid async operations
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, !!session?.user);
        setUser(session?.user || null);
        
        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Load user profile
  async function loadUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      if (data) {
        setProfile(data);
        // Update online status
        await setOnlineStatus(true);
      } else {
        // Create default profile if none exists
        const isGuest = user?.user_metadata?.is_guest === true;
        const defaultProfile = {
          user_id: userId,
          display_name: isGuest ? 'Guest User' : (user?.user_metadata?.full_name || user?.email?.split('@')[0]),
          email: user?.email,
          reputation: 0,
          level: 'Beginner',
          badges: [],
          specialties: [],
          is_verified: false,
          is_online: true
        };

        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert(defaultProfile)
          .select()
          .maybeSingle();

        if (!createError && newProfile) {
          setProfile(newProfile);
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  // Auth methods
  async function signIn(email: string, password: string) {
    const result = await supabaseSignIn(email, password);
    if (result.data.user) {
      await loadUserProfile(result.data.user.id);
    }
    return result;
  }

  async function signOut() {
    if (user) {
      await setOnlineStatus(false);
    }
    await supabaseSignOut();
    setProfile(null);
  }

  async function updateProfile(updates: Partial<Profile>) {
    if (!user) throw new Error('User not logged in');

    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }

    if (data) {
      setProfile(data);
    }
  }

  async function setOnlineStatus(isOnline: boolean) {
    if (!user) return;

    try {
      await supabase
        .from('user_online_status')
        .upsert({
          user_id: user.id,
          is_online: isOnline,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signIn,
      signOut,
      updateProfile,
      setOnlineStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
}