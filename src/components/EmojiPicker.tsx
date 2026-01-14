import { View, Text, Pressable, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';
import { X } from 'lucide-react-native';

const EMOJI_CATEGORIES = [
  {
    name: 'Reactions',
    emojis: ['❤️', '😂', '😮', '😢', '😡', '👍', '👎', '🔥', '💯', '🎉', '💕', '😍'],
  },
  {
    name: 'Faces',
    emojis: ['😀', '😃', '😄', '😁', '😆', '🥹', '😅', '🤣', '🥲', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🫢', '🤫', '🤔'],
  },
  {
    name: 'Love',
    emojis: ['💋', '💌', '💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔', '🩷', '🧡', '💛', '💚', '💙', '🩵', '💜', '🖤', '🩶', '🤍', '🤎'],
  },
  {
    name: 'Gestures',
    emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '🫵', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '🫶', '👐', '🤲', '🤝', '🙏'],
  },
  {
    name: 'Fun',
    emojis: ['🎈', '🎉', '🎊', '🎁', '🎀', '🪅', '🪩', '🎯', '🎮', '🎲', '🧩', '🎭', '🎨', '🎤', '🎧', '🎵', '🎶', '🎸', '🎹', '🎺', '🎻', '🥁'],
  },
  {
    name: 'Food & Drink',
    emojis: ['🍕', '🍔', '🍟', '🌭', '🍿', '🧁', '🍰', '🎂', '🍩', '🍪', '🍫', '🍬', '🍭', '🍮', '🍯', '🍺', '🍻', '🥂', '🍷', '🍸', '🍹', '🍾', '☕', '🧋'],
  },
];

interface EmojiPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
}

export default function EmojiPicker({ visible, onClose, onSelect }: EmojiPickerProps) {
  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        entering={FadeIn.duration(150)}
        exiting={FadeOut.duration(150)}
        className="flex-1 bg-black/60"
      >
        <Pressable className="flex-1" onPress={onClose} />
        <Animated.View
          entering={SlideInDown.duration(250).springify()}
          className="bg-zinc-900 rounded-t-3xl max-h-[60%]"
        >
          <SafeAreaView edges={['bottom']}>
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-800">
              <Text className="text-white font-semibold text-lg">Emoji</Text>
              <Pressable
                onPress={onClose}
                className="w-8 h-8 items-center justify-center rounded-full bg-zinc-800"
              >
                <X size={18} color="#9ca3af" />
              </Pressable>
            </View>

            {/* Quick reactions */}
            <View className="px-4 py-3 border-b border-zinc-800">
              <View className="flex-row justify-between">
                {EMOJI_CATEGORIES[0].emojis.slice(0, 8).map((emoji) => (
                  <Pressable
                    key={emoji}
                    onPress={() => handleSelect(emoji)}
                    className="w-10 h-10 items-center justify-center rounded-full active:bg-zinc-700"
                  >
                    <Text className="text-2xl">{emoji}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* All emojis */}
            <ScrollView
              className="px-4"
              showsVerticalScrollIndicator={false}
            >
              {EMOJI_CATEGORIES.map((category) => (
                <View key={category.name} className="mb-4">
                  <Text className="text-gray-400 text-sm font-medium mb-2 mt-3">
                    {category.name}
                  </Text>
                  <View className="flex-row flex-wrap">
                    {category.emojis.map((emoji) => (
                      <Pressable
                        key={emoji}
                        onPress={() => handleSelect(emoji)}
                        className="w-11 h-11 items-center justify-center rounded-lg active:bg-zinc-700"
                      >
                        <Text className="text-2xl">{emoji}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}
              <View className="h-4" />
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
