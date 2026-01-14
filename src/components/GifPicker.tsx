import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, TextInput, FlatList, Image, Modal, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';
import { X, Search } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GIF_SIZE = (SCREEN_WIDTH - 48) / 2;

// Using Giphy's public beta key for demo purposes
// In production, you'd want to use your own API key via the ENV tab
const GIPHY_API_KEY = 'dc6zaTOxFJmzC';

interface GifData {
  id: string;
  title: string;
  images: {
    fixed_width: {
      url: string;
      width: string;
      height: string;
    };
    original: {
      url: string;
    };
  };
}

interface GifPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (gifUrl: string) => void;
}

export default function GifPicker({ visible, onClose, onSelect }: GifPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [gifs, setGifs] = useState<GifData[]>([]);
  const [loading, setLoading] = useState(false);
  const [trendingLoaded, setTrendingLoaded] = useState(false);

  const fetchTrending = useCallback(async () => {
    if (trendingLoaded) return;
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=30&rating=pg-13`
      );
      const data = await response.json();
      setGifs(data.data || []);
      setTrendingLoaded(true);
    } catch (error) {
      console.log('Error fetching trending GIFs:', error);
    } finally {
      setLoading(false);
    }
  }, [trendingLoaded]);

  const searchGifs = useCallback(async (query: string) => {
    if (!query.trim()) {
      fetchTrending();
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=30&rating=pg-13`
      );
      const data = await response.json();
      setGifs(data.data || []);
    } catch (error) {
      console.log('Error searching GIFs:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchTrending]);

  useEffect(() => {
    if (visible) {
      fetchTrending();
    }
  }, [visible, fetchTrending]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery) {
        searchGifs(searchQuery);
      } else if (visible) {
        fetchTrending();
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery, visible, searchGifs, fetchTrending]);

  const handleSelect = (gif: GifData) => {
    onSelect(gif.images.fixed_width.url);
    onClose();
  };

  const renderGif = ({ item }: { item: GifData }) => (
    <Pressable
      onPress={() => handleSelect(item)}
      className="m-1 rounded-xl overflow-hidden bg-zinc-800"
      style={{ width: GIF_SIZE, height: GIF_SIZE }}
    >
      <Image
        source={{ uri: item.images.fixed_width.url }}
        style={{ width: GIF_SIZE, height: GIF_SIZE }}
        resizeMode="cover"
      />
    </Pressable>
  );

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
          className="bg-zinc-900 rounded-t-3xl h-[70%]"
        >
          <SafeAreaView edges={['bottom']} className="flex-1">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-800">
              <Text className="text-white font-semibold text-lg">GIFs</Text>
              <Pressable
                onPress={onClose}
                className="w-8 h-8 items-center justify-center rounded-full bg-zinc-800"
              >
                <X size={18} color="#9ca3af" />
              </Pressable>
            </View>

            {/* Search */}
            <View className="px-4 py-3">
              <View className="flex-row items-center bg-zinc-800 rounded-xl px-4 py-2.5">
                <Search size={20} color="#9ca3af" />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search GIFs..."
                  placeholderTextColor="#6b7280"
                  className="flex-1 text-white text-base ml-3"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')}>
                    <X size={18} color="#9ca3af" />
                  </Pressable>
                )}
              </View>
            </View>

            {/* GIF Grid */}
            {loading && gifs.length === 0 ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#a855f7" />
                <Text className="text-gray-400 mt-3">Loading GIFs...</Text>
              </View>
            ) : (
              <FlatList
                data={gifs}
                renderItem={renderGif}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View className="flex-1 items-center justify-center py-12">
                    <Text className="text-gray-400">No GIFs found</Text>
                  </View>
                }
              />
            )}

            {/* Giphy Attribution */}
            <View className="items-center pb-2">
              <Text className="text-gray-500 text-xs">Powered by GIPHY</Text>
            </View>
          </SafeAreaView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
