import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Check, ChevronRight } from 'lucide-react-native';
import { INTENTS } from '@/lib/static-data';
import useDatingStore from '@/lib/state/dating-store';
import { cn } from '@/lib/cn';

export default function IntentSelection() {
  const router = useRouter();
  const updateProfile = useDatingStore((s) => s.updateProfile);
  const [selectedIntents, setSelectedIntents] = useState<string[]>([]);

  const toggleIntent = (intentId: string) => {
    setSelectedIntents((prev) =>
      prev.includes(intentId)
        ? prev.filter((id) => id !== intentId)
        : [...prev, intentId]
    );
  };

  const handleContinue = () => {
    updateProfile({ intent_ids: selectedIntents });
    router.push('/onboarding/profile');
  };

  const canContinue = selectedIntents.length >= 1;

  return (
    <View className="flex-1 bg-black">
      <LinearGradient
        colors={['#1a0a1a', '#0d0d0d', '#0a0a14']}
        style={{ flex: 1 }}
      >
        <SafeAreaView className="flex-1">
          <View className="flex-1 px-6 pt-8">
            {/* Header */}
            <Animated.View
              entering={FadeInDown.delay(100).springify()}
              className="mb-6"
            >
              <Text className="text-2xl font-bold text-white mb-2">
                What are you exploring?
              </Text>
              <Text className="text-gray-400 text-base">
                Select all that apply. Match with others who share your interests.
              </Text>
            </Animated.View>

            {/* Intent Grid */}
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {INTENTS.map((intent, index) => {
                const isSelected = selectedIntents.includes(intent.id);
                return (
                  <Animated.View
                    key={intent.id}
                    entering={FadeInDown.delay(150 + index * 40).springify()}
                  >
                    <Pressable
                      onPress={() => toggleIntent(intent.id)}
                      className={cn(
                        'mb-3 p-4 rounded-2xl border flex-row items-center',
                        isSelected
                          ? 'bg-purple-500/15 border-purple-500/50'
                          : 'bg-white/5 border-white/10'
                      )}
                    >
                      <Text className="text-2xl mr-3">{intent.emoji}</Text>
                      <View className="flex-1">
                        <Text className="text-white font-semibold text-base">
                          {intent.label}
                        </Text>
                        <Text className="text-gray-400 text-sm">
                          {intent.description}
                        </Text>
                      </View>
                      <View
                        className={cn(
                          'w-6 h-6 rounded-full items-center justify-center',
                          isSelected ? 'bg-purple-500' : 'bg-white/10'
                        )}
                      >
                        {isSelected && <Check size={16} color="white" />}
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </ScrollView>

            {/* CTA */}
            <Animated.View
              entering={FadeInUp.delay(500).springify()}
              className="pb-8 pt-4"
            >
              <Pressable
                onPress={handleContinue}
                disabled={!canContinue}
                className="py-4 rounded-2xl flex-row items-center justify-center overflow-hidden"
              >
                <LinearGradient
                  colors={canContinue ? ['#9333ea', '#db2777'] : ['#374151', '#374151']}
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
                <Text
                  className={cn(
                    'text-center text-lg font-semibold mr-2',
                    canContinue ? 'text-white' : 'text-gray-400'
                  )}
                >
                  Continue
                </Text>
                <ChevronRight size={20} color={canContinue ? 'white' : '#9ca3af'} />
              </Pressable>
              <Text className="text-gray-500 text-center text-sm mt-3">
                {selectedIntents.length} selected
              </Text>
            </Animated.View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
