import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Shield,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  User,
  MessageSquare,
  Image,
  Calendar,
  Flag,
  Ban,
  AlertCircle,
  FileText,
} from 'lucide-react-native';
import {
  useIsModerator,
  useModerationQueue,
  useModerationStats,
  useAssignToSelf,
  useResolveItem,
  useDismissItem,
  useWarnUser,
  useSuspendUser,
  type QueueItem,
  type QueueStatus,
  type Priority,
} from '@/lib/moderation';

// Priority colors
const priorityColors: Record<Priority, string> = {
  low: '#6b7280',
  normal: '#3b82f6',
  high: '#f59e0b',
  urgent: '#ef4444',
};

// Status colors
const statusColors: Record<QueueStatus, string> = {
  pending: '#f59e0b',
  in_review: '#3b82f6',
  resolved: '#10b981',
  escalated: '#ef4444',
  dismissed: '#6b7280',
};

// Item type icons
function ItemTypeIcon({ type }: { type: string }) {
  const iconProps = { size: 16, color: '#9ca3af' };
  switch (type) {
    case 'message':
      return <MessageSquare {...iconProps} />;
    case 'photo':
      return <Image {...iconProps} />;
    case 'profile':
      return <User {...iconProps} />;
    case 'event':
      return <Calendar {...iconProps} />;
    default:
      return <Flag {...iconProps} />;
  }
}

export default function ModerationScreen() {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<QueueStatus | undefined>('pending');
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [actionNotes, setActionNotes] = useState('');

  // Check if user is moderator
  const { data: modStatus, isLoading: checkingMod } = useIsModerator();
  
  // Get queue and stats
  const { data: queue, isLoading: loadingQueue } = useModerationQueue({ status: selectedStatus });
  const { data: stats } = useModerationStats();
  
  // Mutations
  const assignMutation = useAssignToSelf();
  const resolveMutation = useResolveItem();
  const dismissMutation = useDismissItem();
  const warnMutation = useWarnUser();
  const suspendMutation = useSuspendUser();

  // Loading state
  if (checkingMod) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#c084fc" />
      </View>
    );
  }

  // Access denied
  if (!modStatus?.isModerator) {
    return (
      <View className="flex-1 bg-black items-center justify-center px-6">
        <Shield size={64} color="#ef4444" />
        <Text className="text-white text-xl font-bold mt-4">Access Denied</Text>
        <Text className="text-gray-400 text-center mt-2">
          You don't have permission to access the moderation panel.
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-6 bg-zinc-800 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-medium">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  // Handle actions
  const handleAssign = async (item: QueueItem) => {
    try {
      await assignMutation.mutateAsync(item.id);
      Alert.alert('Assigned', 'Item assigned to you for review');
    } catch {
      Alert.alert('Error', 'Failed to assign item');
    }
  };

  const handleDismiss = async (item: QueueItem) => {
    Alert.prompt(
      'Dismiss Report',
      'Enter reason for dismissal:',
      async (reason) => {
        if (!reason) return;
        try {
          await dismissMutation.mutateAsync({ itemId: item.id, reason });
          setSelectedItem(null);
        } catch {
          Alert.alert('Error', 'Failed to dismiss item');
        }
      }
    );
  };

  const handleWarn = async (item: QueueItem) => {
    if (!actionNotes.trim()) {
      Alert.alert('Error', 'Please enter a reason for the warning');
      return;
    }
    try {
      await warnMutation.mutateAsync({
        targetUserId: item.target_user_id,
        reason: actionNotes,
        queueItemId: item.id,
      });
      await resolveMutation.mutateAsync({
        itemId: item.id,
        resolution: 'User warned',
        actionTaken: 'warning',
        internalNotes: actionNotes,
      });
      setSelectedItem(null);
      setActionNotes('');
      Alert.alert('Success', 'User has been warned');
    } catch {
      Alert.alert('Error', 'Failed to warn user');
    }
  };

  const handleSuspend = async (item: QueueItem, duration: '24h' | '7d' | '30d') => {
    if (!actionNotes.trim()) {
      Alert.alert('Error', 'Please enter a reason for the suspension');
      return;
    }
    Alert.alert(
      'Confirm Suspension',
      `Suspend user for ${duration}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Suspend',
          style: 'destructive',
          onPress: async () => {
            try {
              await suspendMutation.mutateAsync({
                targetUserId: item.target_user_id,
                reason: actionNotes,
                duration,
                queueItemId: item.id,
              });
              await resolveMutation.mutateAsync({
                itemId: item.id,
                resolution: `User suspended for ${duration}`,
                actionTaken: `suspended_${duration}`,
                internalNotes: actionNotes,
              });
              setSelectedItem(null);
              setActionNotes('');
              Alert.alert('Success', `User suspended for ${duration}`);
            } catch {
              Alert.alert('Error', 'Failed to suspend user');
            }
          },
        },
      ]
    );
  };

  const renderQueueItem = ({ item, index }: { item: QueueItem; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 50)}
      className="mb-3"
    >
      <Pressable
        onPress={() => setSelectedItem(item)}
        className="bg-zinc-900 rounded-xl p-4 border border-zinc-800"
      >
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-2">
            <View
              className="px-2 py-1 rounded-full"
              style={{ backgroundColor: priorityColors[item.priority] + '30' }}
            >
              <Text style={{ color: priorityColors[item.priority] }} className="text-xs font-bold uppercase">
                {item.priority}
              </Text>
            </View>
            <View className="flex-row items-center gap-1 bg-zinc-800 px-2 py-1 rounded-full">
              <ItemTypeIcon type={item.item_type} />
              <Text className="text-gray-400 text-xs">{item.item_type}</Text>
            </View>
          </View>
          <View
            className="px-2 py-1 rounded-full"
            style={{ backgroundColor: statusColors[item.status] + '20' }}
          >
            <Text style={{ color: statusColors[item.status] }} className="text-xs">
              {item.status}
            </Text>
          </View>
        </View>

        <Text className="text-white font-medium mb-1">{item.reason}</Text>
        
        <View className="flex-row items-center gap-2 mt-2">
          <User size={14} color="#6b7280" />
          <Text className="text-gray-400 text-sm">
            {(item.target_user as { display_name?: string })?.display_name ?? 'Unknown User'}
          </Text>
          {((item.target_user as { warning_count?: number })?.warning_count ?? 0) > 0 && (
            <View className="bg-red-500/20 px-2 py-0.5 rounded-full">
              <Text className="text-red-400 text-xs">
                {(item.target_user as { warning_count: number }).warning_count} warnings
              </Text>
            </View>
          )}
        </View>

        <Text className="text-gray-500 text-xs mt-2">
          {new Date(item.created_at).toLocaleString()}
        </Text>
      </Pressable>
    </Animated.View>
  );

  return (
    <View className="flex-1 bg-black">
      <LinearGradient colors={['#1a0a1a', '#0d0d0d', '#0a0a14']} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1" edges={['top']}>
          {/* Header */}
          <View className="px-5 py-3 flex-row items-center justify-between border-b border-zinc-800">
            <View className="flex-row items-center gap-3">
              <Pressable onPress={() => router.back()}>
                <ChevronLeft size={24} color="white" />
              </Pressable>
              <Shield size={24} color="#c084fc" />
              <Text className="text-white text-xl font-bold">Moderation</Text>
            </View>
            <View className="bg-purple-500/20 px-3 py-1 rounded-full">
              <Text className="text-purple-300 text-sm capitalize">{modStatus.role}</Text>
            </View>
          </View>

          {/* Stats */}
          {stats && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="px-5 py-3"
              contentContainerStyle={{ gap: 12 }}
            >
              <View className="bg-red-500/20 px-4 py-2 rounded-xl">
                <Text className="text-red-400 text-2xl font-bold">{stats.urgent_reports}</Text>
                <Text className="text-red-300 text-xs">Urgent</Text>
              </View>
              <View className="bg-amber-500/20 px-4 py-2 rounded-xl">
                <Text className="text-amber-400 text-2xl font-bold">{stats.pending_reports}</Text>
                <Text className="text-amber-300 text-xs">Pending</Text>
              </View>
              <View className="bg-blue-500/20 px-4 py-2 rounded-xl">
                <Text className="text-blue-400 text-2xl font-bold">{stats.in_review}</Text>
                <Text className="text-blue-300 text-xs">In Review</Text>
              </View>
              <View className="bg-purple-500/20 px-4 py-2 rounded-xl">
                <Text className="text-purple-400 text-2xl font-bold">{stats.pending_appeals}</Text>
                <Text className="text-purple-300 text-xs">Appeals</Text>
              </View>
              <View className="bg-zinc-700/50 px-4 py-2 rounded-xl">
                <Text className="text-gray-300 text-2xl font-bold">{stats.actions_today}</Text>
                <Text className="text-gray-400 text-xs">Today</Text>
              </View>
            </ScrollView>
          )}

          {/* Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-5 py-2"
            contentContainerStyle={{ gap: 8 }}
          >
            {(['pending', 'in_review', 'escalated', 'resolved', 'dismissed'] as QueueStatus[]).map((status) => (
              <Pressable
                key={status}
                onPress={() => setSelectedStatus(selectedStatus === status ? undefined : status)}
                className={`px-4 py-2 rounded-full ${
                  selectedStatus === status ? 'bg-purple-600' : 'bg-zinc-800'
                }`}
              >
                <Text className={selectedStatus === status ? 'text-white' : 'text-gray-400'}>
                  {status.replace('_', ' ')}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Queue List */}
          {loadingQueue ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#c084fc" />
            </View>
          ) : queue && queue.length > 0 ? (
            <FlatList
              data={queue}
              keyExtractor={(item) => item.id}
              renderItem={renderQueueItem}
              contentContainerStyle={{ padding: 20 }}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <CheckCircle size={48} color="#10b981" />
              <Text className="text-white text-lg font-medium mt-3">All Clear!</Text>
              <Text className="text-gray-400 mt-1">No items in queue</Text>
            </View>
          )}

          {/* Detail Modal */}
          {selectedItem && (
            <View className="absolute inset-0 bg-black/90">
              <SafeAreaView className="flex-1">
                <ScrollView className="flex-1 px-5">
                  {/* Header */}
                  <View className="flex-row items-center justify-between py-4">
                    <Text className="text-white text-xl font-bold">Review Item</Text>
                    <Pressable onPress={() => setSelectedItem(null)}>
                      <XCircle size={28} color="#6b7280" />
                    </Pressable>
                  </View>

                  {/* Item Details */}
                  <View className="bg-zinc-900 rounded-xl p-4 mb-4">
                    <View className="flex-row items-center gap-2 mb-3">
                      <View
                        className="px-2 py-1 rounded-full"
                        style={{ backgroundColor: priorityColors[selectedItem.priority] + '30' }}
                      >
                        <Text style={{ color: priorityColors[selectedItem.priority] }} className="font-bold uppercase">
                          {selectedItem.priority}
                        </Text>
                      </View>
                      <Text className="text-gray-400">{selectedItem.item_type}</Text>
                    </View>

                    <Text className="text-white text-lg font-medium mb-2">{selectedItem.reason}</Text>
                    
                    {selectedItem.details && (
                      <Text className="text-gray-300 mb-3">{selectedItem.details}</Text>
                    )}

                    <View className="border-t border-zinc-700 pt-3 mt-3">
                      <Text className="text-gray-400 text-sm">Reported User:</Text>
                      <Text className="text-white">
                        {(selectedItem.target_user as { display_name?: string })?.display_name}
                      </Text>
                    </View>

                    {selectedItem.reporter && (
                      <View className="mt-2">
                        <Text className="text-gray-400 text-sm">Reported By:</Text>
                        <Text className="text-white">
                          {(selectedItem.reporter as { display_name?: string })?.display_name}
                        </Text>
                      </View>
                    )}

                    <Text className="text-gray-500 text-xs mt-3">
                      {new Date(selectedItem.created_at).toLocaleString()}
                    </Text>
                  </View>

                  {/* Action Notes */}
                  <View className="mb-4">
                    <Text className="text-gray-400 mb-2">Action Notes</Text>
                    <TextInput
                      value={actionNotes}
                      onChangeText={setActionNotes}
                      placeholder="Enter reason for action..."
                      placeholderTextColor="#6b7280"
                      multiline
                      numberOfLines={3}
                      className="bg-zinc-900 rounded-xl p-4 text-white border border-zinc-700"
                    />
                  </View>

                  {/* Action Buttons */}
                  <View className="gap-3">
                    {selectedItem.status === 'pending' && (
                      <Pressable
                        onPress={() => handleAssign(selectedItem)}
                        className="bg-blue-600 py-3 rounded-xl flex-row items-center justify-center gap-2"
                      >
                        <Clock size={20} color="white" />
                        <Text className="text-white font-medium">Assign to Me</Text>
                      </Pressable>
                    )}

                    <Pressable
                      onPress={() => handleWarn(selectedItem)}
                      className="bg-amber-600 py-3 rounded-xl flex-row items-center justify-center gap-2"
                    >
                      <AlertTriangle size={20} color="white" />
                      <Text className="text-white font-medium">Issue Warning</Text>
                    </Pressable>

                    <View className="flex-row gap-3">
                      <Pressable
                        onPress={() => handleSuspend(selectedItem, '24h')}
                        className="flex-1 bg-orange-600 py-3 rounded-xl items-center"
                      >
                        <Text className="text-white font-medium">24h</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleSuspend(selectedItem, '7d')}
                        className="flex-1 bg-orange-700 py-3 rounded-xl items-center"
                      >
                        <Text className="text-white font-medium">7 days</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleSuspend(selectedItem, '30d')}
                        className="flex-1 bg-red-600 py-3 rounded-xl items-center"
                      >
                        <Text className="text-white font-medium">30 days</Text>
                      </Pressable>
                    </View>

                    <Pressable
                      onPress={() => handleDismiss(selectedItem)}
                      className="bg-zinc-700 py-3 rounded-xl flex-row items-center justify-center gap-2"
                    >
                      <XCircle size={20} color="white" />
                      <Text className="text-white font-medium">Dismiss Report</Text>
                    </Pressable>
                  </View>

                  <View className="h-20" />
                </ScrollView>
              </SafeAreaView>
            </View>
          )}
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
