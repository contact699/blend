import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
  TextInput,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  Plus,
  X,
  Check,
  Heart,
  UserPlus,
} from 'lucide-react-native';
import useDatingStore from '@/lib/state/dating-store';
import { INTENTS } from '@/lib/mock-data';
import { Intent, LinkedPartner } from '@/lib/types';
import { cn } from '@/lib/cn';

export default function EditProfileScreen() {
  const router = useRouter();
  const currentProfile = useDatingStore((s) => s.currentProfile);
  const updateProfile = useDatingStore((s) => s.updateProfile);

  const [displayName, setDisplayName] = useState(currentProfile?.display_name || '');
  const [age, setAge] = useState(currentProfile?.age?.toString() || '');
  const [city, setCity] = useState(currentProfile?.city || '');
  const [bio, setBio] = useState(currentProfile?.bio || '');
  const [photos, setPhotos] = useState<string[]>(currentProfile?.photos || []);
  const [selectedIntents, setSelectedIntents] = useState<string[]>(
    currentProfile?.intent_ids || []
  );
  const [pacePreference, setPacePreference] = useState<'slow' | 'medium' | 'fast'>(
    currentProfile?.pace_preference || 'medium'
  );
  const [openToMeet, setOpenToMeet] = useState(currentProfile?.open_to_meet || false);

  // Linked partner state
  const [hasPartner, setHasPartner] = useState(!!currentProfile?.linked_partner);
  const [partnerName, setPartnerName] = useState(currentProfile?.linked_partner?.name || '');
  const [partnerAge, setPartnerAge] = useState(currentProfile?.linked_partner?.age?.toString() || '');
  const [partnerPhoto, setPartnerPhoto] = useState<string | undefined>(currentProfile?.linked_partner?.photo);

  const handleAddPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  const handleAddPartnerPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPartnerPhoto(result.assets[0].uri);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleToggleIntent = (intentId: string) => {
    if (selectedIntents.includes(intentId)) {
      setSelectedIntents(selectedIntents.filter((id) => id !== intentId));
    } else {
      setSelectedIntents([...selectedIntents, intentId]);
    }
  };

  const handleSave = () => {
    let linkedPartner: LinkedPartner | undefined;

    if (hasPartner && partnerName.trim() && partnerAge) {
      linkedPartner = {
        id: `partner-${Date.now()}`,
        name: partnerName.trim(),
        age: parseInt(partnerAge, 10),
        photo: partnerPhoto,
        is_on_blend: false, // Manually added partner
      };
    }

    updateProfile({
      display_name: displayName,
      age: parseInt(age, 10),
      city,
      bio,
      photos,
      intent_ids: selectedIntents,
      pace_preference: pacePreference,
      open_to_meet: openToMeet,
      linked_partner: linkedPartner,
    });
    router.back();
  };

  const canSave = displayName.length >= 2 && age.length > 0 && parseInt(age, 10) >= 18;

  return (
    <View className="flex-1 bg-black">
      <LinearGradient
        colors={['#1a0a1a', '#0d0d0d', '#0a0a14']}
        style={{ flex: 1 }}
      >
        <SafeAreaView className="flex-1">
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-purple-900/30">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center"
            >
              <ArrowLeft size={24} color="white" />
            </Pressable>
            <Text className="text-white text-lg font-semibold">Edit Profile</Text>
            <Pressable
              onPress={handleSave}
              disabled={!canSave}
              className="w-10 h-10 items-center justify-center"
            >
              <Check size={24} color={canSave ? '#c084fc' : '#6b7280'} />
            </Pressable>
          </View>

          <ScrollView
            className="flex-1 px-5"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 20 }}
          >
            {/* Photos */}
            <View className="mb-6">
              <Text className="text-gray-500 text-xs uppercase tracking-wide mb-3">
                Photos
              </Text>
              <View className="flex-row flex-wrap">
                {photos.map((photo, index) => (
                  <View key={index} className="w-[30%] aspect-square mr-[3%] mb-3 relative">
                    <Image
                      source={{ uri: photo }}
                      className="w-full h-full rounded-xl"
                    />
                    <Pressable
                      onPress={() => handleRemovePhoto(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-pink-500 rounded-full items-center justify-center"
                    >
                      <X size={14} color="white" />
                    </Pressable>
                    {index === 0 && (
                      <View className="absolute bottom-1 left-1 bg-purple-500 px-2 py-0.5 rounded">
                        <Text className="text-white text-xs">Main</Text>
                      </View>
                    )}
                  </View>
                ))}
                {photos.length < 6 && (
                  <Pressable
                    onPress={handleAddPhoto}
                    className="w-[30%] aspect-square bg-zinc-900 rounded-xl items-center justify-center border border-dashed border-purple-500/50"
                  >
                    <View className="w-10 h-10 bg-purple-500/20 rounded-full items-center justify-center mb-1">
                      <Plus size={20} color="#c084fc" />
                    </View>
                    <Text className="text-purple-400 text-xs">Add Photo</Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Basic Info */}
            <View className="mb-6">
              <Text className="text-gray-500 text-xs uppercase tracking-wide mb-3">
                Basic Info
              </Text>
              <View className="bg-zinc-900/80 rounded-xl border border-zinc-800 overflow-hidden">
                <View className="p-4 border-b border-zinc-800">
                  <Text className="text-gray-400 text-sm mb-1">Display Name</Text>
                  <TextInput
                    value={displayName}
                    onChangeText={setDisplayName}
                    className="text-white text-base"
                    placeholderTextColor="#6b7280"
                    placeholder="Your name"
                    maxLength={30}
                  />
                </View>
                <View className="p-4 border-b border-zinc-800">
                  <Text className="text-gray-400 text-sm mb-1">Age</Text>
                  <TextInput
                    value={age}
                    onChangeText={(text) => setAge(text.replace(/[^0-9]/g, ''))}
                    className="text-white text-base"
                    placeholderTextColor="#6b7280"
                    placeholder="Your age"
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>
                <View className="p-4 border-b border-zinc-800">
                  <Text className="text-gray-400 text-sm mb-1">City</Text>
                  <TextInput
                    value={city}
                    onChangeText={setCity}
                    className="text-white text-base"
                    placeholderTextColor="#6b7280"
                    placeholder="Where you're based"
                    maxLength={50}
                  />
                </View>
                <View className="p-4">
                  <Text className="text-gray-400 text-sm mb-1">Bio</Text>
                  <TextInput
                    value={bio}
                    onChangeText={setBio}
                    className="text-white text-base"
                    placeholderTextColor="#6b7280"
                    placeholder="Tell people about yourself..."
                    multiline
                    numberOfLines={4}
                    maxLength={300}
                    style={{ minHeight: 80, textAlignVertical: 'top' }}
                  />
                  <Text className="text-gray-600 text-xs text-right mt-1">
                    {bio.length}/300
                  </Text>
                </View>
              </View>
            </View>

            {/* Linked Partner */}
            <View className="mb-6">
              <Text className="text-gray-500 text-xs uppercase tracking-wide mb-3">
                Linked Partner
              </Text>
              <View className="bg-zinc-900/80 rounded-xl border border-zinc-800 overflow-hidden">
                <View className="p-4 flex-row items-center justify-between border-b border-zinc-800">
                  <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 bg-pink-500/20 rounded-full items-center justify-center">
                      <Heart size={20} color="#ec4899" />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-white font-medium">Link a partner</Text>
                      <Text className="text-gray-400 text-sm">
                        Show your partner on your profile
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={hasPartner}
                    onValueChange={setHasPartner}
                    trackColor={{ false: '#3f3f46', true: '#9333ea' }}
                    thumbColor={hasPartner ? '#c084fc' : '#71717a'}
                  />
                </View>

                {hasPartner && (
                  <>
                    {/* Partner Photo */}
                    <View className="p-4 border-b border-zinc-800">
                      <Text className="text-gray-400 text-sm mb-3">Partner Photo</Text>
                      <View className="flex-row items-center">
                        {partnerPhoto ? (
                          <View className="relative">
                            <Image
                              source={{ uri: partnerPhoto }}
                              className="w-20 h-20 rounded-full"
                            />
                            <Pressable
                              onPress={() => setPartnerPhoto(undefined)}
                              className="absolute -top-1 -right-1 w-6 h-6 bg-pink-500 rounded-full items-center justify-center"
                            >
                              <X size={12} color="white" />
                            </Pressable>
                          </View>
                        ) : (
                          <Pressable
                            onPress={handleAddPartnerPhoto}
                            className="w-20 h-20 bg-zinc-800 rounded-full items-center justify-center border border-dashed border-purple-500/50"
                          >
                            <UserPlus size={24} color="#c084fc" />
                          </Pressable>
                        )}
                        <Text className="text-gray-500 text-sm ml-4 flex-1">
                          Add a photo so others can see your partner
                        </Text>
                      </View>
                    </View>

                    {/* Partner Name */}
                    <View className="p-4 border-b border-zinc-800">
                      <Text className="text-gray-400 text-sm mb-1">Partner Name</Text>
                      <TextInput
                        value={partnerName}
                        onChangeText={setPartnerName}
                        className="text-white text-base"
                        placeholderTextColor="#6b7280"
                        placeholder="Their name"
                        maxLength={30}
                      />
                    </View>

                    {/* Partner Age */}
                    <View className="p-4">
                      <Text className="text-gray-400 text-sm mb-1">Partner Age</Text>
                      <TextInput
                        value={partnerAge}
                        onChangeText={(text) => setPartnerAge(text.replace(/[^0-9]/g, ''))}
                        className="text-white text-base"
                        placeholderTextColor="#6b7280"
                        placeholder="Their age"
                        keyboardType="number-pad"
                        maxLength={2}
                      />
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* Interests */}
            <View className="mb-6">
              <Text className="text-gray-500 text-xs uppercase tracking-wide mb-3">
                What are you open to?
              </Text>
              <View className="flex-row flex-wrap">
                {INTENTS.map((intent: Intent) => {
                  const isSelected = selectedIntents.includes(intent.id);
                  return (
                    <Pressable
                      key={intent.id}
                      onPress={() => handleToggleIntent(intent.id)}
                      className={cn(
                        'px-4 py-2.5 rounded-full mr-2 mb-2 flex-row items-center border',
                        isSelected
                          ? 'bg-purple-500/20 border-purple-500'
                          : 'bg-zinc-900 border-zinc-800'
                      )}
                    >
                      <Text className="mr-1.5">{intent.emoji}</Text>
                      <Text
                        className={cn(
                          'text-sm',
                          isSelected ? 'text-purple-300' : 'text-gray-400'
                        )}
                      >
                        {intent.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Preferences */}
            <View className="mb-6">
              <Text className="text-gray-500 text-xs uppercase tracking-wide mb-3">
                Preferences
              </Text>
              <View className="bg-zinc-900/80 rounded-xl border border-zinc-800 overflow-hidden">
                <View className="p-4 border-b border-zinc-800">
                  <Text className="text-white font-medium mb-3">Dating Pace</Text>
                  <View className="flex-row">
                    {(['slow', 'medium', 'fast'] as const).map((pace) => (
                      <Pressable
                        key={pace}
                        onPress={() => setPacePreference(pace)}
                        className={cn(
                          'flex-1 py-2 rounded-lg mr-2',
                          pacePreference === pace
                            ? 'bg-purple-500'
                            : 'bg-zinc-800'
                        )}
                      >
                        <Text
                          className={cn(
                            'text-center text-sm capitalize',
                            pacePreference === pace ? 'text-white' : 'text-gray-400'
                          )}
                        >
                          {pace}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <View className="p-4 flex-row items-center justify-between">
                  <View>
                    <Text className="text-white font-medium">Open to Meet</Text>
                    <Text className="text-gray-400 text-sm">
                      Show others you're ready to meet in person
                    </Text>
                  </View>
                  <Switch
                    value={openToMeet}
                    onValueChange={setOpenToMeet}
                    trackColor={{ false: '#3f3f46', true: '#9333ea' }}
                    thumbColor={openToMeet ? '#c084fc' : '#71717a'}
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
