'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useSupabase } from './SupabaseContext';
import { User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  role: 'normal_user' | 'dealer' | 'admin';
  full_name?: string | null;
  name?: string | null;
  phone_number?: string | null;
  phone?: string | null;
  email: string | null;
  country_id?: number | null;
}

interface DealershipProfile {
  id: number;
  business_name: string;
  business_name_ar: string;
  description: string | null;
  description_ar: string | null;
  logo_url: string | null;
  location: string | null;
  dealership_type: 'Official' | 'Private';
  business_type: 'Dealership' | 'Service Center' | 'Both';
  brands: string[];
  is_verified: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  dealershipProfile: DealershipProfile | null;
  isDealer: boolean;
  isLoading: boolean;
  signOutMessage: string | null;
  setSignOutMessage: (message: string | null) => void;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  dealershipProfile: null,
  isDealer: false,
  isLoading: true,
  signOutMessage: null,
  setSignOutMessage: () => {},
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { supabase } = useSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dealershipProfile, setDealershipProfile] = useState<DealershipProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [signOutMessage, setSignOutMessage] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setProfile(null);
        setDealershipProfile(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const fetchUserData = async (userId: string) => {
    try {
      // Try to fetch the profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // If no profile found or error, create one using our RPC function
      if (profileError || !profileData) {
        console.log('Profile not found, creating one...');
        
        // Get user details from auth
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        
        if (user) {
          // Create profile using RPC
          const { data: rpcResult, error: rpcError } = await supabase.rpc('update_user_profile', {
            user_id: userId,
            user_email: user.email || '',
            user_full_name: user.user_metadata?.full_name || '',
            user_phone: user.user_metadata?.phone_number || '',
            user_password: null
          });
          
          if (rpcError) {
            console.error('Error creating profile via RPC:', rpcError);
          } else {
            console.log('Profile created successfully:', rpcResult);
            
            // Try fetching the profile again
            const { data: newProfileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .single();
              
            if (newProfileData) {
              setProfile(newProfileData);
            }
          }
        }
      } else {
        setProfile(profileData);
      }

      // If user is a dealer, fetch dealership profile
      if (profileData?.role === 'dealer') {
        const { data: dealershipData, error: dealershipError } = await supabase
          .from('dealerships')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'approved')
          .single();

        if (dealershipError && dealershipError.code !== 'PGRST116') {
          console.error('Error fetching dealership:', dealershipError);
        }
        setDealershipProfile(dealershipData || null);
      } else {
        setDealershipProfile(null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        dealershipProfile,
        isDealer: !!profile?.role && profile.role === 'dealer',
        isLoading,
        signOutMessage,
        setSignOutMessage,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
