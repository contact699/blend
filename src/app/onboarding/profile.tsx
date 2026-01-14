import { useState, useEffect } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { ChevronRight, User, MapPin, Calendar, Plus, X, EyeOff, Eye } from 'lucide-react-native';
import useDatingStore from '@/lib/state/dating-store';
import { cn } from '@/lib/cn';
import { ProfilePhoto, Profile } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MIN_BIO_LENGTH = 50;
const ONBOARDING_PROFILE_KEY = 'onboarding_profile_data';

export default function ProfileSetup() {
  const router = useRouter();
  const updateProfile = useDatingStore((s) => s.updateProfile);
  const setCurrentProfile = useDatingStore((s) => s.setCurrentProfile);
  const currentProfile = useDatingStore((s) => s.currentProfile);

  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);

  // Initialize currentProfile if it's null or from mock data
  useEffect(() => {
    const initProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && (!currentProfile || currentProfile.user_id !== user.id)) {
        console.log('Initializing fresh profile for user:', user.id);
        // Create a fresh profile object for the actual user
        const freshProfile: Profile = {
          id: '',
          user_id: user.id,
          display_name: '',
          age: 18,
          city: '',
          bio: '',
          photos: [],
          intent_ids: [],
          pace_preference: 'medium',
          response_style: 'relaxed',
          open_to_meet: true,
          virtual_only: false,
          no_photos: false,
          prompt_responses: [],
        };
        setCurrentProfile(freshProfile);
      }
    };
    initProfile();
  }, [currentProfile, setCurrentProfile]);

  const handleAddPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos([...photos, {
        uri: result.assets[0].uri,
        hidden_until_match: true // Default to hidden
      }]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleTogglePhotoVisibility = (index: number) => {
    setPhotos(photos.map((photo, i) =>
      i === index
        ? { ...photo, hidden_until_match: !photo.hidden_until_match }
        : photo
    ));
  };

  const handleContinue = async () => {
    // Get the actual user ID from Supabase to ensure it's correct
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || currentProfile?.user_id || '';

    console.log('Saving profile with user_id:', userId);

    const profileData = {
      user_id: userId,
      display_name: displayName,
      age: parseInt(age, 10),
      city,
      bio,
      photos: photos.map(p => p.uri),
      photo_settings: photos,
    };

    // Save to Zustand store
    updateProfile(profileData);

    // ALSO save to AsyncStorage as backup (Zustand persistence can be flaky on web)
    try {
      await AsyncStorage.setItem(ONBOARDING_PROFILE_KEY, JSON.stringify(profileData));
      console.log('Profile data saved to AsyncStorage');
    } catch (e) {
      console.log('Failed to save to AsyncStorage:', e);
    }

    router.push('/onboarding/prompts');
  };

  // Check if there's at least one visible photo (not hidden until match)
  const hasVisiblePhoto = photos.some(p => !p.hidden_until_match);

  const canContinue =
    displayName.length >= 2 &&
    age.length > 0 &&
    parseInt(age, 10) >= 18 &&
    bio.length >= MIN_BIO_LENGTH &&
    photos.length >= 1 &&
    hasVisiblePhoto;

  return (
    <View className="flex-1 bg-black">
      <LinearGradient
        colors={['#1a0a1a', '#0d0d0d', '#0a0a14']}
        style={{ flex: 1 }}
      >
        <SafeAreaView className="flex-1">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
          >
            <ScrollView
              className="flex-1 px-6 pt-8"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Header */}
              <Animated.View
                entering={FadeInDown.delay(100).springify()}
                className="mb-8"
              >
                <Text className="text-2xl font-bold text-white mb-2">
                  Tell us about yourself
                </Text>
                <Text className="text-gray-400 text-base">
                  This helps others get to know you
                </Text>
              </Animated.View>

              {/* Form Fields */}
              <Animated.View
                entering={FadeInDown.delay(200).springify()}
                className="space-y-5"
              >
                {/* Name */}
                <View className="mb-5">
                  <Text className="text-gray-300 text-sm font-medium mb-2">
                    Display Name
                  </Text>
                  <View className="bg-zinc-900/80 rounded-xl flex-row items-center px-4 border border-zinc-800">
                    <User size={20} color="#a855f7" />
                    <TextInput
                      value={displayName}
                      onChangeText={setDisplayName}
                      placeholder="How should we call you?"
                      placeholderTextColor="#6b7280"
                      className="flex-1 text-white py-4 px-3 text-base"
                      maxLength={30}
                    />
                  </View>
                </View>

                {/* Age */}
                <View className="mb-5">
                  <Text className="text-gray-300 text-sm font-medium mb-2">
                    Age
                  </Text>
                  <View className="bg-zinc-900/80 rounded-xl flex-row items-center px-4 border border-zinc-800">
                    <Calendar size={20} color="#a855f7" />
                    <TextInput
                      value={age}
                      onChangeText={(text) => setAge(text.replace(/[^0-9]/g, ''))}
                      placeholder="Your age"
                      placeholderTextColor="#6b7280"
                      className="flex-1 text-white py-4 px-3 text-base"
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                  </View>
                  {age.length > 0 && parseInt(age, 10) < 18 && (
                    <Text className="text-pink-400 text-sm mt-2">
                      You must be 18 or older
                    </Text>
                  )}
                </View>

                {/* City */}
                <View className="mb-5">
                  <Text className="text-gray-300 text-sm font-medium mb-2">
                    City
                  </Text>
                  <View className="bg-zinc-900/80 rounded-xl flex-row items-center px-4 border border-zinc-800">
                    <MapPin size={20} color="#a855f7" />
                    <TextInput
                      value={city}
                      onChangeText={setCity}
                      placeholder="Where are you based?"
                      placeholderTextColor="#6b7280"
                      className="flex-1 text-white py-4 px-3 text-base"
                      maxLength={50}
                    />
                  </View>
                </View>

                {/* Bio */}
                <View className="mb-5">
                  <Text className="text-gray-300 text-sm font-medium mb-2">
                    Bio <Text className="text-purple-400">*</Text>
                  </Text>
                  <View className="bg-zinc-900/80 rounded-xl px-4 py-3 border border-zinc-800">
                    <TextInput
                      value={bio}
                      onChangeText={setBio}
                      placeholder="Tell others about yourself, what you're looking for, your interests..."
                      placeholderTextColor="#6b7280"
                      className="text-white text-base"
                      multiline
                      numberOfLines={4}
                      maxLength={500}
                      style={{ minHeight: 120, textAlignVertical: 'top' }}
                    />
                  </View>
                  <View className="flex-row justify-between mt-2">
                    <Text className={cn(
                      "text-sm",
                      bio.length < MIN_BIO_LENGTH ? "text-pink-400" : "text-gray-500"
                    )}>
                      {bio.length < MIN_BIO_LENGTH ? `${MIN_BIO_LENGTH - bio.length} more characters needed` : ''}
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      {bio.length}/500
                    </Text>
                  </View>
                </View>

                {/* Photos */}
                <View className="mb-5">
                  <Text className="text-gray-300 text-sm font-medium mb-2">
                    Photos <Text className="text-purple-400">*</Text>
                  </Text>
                  <View className="bg-purple-500/10 rounded-xl p-3 mb-3 border border-purple-500/20">
                    <View className="flex-row items-center">
                      <EyeOff size={16} color="#a855f7" />
                      <Text className="text-purple-300 text-sm ml-2 flex-1">
                        Tap the eye icon on each photo to control visibility. Hidden photos are only revealed after matching.
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row flex-wrap gap-3">
                    {photos.map((photo, index) => (
                      <View key={index} className="relative">
                        <Image
                          source={{ uri: photo.uri }}
                          className={cn(
                            "w-24 h-24 rounded-xl",
                            photo.hidden_until_match && "opacity-70"
                          )}
                        />
                        {/* Hidden overlay */}
                        {photo.hidden_until_match && (
                          <View className="absolute inset-0 bg-black/40 rounded-xl items-center justify-center">
                            <EyeOff size={20} color="#c084fc" />
                          </View>
                        )}
                        {/* Remove button */}
                        <Pressable
                          onPress={() => handleRemovePhoto(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-pink-600 rounded-full items-center justify-center"
                        >
                          <X size={14} color="white" />
                        </Pressable>
                        {/* Visibility toggle */}
                        <Pressable
                          onPress={() => handleTogglePhotoVisibility(index)}
                          className={cn(
                            "absolute bottom-1 right-1 w-7 h-7 rounded-full items-center justify-center",
                            photo.hidden_until_match
                              ? "bg-purple-600/90"
                              : "bg-green-600/90"
                          )}
                        >
                          {photo.hidden_until_match ? (
                            <EyeOff size={14} color="white" />
                          ) : (
                            <Eye size={14} color="white" />
                          )}
                        </Pressable>
                        {/* Main badge */}
                        {index === 0 && (
                          <View className="absolute top-1 left-1 bg-purple-600/90 px-2 py-0.5 rounded-full">
                            <Text className="text-white text-xs">Main</Text>
                          </View>
                        )}
                      </View>
                    ))}
                    {photos.length < 6 && (
                      <Pressable
                        onPress={handleAddPhoto}
                        className="w-24 h-24 rounded-xl border-2 border-dashed border-purple-500/50 items-center justify-center bg-purple-500/10"
                      >
                        <Plus size={28} color="#a855f7" />
                        <Text className="text-purple-400 text-xs mt-1">Add</Text>
                      </Pressable>
                    )}
                  </View>
                  {photos.length === 0 && (
                    <Text className="text-pink-400 text-sm mt-2">
                      Add at least 1 photo
                    </Text>
                  )}
                  {photos.length > 0 && !hasVisiblePhoto && (
                    <Text className="text-pink-400 text-sm mt-2">
                      At least 1 photo must be visible (tap the eye icon to make it public)
                    </Text>
                  )}
                  {photos.length > 0 && (
                    <View className="flex-row items-center mt-3">
                      <View className="flex-row items-center mr-4">
                        <View className="w-3 h-3 rounded-full bg-purple-600 mr-1.5" />
                        <Text className="text-gray-400 text-xs">Hidden until match</Text>
                      </View>
                      <View className="flex-row items-center">
                        <View className="w-3 h-3 rounded-full bg-green-600 mr-1.5" />
                        <Text className="text-gray-400 text-xs">Always visible</Text>
                      </View>
                    </View>
                  )}
                </View>
              </Animated.View>

              {/* Spacer for keyboard */}
              <View className="h-32" />
            </ScrollView>

            {/* CTA */}
            <Animated.View
              entering={FadeInUp.delay(400).springify()}
              className="px-6 pb-8 pt-4"
            >
              <Pressable
                onPress={handleContinue}
                disabled={!canContinue}
                className="rounded-2xl overflow-hidden"
              >
                {canContinue ? (
                  <LinearGradient
                    colors={['#9333ea', '#db2777']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                  >
                    <Text className="text-white text-lg font-semibold mr-2">
                      Continue
                    </Text>
                    <ChevronRight size={20} color="white" />
                  </LinearGradient>
                ) : (
                  <View className="bg-zinc-800 py-4 flex-row items-center justify-center">
                    <Text className="text-gray-400 text-lg font-semibold mr-2">
                      Continue
                    </Text>
                    <ChevronRight size={20} color="#9ca3af" />
                  </View>
                )}
              </Pressable>
            </Animated.View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
