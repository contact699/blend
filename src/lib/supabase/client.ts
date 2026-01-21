// Supabase Client Configuration
// IMPORTANT: Environment variables must be set in your .env file
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not found. Please add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file.'
  );
}

// CRITICAL: Disable AsyncStorage to prevent module-level native access crash
// AsyncStorage cannot be accessed before React Native bridge is ready
// Using memory-only storage temporarily until app initializes properly
const memoryStorage = {
  getItem: async (_key: string) => null,
  setItem: async (_key: string, _value: string) => {},
  removeItem: async (_key: string) => {},
};

// Using generic client type since database schema is defined at runtime
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: SupabaseClient<any, 'public', any> = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      storage: memoryStorage as any, // Use memory storage to prevent crash
      autoRefreshToken: true,
      persistSession: false, // DISABLED: Prevent AsyncStorage access
      detectSessionInUrl: false,
    },
  }
);

// Helper to get the current authenticated user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    // "Auth session missing" is expected when logged out - don't log as error
    if (!error.message?.includes('session missing')) {
      console.error('Error getting current user:', error.message);
    }
    return null;
  }
  return user;
};

// Helper to get the current session
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error.message);
    return null;
  }
  return session;
};

// Auth state change listener
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};
