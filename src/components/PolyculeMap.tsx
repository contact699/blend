import React, { useMemo } from 'react';
import { View, Text, Image, Pressable, Dimensions, Platform } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Users, Edit3, Link, UserX, Check, Clock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Polycule, PolyculeConnection } from '@/lib/types';
import { RELATIONSHIP_STRUCTURES } from '@/lib/mock-data';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAP_SIZE = SCREEN_WIDTH - 48;
const NODE_SIZE = 64;
const CENTER = MAP_SIZE / 2;

interface PolyculeMapProps {
  polycule: Polycule;
  onEdit?: () => void;
  onMemberPress?: (member: PolyculeConnection) => void;
  isEditable?: boolean;
}

// Calculate node positions in a circular/organic layout
function calculateNodePositions(members: PolyculeConnection[]) {
  const positions: { [key: string]: { x: number; y: number } } = {};

  if (members.length === 0) return positions;

  // Place "me" in the center
  const meNode = members.find((m) => m.id === 'me');
  if (meNode) {
    positions['me'] = { x: CENTER, y: CENTER };
  }

  // Place primary connections closer, secondary further
  const primaryMembers = members.filter(
    (m) => m.id !== 'me' && m.connection_strength === 'primary'
  );
  const secondaryMembers = members.filter(
    (m) => m.id !== 'me' && m.connection_strength !== 'primary'
  );

  // Primary ring
  const primaryRadius = MAP_SIZE * 0.25;
  primaryMembers.forEach((member, index) => {
    const angle = (2 * Math.PI * index) / primaryMembers.length - Math.PI / 2;
    positions[member.id] = {
      x: CENTER + primaryRadius * Math.cos(angle),
      y: CENTER + primaryRadius * Math.sin(angle),
    };
  });

  // Secondary ring
  const secondaryRadius = MAP_SIZE * 0.4;
  secondaryMembers.forEach((member, index) => {
    const angle = (2 * Math.PI * index) / secondaryMembers.length - Math.PI / 4;
    positions[member.id] = {
      x: CENTER + secondaryRadius * Math.cos(angle),
      y: CENTER + secondaryRadius * Math.sin(angle),
    };
  });

  return positions;
}

function ConnectionLine({
  from,
  to,
  isPrimary,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  isPrimary: boolean;
}) {
  const opacity = isPrimary ? 0.7 : 0.4;

  // Calculate line properties
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Offset to start from edge of nodes
  const offset = NODE_SIZE / 2 + 4;
  const adjustedLength = length - offset * 2;

  if (adjustedLength <= 0) return null;

  const startX = from.x + (dx / length) * offset;
  const startY = from.y + (dy / length) * offset;

  return (
    <View
      style={{
        position: 'absolute',
        left: startX,
        top: startY - (isPrimary ? 2 : 1),
        width: adjustedLength,
        height: isPrimary ? 4 : 2,
        borderRadius: 2,
        opacity,
        transform: [{ rotate: `${angle}deg` }],
      }}
    >
      <LinearGradient
        colors={isPrimary ? ['#c084fc', '#db2777'] : ['#6b7280', '#9ca3af']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ flex: 1, borderRadius: 2 }}
      />
    </View>
  );
}

function MemberNode({
  member,
  position,
  isMe = false,
  onPress,
}: {
  member: PolyculeConnection;
  position: { x: number; y: number };
  isMe?: boolean;
  onPress?: () => void;
}) {
  const getRelationshipColor = () => {
    switch (member.relationship_type) {
      case 'anchor':
      case 'nesting_partner':
        return ['#c084fc', '#9333ea'];
      case 'partner':
        return ['#ec4899', '#db2777'];
      case 'dating':
        return ['#f472b6', '#ec4899'];
      case 'meta':
        return ['#6b7280', '#4b5563'];
      case 'comet':
        return ['#60a5fa', '#3b82f6'];
      default:
        return ['#9ca3af', '#6b7280'];
    }
  };

  const getRelationshipLabel = () => {
    switch (member.relationship_type) {
      case 'anchor':
        return 'Anchor';
      case 'nesting_partner':
        return 'Nesting';
      case 'partner':
        return 'Partner';
      case 'dating':
        return 'Dating';
      case 'meta':
        return 'Meta';
      case 'comet':
        return 'Comet';
      default:
        return member.relationship_type;
    }
  };

  const handlePress = () => {
    if (onPress && !isMe) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  // Determine link status indicator
  const getLinkStatusIndicator = () => {
    if (isMe) return null;

    if (member.is_on_blend) {
      if (member.link_status === 'confirmed') {
        return (
          <View className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 items-center justify-center border-2 border-black">
            <Check size={10} color="white" />
          </View>
        );
      } else if (member.link_status === 'pending') {
        return (
          <View className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 items-center justify-center border-2 border-black">
            <Clock size={10} color="white" />
          </View>
        );
      }
      return (
        <View className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-purple-500 items-center justify-center border-2 border-black">
          <Link size={10} color="white" />
        </View>
      );
    } else {
      // Not on Blend - show indicator
      return (
        <View className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-zinc-600 items-center justify-center border-2 border-black">
          <UserX size={10} color="white" />
        </View>
      );
    }
  };

  return (
    <View
      style={{
        position: 'absolute',
        left: position.x - NODE_SIZE / 2,
        top: position.y - NODE_SIZE / 2,
        alignItems: 'center',
      }}
    >
      <Pressable onPress={handlePress} disabled={isMe}>
        <View className="relative">
          <View
            className={`rounded-full ${isMe ? 'p-1' : 'p-0.5'}`}
            style={{
              backgroundColor: isMe ? 'rgba(192, 132, 252, 0.3)' : 'transparent',
            }}
          >
            <LinearGradient
              colors={getRelationshipColor() as [string, string]}
              style={{
                width: isMe ? NODE_SIZE : NODE_SIZE - 8,
                height: isMe ? NODE_SIZE : NODE_SIZE - 8,
                borderRadius: 999,
                padding: 2,
              }}
            >
              {member.photo ? (
                <Image
                  source={{ uri: member.photo }}
                  className="w-full h-full rounded-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-full rounded-full bg-zinc-800 items-center justify-center">
                  <Users size={20} color="#9ca3af" />
                </View>
              )}
            </LinearGradient>
          </View>
          {getLinkStatusIndicator()}
        </View>
        <Text
          className="text-white text-xs font-medium mt-1 text-center"
          numberOfLines={1}
          style={{ maxWidth: 80 }}
        >
          {member.name}
        </Text>
        {!isMe && (
          <View className="flex-row items-center gap-1 mt-0.5">
            <View
              className="px-2 py-0.5 rounded-full"
              style={{ backgroundColor: getRelationshipColor()[0] + '40' }}
            >
              <Text className="text-[10px] text-zinc-300">{getRelationshipLabel()}</Text>
            </View>
          </View>
        )}
      </Pressable>
    </View>
  );
}

export default function PolyculeMap({ polycule, onEdit, onMemberPress, isEditable = true }: PolyculeMapProps) {
  const positions = useMemo(() => calculateNodePositions(polycule.members), [polycule.members]);

  // Get all connection lines
  const connections = useMemo(() => {
    const lines: { from: string; to: string; isPrimary: boolean }[] = [];
    const added = new Set<string>();

    polycule.members.forEach((member) => {
      member.connected_to.forEach((targetId) => {
        const key = [member.id, targetId].sort().join('-');
        if (!added.has(key)) {
          added.add(key);
          const targetMember = polycule.members.find((m) => m.id === targetId);
          const isPrimary =
            member.connection_strength === 'primary' ||
            targetMember?.connection_strength === 'primary';
          lines.push({ from: member.id, to: targetId, isPrimary });
        }
      });
    });

    return lines;
  }, [polycule.members]);

  const structureInfo = RELATIONSHIP_STRUCTURES.find((s) => s.id === polycule.structure);

  return (
    <View className="bg-zinc-900/50 rounded-3xl p-4 border border-zinc-800">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-purple-500/20 items-center justify-center mr-3">
            <Heart size={20} color="#c084fc" fill="#c084fc" />
          </View>
          <View>
            <Text className="text-white font-semibold text-lg">Polycule Map</Text>
            {structureInfo && (
              <View className="flex-row items-center mt-0.5">
                <Text className="text-zinc-400 text-sm">
                  {structureInfo.emoji} {structureInfo.label}
                </Text>
              </View>
            )}
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

      {/* Map Canvas */}
      <View
        style={{
          width: MAP_SIZE,
          height: MAP_SIZE,
          position: 'relative',
        }}
        className="self-center"
      >
        {/* Background circles for visual depth */}
        <View
          style={{
            position: 'absolute',
            left: CENTER - MAP_SIZE * 0.25,
            top: CENTER - MAP_SIZE * 0.25,
            width: MAP_SIZE * 0.5,
            height: MAP_SIZE * 0.5,
            borderRadius: MAP_SIZE * 0.25,
            borderWidth: 1,
            borderColor: 'rgba(192, 132, 252, 0.1)',
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: CENTER - MAP_SIZE * 0.4,
            top: CENTER - MAP_SIZE * 0.4,
            width: MAP_SIZE * 0.8,
            height: MAP_SIZE * 0.8,
            borderRadius: MAP_SIZE * 0.4,
            borderWidth: 1,
            borderColor: 'rgba(192, 132, 252, 0.05)',
          }}
        />

        {/* Connection lines */}
        {connections.map((conn, index) => {
          const fromPos = positions[conn.from];
          const toPos = positions[conn.to];
          if (!fromPos || !toPos) return null;

          return (
            <ConnectionLine
              key={`${conn.from}-${conn.to}`}
              from={fromPos}
              to={toPos}
              isPrimary={conn.isPrimary}
            />
          );
        })}

        {/* Member nodes */}
        {polycule.members.map((member) => {
          const position = positions[member.id];
          if (!position) return null;

          return (
            <MemberNode
              key={member.id}
              member={member}
              position={position}
              isMe={member.id === 'me'}
              onPress={() => onMemberPress?.(member)}
            />
          );
        })}
      </View>

      {/* Legend */}
      <View className="mt-4 pt-4 border-t border-zinc-800">
        <View className="flex-row flex-wrap justify-center gap-3">
          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full bg-purple-500 mr-1.5" />
            <Text className="text-zinc-400 text-xs">Primary</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full bg-pink-500 mr-1.5" />
            <Text className="text-zinc-400 text-xs">Partner</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full bg-zinc-500 mr-1.5" />
            <Text className="text-zinc-400 text-xs">Meta</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full bg-blue-500 mr-1.5" />
            <Text className="text-zinc-400 text-xs">Comet</Text>
          </View>
        </View>
        {/* Blend status legend */}
        <View className="flex-row flex-wrap justify-center gap-3 mt-2 pt-2 border-t border-zinc-800/50">
          <View className="flex-row items-center">
            <View className="w-4 h-4 rounded-full bg-green-500 items-center justify-center mr-1.5">
              <Check size={8} color="white" />
            </View>
            <Text className="text-zinc-500 text-xs">On Blend</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-4 h-4 rounded-full bg-amber-500 items-center justify-center mr-1.5">
              <Clock size={8} color="white" />
            </View>
            <Text className="text-zinc-500 text-xs">Pending</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-4 h-4 rounded-full bg-zinc-600 items-center justify-center mr-1.5">
              <UserX size={8} color="white" />
            </View>
            <Text className="text-zinc-500 text-xs">Not on Blend</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
