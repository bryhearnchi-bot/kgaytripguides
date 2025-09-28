import { useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useLocation } from 'wouter';

export interface Profile {
  id: string;
  email: string;
  name?: {
    first: string;
    last: string;
    middle?: string;
    suffix?: string;
    preferred?: string;
    full: string;
  };
  username?: string;
  avatarUrl?: string;
  role: string;
  bio?: string;
  website?: string;
  phoneNumber?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  socialLinks?: {
    website?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    facebook?: string;
    youtube?: string;
  };
  created_at: string;
  updated_at: string;
}

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();
  const initialLoadCompleteRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        // Set loading to false immediately after setting auth state
        initialLoadCompleteRef.current = true;
        setLoading(false);

        // Fetch profile asynchronously without blocking initial load
        if (session?.user) {
          fetchProfile(session.user.id).catch(error => {
            console.error('Failed to fetch profile during init:', error);
            // Profile fetch failure doesn't affect authentication state
          });
        }
      } catch (error) {
        // Log error without sensitive details
        console.error('Error initializing auth');
        if (mounted) {
          initialLoadCompleteRef.current = true;
          setLoading(false);
        }
      }
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      // Skip the initial session event to avoid race condition
      if (event === 'INITIAL_SESSION' && !initialLoadCompleteRef.current) {
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);

      // Set loading to false immediately after setting session/user
      // Profile fetching happens asynchronously and shouldn't block auth state
      if (initialLoadCompleteRef.current) {
        setLoading(false);
      }

      // Fetch profile asynchronously without blocking loading state
      if (session?.user) {
        fetchProfile(session.user.id).catch(error => {
          console.error('Failed to fetch profile in auth state change:', error);
          // Profile fetch failure doesn't affect authentication state
        });
      } else {
        setProfile(null);
      }

      // Handle post-login redirect
      if (event === 'SIGNED_IN') {
        const redirectTo = sessionStorage.getItem('redirectAfterLogin');
        if (redirectTo) {
          sessionStorage.removeItem('redirectAfterLogin');
          navigate(redirectTo);
        }
      }
    });

    initAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const fetchProfile = async (userId: string, forceRefresh = false) => {
    try {
      console.log('📡 Fetching profile for user:', userId, 'Force refresh:', forceRefresh);

      // Get the current session for authentication
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      // Use our API instead of Supabase direct to ensure consistency
      const response = await fetch('/api/admin/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${currentSession?.access_token}`,
          'Content-Type': 'application/json',
        },
        cache: forceRefresh ? 'no-store' : 'default'
      });

      if (!response.ok) {
        console.error('Error fetching profile from API:', response.status, response.statusText);
        setProfile(null);
        return;
      }

      const data = await response.json();


      // The API already returns properly formatted data, so we can use it directly
      if (data) {
        const mappedProfile = {
          id: data.id,
          email: data.email,
          name: data.name || {
            full: '',
            first: '',
            last: ''
          },
          username: data.username || '',
          avatarUrl: data.profile_image_url || data.avatarUrl || '',
          role: data.role || 'user',
          bio: data.bio || '',
          website: data.website || data.socialLinks?.website || '',
          phoneNumber: data.phoneNumber || '',
          location: data.location || undefined,
          socialLinks: data.socialLinks || undefined,
          created_at: data.createdAt,
          updated_at: data.updatedAt,
        };


        setProfile(mappedProfile);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      setProfile(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  };

  const signUp = async (email: string, password: string, name?: { first: string; last: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
      },
    });

    if (error) throw error;
    return data;
  };

  const signInWithProvider = async (provider: 'google' | 'facebook' | 'twitter') => {
    // Map 'twitter' to 'twitter' for X (Twitter) OAuth
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: provider === 'google' ? 'email profile' : undefined,
      },
    });

    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    try {
      // Clear profile immediately
      setProfile(null);
      setUser(null);
      setSession(null);

      // Clear all Supabase auth data from localStorage
      // This ensures the session is not restored on reload
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      const projectId = supabaseUrl.split('//')[1]?.split('.')[0] || '';
      if (projectId) {
        const storageKey = `sb-${projectId}-auth-token`;
        localStorage.removeItem(storageKey);
      }

      // Also clear any other potential Supabase storage keys
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });

      // Attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Logout error:', error);
      }

      // Navigate to home page without reload
      // The auth state change listener will handle the UI update
      navigate('/');
    } catch (error) {
      console.error('Sign out failed:', error);
      // Clear storage even on error
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });
      navigate('/');
    }
  };

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) throw error;
    return data;
  };

  const updatePassword = async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return data;
  };

  const isAdmin = () => {
    return profile?.role === 'admin';
  };

  const refreshProfile = async () => {
    if (user?.id) {
      console.log('🔄 Manually refreshing profile with force refresh...');
      console.log('👤 Current user ID:', user.id);
      // Clear profile first to force a fresh fetch
      setProfile(null);
      await fetchProfile(user.id, true);
      console.log('✅ Profile refresh completed');
    } else {
      console.log('❌ No user ID for profile refresh');
    }
  };

  return {
    user,
    profile,
    session,
    loading,
    isAuthenticated: !!session,
    isAdmin: isAdmin(),
    signIn,
    signUp,
    signInWithProvider,
    signOut,
    resetPassword,
    updatePassword,
    refreshProfile,
  };
}