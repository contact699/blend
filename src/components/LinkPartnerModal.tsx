import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  X,
  Search,
  UserPlus,
  Users,
  Check,
  Link,
  Unlink,
  Heart,
  Clock,
  ChevronRight,
  AlertCircle,
} from 'lucide-react-native';
import { LinkedPartner, Profile } from '@/lib/types';
import { MOCK_PROFILES } from '@/lib/mock-data';

interface LinkPartnerModalProps {
  visible: boolean;
  onClose: () => void;
  onLinkPartner: (partner: LinkedPartner) => void;
  existingPartners?: LinkedPartner[];
}

type LinkMode = 'search' | 'manual';

const RELATIONSHIP_TYPES = [
  { id: 'partner', label: 'Partner', emoji: '💜' },
  { id: 'nesting_partner', label: 'Nesting Partner', emoji: '🏠' },
  { id: 'anchor', label: 'Anchor Partner', emoji: '⚓' },
  { id: 'dating', label: 'Dating', emoji: '💕' },
  { id: 'comet', label: 'Comet', emoji: '☄️' },
  { id: 'meta', label: 'Metamour', emoji: '🤝' },
] as const;

export default function LinkPartnerModal({
  visible,
  onClose,
  onLinkPartner,
  existingPartners = [],
}: LinkPartnerModalProps) {
  const [mode, setMode] = useState<LinkMode>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [relationshipType, setRelationshipType] = useState<LinkedPartner['relationship_type']>('partner');
  const [relationshipDuration, setRelationshipDuration] = useState('');

  // Manual entry fields
  const [manualName, setManualName] = useState('');
  const [manualAge, setManualAge] = useState('');
  const [manualPhoto, setManualPhoto] = useState('');

  // Search results from mock profiles
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const existingIds = existingPartners
      .filter(p => p.blend_user_id)
      .map(p => p.blend_user_id);

    return MOCK_PROFILES.filter((profile: Profile) => {
      // Don't show already linked partners
      if (existingIds.includes(profile.user_id)) return false;

      // Search by name or city
      return (
        profile.display_name.toLowerCase().includes(query) ||
        profile.city.toLowerCase().includes(query)
      );
    }).slice(0, 10);
  }, [searchQuery, existingPartners]);

  const handleSelectProfile = useCallback((profile: Profile) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedProfile(profile);
  }, []);

  const handleLinkBlendUser = useCallback(() => {
    if (!selectedProfile) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const partner: LinkedPartner = {
      id: `partner-${Date.now()}`,
      name: selectedProfile.display_name,
      age: selectedProfile.age,
      photo: selectedProfile.photos?.[0],
      blend_user_id: selectedProfile.user_id,
      blend_profile: selectedProfile,
      is_on_blend: true,
      relationship_type: relationshipType,
      relationship_duration: relationshipDuration || undefined,
      link_status: 'pending', // They need to confirm
      linked_at: new Date().toISOString(),
    };

    onLinkPartner(partner);
    resetAndClose();
  }, [selectedProfile, relationshipType, relationshipDuration, onLinkPartner]);

  const handleAddManual = useCallback(() => {
    if (!manualName.trim() || !manualAge) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const partner: LinkedPartner = {
      id: `partner-manual-${Date.now()}`,
      name: manualName.trim(),
      age: parseInt(manualAge, 10),
      photo: manualPhoto || undefined,
      is_on_blend: false,
      relationship_type: relationshipType,
      relationship_duration: relationshipDuration || undefined,
    };

    onLinkPartner(partner);
    resetAndClose();
  }, [manualName, manualAge, manualPhoto, relationshipType, relationshipDuration, onLinkPartner]);

  const resetAndClose = () => {
    setSearchQuery('');
    setSelectedProfile(null);
    setRelationshipType('partner');
    setRelationshipDuration('');
    setManualName('');
    setManualAge('');
    setManualPhoto('');
    setMode('search');
    onClose();
  };

  const canSubmit = mode === 'search'
    ? selectedProfile !== null
    : manualName.trim().length > 0 && manualAge.length > 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-black">
        <LinearGradient
          colors={['#18181b', '#09090b', '#000000']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />

        <SafeAreaView className="flex-1" edges={['top']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
          >
            {/* Header */}
            <Animated.View
              entering={FadeIn.duration(300)}
              className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-800"
            >
              <Pressable
                onPress={resetAndClose}
                className="w-10 h-10 rounded-full bg-zinc-800/50 items-center justify-center"
              >
                <X size={22} color="white" />
              </Pressable>
              <Text className="text-white text-lg font-semibold">Link Partner</Text>
              <View className="w-10" />
            </Animated.View>

            {/* Mode Toggle */}
            <View className="flex-row mx-4 mt-4 p-1 bg-zinc-900 rounded-xl">
              <Pressable
                onPress={() => setMode('search')}
                className={`flex-1 py-3 rounded-lg ${mode === 'search' ? 'bg-purple-500/30' : ''}`}
              >
                <Text className={`text-center font-medium ${mode === 'search' ? 'text-purple-400' : 'text-zinc-400'}`}>
                  Search Blend
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setMode('manual')}
                className={`flex-1 py-3 rounded-lg ${mode === 'manual' ? 'bg-purple-500/30' : ''}`}
              >
                <Text className={`text-center font-medium ${mode === 'manual' ? 'text-purple-400' : 'text-zinc-400'}`}>
                  Add Manually
                </Text>
              </Pressable>
            </View>

            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            >
              {mode === 'search' ? (
                <SearchBlendMode
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  searchResults={searchResults}
                  selectedProfile={selectedProfile}
                  onSelectProfile={handleSelectProfile}
                />
              ) : (
                <ManualEntryMode
                  name={manualName}
                  setName={setManualName}
                  age={manualAge}
                  setAge={setManualAge}
                  photo={manualPhoto}
                  setPhoto={setManualPhoto}
                />
              )}

              {/* Relationship Details - shown for both modes */}
              {(selectedProfile || mode === 'manual') && (
                <Animated.View entering={FadeInDown.delay(200).duration(300)} className="mt-6">
                  <Text className="text-white font-semibold text-lg mb-3">Relationship Details</Text>

                  {/* Relationship Type */}
                  <Text className="text-zinc-400 text-sm mb-2">Relationship Type</Text>
                  <View className="flex-row flex-wrap gap-2 mb-4">
                    {RELATIONSHIP_TYPES.map((type) => (
                      <Pressable
                        key={type.id}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setRelationshipType(type.id as LinkedPartner['relationship_type']);
                        }}
                        className={`flex-row items-center px-3 py-2 rounded-full border ${
                          relationshipType === type.id
                            ? 'bg-purple-500/20 border-purple-500'
                            : 'bg-zinc-900 border-zinc-800'
                        }`}
                      >
                        <Text className="mr-1.5">{type.emoji}</Text>
                        <Text className={relationshipType === type.id ? 'text-purple-400' : 'text-zinc-400'}>
                          {type.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* Duration */}
                  <Text className="text-zinc-400 text-sm mb-2">How long together? (optional)</Text>
                  <TextInput
                    value={relationshipDuration}
                    onChangeText={setRelationshipDuration}
                    placeholder="e.g., 2 years, 6 months"
                    placeholderTextColor="#52525b"
                    className="bg-zinc-900 rounded-xl px-4 py-3 text-white border border-zinc-800"
                  />
                </Animated.View>
              )}

              {/* Info banner for manual entry */}
              {mode === 'manual' && (
                <Animated.View
                  entering={FadeInDown.delay(300).duration(300)}
                  className="mt-6 flex-row items-start bg-amber-500/10 rounded-xl p-4 border border-amber-500/30"
                >
                  <AlertCircle size={20} color="#f59e0b" />
                  <View className="flex-1 ml-3">
                    <Text className="text-amber-400 font-medium">Not on Blend</Text>
                    <Text className="text-amber-400/70 text-sm mt-1">
                      Manually added partners will show a "Not on Blend" badge. If they join later, you can link their profile.
                    </Text>
                  </View>
                </Animated.View>
              )}
            </ScrollView>

            {/* Submit Button */}
            <View className="px-4 pb-4 pt-2 border-t border-zinc-800">
              <Pressable
                onPress={mode === 'search' ? handleLinkBlendUser : handleAddManual}
                disabled={!canSubmit}
                className={`py-4 rounded-xl overflow-hidden ${!canSubmit ? 'opacity-50' : ''}`}
              >
                <LinearGradient
                  colors={canSubmit ? ['#a855f7', '#7c3aed'] : ['#3f3f46', '#27272a']}
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
                <View className="flex-row items-center justify-center">
                  {mode === 'search' ? (
                    <>
                      <Link size={20} color="white" />
                      <Text className="text-white font-semibold text-lg ml-2">
                        Send Link Request
                      </Text>
                    </>
                  ) : (
                    <>
                      <UserPlus size={20} color="white" />
                      <Text className="text-white font-semibold text-lg ml-2">
                        Add Partner
                      </Text>
                    </>
                  )}
                </View>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

// Search Blend Users Mode
function SearchBlendMode({
  searchQuery,
  setSearchQuery,
  searchResults,
  selectedProfile,
  onSelectProfile,
}: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Profile[];
  selectedProfile: Profile | null;
  onSelectProfile: (profile: Profile) => void;
}) {
  return (
    <>
      {/* Search Input */}
      <View className="flex-row items-center bg-zinc-900 rounded-xl px-4 border border-zinc-800">
        <Search size={20} color="#71717a" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by name..."
          placeholderTextColor="#52525b"
          className="flex-1 py-3 px-3 text-white"
          autoCapitalize="none"
        />
      </View>

      {/* Search Results */}
      {searchQuery.length > 0 && (
        <Animated.View entering={FadeInDown.duration(200)} className="mt-4">
          {searchResults.length === 0 ? (
            <View className="items-center py-8">
              <Users size={40} color="#52525b" />
              <Text className="text-zinc-500 mt-3">No users found</Text>
              <Text className="text-zinc-600 text-sm mt-1">Try a different name</Text>
            </View>
          ) : (
            <View className="gap-2">
              {searchResults.map((profile, index) => (
                <Animated.View key={profile.user_id} entering={FadeInDown.delay(index * 50)}>
                  <ProfileSearchResult
                    profile={profile}
                    isSelected={selectedProfile?.user_id === profile.user_id}
                    onSelect={() => onSelectProfile(profile)}
                  />
                </Animated.View>
              ))}
            </View>
          )}
        </Animated.View>
      )}

      {/* Empty state */}
      {searchQuery.length === 0 && !selectedProfile && (
        <View className="items-center py-12">
          <View className="w-20 h-20 rounded-full bg-purple-500/20 items-center justify-center mb-4">
            <Search size={36} color="#a855f7" />
          </View>
          <Text className="text-white font-semibold text-lg mb-2">Find Your Partner</Text>
          <Text className="text-zinc-400 text-center px-8">
            Search for your partner's name to link their Blend profile to yours
          </Text>
        </View>
      )}

      {/* Selected Profile Preview */}
      {selectedProfile && (
        <Animated.View entering={FadeInUp.springify()} className="mt-4">
          <Text className="text-zinc-400 text-sm mb-2">Selected Partner</Text>
          <View className="bg-purple-500/10 rounded-2xl p-4 border border-purple-500/30">
            <View className="flex-row items-center">
              {selectedProfile.photos?.[0] ? (
                <Image
                  source={{ uri: selectedProfile.photos[0] }}
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <View className="w-16 h-16 rounded-full bg-zinc-800 items-center justify-center">
                  <Users size={24} color="#71717a" />
                </View>
              )}
              <View className="flex-1 ml-4">
                <View className="flex-row items-center">
                  <Text className="text-white font-semibold text-lg">{selectedProfile.display_name}</Text>
                  <Text className="text-zinc-500 ml-2">{selectedProfile.age}</Text>
                </View>
                <Text className="text-zinc-400">{selectedProfile.city}</Text>
                <View className="flex-row items-center mt-1">
                  <View className="w-2 h-2 rounded-full bg-green-500 mr-1.5" />
                  <Text className="text-green-400 text-sm">On Blend</Text>
                </View>
              </View>
              <View className="w-8 h-8 rounded-full bg-purple-500 items-center justify-center">
                <Check size={18} color="white" />
              </View>
            </View>
          </View>
        </Animated.View>
      )}
    </>
  );
}

// Profile Search Result Item
function ProfileSearchResult({
  profile,
  isSelected,
  onSelect,
}: {
  profile: Profile;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <Pressable
      onPress={onSelect}
      className={`flex-row items-center p-3 rounded-xl border ${
        isSelected
          ? 'bg-purple-500/20 border-purple-500'
          : 'bg-zinc-900 border-zinc-800 active:bg-zinc-800'
      }`}
    >
      {profile.photos?.[0] ? (
        <Image
          source={{ uri: profile.photos[0] }}
          className="w-12 h-12 rounded-full"
        />
      ) : (
        <View className="w-12 h-12 rounded-full bg-zinc-800 items-center justify-center">
          <Users size={20} color="#71717a" />
        </View>
      )}
      <View className="flex-1 ml-3">
        <View className="flex-row items-center">
          <Text className="text-white font-medium">{profile.display_name}</Text>
          <Text className="text-zinc-500 ml-1">, {profile.age}</Text>
        </View>
        <Text className="text-zinc-500 text-sm">{profile.city}</Text>
      </View>
      {isSelected ? (
        <View className="w-6 h-6 rounded-full bg-purple-500 items-center justify-center">
          <Check size={14} color="white" />
        </View>
      ) : (
        <ChevronRight size={18} color="#52525b" />
      )}
    </Pressable>
  );
}

// Manual Entry Mode
function ManualEntryMode({
  name,
  setName,
  age,
  setAge,
  photo,
  setPhoto,
}: {
  name: string;
  setName: (name: string) => void;
  age: string;
  setAge: (age: string) => void;
  photo: string;
  setPhoto: (photo: string) => void;
}) {
  return (
    <Animated.View entering={FadeInDown.duration(300)}>
      <View className="items-center py-6 mb-4">
        <View className="w-20 h-20 rounded-full bg-zinc-800 items-center justify-center mb-3 border-2 border-dashed border-zinc-700">
          <UserPlus size={32} color="#71717a" />
        </View>
        <Text className="text-zinc-400 text-sm">Partner not on Blend?</Text>
        <Text className="text-white font-medium">Add them manually</Text>
      </View>

      {/* Name */}
      <Text className="text-zinc-400 text-sm mb-2">Partner's Name *</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Enter their name"
        placeholderTextColor="#52525b"
        className="bg-zinc-900 rounded-xl px-4 py-3 text-white border border-zinc-800 mb-4"
      />

      {/* Age */}
      <Text className="text-zinc-400 text-sm mb-2">Age *</Text>
      <TextInput
        value={age}
        onChangeText={setAge}
        placeholder="Enter their age"
        placeholderTextColor="#52525b"
        keyboardType="number-pad"
        className="bg-zinc-900 rounded-xl px-4 py-3 text-white border border-zinc-800 mb-4"
      />

      {/* Photo URL (optional) */}
      <Text className="text-zinc-400 text-sm mb-2">Photo URL (optional)</Text>
      <TextInput
        value={photo}
        onChangeText={setPhoto}
        placeholder="https://example.com/photo.jpg"
        placeholderTextColor="#52525b"
        autoCapitalize="none"
        className="bg-zinc-900 rounded-xl px-4 py-3 text-white border border-zinc-800"
      />
    </Animated.View>
  );
}
