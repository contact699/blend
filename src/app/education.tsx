import React from 'react';
import { View, Text, SafeAreaView, ScrollView, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  BookOpen,
  Heart,
  MessageCircle,
  Shield,
  Users,
  AlertCircle,
  ExternalLink,
  Clock,
  Bookmark,
} from 'lucide-react-native';
import { EDUCATION_ARTICLES } from '@/lib/mock-data';
import { EducationArticle } from '@/lib/types';

const CATEGORY_CONFIG: {
  [key: string]: { icon: typeof BookOpen; color: string; label: string };
} = {
  basics: { icon: BookOpen, color: '#c084fc', label: 'ENM Basics' },
  communication: { icon: MessageCircle, color: '#4ECDC4', label: 'Communication' },
  jealousy: { icon: Heart, color: '#FF6B6B', label: 'Jealousy' },
  boundaries: { icon: Shield, color: '#FFE66D', label: 'Boundaries' },
  structures: { icon: Users, color: '#96CEB4', label: 'Structures' },
  safety: { icon: AlertCircle, color: '#45B7D1', label: 'Safety' },
  coming_out: { icon: ExternalLink, color: '#DDA0DD', label: 'Coming Out' },
  resources: { icon: Bookmark, color: '#F7DC6F', label: 'Resources' },
};

function ArticleCard({
  article,
  index,
  onPress,
}: {
  article: EducationArticle;
  index: number;
  onPress: () => void;
}) {
  const config = CATEGORY_CONFIG[article.category] || CATEGORY_CONFIG.basics;
  const Icon = config.icon;

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
      <Pressable
        onPress={onPress}
        className="bg-zinc-900/80 rounded-2xl overflow-hidden mb-4 border border-zinc-800 active:opacity-80"
      >
        {article.image_url && (
          <Image
            source={{ uri: article.image_url }}
            className="w-full h-32"
            resizeMode="cover"
          />
        )}
        <View className="p-4">
          <View className="flex-row items-center mb-2">
            <View
              className="px-2 py-1 rounded-full flex-row items-center"
              style={{ backgroundColor: config.color + '20' }}
            >
              <Icon size={12} color={config.color} />
              <Text className="text-xs ml-1" style={{ color: config.color }}>
                {config.label}
              </Text>
            </View>
            <View className="flex-row items-center ml-auto">
              <Clock size={12} color="#6b7280" />
              <Text className="text-zinc-500 text-xs ml-1">{article.read_time} min</Text>
            </View>
          </View>
          <Text className="text-white font-semibold text-lg mb-1">{article.title}</Text>
          <Text className="text-zinc-400 text-sm leading-relaxed" numberOfLines={2}>
            {article.summary}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function CategoryChip({
  category,
  isSelected,
  onPress,
}: {
  category: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  const config = CATEGORY_CONFIG[category];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <Pressable
      onPress={onPress}
      className={`px-4 py-2 rounded-full flex-row items-center mr-2 ${
        isSelected ? '' : 'border border-zinc-700'
      }`}
      style={{
        backgroundColor: isSelected ? config.color + '30' : 'transparent',
        borderColor: isSelected ? config.color : undefined,
      }}
    >
      <Icon size={14} color={isSelected ? config.color : '#9ca3af'} />
      <Text
        className="text-sm ml-1.5 font-medium"
        style={{ color: isSelected ? config.color : '#9ca3af' }}
      >
        {config.label}
      </Text>
    </Pressable>
  );
}

export default function EducationHub() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = React.useState<EducationArticle | null>(null);

  const categories = Object.keys(CATEGORY_CONFIG);

  const filteredArticles = selectedCategory
    ? EDUCATION_ARTICLES.filter((a) => a.category === selectedCategory)
    : EDUCATION_ARTICLES;

  if (selectedArticle) {
    return (
      <View className="flex-1 bg-black">
        <SafeAreaView className="flex-1">
          {/* Article Header */}
          <View className="flex-row items-center px-4 py-2">
            <Pressable
              onPress={() => setSelectedArticle(null)}
              className="w-10 h-10 rounded-full bg-zinc-800/80 items-center justify-center"
            >
              <ChevronLeft size={24} color="white" />
            </Pressable>
          </View>

          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {selectedArticle.image_url && (
              <Image
                source={{ uri: selectedArticle.image_url }}
                className="w-full h-48"
                resizeMode="cover"
              />
            )}

            <View className="p-6">
              <Animated.View entering={FadeIn}>
                <View className="flex-row items-center mb-4">
                  <View
                    className="px-3 py-1.5 rounded-full flex-row items-center"
                    style={{
                      backgroundColor:
                        CATEGORY_CONFIG[selectedArticle.category]?.color + '20' || '#c084fc20',
                    }}
                  >
                    <Text
                      className="text-sm font-medium"
                      style={{
                        color: CATEGORY_CONFIG[selectedArticle.category]?.color || '#c084fc',
                      }}
                    >
                      {CATEGORY_CONFIG[selectedArticle.category]?.label || 'Article'}
                    </Text>
                  </View>
                  <View className="flex-row items-center ml-3">
                    <Clock size={14} color="#6b7280" />
                    <Text className="text-zinc-500 text-sm ml-1">
                      {selectedArticle.read_time} min read
                    </Text>
                  </View>
                </View>

                <Text className="text-white font-bold text-2xl mb-4">
                  {selectedArticle.title}
                </Text>

                <Text className="text-zinc-300 text-base leading-7 whitespace-pre-line">
                  {selectedArticle.content}
                </Text>
              </Animated.View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-4 py-2">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-zinc-800/80 items-center justify-center"
          >
            <ChevronLeft size={24} color="white" />
          </Pressable>
          <Text className="text-white font-bold text-xl ml-4">Learn</Text>
        </View>

        {/* Hero Section */}
        <Animated.View entering={FadeInDown.delay(100)} className="px-4 py-4">
          <LinearGradient
            colors={['#7c3aed', '#db2777']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 20, padding: 20 }}
          >
            <View className="flex-row items-center mb-2">
              <BookOpen size={24} color="white" />
              <Text className="text-white font-bold text-lg ml-2">ENM Education Hub</Text>
            </View>
            <Text className="text-white/80 text-sm leading-relaxed">
              Articles, guides, and resources to help you navigate ethical non-monogamy with
              confidence.
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Category filters */}
        <View className="py-2">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            style={{ flexGrow: 0 }}
          >
            <Pressable
              onPress={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full mr-2 ${
                !selectedCategory ? 'bg-purple-500/30' : 'border border-zinc-700'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  !selectedCategory ? 'text-purple-400' : 'text-zinc-400'
                }`}
              >
                All
              </Text>
            </Pressable>
            {categories.map((cat) => (
              <CategoryChip
                key={cat}
                category={cat}
                isSelected={selectedCategory === cat}
                onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Articles list */}
        <ScrollView
          className="flex-1 px-4 pt-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {filteredArticles.map((article, index) => (
            <ArticleCard
              key={article.id}
              article={article}
              index={index}
              onPress={() => setSelectedArticle(article)}
            />
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
