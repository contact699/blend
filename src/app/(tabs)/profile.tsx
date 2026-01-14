import { View, Text, Pressable, Image, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Settings,
  MapPin,
  Edit3,
  Zap,
  Clock,
  Users,
  Heart,
  BookOpen,
  Sparkles,
  Shield,
  FileText,
  ChevronRight,
  User,
} from 'lucide-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, useCurrentUser, useCurrentProfile, getSignedPhotoUrls } from '@/lib/supabase';
import useDatingStore from '@/lib/state/dating-store';

interface ProfilePhoto {
  id: string;
  storage_path: string;
  signedUrl?: string | null;
}

interface ProfileIntent {
  intent_id: string;
  intents?: {
    id: string;
    label: string;
    emoji: string;
    description: string;
  };
}

interface PromptResponse {
  id: string;
  prompt_text: string;
  response_text: string;
}

interface LinkedPartner {
  id: string;
  name: string;
  relationship_type: string;
  status: string;
  linked_profile?: {
    display_name: string;
    age: number;
    photos?: Array<{ storage_path: string; signedUrl?: string }>;
  };
}

interface FullProfile {
  id: string;
  user_id: string;
  display_name: string;
  age: number;
  city: string;
  bio: string;
  pace_preference: 'slow' | 'medium' | 'fast';
  response_style: 'quick' | 'relaxed';
  open_to_meet: boolean;
  virtual_only: boolean;
  photos?: ProfilePhoto[];
  profile_intents?: ProfileIntent[];
  prompt_responses?: PromptResponse[];
}

export default function ProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { data: basicProfile, isLoading: profileLoading } = useCurrentProfile();
  const setOnboarded = useDatingStore((s) => s.setOnboarded);
  const setCurrentProfile = useDatingStore((s) => s.setCurrentProfile);

  // Fetch full profile with photos, intents, and prompts
  const { data: fullProfile, isLoading: fullProfileLoading } = useQuery({
    queryKey: ['full-profile', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          photos (*),
          profile_intents (
            intent_id,
            intents (id, label, emoji, description)
          ),
          prompt_responses (id, prompt_text, response_text)
        `)
        .eq('user_id', currentUser.id)
        .single();

      if (error) {
        console.error('[Profile] Error fetching full profile:', error);
        return null;
      }

      const profile = data as unknown as FullProfile;

      console.log('[Profile] Fetched profile:', profile.display_name, 'photos count:', profile.photos?.length);

      // Get signed URLs for photos
      if (profile.photos && profile.photos.length > 0) {
        const paths = profile.photos.map((p) => p.storage_path).filter(Boolean);
        console.log('[Profile] Photo paths to sign:', paths);

        if (paths.length > 0) {
          const signedUrls = await getSignedPhotoUrls(paths);
          console.log('[Profile] Signed URLs generated:', signedUrls.size);

          profile.photos = profile.photos.map((p) => ({
            ...p,
            signedUrl: p.storage_path ? signedUrls.get(p.storage_path) || null : null,
          }));

          const photosWithUrls = profile.photos.filter(p => p.signedUrl);
          console.log('[Profile] Photos with valid URLs:', photosWithUrls.length);
        }
      } else {
        console.log('[Profile] No photos found in profile');
      }

      return profile;
    },
    enabled: !!currentUser?.id,
  });

  // Fetch partner links - gracefully handle if table doesn't exist
  const { data: partnerLinks } = useQuery({
    queryKey: ['partner-links', fullProfile?.id],
    queryFn: async () => {
      if (!fullProfile?.id) return [];

      try {
        const { data, error } = await supabase
          .from('partner_links')
          .select(`
            *,
            linked_profile:profiles!partner_links_linked_user_id_fkey (
              display_name,
              age,
              photos (storage_path)
            )
          `)
          .eq('profile_id', fullProfile.id)
          .eq('status', 'confirmed');

        if (error) {
          // Log the actual error - could be table doesn't exist
          const errorMsg = error?.message ?? error?.code ?? 'Unknown error';
          console.log('[Profile] Partner links query error (table may not exist yet):', errorMsg);
          return [];
        }

        return (data ?? []) as LinkedPartner[];
      } catch (err) {
        console.log('[Profile] Partner links exception:', err);
        return [];
      }
    },
    enabled: !!fullProfile?.id,
  });

  const isLoading = userLoading || profileLoading || fullProfileLoading;

  if (isLoading) {
    return (
      <View className="flex-1 bg-black">
        <LinearGradient
          colors={['#1a0a1a', '#0d0d0d', '#0a0a14']}
          style={{ flex: 1 }}
        >
          <SafeAreaView className="flex-1 items-center justify-center" edges={['top']}>
            <ActivityIndicator size="large" color="#c084fc" />
            <Text className="text-gray-400 mt-4">Loading profile...</Text>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  if (!fullProfile) {
    return (
      <View className="flex-1 bg-black">
        <LinearGradient
          colors={['#1a0a1a', '#0d0d0d', '#0a0a14']}
          style={{ flex: 1 }}
        >
          <SafeAreaView className="flex-1 items-center justify-center" edges={['top']}>
            <Text className="text-white text-lg mb-4">Profile not found</Text>
            <Pressable
              onPress={() => router.replace('/auth')}
              className="bg-purple-500 px-6 py-3 rounded-xl"
            >
              <Text className="text-white font-semibold">Sign In</Text>
            </Pressable>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  const userIntents = fullProfile.profile_intents?.filter((pi) => pi.intents) ?? [];
  const primaryPhoto = fullProfile.photos?.find((p) => p.signedUrl)?.signedUrl;
  const linkedPartner = partnerLinks && partnerLinks.length > 0 ? partnerLinks[0] : null;

  const handleLogout = async () => {
    console.log('[Logout] Starting logout...');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.log('[Logout] Error signing out:', error.message);
      } else {
        console.log('[Logout] Supabase signOut successful');
      }

      setOnboarded(false);
      setCurrentProfile(null);
      queryClient.clear();
      router.replace('/auth');
    } catch (err) {
      console.log('[Logout] Unexpected error:', err);
    }
  };

  const handleEditProfile = () => {
    router.push('/edit-profile');
  };

  const paceLabels = {
    slow: 'Taking it slow',
    medium: 'Moderate pace',
    fast: 'Moving quickly',
  };

  const responseLabels = {
    quick: 'Quick responder',
    relaxed: 'Relaxed responder',
  };

  return (
    <View className="flex-1 bg-black">
      <LinearGradient
        colors={['#1a0a1a', '#0d0d0d', '#0a0a14']}
        style={{ flex: 1 }}
      >
        <SafeAreaView className="flex-1" edges={['top']}>
          {/* Header */}
          <View className="px-5 py-3 flex-row items-center justify-between">
            <Text className="text-white text-2xl font-bold">Profile</Text>
            <Pressable
              onPress={() => router.push('/settings')}
              className="w-10 h-10 bg-zinc-900 rounded-full items-center justify-center border border-zinc-800"
            >
              <Settings size={20} color="#9ca3af" />
            </Pressable>
          </View>

          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* Profile Header */}
            <View className="items-center px-5 mb-6">
              <View className="relative mb-4">
                {primaryPhoto ? (
                  <Image
                    source={{ uri: primaryPhoto }}
                    className="w-28 h-28 rounded-full border-2 border-purple-500/30"
                  />
                ) : (
                  <View className="w-28 h-28 rounded-full border-2 border-purple-500/30 bg-zinc-800 items-center justify-center">
                    <User size={48} color="#6b7280" />
                  </View>
                )}
                <Pressable
                  onPress={handleEditProfile}
                  className="absolute bottom-0 right-0 w-9 h-9 rounded-full items-center justify-center border-4 border-black overflow-hidden"
                >
                  <LinearGradient
                    colors={['#9333ea', '#db2777']}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Edit3 size={16} color="white" />
                  </LinearGradient>
                </Pressable>
              </View>
              <Text className="text-white text-2xl font-bold">
                {fullProfile.display_name}, {fullProfile.age}
              </Text>
              <View className="flex-row items-center mt-1">
                <MapPin size={14} color="#c084fc" />
                <Text className="text-purple-300 ml-1">{fullProfile.city}</Text>
              </View>
            </View>

            {/* Linked Partner */}
            {linkedPartner && (
              <View className="mx-5 mb-6">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-gray-500 text-xs uppercase tracking-wide">
                    Linked Partner
                  </Text>
                  <Pressable onPress={() => router.push('/link-partner')}>
                    <Text className="text-purple-400 text-sm">Manage</Text>
                  </Pressable>
                </View>
                <Pressable
                  onPress={() => router.push('/link-partner')}
                  className="bg-pink-500/10 rounded-xl p-4 border border-pink-500/30 active:bg-pink-500/20"
                >
                  <View className="flex-row items-center">
                    {linkedPartner.linked_profile?.photos?.[0]?.signedUrl ? (
                      <Image
                        source={{ uri: linkedPartner.linked_profile.photos[0].signedUrl }}
                        className="w-16 h-16 rounded-full border-2 border-pink-500/30"
                      />
                    ) : (
                      <View className="w-16 h-16 bg-pink-500/20 rounded-full items-center justify-center border-2 border-pink-500/30">
                        <Heart size={24} color="#ec4899" />
                      </View>
                    )}
                    <View className="ml-4 flex-1">
                      <Text className="text-white font-semibold text-lg">
                        {linkedPartner.linked_profile?.display_name ?? linkedPartner.name}
                        {linkedPartner.linked_profile?.age ? `, ${linkedPartner.linked_profile.age}` : ''}
                      </Text>
                      <Text className="text-pink-300 text-sm mt-0.5">
                        {linkedPartner.relationship_type === 'anchor' ? 'Anchor Partner' :
                         linkedPartner.relationship_type === 'nesting_partner' ? 'Nesting Partner' :
                         linkedPartner.relationship_type === 'partner' ? 'Partner' :
                         linkedPartner.relationship_type}
                      </Text>
                    </View>
                    <View className="bg-pink-500/20 px-3 py-1.5 rounded-full">
                      <Text className="text-pink-300 text-xs font-medium">Linked</Text>
                    </View>
                  </View>
                </Pressable>
              </View>
            )}

            {/* Relationship Hub */}
            <View className="mx-5 mb-6">
              <Text className="text-gray-500 text-xs uppercase tracking-wide mb-2">
                Relationship Tools
              </Text>
              <Pressable
                onPress={() => router.push('/my-relationships')}
                className="overflow-hidden rounded-xl mb-3"
              >
                <LinearGradient
                  colors={['#7c3aed', '#db2777']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ padding: 16 }}
                >
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 bg-white/20 rounded-xl items-center justify-center mr-4">
                      <Heart size={24} color="white" fill="white" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-bold text-lg">My Relationships</Text>
                      <Text className="text-white/70 text-sm">
                        Polycule map, calendar, agreements
                      </Text>
                    </View>
                    <ChevronRight size={24} color="white" />
                  </View>
                </LinearGradient>
              </Pressable>

              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => router.push('/education')}
                  className="flex-1 bg-zinc-900/80 rounded-xl p-3 border border-zinc-800 active:bg-zinc-800"
                >
                  <View className="flex-row items-center">
                    <View className="w-9 h-9 bg-purple-500/20 rounded-lg items-center justify-center mr-2">
                      <BookOpen size={18} color="#c084fc" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white text-sm font-medium">Learn</Text>
                      <Text className="text-zinc-500 text-xs">ENM guides</Text>
                    </View>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => router.push('/quiz')}
                  className="flex-1 bg-zinc-900/80 rounded-xl p-3 border border-zinc-800 active:bg-zinc-800"
                >
                  <View className="flex-row items-center">
                    <View className="w-9 h-9 bg-amber-500/20 rounded-lg items-center justify-center mr-2">
                      <Sparkles size={18} color="#f59e0b" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white text-sm font-medium">Quiz</Text>
                      <Text className="text-zinc-500 text-xs">Your style</Text>
                    </View>
                  </View>
                </Pressable>
              </View>

              <View className="flex-row gap-2 mt-2">
                <Pressable
                  onPress={() => router.push('/sti-safety')}
                  className="flex-1 bg-zinc-900/80 rounded-xl p-3 border border-zinc-800 active:bg-zinc-800"
                >
                  <View className="flex-row items-center">
                    <View className="w-9 h-9 bg-blue-500/20 rounded-lg items-center justify-center mr-2">
                      <Shield size={18} color="#3b82f6" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white text-sm font-medium">Safety</Text>
                      <Text className="text-zinc-500 text-xs">STI status</Text>
                    </View>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => router.push('/consent-checklist')}
                  className="flex-1 bg-zinc-900/80 rounded-xl p-3 border border-zinc-800 active:bg-zinc-800"
                >
                  <View className="flex-row items-center">
                    <View className="w-9 h-9 bg-teal-500/20 rounded-lg items-center justify-center mr-2">
                      <FileText size={18} color="#14b8a6" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white text-sm font-medium">Consent</Text>
                      <Text className="text-zinc-500 text-xs">Preferences</Text>
                    </View>
                  </View>
                </Pressable>
              </View>
            </View>

            {/* Bio */}
            {fullProfile.bio && (
              <View className="mx-5 mb-6">
                <Text className="text-gray-500 text-xs uppercase tracking-wide mb-2">
                  About
                </Text>
                <Pressable
                  onPress={handleEditProfile}
                  className="bg-zinc-900/80 rounded-xl p-4 border border-zinc-800 active:bg-zinc-800"
                >
                  <Text className="text-white">{fullProfile.bio}</Text>
                </Pressable>
              </View>
            )}

            {/* Intents */}
            {userIntents.length > 0 && (
              <View className="mx-5 mb-6">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-gray-500 text-xs uppercase tracking-wide">
                    Your Interests
                  </Text>
                  <Pressable onPress={handleEditProfile}>
                    <Text className="text-purple-400 text-sm">Edit</Text>
                  </Pressable>
                </View>
                <View className="flex-row flex-wrap">
                  {userIntents.map((pi) => (
                    <View
                      key={pi.intent_id}
                      className="bg-purple-500/15 px-3 py-2 rounded-full mr-2 mb-2 flex-row items-center border border-purple-500/30"
                    >
                      <Text className="mr-1">{pi.intents?.emoji}</Text>
                      <Text className="text-purple-300 text-sm">{pi.intents?.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Preferences */}
            <View className="mx-5 mb-6">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-gray-500 text-xs uppercase tracking-wide">
                  Preferences
                </Text>
                <Pressable onPress={handleEditProfile}>
                  <Text className="text-purple-400 text-sm">Edit</Text>
                </Pressable>
              </View>
              <View className="bg-zinc-900/80 rounded-xl overflow-hidden border border-zinc-800">
                <View className="flex-row items-center p-4 border-b border-zinc-800">
                  <View className="w-10 h-10 bg-purple-500/20 rounded-full items-center justify-center">
                    <Zap size={20} color="#c084fc" />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-white font-medium">Dating Pace</Text>
                    <Text className="text-gray-400 text-sm">
                      {paceLabels[fullProfile.pace_preference]}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center p-4 border-b border-zinc-800">
                  <View className="w-10 h-10 bg-pink-500/20 rounded-full items-center justify-center">
                    <Clock size={20} color="#ec4899" />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-white font-medium">Response Style</Text>
                    <Text className="text-gray-400 text-sm">
                      {responseLabels[fullProfile.response_style]}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center p-4">
                  <View className="w-10 h-10 bg-blue-500/20 rounded-full items-center justify-center">
                    <Users size={20} color="#3b82f6" />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-white font-medium">Open to Meet</Text>
                    <Text className="text-gray-400 text-sm">
                      {fullProfile.open_to_meet ? 'Yes, open to meeting' : 'Not right now'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Prompts */}
            {fullProfile.prompt_responses && fullProfile.prompt_responses.length > 0 && (
              <View className="mx-5 mb-6">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-gray-500 text-xs uppercase tracking-wide">
                    Your Prompts
                  </Text>
                  <Pressable onPress={handleEditProfile}>
                    <Text className="text-purple-400 text-sm">Edit</Text>
                  </Pressable>
                </View>
                {fullProfile.prompt_responses.map((pr) => (
                  <View
                    key={pr.id}
                    className="bg-zinc-900/80 rounded-xl p-4 mb-3 border border-zinc-800"
                  >
                    <Text className="text-purple-300 text-sm mb-1">
                      {pr.prompt_text}
                    </Text>
                    <Text className="text-white">{pr.response_text}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Edit Profile Button */}
            <View className="mx-5 mb-4">
              <Pressable
                onPress={handleEditProfile}
                className="rounded-xl overflow-hidden"
              >
                <LinearGradient
                  colors={['#9333ea', '#db2777']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ paddingVertical: 14, alignItems: 'center' }}
                >
                  <Text className="text-white font-semibold">Edit Profile</Text>
                </LinearGradient>
              </Pressable>
            </View>

            {/* Logout */}
            <View className="mx-5">
              <Pressable
                onPress={handleLogout}
                className="bg-zinc-900/80 rounded-xl p-4 items-center active:bg-zinc-800 border border-zinc-800"
              >
                <Text className="text-pink-400 font-medium">Log Out</Text>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
