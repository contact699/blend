import React from 'react';
import { View, Text, Image, Pressable, ScrollView } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  Users,
  Heart,
  MessageCircle,
  Clock,
  Check,
  ChevronRight,
  Plus,
  Edit3,
  Link,
  UserX,
  ExternalLink,
} from 'lucide-react-native';
import { PartnerProfile } from '@/lib/types';

interface MeetThePartnersProps {
  partners: PartnerProfile[];
  onEdit?: () => void;
  onAddPartner?: () => void;
  onPartnerPress?: (partner: PartnerProfile) => void;
  isEditable?: boolean;
  compact?: boolean;
}

const INVOLVEMENT_CONFIG: {
  [key: string]: { label: string; color: string; description: string };
} = {
  always_present: {
    label: 'Always Present',
    color: '#22c55e',
    description: 'Involved in all meetings',
  },
  sometimes_present: {
    label: 'Sometimes Present',
    color: '#eab308',
    description: 'May join some meetups',
  },
  aware_only: {
    label: 'Aware Only',
    color: '#3b82f6',
    description: 'Knows about you but not involved',
  },
  kitchen_table: {
    label: 'Kitchen Table',
    color: '#c084fc',
    description: 'Happy to socialize together',
  },
};

function PartnerCard({
  partner,
  index,
  compact,
  onMessage,
  onPress,
}: {
  partner: PartnerProfile;
  index: number;
  compact?: boolean;
  onMessage?: () => void;
  onPress?: () => void;
}) {
  const involvementConfig = INVOLVEMENT_CONFIG[partner.involvement_level];

  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  // Blend status badge component
  const BlendStatusBadge = () => {
    if (partner.is_on_blend) {
      if (partner.link_status === 'confirmed') {
        return (
          <View className="flex-row items-center px-2 py-0.5 bg-green-500/20 rounded-full">
            <Check size={10} color="#22c55e" />
            <Text className="text-green-400 text-xs ml-1">Linked</Text>
          </View>
        );
      } else if (partner.link_status === 'pending') {
        return (
          <View className="flex-row items-center px-2 py-0.5 bg-amber-500/20 rounded-full">
            <Clock size={10} color="#f59e0b" />
            <Text className="text-amber-400 text-xs ml-1">Pending</Text>
          </View>
        );
      }
      return (
        <View className="flex-row items-center px-2 py-0.5 bg-purple-500/20 rounded-full">
          <Link size={10} color="#a855f7" />
          <Text className="text-purple-400 text-xs ml-1">On Blend</Text>
        </View>
      );
    } else {
      return (
        <View className="flex-row items-center px-2 py-0.5 bg-zinc-700/50 rounded-full">
          <UserX size={10} color="#71717a" />
          <Text className="text-zinc-500 text-xs ml-1">Not on Blend</Text>
        </View>
      );
    }
  };

  if (compact) {
    return (
      <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
        <Pressable
          onPress={handlePress}
          className="flex-row items-center bg-zinc-800/50 rounded-2xl p-3 mb-2 border border-zinc-700/50 active:bg-zinc-700/50"
        >
          <View className="relative">
            {partner.photo ? (
              <Image
                source={{ uri: partner.photo }}
                className="w-12 h-12 rounded-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-12 h-12 rounded-full bg-zinc-700 items-center justify-center">
                <Users size={20} color="#9ca3af" />
              </View>
            )}
            {/* Blend status indicator dot */}
            <View
              className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full items-center justify-center border-2 border-zinc-800 ${
                partner.is_on_blend
                  ? partner.link_status === 'confirmed'
                    ? 'bg-green-500'
                    : partner.link_status === 'pending'
                    ? 'bg-amber-500'
                    : 'bg-purple-500'
                  : 'bg-zinc-600'
              }`}
            >
              {partner.is_on_blend ? (
                partner.link_status === 'confirmed' ? (
                  <Check size={8} color="white" />
                ) : partner.link_status === 'pending' ? (
                  <Clock size={8} color="white" />
                ) : (
                  <Link size={8} color="white" />
                )
              ) : (
                <UserX size={8} color="white" />
              )}
            </View>
          </View>
          <View className="flex-1 ml-3">
            <View className="flex-row items-center">
              <Text className="text-white font-medium">{partner.name}</Text>
              {partner.age && <Text className="text-zinc-500 ml-1">, {partner.age}</Text>}
            </View>
            <Text className="text-zinc-400 text-sm">{partner.relationship_type}</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: involvementConfig?.color || '#9ca3af' }}
            />
            <ChevronRight size={16} color="#71717a" />
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify()}
      className="bg-zinc-800/50 rounded-2xl overflow-hidden mb-4 border border-zinc-700/50"
    >
      <Pressable onPress={handlePress} className="p-4 active:bg-zinc-700/30">
        <View className="flex-row items-start">
          <View className="relative">
            {partner.photo ? (
              <Image
                source={{ uri: partner.photo }}
                className="w-16 h-16 rounded-xl"
                resizeMode="cover"
              />
            ) : (
              <View className="w-16 h-16 rounded-xl bg-zinc-700 items-center justify-center">
                <Users size={24} color="#9ca3af" />
              </View>
            )}
            {/* Blend status indicator dot */}
            <View
              className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full items-center justify-center border-2 border-zinc-800 ${
                partner.is_on_blend
                  ? partner.link_status === 'confirmed'
                    ? 'bg-green-500'
                    : partner.link_status === 'pending'
                    ? 'bg-amber-500'
                    : 'bg-purple-500'
                  : 'bg-zinc-600'
              }`}
            >
              {partner.is_on_blend ? (
                partner.link_status === 'confirmed' ? (
                  <Check size={10} color="white" />
                ) : partner.link_status === 'pending' ? (
                  <Clock size={10} color="white" />
                ) : (
                  <Link size={10} color="white" />
                )
              ) : (
                <UserX size={10} color="white" />
              )}
            </View>
          </View>

          <View className="flex-1 ml-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <Text className="text-white font-semibold text-lg">{partner.name}</Text>
                {partner.age && <Text className="text-zinc-500 ml-2">{partner.age}</Text>}
              </View>
              <BlendStatusBadge />
            </View>

            <View className="flex-row items-center mt-1">
              <Heart size={14} color="#c084fc" />
              <Text className="text-zinc-400 text-sm ml-1.5">{partner.relationship_type}</Text>
            </View>

            {partner.relationship_duration && (
              <View className="flex-row items-center mt-1">
                <Clock size={14} color="#9ca3af" />
                <Text className="text-zinc-500 text-sm ml-1.5">
                  {partner.relationship_duration}
                </Text>
              </View>
            )}
          </View>
        </View>

        {partner.bio && (
          <Text className="text-zinc-300 text-sm leading-relaxed mt-3">{partner.bio}</Text>
        )}

        <View className="flex-row items-center justify-between mt-4 pt-3 border-t border-zinc-700/50">
          <View
            className="flex-row items-center px-3 py-1.5 rounded-full"
            style={{ backgroundColor: (involvementConfig?.color || '#9ca3af') + '20' }}
          >
            <View
              className="w-2 h-2 rounded-full mr-2"
              style={{ backgroundColor: involvementConfig?.color || '#9ca3af' }}
            />
            <Text
              className="text-sm font-medium"
              style={{ color: involvementConfig?.color || '#9ca3af' }}
            >
              {involvementConfig?.label || 'Partner'}
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            {partner.is_on_blend && partner.can_message && onMessage && (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  onMessage();
                }}
                className="flex-row items-center px-3 py-1.5 bg-purple-500/20 rounded-full"
              >
                <MessageCircle size={14} color="#c084fc" />
                <Text className="text-purple-400 font-medium text-xs ml-1.5">Message</Text>
              </Pressable>
            )}
            <View className="flex-row items-center px-3 py-1.5 bg-zinc-700/50 rounded-full">
              <ExternalLink size={14} color="#9ca3af" />
              <Text className="text-zinc-400 text-xs ml-1.5">View</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function MeetThePartners({
  partners,
  onEdit,
  onAddPartner,
  onPartnerPress,
  isEditable = false,
  compact = false,
}: MeetThePartnersProps) {
  if (partners.length === 0) {
    return (
      <View className="bg-zinc-900/50 rounded-3xl p-6 border border-zinc-800">
        <View className="items-center py-6">
          <View className="w-16 h-16 rounded-full bg-zinc-800 items-center justify-center mb-4">
            <Users size={28} color="#6b7280" />
          </View>
          <Text className="text-white font-semibold text-lg mb-1">No partners added yet</Text>
          <Text className="text-zinc-500 text-sm text-center mb-4">
            Add your partners to help matches understand your relationship structure
          </Text>
          {isEditable && onAddPartner && (
            <Pressable
              onPress={onAddPartner}
              className="flex-row items-center px-4 py-2 bg-purple-500/20 rounded-full"
            >
              <Plus size={18} color="#c084fc" />
              <Text className="text-purple-400 font-medium ml-2">Add Partner</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  return (
    <View className="bg-zinc-900/50 rounded-3xl p-4 border border-zinc-800">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-pink-500/20 items-center justify-center mr-3">
            <Users size={20} color="#ec4899" />
          </View>
          <View>
            <Text className="text-white font-semibold text-lg">Meet My Partners</Text>
            <Text className="text-zinc-400 text-sm">{partners.length} partner(s)</Text>
          </View>
        </View>
        {isEditable && onEdit && (
          <Pressable
            onPress={onEdit}
            className="w-9 h-9 rounded-full bg-zinc-800 items-center justify-center"
          >
            <Edit3 size={16} color="#c084fc" />
          </Pressable>
        )}
      </View>

      {/* Partner cards */}
      <View>
        {partners.map((partner, index) => (
          <PartnerCard
            key={partner.id}
            partner={partner}
            index={index}
            compact={compact}
            onMessage={partner.can_message ? () => {} : undefined}
            onPress={onPartnerPress ? () => onPartnerPress(partner) : undefined}
          />
        ))}
      </View>

      {/* Involvement legend (if not compact) */}
      {!compact && (
        <View className="mt-4 pt-4 border-t border-zinc-800">
          <Text className="text-zinc-500 text-xs mb-2">INVOLVEMENT LEVELS</Text>
          <View className="flex-row flex-wrap gap-2">
            {Object.entries(INVOLVEMENT_CONFIG).map(([key, config]) => (
              <View
                key={key}
                className="flex-row items-center px-2 py-1 rounded-full bg-zinc-800/50"
              >
                <View
                  className="w-2 h-2 rounded-full mr-1.5"
                  style={{ backgroundColor: config.color }}
                />
                <Text className="text-zinc-400 text-xs">{config.label}</Text>
              </View>
            ))}
          </View>

          {/* Blend status legend */}
          <View className="mt-3 pt-3 border-t border-zinc-800/50">
            <Text className="text-zinc-500 text-xs mb-2">BLEND STATUS</Text>
            <View className="flex-row flex-wrap gap-2">
              <View className="flex-row items-center px-2 py-1 rounded-full bg-zinc-800/50">
                <View className="w-4 h-4 rounded-full bg-green-500 items-center justify-center mr-1.5">
                  <Check size={8} color="white" />
                </View>
                <Text className="text-zinc-400 text-xs">Linked</Text>
              </View>
              <View className="flex-row items-center px-2 py-1 rounded-full bg-zinc-800/50">
                <View className="w-4 h-4 rounded-full bg-amber-500 items-center justify-center mr-1.5">
                  <Clock size={8} color="white" />
                </View>
                <Text className="text-zinc-400 text-xs">Pending</Text>
              </View>
              <View className="flex-row items-center px-2 py-1 rounded-full bg-zinc-800/50">
                <View className="w-4 h-4 rounded-full bg-zinc-600 items-center justify-center mr-1.5">
                  <UserX size={8} color="white" />
                </View>
                <Text className="text-zinc-400 text-xs">Not on Blend</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Add more partners */}
      {isEditable && onAddPartner && (
        <Pressable
          onPress={onAddPartner}
          className="mt-4 border-2 border-dashed border-zinc-700 rounded-xl p-4 items-center justify-center active:border-purple-500"
        >
          <Plus size={20} color="#9ca3af" />
          <Text className="text-zinc-400 text-sm mt-1">Add another partner</Text>
        </Pressable>
      )}
    </View>
  );
}
