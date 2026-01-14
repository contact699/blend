import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import {
  ChevronLeft,
  Heart,
  Mail,
  Check,
  Clock,
  Trash2,
  Link,
  UserPlus,
  X,
  Sparkles,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import {
  usePartnerLinks,
  useAddPartnerLink,
  useRemovePartnerLink,
} from '@/lib/supabase';
import { cn } from '@/lib/cn';

// Relationship type labels for partners
const RELATIONSHIP_LABELS = [
  { id: 'anchor', label: 'Anchor Partner', emoji: '⚓' },
  { id: 'nesting_partner', label: 'Nesting Partner', emoji: '🏠' },
  { id: 'partner', label: 'Partner', emoji: '💕' },
  { id: 'dating', label: 'Dating', emoji: '💫' },
  { id: 'comet', label: 'Comet', emoji: '☄️' },
  { id: 'meta', label: 'Metamour', emoji: '🔗' },
  { id: 'fwb', label: 'FWB', emoji: '🔥' },
];

interface PartnerLink {
  id: string;
  profile_id: string;
  invited_email: string | null;
  linked_user_id: string | null;
  relationship_type: string;
  status: 'pending' | 'confirmed' | 'declined';
  name: string;
  created_at: string;
  linked_profile?: {
    display_name: string;
    age: number;
    city: string;
    photos?: Array<{ storage_path: string; signedUrl?: string }>;
  };
}

export default function LinkPartnerScreen() {
  const router = useRouter();

  const [showAddModal, setShowAddModal] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState('partner');

  // Use the Supabase hooks
  const { data: partnerLinks, isLoading } = usePartnerLinks();
  const addPartnerMutation = useAddPartnerLink();
  const removePartnerMutation = useRemovePartnerLink();

  const handleAddPartner = () => {
    if (!email.trim() || !name.trim()) {
      Alert.alert('Missing Information', 'Please enter both email and name.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    addPartnerMutation.mutate(
      { email, name, relationshipType: selectedType },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setShowAddModal(false);
          setEmail('');
          setName('');
          setSelectedType('partner');
        },
        onError: (error: Error) => {
          console.error('[PartnerLinks] Add error:', error);
          Alert.alert('Error', 'Failed to add partner. Please try again.');
        },
      }
    );
  };

  const handleRemovePartner = (link: PartnerLink) => {
    Alert.alert(
      'Remove Partner',
      `Are you sure you want to remove ${link.name} from your linked partners?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removePartnerMutation.mutate(link.id, {
              onSuccess: () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              },
            });
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-amber-500';
      case 'declined':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Connected';
      case 'pending':
        return 'Pending';
      case 'declined':
        return 'Declined';
      default:
        return status;
    }
  };

  const getRelationshipLabel = (type: string) => {
    return RELATIONSHIP_LABELS.find((r) => r.id === type)?.label ?? type;
  };

  const getRelationshipEmoji = (type: string) => {
    return RELATIONSHIP_LABELS.find((r) => r.id === type)?.emoji ?? '💕';
  };

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
          <Text className="text-white font-bold text-xl ml-4">Link Partners</Text>
        </View>

        <ScrollView
          className="flex-1 px-4 pt-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Hero Card */}
          <Animated.View entering={FadeInDown.delay(100)} className="mb-6">
            <LinearGradient
              colors={['#ec4899', '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 24, padding: 20 }}
            >
              <View className="flex-row items-center mb-2">
                <Heart size={24} color="white" fill="white" />
                <Text className="text-white font-bold text-lg ml-2">Your Polycule</Text>
              </View>
              <Text className="text-white/80 text-sm leading-relaxed">
                Link your partners so they appear on your profile and Polycule Map. Partners who
                are also on the app will be connected to your profile.
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* Partner Links List */}
          <View className="mb-6">
            <Text className="text-gray-400 text-sm font-medium mb-3">
              YOUR LINKED PARTNERS ({partnerLinks?.length ?? 0})
            </Text>

            {isLoading ? (
              <View className="py-8 items-center">
                <ActivityIndicator size="large" color="#c084fc" />
              </View>
            ) : partnerLinks && partnerLinks.length > 0 ? (
              partnerLinks.map((link: PartnerLink, index: number) => (
                <Animated.View
                  key={link.id}
                  entering={FadeInDown.delay(index * 100)}
                  className="bg-zinc-900/80 rounded-2xl p-4 mb-3 border border-zinc-800"
                >
                  <View className="flex-row items-center">
                    {/* Profile Photo or Placeholder */}
                    <View className="w-14 h-14 rounded-full bg-zinc-800 items-center justify-center mr-4 overflow-hidden">
                      {link.linked_profile?.photos?.[0]?.signedUrl ? (
                        <Image
                          source={{ uri: link.linked_profile.photos[0].signedUrl }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <Text className="text-2xl">{getRelationshipEmoji(link.relationship_type)}</Text>
                      )}
                    </View>

                    {/* Info */}
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text className="text-white font-semibold text-base">
                          {link.linked_profile?.display_name ?? link.name}
                        </Text>
                        {/* Status badge */}
                        <View
                          className={cn(
                            'ml-2 px-2 py-0.5 rounded-full flex-row items-center',
                            getStatusColor(link.status) + '/20'
                          )}
                        >
                          {link.status === 'confirmed' ? (
                            <Check size={10} color="#22c55e" />
                          ) : (
                            <Clock size={10} color="#f59e0b" />
                          )}
                          <Text
                            className={cn(
                              'text-xs ml-1',
                              link.status === 'confirmed' ? 'text-green-400' : 'text-amber-400'
                            )}
                          >
                            {getStatusLabel(link.status)}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-gray-400 text-sm mt-0.5">
                        {getRelationshipLabel(link.relationship_type)}
                      </Text>
                      {link.invited_email && link.status === 'pending' && (
                        <View className="flex-row items-center mt-1">
                          <Mail size={12} color="#6b7280" />
                          <Text className="text-gray-500 text-xs ml-1">
                            Invite sent to {link.invited_email}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Remove button */}
                    <Pressable
                      onPress={() => handleRemovePartner(link)}
                      className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center"
                    >
                      <Trash2 size={18} color="#ef4444" />
                    </Pressable>
                  </View>
                </Animated.View>
              ))
            ) : (
              <View className="py-8 items-center bg-zinc-900/50 rounded-2xl border border-zinc-800">
                <View className="w-16 h-16 rounded-full bg-purple-500/20 items-center justify-center mb-4">
                  <Link size={32} color="#c084fc" />
                </View>
                <Text className="text-white font-semibold mb-1">No Partners Linked</Text>
                <Text className="text-gray-400 text-sm text-center px-8">
                  Add your partners so they appear on your profile
                </Text>
              </View>
            )}
          </View>

          {/* Add Partner Button */}
          <Pressable
            onPress={() => setShowAddModal(true)}
            className="bg-purple-500/20 border-2 border-dashed border-purple-500/50 rounded-2xl p-6 items-center active:bg-purple-500/30"
          >
            <View className="w-12 h-12 rounded-full bg-purple-500/30 items-center justify-center mb-3">
              <UserPlus size={24} color="#c084fc" />
            </View>
            <Text className="text-purple-300 font-semibold">Add a Partner</Text>
            <Text className="text-gray-500 text-sm mt-1">Invite by email</Text>
          </Pressable>

          {/* Info Section */}
          <View className="mt-8 bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800">
            <View className="flex-row items-center mb-3">
              <Sparkles size={18} color="#f59e0b" />
              <Text className="text-white font-medium ml-2">How Partner Linking Works</Text>
            </View>
            <View className="space-y-2">
              <View className="flex-row">
                <Text className="text-gray-400 mr-2">1.</Text>
                <Text className="text-gray-400 flex-1">
                  Enter your partner's email and relationship type
                </Text>
              </View>
              <View className="flex-row">
                <Text className="text-gray-400 mr-2">2.</Text>
                <Text className="text-gray-400 flex-1">
                  They'll receive an invitation to connect
                </Text>
              </View>
              <View className="flex-row">
                <Text className="text-gray-400 mr-2">3.</Text>
                <Text className="text-gray-400 flex-1">
                  Once confirmed, they'll appear on your Polycule Map
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Add Partner Modal */}
        <Modal
          visible={showAddModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAddModal(false)}
        >
          <Pressable
            className="flex-1 bg-black/80 justify-end"
            onPress={() => setShowAddModal(false)}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <Animated.View
                entering={FadeIn.duration(200)}
                className="bg-zinc-900 rounded-t-3xl"
              >
                {/* Handle */}
                <View className="w-12 h-1 bg-zinc-700 rounded-full self-center mt-3" />

                {/* Header */}
                <View className="px-5 pt-5 pb-4 flex-row items-center justify-between">
                  <Text className="text-white text-xl font-bold">Add Partner</Text>
                  <Pressable
                    onPress={() => setShowAddModal(false)}
                    className="w-8 h-8 rounded-full bg-zinc-800 items-center justify-center"
                  >
                    <X size={18} color="#9ca3af" />
                  </Pressable>
                </View>

                <ScrollView className="px-5 pb-8">
                  {/* Name Input */}
                  <View className="mb-4">
                    <Text className="text-gray-400 text-sm mb-2">Partner's Name</Text>
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      placeholder="Enter their name"
                      placeholderTextColor="#6b7280"
                      className="bg-zinc-800 rounded-xl px-4 py-3 text-white"
                      autoCapitalize="words"
                    />
                  </View>

                  {/* Email Input */}
                  <View className="mb-4">
                    <Text className="text-gray-400 text-sm mb-2">Partner's Email</Text>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="partner@example.com"
                      placeholderTextColor="#6b7280"
                      className="bg-zinc-800 rounded-xl px-4 py-3 text-white"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <Text className="text-gray-500 text-xs mt-1">
                      If they're already on the app, they'll be connected automatically
                    </Text>
                  </View>

                  {/* Relationship Type */}
                  <View className="mb-6">
                    <Text className="text-gray-400 text-sm mb-2">Relationship Type</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{ flexGrow: 0 }}
                      contentContainerStyle={{ gap: 8 }}
                    >
                      {RELATIONSHIP_LABELS.map((rel) => (
                        <Pressable
                          key={rel.id}
                          onPress={() => setSelectedType(rel.id)}
                          className={cn(
                            'flex-row items-center px-4 py-2 rounded-full border',
                            selectedType === rel.id
                              ? 'bg-purple-500/20 border-purple-500'
                              : 'bg-zinc-800 border-zinc-700'
                          )}
                        >
                          <Text className="text-lg mr-2">{rel.emoji}</Text>
                          <Text
                            className={cn(
                              'text-sm',
                              selectedType === rel.id ? 'text-purple-300' : 'text-gray-300'
                            )}
                          >
                            {rel.label}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Submit Button */}
                  <Pressable
                    onPress={handleAddPartner}
                    disabled={addPartnerMutation.isPending}
                    className="rounded-xl overflow-hidden"
                  >
                    <LinearGradient
                      colors={['#9333ea', '#db2777']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        paddingVertical: 16,
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                      }}
                    >
                      {addPartnerMutation.isPending ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <>
                          <UserPlus size={20} color="white" />
                          <Text className="text-white font-semibold text-lg ml-2">
                            Send Invitation
                          </Text>
                        </>
                      )}
                    </LinearGradient>
                  </Pressable>
                </ScrollView>
              </Animated.View>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
