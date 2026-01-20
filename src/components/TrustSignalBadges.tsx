import { View, Text, Pressable } from 'react-native';
import {
  Users,
  Calendar,
  Clock,
  MessageCircle,
  CheckCircle,
  Heart,
  Video,
  Shield,
  Phone,
  CreditCard,
  Sparkles,
} from 'lucide-react-native';
import { TrustSignals, getTrustLevel } from '@/lib/types/trust-signals';
import { activityTracker } from '@/lib/services/activity-tracker';
import { haptics } from '@/lib/haptics';

interface TrustSignalBadgesProps {
  signals: TrustSignals;
  accountCreatedAt: string;
  compact?: boolean; // Show fewer badges in compact mode
  onBadgePress?: (badgeType: string) => void;
}

export default function TrustSignalBadges({
  signals,
  accountCreatedAt,
  compact = false,
  onBadgePress,
}: TrustSignalBadgesProps) {
  const accountAgeDays = activityTracker.getAccountAgeDays(accountCreatedAt);
  const trustLevel = getTrustLevel(signals.community_vouches);

  const badges = [
    // Community Vouches (always show if > 0)
    signals.community_vouches > 0 && {
      key: 'community_vouches',
      icon: <Users size={14} color="#a855f7" />,
      label: `${signals.community_vouches} ${signals.community_vouches === 1 ? 'vouch' : 'vouches'}`,
      bgColor: 'bg-purple-500/20',
      textColor: 'text-purple-300',
      priority: 1,
    },

    // Account Age (show if >= 30 days)
    accountAgeDays >= 30 && {
      key: 'account_age',
      icon: <Calendar size={14} color="#3b82f6" />,
      label: activityTracker.getAccountAgeLabel(accountAgeDays),
      bgColor: 'bg-blue-500/20',
      textColor: 'text-blue-300',
      priority: 2,
    },

    // Active Status (show if active this week)
    signals.active_status.status !== 'inactive' && {
      key: 'active_status',
      icon: <Clock size={14} color={signals.active_status.color} />,
      label: signals.active_status.label,
      bgColor: `bg-${signals.active_status.color}/20`,
      textColor: `text-${signals.active_status.color}`,
      priority: 3,
    },

    // Response Rate (show if >= 70%)
    signals.response_rate !== null &&
      signals.response_rate >= 70 && {
        key: 'response_rate',
        icon: <MessageCircle size={14} color="#10b981" />,
        label: `${Math.round(signals.response_rate)}% response rate`,
        bgColor: 'bg-green-500/20',
        textColor: 'text-green-300',
        priority: 4,
      },

    // Profile Completeness (show if 100%)
    signals.profile_completeness === 100 && {
      key: 'profile_completeness',
      icon: <CheckCircle size={14} color="#06b6d4" />,
      label: 'Complete profile',
      bgColor: 'bg-cyan-500/20',
      textColor: 'text-cyan-300',
      priority: 5,
    },

    // Event Attendance (show if >= 3)
    signals.event_attendance_count >= 3 && {
      key: 'event_attendance',
      icon: <Calendar size={14} color="#f59e0b" />,
      label: `${signals.event_attendance_count} events`,
      bgColor: 'bg-orange-500/20',
      textColor: 'text-orange-300',
      priority: 6,
    },

    // Partner Links (show if >= 1)
    signals.partner_count >= 1 && {
      key: 'partner_links',
      icon: <Heart size={14} color="#ec4899" />,
      label: `${signals.partner_count} ${signals.partner_count === 1 ? 'partner' : 'partners'}`,
      bgColor: 'bg-pink-500/20',
      textColor: 'text-pink-300',
      priority: 7,
    },

    // Video Profile
    signals.has_video_profile && {
      key: 'video_profile',
      icon: <Video size={14} color="#8b5cf6" />,
      label: 'Video profile',
      bgColor: 'bg-purple-500/20',
      textColor: 'text-purple-300',
      priority: 8,
    },

    // AI Verified
    signals.is_ai_verified && {
      key: 'ai_verified',
      icon: <Sparkles size={14} color="#10b981" />,
      label: 'AI Verified',
      bgColor: 'bg-green-500/20',
      textColor: 'text-green-300',
      priority: 9,
    },

    // Photo Verified
    signals.is_photo_verified && {
      key: 'photo_verified',
      icon: <CheckCircle size={14} color="#3b82f6" />,
      label: 'Photo Verified',
      bgColor: 'bg-blue-500/20',
      textColor: 'text-blue-300',
      priority: 10,
    },

    // Phone Verified
    signals.is_phone_verified && {
      key: 'phone_verified',
      icon: <Phone size={14} color="#06b6d4" />,
      label: 'Phone Verified',
      bgColor: 'bg-cyan-500/20',
      textColor: 'text-cyan-300',
      priority: 11,
    },

    // ID Verified
    signals.is_id_verified && {
      key: 'id_verified',
      icon: <CreditCard size={14} color="#8b5cf6" />,
      label: 'ID Verified',
      bgColor: 'bg-purple-500/20',
      textColor: 'text-purple-300',
      priority: 12,
    },
  ].filter(Boolean) as Array<{
    key: string;
    icon: React.ReactNode;
    label: string;
    bgColor: string;
    textColor: string;
    priority: number;
  }>;

  // Sort by priority
  badges.sort((a, b) => a.priority - b.priority);

  // Limit badges in compact mode
  const displayBadges = compact ? badges.slice(0, 4) : badges;

  const handleBadgePress = (badgeType: string) => {
    haptics.tap();
    onBadgePress?.(badgeType);
  };

  if (displayBadges.length === 0) {
    return null;
  }

  return (
    <View className="flex-row flex-wrap gap-2">
      {displayBadges.map((badge) => (
        <Pressable
          key={badge.key}
          onPress={() => handleBadgePress(badge.key)}
          className={`${badge.bgColor} px-3 py-1.5 rounded-full flex-row items-center`}
          accessibilityRole="button"
          accessibilityLabel={badge.label}
        >
          {badge.icon}
          <Text className={`${badge.textColor} text-xs font-medium ml-1.5`}>
            {badge.label}
          </Text>
        </Pressable>
      ))}

      {compact && badges.length > 4 && (
        <Pressable
          onPress={() => handleBadgePress('view_all')}
          className="bg-zinc-800 px-3 py-1.5 rounded-full"
          accessibilityRole="button"
          accessibilityLabel="View all trust signals"
        >
          <Text className="text-gray-400 text-xs font-medium">
            +{badges.length - 4} more
          </Text>
        </Pressable>
      )}
    </View>
  );
}

/**
 * Trust Level Badge
 * Shows overall trust level based on vouch count
 */
interface TrustLevelBadgeProps {
  vouchCount: number;
  size?: 'small' | 'medium' | 'large';
}

export function TrustLevelBadge({ vouchCount, size = 'medium' }: TrustLevelBadgeProps) {
  const trustLevel = getTrustLevel(vouchCount);

  const sizeClasses = {
    small: 'px-2 py-1',
    medium: 'px-3 py-1.5',
    large: 'px-4 py-2',
  };

  const textSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
  };

  return (
    <View
      className={`${sizeClasses[size]} rounded-full flex-row items-center`}
      style={{ backgroundColor: `${trustLevel.color}20` }}
    >
      <Shield size={size === 'small' ? 12 : size === 'medium' ? 14 : 16} color={trustLevel.color} />
      <Text
        className={`${textSizeClasses[size]} font-semibold ml-1.5`}
        style={{ color: trustLevel.color }}
      >
        {trustLevel.label}
      </Text>
    </View>
  );
}

/**
 * Single Trust Signal Badge
 * Reusable badge component
 */
interface TrustSignalBadgeProps {
  icon: React.ReactNode;
  label: string;
  bgColor: string;
  textColor: string;
  onPress?: () => void;
}

export function TrustSignalBadge({
  icon,
  label,
  bgColor,
  textColor,
  onPress,
}: TrustSignalBadgeProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`${bgColor} px-3 py-1.5 rounded-full flex-row items-center`}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {icon}
      <Text className={`${textColor} text-xs font-medium ml-1.5`}>{label}</Text>
    </Pressable>
  );
}
