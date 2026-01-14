import React from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, SlideInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  X,
  Users,
  Heart,
  MapPin,
  Clock,
  Link,
  UserX,
  MessageCircle,
  Check,
  ExternalLink,
  AlertCircle,
} from 'lucide-react-native';
import { PolyculeConnection, Profile } from '@/lib/types';
import { MOCK_PROFILES } from '@/lib/mock-data';

interface PartnerProfileModalProps {
  visible: boolean;
  onClose: () => void;
  member: PolyculeConnection | null;
  onViewFullProfile?: (userId: string) => void;
  onMessage?: (userId: string) => void;
}

export default function PartnerProfileModal({
  visible,
  onClose,
  member,
  onViewFullProfile,
  onMessage,
}: PartnerProfileModalProps) {
  if (!member) return null;

  // Get the full profile if on Blend
  const fullProfile = member.blend_user_id
    ? MOCK_PROFILES.find((p: Profile) => p.user_id === member.blend_user_id)
    : null;

  const getRelationshipLabel = () => {
    switch (member.relationship_type) {
      case 'anchor':
        return 'Anchor Partner';
      case 'nesting_partner':
        return 'Nesting Partner';
      case 'partner':
        return 'Partner';
      case 'dating':
        return 'Dating';
      case 'meta':
        return 'Metamour';
      case 'comet':
        return 'Comet';
      default:
        return member.relationship_type;
    }
  };

  const getRelationshipEmoji = () => {
    switch (member.relationship_type) {
      case 'anchor':
        return '⚓';
      case 'nesting_partner':
        return '🏠';
      case 'partner':
        return '💜';
      case 'dating':
        return '💕';
      case 'meta':
        return '🤝';
      case 'comet':
        return '☄️';
      default:
        return '💜';
    }
  };

  const handleViewFullProfile = () => {
    if (fullProfile && onViewFullProfile) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onViewFullProfile(fullProfile.user_id);
      onClose();
    }
  };

  const handleMessage = () => {
    if (fullProfile && onMessage) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onMessage(fullProfile.user_id);
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-black">
        <LinearGradient
          colors={['#18181b', '#09090b', '#000000']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />

        <SafeAreaView className="flex-1" edges={['top']}>
          {/* Header */}
          <Animated.View
            entering={FadeIn.duration(300)}
            className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-800"
          >
            <Pressable
              onPress={onClose}
              className="w-10 h-10 rounded-full bg-zinc-800/50 items-center justify-center"
            >
              <X size={22} color="white" />
            </Pressable>
            <Text className="text-white text-lg font-semibold">Partner Profile</Text>
            <View className="w-10" />
          </Animated.View>

          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          >
            {/* Profile Header */}
            <Animated.View
              entering={FadeInDown.delay(100).duration(300)}
              className="items-center mb-6"
            >
              {/* Photo */}
              <View className="relative mb-4">
                {member.photo || fullProfile?.photos?.[0] ? (
                  <Image
                    source={{ uri: member.photo || fullProfile?.photos?.[0] }}
                    className="w-32 h-32 rounded-full"
                  />
                ) : (
                  <View className="w-32 h-32 rounded-full bg-zinc-800 items-center justify-center">
                    <Users size={48} color="#71717a" />
                  </View>
                )}

                {/* Blend status badge */}
                <View
                  className={`absolute -bottom-1 -right-1 px-3 py-1.5 rounded-full flex-row items-center ${
                    member.is_on_blend ? 'bg-green-500' : 'bg-zinc-600'
                  }`}
                >
                  {member.is_on_blend ? (
                    <>
                      <Check size={14} color="white" />
                      <Text className="text-white text-xs font-medium ml-1">On Blend</Text>
                    </>
                  ) : (
                    <>
                      <UserX size={14} color="white" />
                      <Text className="text-white text-xs font-medium ml-1">Not on Blend</Text>
                    </>
                  )}
                </View>
              </View>

              {/* Name & Age */}
              <Text className="text-white text-2xl font-bold">{member.name}</Text>
              {fullProfile && (
                <View className="flex-row items-center mt-1">
                  <Text className="text-zinc-400">{fullProfile.age}</Text>
                  <View className="w-1 h-1 rounded-full bg-zinc-600 mx-2" />
                  <MapPin size={14} color="#71717a" />
                  <Text className="text-zinc-400 ml-1">{fullProfile.city}</Text>
                </View>
              )}

              {/* Relationship type */}
              <View className="flex-row items-center mt-3 px-4 py-2 bg-purple-500/20 rounded-full">
                <Text className="text-lg mr-2">{getRelationshipEmoji()}</Text>
                <Text className="text-purple-400 font-medium">{getRelationshipLabel()}</Text>
              </View>

              {/* Link status for Blend users */}
              {member.is_on_blend && member.link_status && (
                <View className="mt-3">
                  {member.link_status === 'confirmed' ? (
                    <View className="flex-row items-center px-3 py-1.5 bg-green-500/20 rounded-full">
                      <Check size={14} color="#22c55e" />
                      <Text className="text-green-400 text-sm ml-1">Link Confirmed</Text>
                    </View>
                  ) : member.link_status === 'pending' ? (
                    <View className="flex-row items-center px-3 py-1.5 bg-amber-500/20 rounded-full">
                      <Clock size={14} color="#f59e0b" />
                      <Text className="text-amber-400 text-sm ml-1">Pending Confirmation</Text>
                    </View>
                  ) : null}
                </View>
              )}
            </Animated.View>

            {/* Not on Blend Notice */}
            {!member.is_on_blend && (
              <Animated.View
                entering={FadeInDown.delay(200).duration(300)}
                className="mb-6 flex-row items-start bg-zinc-800/50 rounded-xl p-4 border border-zinc-700"
              >
                <AlertCircle size={20} color="#71717a" />
                <View className="flex-1 ml-3">
                  <Text className="text-zinc-300 font-medium">Manually Added Partner</Text>
                  <Text className="text-zinc-500 text-sm mt-1">
                    This partner was added manually and isn't on Blend. You can invite them to join!
                  </Text>
                </View>
              </Animated.View>
            )}

            {/* Bio Section - only for Blend users */}
            {fullProfile?.bio && (
              <Animated.View
                entering={FadeInDown.delay(250).duration(300)}
                className="mb-6"
              >
                <Text className="text-zinc-500 text-xs uppercase mb-2">About</Text>
                <View className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                  <Text className="text-zinc-300 leading-relaxed">{fullProfile.bio}</Text>
                </View>
              </Animated.View>
            )}

            {/* Connection Notes */}
            {member.notes && (
              <Animated.View
                entering={FadeInDown.delay(300).duration(300)}
                className="mb-6"
              >
                <Text className="text-zinc-500 text-xs uppercase mb-2">Notes</Text>
                <View className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                  <Text className="text-zinc-300 leading-relaxed">{member.notes}</Text>
                </View>
              </Animated.View>
            )}

            {/* Prompts - only for Blend users */}
            {fullProfile?.prompt_responses && fullProfile.prompt_responses.length > 0 && (
              <Animated.View
                entering={FadeInDown.delay(350).duration(300)}
                className="mb-6"
              >
                <Text className="text-zinc-500 text-xs uppercase mb-2">Prompts</Text>
                {fullProfile.prompt_responses.slice(0, 2).map((prompt, index) => (
                  <View
                    key={prompt.id || index}
                    className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 mb-2"
                  >
                    <Text className="text-purple-400 text-sm mb-1">{prompt.prompt_text}</Text>
                    <Text className="text-zinc-300">{prompt.response_text}</Text>
                  </View>
                ))}
              </Animated.View>
            )}

            {/* Actions for Blend users */}
            {member.is_on_blend && fullProfile && (
              <Animated.View
                entering={FadeInDown.delay(400).duration(300)}
                className="gap-3"
              >
                <Pressable
                  onPress={handleViewFullProfile}
                  className="flex-row items-center justify-center py-4 rounded-xl overflow-hidden"
                >
                  <LinearGradient
                    colors={['#a855f7', '#7c3aed']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                    }}
                  />
                  <ExternalLink size={20} color="white" />
                  <Text className="text-white font-semibold text-lg ml-2">
                    View Full Profile
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleMessage}
                  className="flex-row items-center justify-center py-4 rounded-xl bg-zinc-800 border border-zinc-700"
                >
                  <MessageCircle size={20} color="#a855f7" />
                  <Text className="text-purple-400 font-semibold text-lg ml-2">
                    Send Message
                  </Text>
                </Pressable>
              </Animated.View>
            )}

            {/* Invite to Blend for manual partners */}
            {!member.is_on_blend && (
              <Animated.View
                entering={FadeInDown.delay(400).duration(300)}
              >
                <Pressable className="flex-row items-center justify-center py-4 rounded-xl bg-purple-500/20 border border-purple-500/30">
                  <Link size={20} color="#a855f7" />
                  <Text className="text-purple-400 font-semibold text-lg ml-2">
                    Invite to Blend
                  </Text>
                </Pressable>
              </Animated.View>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
