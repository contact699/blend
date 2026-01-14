import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Users, Lock, MessageCircle, ShieldCheck, LogOut } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';

export default function OnboardingWelcome() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    try {
      // Clear all local storage
      await AsyncStorage.clear();
      // Sign out from Supabase
      await supabase.auth.signOut();
      // Clear cached queries
      queryClient.clear();
      // Navigate to auth
      router.replace('/auth');
    } catch (e) {
      console.log('Sign out error:', e);
      // Force navigate anyway
      router.replace('/auth');
    }
  };

  return (
    <View className="flex-1 bg-black">
      <LinearGradient
        colors={['#1a0a1a', '#0d0d0d', '#0a0a14']}
        style={{ flex: 1 }}
      >
        <SafeAreaView className="flex-1">
          {/* Header with Sign Out Button */}
          <View className="flex-row justify-end px-4 pt-2">
            <Pressable
              onPress={handleSignOut}
              className="flex-row items-center px-3 py-2 rounded-lg bg-zinc-800/80 active:bg-zinc-700"
            >
              <LogOut size={16} color="#9ca3af" />
              <Text className="text-gray-400 text-sm ml-2">Sign Out</Text>
            </Pressable>
          </View>

          <View className="flex-1 px-6 pt-8">
            {/* Logo/Branding */}
            <Animated.View
              entering={FadeInDown.delay(100).springify()}
              className="items-center mb-16"
            >
              <View className="w-24 h-24 bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-3xl items-center justify-center mb-5 border border-purple-500/20">
                <Users size={48} color="#c084fc" />
              </View>
              <Text className="text-4xl font-bold text-white tracking-tight">Blend</Text>
              <Text className="text-purple-300/80 text-base mt-2">For the ethically curious</Text>
            </Animated.View>

            {/* Features */}
            <Animated.View
              entering={FadeInDown.delay(300).springify()}
              className="mb-auto"
            >
              <FeatureItem
                icon={<Users size={22} color="#c084fc" />}
                title="Couples & singles welcome"
                description="Built for ENM, poly, swingers, and the ethically non-monogamous"
              />
              <FeatureItem
                icon={<Lock size={22} color="#c084fc" />}
                title="Privacy first"
                description="Screenshot protection and secure messaging by default"
              />
              <FeatureItem
                icon={<MessageCircle size={22} color="#c084fc" />}
                title="Intentional connections"
                description="Match by shared desires, not just appearances"
              />
              <FeatureItem
                icon={<ShieldCheck size={22} color="#c084fc" />}
                title="Consent-centered"
                description="Clear boundaries and communication from the start"
              />
            </Animated.View>

            {/* CTA */}
            <Animated.View
              entering={FadeInUp.delay(500).springify()}
              className="pb-8"
            >
              <Pressable
                onPress={() => router.push('/onboarding/intents')}
                className="py-4 rounded-2xl active:opacity-80 overflow-hidden"
              >
                <LinearGradient
                  colors={['#9333ea', '#db2777']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                    borderRadius: 16,
                  }}
                />
                <Text className="text-white text-center text-lg font-semibold">
                  Get Started
                </Text>
              </Pressable>
              <Text className="text-gray-500 text-center text-sm mt-4">
                18+ only. By continuing, you agree to our Terms & Privacy Policy
              </Text>
            </Animated.View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <View className="flex-row items-start mb-5">
      <View className="w-11 h-11 bg-purple-500/10 rounded-xl items-center justify-center border border-purple-500/20">
        {icon}
      </View>
      <View className="flex-1 ml-4">
        <Text className="text-white font-semibold text-base">{title}</Text>
        <Text className="text-gray-400 text-sm mt-0.5">{description}</Text>
      </View>
    </View>
  );
}
