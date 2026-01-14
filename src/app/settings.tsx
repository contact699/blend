import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, Bell, Shield, HelpCircle, FileText, ChevronRight } from 'lucide-react-native';

export default function SettingsScreen() {
  const router = useRouter();

  const settingsItems = [
    { icon: Bell, label: 'Notifications', description: 'Manage your alerts' },
    { icon: Shield, label: 'Privacy', description: 'Control who sees your profile' },
    { icon: HelpCircle, label: 'Help & Support', description: 'Get help or report an issue' },
    { icon: FileText, label: 'Terms & Privacy Policy', description: 'Read our policies' },
  ];

  return (
    <View className="flex-1 bg-slate-900">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-slate-800">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center"
          >
            <ArrowLeft size={24} color="white" />
          </Pressable>
          <Text className="text-white text-xl font-bold ml-2">Settings</Text>
        </View>

        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingVertical: 20 }}
        >
          {settingsItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Animated.View
                key={item.label}
                entering={FadeInDown.delay(index * 50).springify()}
              >
                <Pressable className="bg-slate-800 rounded-xl p-4 mb-3 flex-row items-center active:bg-slate-700">
                  <View className="w-10 h-10 bg-slate-700 rounded-full items-center justify-center">
                    <Icon size={20} color="#9ca3af" />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-white font-medium">{item.label}</Text>
                    <Text className="text-gray-400 text-sm">{item.description}</Text>
                  </View>
                  <ChevronRight size={20} color="#6b7280" />
                </Pressable>
              </Animated.View>
            );
          })}

          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            className="mt-8 items-center"
          >
            <Text className="text-gray-500 text-sm">Kindred v1.0.0</Text>
            <Text className="text-gray-600 text-xs mt-1">
              Made with intentionality
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
