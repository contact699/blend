import { useRouter } from 'expo-router';
import { Text, View, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Home } from 'lucide-react-native';

export default function NotFoundScreen() {
  const router = useRouter();

  const handleGoHome = () => {
    router.replace('/');
  };

  return (
    <View className="flex-1 bg-black">
      <LinearGradient
        colors={['#1a0a1a', '#0d0d0d', '#0a0a14']}
        style={{ flex: 1 }}
      >
        <SafeAreaView className="flex-1 items-center justify-center px-6">
          <View className="items-center">
            <View className="w-20 h-20 rounded-full bg-purple-500/20 items-center justify-center mb-6">
              <Home size={40} color="#c084fc" />
            </View>

            <Text className="text-2xl font-bold text-white mb-2">
              Page Not Found
            </Text>

            <Text className="text-zinc-400 text-center mb-8">
              The screen you're looking for doesn't exist.
            </Text>

            <Pressable onPress={handleGoHome}>
              <LinearGradient
                colors={['#9333ea', '#db2777']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 }}
              >
                <Text className="text-white font-semibold text-base">
                  Go to Home
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
