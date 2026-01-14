import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Mail, Lock, ArrowRight, Sparkles } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/cn';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthMode = 'signin' | 'signup';

export default function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingExistingSession, setCheckingExistingSession] = useState(true);
  const [showEmailConfirmModal, setShowEmailConfirmModal] = useState(false);

  // Check for existing session on mount - handle partial login states
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // User is logged in but ended up on auth screen
          // Check if they have a profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', session.user.id)
            .single();

          if (profile) {
            // Has profile, go to main app
            router.replace('/(tabs)');
          } else {
            // No profile, go to onboarding
            router.replace('/onboarding');
          }
          return;
        }
      } catch (e) {
        console.log('Session check error:', e);
      } finally {
        setCheckingExistingSession(false);
      }
    };

    checkExistingSession();
  }, [router]);

  const handleAuth = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          // Handle specific signup errors
          if (signUpError.message.includes('already registered') || signUpError.status === 422) {
            // Auto-switch to sign-in mode
            setMode('signin');
            setError('This email is already registered. Please sign in instead.');
            setLoading(false);
            return;
          }
          throw signUpError;
        }

        if (data.user) {
          // Create the user record in public.users table
          // This is CRITICAL for RLS - profiles need this to be visible
          const { error: userInsertError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email,
              is_active: true,
            });

          if (userInsertError) {
            console.log('User insert error:', userInsertError);
            // If user already exists (duplicate), that's ok - continue
            if (!userInsertError.message.includes('duplicate') && userInsertError.code !== '23505') {
              throw userInsertError;
            }
          }

          // Check if email confirmation is required
          if (data.session) {
            // Auto-confirmed, go to onboarding
            router.replace('/onboarding');
          } else {
            setShowEmailConfirmModal(true);
          }
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        // Check if user has a profile
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Ensure user exists in public.users table (for users created before this fix)
          const { error: userInsertError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              email: user.email,
              is_active: true,
            });

          // Ignore duplicate errors - user already exists
          if (userInsertError && !userInsertError.message.includes('duplicate')) {
            console.log('User insert on signin:', userInsertError);
          }

          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

          if (profile) {
            router.replace('/(tabs)');
          } else {
            router.replace('/onboarding');
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <LinearGradient
        colors={['#1a0a1a', '#0d0d0d', '#0a0a14']}
        style={{ flex: 1 }}
      >
        <SafeAreaView className="flex-1">
          {checkingExistingSession ? (
            <View className="flex-1 items-center justify-center">
              <View className="w-20 h-20 rounded-full items-center justify-center mb-4 overflow-hidden">
                <LinearGradient
                  colors={['#9333ea', '#db2777']}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Sparkles size={40} color="white" />
                </LinearGradient>
              </View>
              <Text className="text-gray-400">Checking session...</Text>
            </View>
          ) : (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
          >
            <View className="flex-1 px-6 justify-center">
              {/* Logo/Header */}
              <View className="items-center mb-10">
                <View className="w-20 h-20 rounded-full items-center justify-center mb-4 overflow-hidden">
                  <LinearGradient
                    colors={['#9333ea', '#db2777']}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Sparkles size={40} color="white" />
                  </LinearGradient>
                </View>
                <Text className="text-white text-3xl font-bold mb-2">Blend</Text>
                <Text className="text-gray-400 text-center">
                  {mode === 'signup'
                    ? 'Create your account to get started'
                    : 'Welcome back'}
                </Text>
              </View>

              {/* Form */}
              <View className="space-y-4">
                {/* Email Input */}
                <View className="bg-zinc-900/80 rounded-xl border border-zinc-800 flex-row items-center px-4">
                  <Mail size={20} color="#9ca3af" />
                  <TextInput
                    className="flex-1 py-4 px-3 text-white text-base"
                    placeholder="Email"
                    placeholderTextColor="#6b7280"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                  />
                </View>

                {/* Password Input */}
                <View className="bg-zinc-900/80 rounded-xl border border-zinc-800 flex-row items-center px-4 mt-3">
                  <Lock size={20} color="#9ca3af" />
                  <TextInput
                    className="flex-1 py-4 px-3 text-white text-base"
                    placeholder="Password"
                    placeholderTextColor="#6b7280"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>

                {/* Error Message */}
                {error && (
                  <View className="bg-red-500/10 rounded-xl p-3 border border-red-500/30 mt-3">
                    <Text className="text-red-400 text-center">{error}</Text>
                  </View>
                )}

                {/* Submit Button */}
                <Pressable
                  onPress={handleAuth}
                  disabled={loading}
                  className="mt-6 rounded-xl overflow-hidden"
                >
                  <LinearGradient
                    colors={loading ? ['#6b7280', '#6b7280'] : ['#9333ea', '#db2777']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ paddingVertical: 16 }}
                  >
                    <View className="flex-row items-center justify-center">
                      <Text className="text-white font-semibold text-lg mr-2">
                        {loading
                          ? 'Loading...'
                          : mode === 'signup'
                          ? 'Create Account'
                          : 'Sign In'}
                      </Text>
                      {!loading && <ArrowRight size={20} color="white" />}
                    </View>
                  </LinearGradient>
                </Pressable>

                {/* Toggle Mode */}
                <View className="flex-row justify-center mt-6">
                  <Text className="text-gray-400">
                    {mode === 'signup'
                      ? 'Already have an account? '
                      : "Don't have an account? "}
                  </Text>
                  <Pressable onPress={() => setMode(mode === 'signup' ? 'signin' : 'signup')}>
                    <Text className="text-purple-400 font-medium">
                      {mode === 'signup' ? 'Sign In' : 'Sign Up'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
          )}

          {/* Email Confirmation Modal */}
          <Modal
            transparent
            visible={showEmailConfirmModal}
            animationType="fade"
            onRequestClose={() => setShowEmailConfirmModal(false)}
          >
            <View className="flex-1 bg-black/70 items-center justify-center px-6">
              <View className="bg-zinc-900 rounded-2xl p-6 w-full max-w-sm border border-zinc-800">
                <View className="items-center mb-4">
                  <View className="w-16 h-16 rounded-full items-center justify-center mb-4 overflow-hidden">
                    <LinearGradient
                      colors={['#9333ea', '#db2777']}
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 32,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Mail size={32} color="white" />
                    </LinearGradient>
                  </View>
                  <Text className="text-white text-xl font-bold mb-2">Check your email</Text>
                  <Text className="text-gray-400 text-center">
                    We sent you a confirmation link. Please confirm your email to continue.
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowEmailConfirmModal(false)}
                  className="mt-4 rounded-xl overflow-hidden"
                >
                  <LinearGradient
                    colors={['#9333ea', '#db2777']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ paddingVertical: 14 }}
                  >
                    <Text className="text-white font-semibold text-center">OK</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
