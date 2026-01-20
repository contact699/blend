import { View, Text, Pressable, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { X, UserCheck, Check, XCircle, Users, Award } from 'lucide-react-native';
import { haptics } from '@/lib/haptics';
import { Vouch, VouchStats } from '@/lib/types/trust-signals';

export default function VouchesScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'received' | 'given'>('received');
  const [receivedVouches, setReceivedVouches] = useState<Vouch[]>([]);
  const [givenVouches, setGivenVouches] = useState<Vouch[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Vouch[]>([]);
  const [stats, setStats] = useState<VouchStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadVouches();
  }, []);

  const loadVouches = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual Supabase query
      // const { data: received } = await supabase
      //   .from('vouches')
      //   .select('*, from_user:users!vouches_from_user_id_fkey(id, profile:profiles(*))')
      //   .eq('to_user_id', currentUserId)
      //   .order('created_at', { ascending: false });

      // Mock data for now
      const mockReceived: Vouch[] = [
        {
          id: '1',
          from_user_id: 'user1',
          to_user_id: 'current_user',
          status: 'approved',
          relationship: 'met_irl',
          message: 'Met at the SF Poly Meetup. Great person!',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          approved_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          rejected_at: null,
          revoked_at: null,
          rejection_reason: null,
        },
        {
          id: '2',
          from_user_id: 'user2',
          to_user_id: 'current_user',
          status: 'pending',
          relationship: 'community_member',
          message: 'We chat often in the Discord server',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          approved_at: null,
          rejected_at: null,
          revoked_at: null,
          rejection_reason: null,
        },
      ];

      const mockGiven: Vouch[] = [
        {
          id: '3',
          from_user_id: 'current_user',
          to_user_id: 'user3',
          status: 'approved',
          relationship: 'partner',
          message: null,
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          approved_at: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString(),
          rejected_at: null,
          revoked_at: null,
          rejection_reason: null,
        },
      ];

      setReceivedVouches(mockReceived.filter((v) => v.status !== 'pending'));
      setPendingRequests(mockReceived.filter((v) => v.status === 'pending'));
      setGivenVouches(mockGiven);

      setStats({
        total_vouches: mockReceived.filter((v) => v.status === 'approved').length,
        pending_requests: mockReceived.filter((v) => v.status === 'pending').length,
        given_vouches: mockGiven.filter((v) => v.status === 'approved').length,
        received_vouches: mockReceived.filter((v) => v.status === 'approved').length,
      });
    } catch (error) {
      console.error('Failed to load vouches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveVouch = async (vouchId: string) => {
    haptics.success();

    try {
      // TODO: Implement Supabase update
      // await supabase
      //   .from('vouches')
      //   .update({ status: 'approved', approved_at: new Date().toISOString() })
      //   .eq('id', vouchId);

      Alert.alert('Vouch Approved', 'Thank you for helping build trust in the community!');
      loadVouches();
    } catch (error) {
      console.error('Failed to approve vouch:', error);
      Alert.alert('Error', 'Failed to approve vouch. Please try again.');
    }
  };

  const handleRejectVouch = async (vouchId: string) => {
    haptics.warning();

    Alert.alert(
      'Reject Vouch Request?',
      'This will decline the vouch request.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Implement Supabase update
              // await supabase
              //   .from('vouches')
              //   .update({ status: 'rejected', rejected_at: new Date().toISOString() })
              //   .eq('id', vouchId);

              loadVouches();
            } catch (error) {
              console.error('Failed to reject vouch:', error);
              Alert.alert('Error', 'Failed to reject vouch. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleRevokeVouch = async (vouchId: string) => {
    haptics.warning();

    Alert.alert(
      'Revoke Vouch?',
      'This will remove your vouch for this person.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Implement Supabase update
              // await supabase
              //   .from('vouches')
              //   .update({ status: 'revoked', revoked_at: new Date().toISOString() })
              //   .eq('id', vouchId);

              loadVouches();
            } catch (error) {
              console.error('Failed to revoke vouch:', error);
              Alert.alert('Error', 'Failed to revoke vouch. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getRelationshipLabel = (relationship: string): string => {
    const labels: Record<string, string> = {
      met_irl: 'Met IRL',
      partner: 'Partner',
      friend: 'Friend',
      event_cohost: 'Event Co-Host',
      community_member: 'Community Member',
    };
    return labels[relationship] || relationship;
  };

  const renderVouchItem = (vouch: Vouch, isPending: boolean) => {
    const isGiven = vouch.from_user_id === 'current_user';

    return (
      <View key={vouch.id} className="bg-zinc-900 rounded-2xl p-4 mb-3 border border-zinc-800">
        {/* User Info */}
        <View className="flex-row items-center mb-3">
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' }}
            className="w-12 h-12 rounded-full"
          />
          <View className="flex-1 ml-3">
            <Text className="text-white font-semibold">
              {isGiven ? 'User Name' : 'Voucher Name'}
            </Text>
            <View className="flex-row items-center mt-1">
              <View className="bg-purple-500/20 px-2 py-1 rounded-full">
                <Text className="text-purple-300 text-xs font-medium">
                  {getRelationshipLabel(vouch.relationship)}
                </Text>
              </View>
            </View>
          </View>

          {/* Status Badge */}
          {vouch.status === 'approved' && (
            <View className="bg-green-500/20 px-3 py-1 rounded-full">
              <Text className="text-green-400 text-xs font-bold">Approved</Text>
            </View>
          )}
        </View>

        {/* Message */}
        {vouch.message && (
          <View className="bg-zinc-800/50 rounded-xl p-3 mb-3">
            <Text className="text-gray-300 text-sm">{vouch.message}</Text>
          </View>
        )}

        {/* Date */}
        <Text className="text-gray-500 text-xs mb-3">
          {new Date(vouch.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>

        {/* Actions */}
        {isPending && !isGiven && (
          <View className="flex-row space-x-2">
            <Pressable
              onPress={() => handleApproveVouch(vouch.id)}
              className="flex-1 rounded-xl overflow-hidden"
              accessibilityRole="button"
              accessibilityLabel="Approve vouch"
            >
              <LinearGradient
                colors={['#10b981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ paddingVertical: 12, alignItems: 'center' }}
              >
                <View className="flex-row items-center">
                  <Check size={18} color="white" />
                  <Text className="text-white font-semibold ml-2">Approve</Text>
                </View>
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={() => handleRejectVouch(vouch.id)}
              className="flex-1 bg-zinc-800 py-3 rounded-xl items-center"
              accessibilityRole="button"
              accessibilityLabel="Reject vouch"
            >
              <View className="flex-row items-center">
                <XCircle size={18} color="#ef4444" />
                <Text className="text-red-400 font-semibold ml-2">Reject</Text>
              </View>
            </Pressable>
          </View>
        )}

        {isGiven && vouch.status === 'approved' && (
          <Pressable
            onPress={() => handleRevokeVouch(vouch.id)}
            className="bg-zinc-800 py-3 rounded-xl items-center"
            accessibilityRole="button"
            accessibilityLabel="Revoke vouch"
          >
            <Text className="text-red-400 font-medium">Revoke Vouch</Text>
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-black">
      <LinearGradient colors={['#1a0a1a', '#0d0d0d', '#0a0a14']} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1" edges={['top']}>
          {/* Header */}
          <View className="px-5 py-3 flex-row items-center justify-between border-b border-zinc-800">
            <View className="flex-1">
              <Text className="text-white text-xl font-bold">Community Vouches</Text>
              {stats && (
                <Text className="text-gray-400 text-sm mt-0.5">
                  {stats.total_vouches} vouches • {stats.pending_requests} pending
                </Text>
              )}
            </View>
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <X size={24} color="#fff" />
            </Pressable>
          </View>

          {/* Stats Cards */}
          {stats && (
            <View className="px-5 py-4">
              <View className="flex-row space-x-3">
                <View className="flex-1 bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800">
                  <View className="w-10 h-10 bg-purple-500/20 rounded-full items-center justify-center mb-2">
                    <Award size={20} color="#a855f7" />
                  </View>
                  <Text className="text-white text-2xl font-bold">{stats.received_vouches}</Text>
                  <Text className="text-gray-400 text-xs mt-1">Received</Text>
                </View>

                <View className="flex-1 bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800">
                  <View className="w-10 h-10 bg-pink-500/20 rounded-full items-center justify-center mb-2">
                    <Users size={20} color="#ec4899" />
                  </View>
                  <Text className="text-white text-2xl font-bold">{stats.given_vouches}</Text>
                  <Text className="text-gray-400 text-xs mt-1">Given</Text>
                </View>
              </View>
            </View>
          )}

          {/* Pending Requests Banner */}
          {pendingRequests.length > 0 && (
            <View className="mx-5 mb-4">
              <View className="bg-purple-500/10 rounded-2xl p-4 border border-purple-500/30">
                <View className="flex-row items-center">
                  <UserCheck size={20} color="#a855f7" />
                  <Text className="text-purple-300 font-semibold ml-2">
                    {pendingRequests.length} pending {pendingRequests.length === 1 ? 'request' : 'requests'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Tabs */}
          <View className="px-5 mb-4">
            <View className="flex-row bg-zinc-900/50 rounded-xl p-1">
              <Pressable
                onPress={() => {
                  haptics.tap();
                  setActiveTab('received');
                }}
                className={`flex-1 py-2 rounded-lg ${
                  activeTab === 'received' ? 'bg-purple-500' : ''
                }`}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === 'received' }}
              >
                <Text
                  className={`text-center font-semibold ${
                    activeTab === 'received' ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  Received
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  haptics.tap();
                  setActiveTab('given');
                }}
                className={`flex-1 py-2 rounded-lg ${
                  activeTab === 'given' ? 'bg-purple-500' : ''
                }`}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === 'given' }}
              >
                <Text
                  className={`text-center font-semibold ${
                    activeTab === 'given' ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  Given
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Content */}
          <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
            {isLoading ? (
              <View className="py-20 items-center">
                <ActivityIndicator color="white" size="large" />
              </View>
            ) : (
              <>
                {/* Pending Requests Section */}
                {activeTab === 'received' && pendingRequests.length > 0 && (
                  <View className="mb-6">
                    <Text className="text-white font-semibold mb-3">Pending Requests</Text>
                    {pendingRequests.map((vouch) => renderVouchItem(vouch, true))}
                  </View>
                )}

                {/* Vouches List */}
                {activeTab === 'received' && receivedVouches.length === 0 && (
                  <View className="py-20 items-center">
                    <UserCheck size={48} color="#6b7280" />
                    <Text className="text-gray-400 text-center mt-4">
                      No vouches yet
                    </Text>
                    <Text className="text-gray-500 text-sm text-center mt-2 px-8">
                      Request vouches from people you know to build trust
                    </Text>
                  </View>
                )}

                {activeTab === 'received' && receivedVouches.map((vouch) => renderVouchItem(vouch, false))}

                {activeTab === 'given' && givenVouches.length === 0 && (
                  <View className="py-20 items-center">
                    <Users size={48} color="#6b7280" />
                    <Text className="text-gray-400 text-center mt-4">
                      No vouches given yet
                    </Text>
                    <Text className="text-gray-500 text-sm text-center mt-2 px-8">
                      Vouch for people you know to help them build trust
                    </Text>
                  </View>
                )}

                {activeTab === 'given' && givenVouches.map((vouch) => renderVouchItem(vouch, false))}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
